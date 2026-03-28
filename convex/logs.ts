import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requirePatientMembership } from './auth'
import {
  getHistoryWindowStart,
  getLocalDayBounds,
  getScheduledSlotTimestamps,
  getScheduledSlotsInDateRange,
  getUtcRangeForLocalDateRange,
} from './timezone'
import type { MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const onTimeWindowMs = 60 * 60 * 1000

function getSlotKey(medicationId: string, scheduledFor: number) {
  return `${medicationId}:${scheduledFor}`
}

async function getAuthorizedMedication(
  ctx: MutationCtx,
  patientId: Id<'patients'>,
  medicationId: Id<'medications'>,
) {
  const { user } = await requirePatientMembership(ctx, patientId)
  const medication = await ctx.db.get('medications', medicationId)

  if (!medication || medication.patientId !== patientId) {
    throw new Error('Medication not found')
  }

  if (!medication.active) {
    throw new Error('Medication is archived')
  }

  return { medication, user }
}

export const logMedicationTaken = mutation({
  args: {
    patientId: v.id('patients'),
    medicationId: v.id('medications'),
    scheduledFor: v.number(),
    takenAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const takenAt = args.takenAt ?? Date.now()
    const { medication, user } = await getAuthorizedMedication(
      ctx,
      args.patientId,
      args.medicationId,
    )
    const patient = await ctx.db.get('patients', args.patientId)
    if (!patient) {
      throw new Error('Patient not found')
    }

    const slots = getScheduledSlotTimestamps(
      args.scheduledFor,
      medication.scheduledTimes,
      patient.timezone,
    )
    const slot = slots.find(
      (candidate) => candidate.scheduledFor === args.scheduledFor,
    )

    if (!slot) {
      throw new Error('Scheduled slot not found for this medication')
    }

    const status =
      Math.abs(takenAt - slot.scheduledFor) <= onTimeWindowMs ? 'taken' : 'late'

    const existingLog = await ctx.db
      .query('logs')
      .withIndex('by_medicationId_and_scheduledFor', (q) =>
        q
          .eq('medicationId', args.medicationId)
          .eq('scheduledFor', slot.scheduledFor),
      )
      .unique()

    if (existingLog) {
      throw new Error('This dose has already been logged')
    }

    return await ctx.db.insert('logs', {
      patientId: args.patientId,
      medicationId: args.medicationId,
      loggedBy: user._id,
      takenAt,
      status,
      scheduledHour: slot.scheduledHour,
      scheduledFor: slot.scheduledFor,
      notes: args.notes,
    })
  },
})

export const logMedicationMissed = mutation({
  args: {
    patientId: v.id('patients'),
    medicationId: v.id('medications'),
    scheduledFor: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { medication, user } = await getAuthorizedMedication(
      ctx,
      args.patientId,
      args.medicationId,
    )
    const patient = await ctx.db.get('patients', args.patientId)
    if (!patient) {
      throw new Error('Patient not found')
    }

    const slots = getScheduledSlotTimestamps(
      args.scheduledFor,
      medication.scheduledTimes,
      patient.timezone,
    )
    const slot = slots.find(
      (candidate) => candidate.scheduledFor === args.scheduledFor,
    )

    if (!slot) {
      throw new Error('Scheduled slot not found for this medication')
    }

    const existingLog = await ctx.db
      .query('logs')
      .withIndex('by_medicationId_and_scheduledFor', (q) =>
        q
          .eq('medicationId', args.medicationId)
          .eq('scheduledFor', args.scheduledFor),
      )
      .unique()

    if (existingLog) {
      throw new Error('This dose has already been logged')
    }

    return await ctx.db.insert('logs', {
      patientId: args.patientId,
      medicationId: args.medicationId,
      loggedBy: user._id,
      takenAt: args.scheduledFor,
      status: 'missed',
      scheduledHour: slot.scheduledHour,
      scheduledFor: slot.scheduledFor,
      notes: args.notes,
    })
  },
})

export const getTodaySchedule = query({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    await requirePatientMembership(ctx, args.patientId)
    const patient = await ctx.db.get('patients', args.patientId)
    if (!patient) {
      throw new Error('Patient not found')
    }

    const medications = await ctx.db
      .query('medications')
      .withIndex('by_patientId_and_active', (q) =>
        q.eq('patientId', args.patientId).eq('active', true),
      )
      .collect()
    const now = Date.now()
    const { dayStart, nextDayStart } = getLocalDayBounds(now, patient.timezone)
    const logs = await ctx.db
      .query('logs')
      .withIndex('by_patientId_and_scheduledFor', (q) =>
        q
          .eq('patientId', args.patientId)
          .gte('scheduledFor', dayStart)
          .lt('scheduledFor', nextDayStart),
      )
      .collect()

    const userIds = [...new Set(logs.map((log) => log.loggedBy))]
    const users = await Promise.all(
      userIds.map((userId) => ctx.db.get('users', userId)),
    )
    const userNamesById = new Map(
      users
        .filter((user) => user !== null)
        .map((user) => [user._id, user.name ?? user.email ?? 'Unknown user']),
    )
    const logBySlot = new Map(
      logs.map((log) => [getSlotKey(log.medicationId, log.scheduledFor), log]),
    )

    return medications
      .flatMap((medication) =>
        getScheduledSlotTimestamps(
          now,
          medication.scheduledTimes,
          patient.timezone,
        ).map((slot) => {
          const log = logBySlot.get(
            getSlotKey(medication._id, slot.scheduledFor),
          )

          return {
            medication,
            scheduledHour: slot.scheduledHour,
            scheduledFor: slot.scheduledFor,
            status: log?.status ?? 'pending',
            log: log
              ? {
                  ...log,
                  loggedByUserName: userNamesById.get(log.loggedBy) ?? null,
                }
              : null,
          }
        }),
      )
      .sort((a, b) => a.scheduledFor - b.scheduledFor)
  },
})

export const getTodayScheduleDigest = query({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    await requirePatientMembership(ctx, args.patientId)
    const patient = await ctx.db.get('patients', args.patientId)
    if (!patient) {
      throw new Error('Patient not found')
    }

    const medications = await ctx.db
      .query('medications')
      .withIndex('by_patientId_and_active', (q) =>
        q.eq('patientId', args.patientId).eq('active', true),
      )
      .collect()
    const now = Date.now()
    const { dayStart, nextDayStart } = getLocalDayBounds(now, patient.timezone)
    const logs = await ctx.db
      .query('logs')
      .withIndex('by_patientId_and_scheduledFor', (q) =>
        q
          .eq('patientId', args.patientId)
          .gte('scheduledFor', dayStart)
          .lt('scheduledFor', nextDayStart),
      )
      .collect()

    const userIds = [...new Set(logs.map((log) => log.loggedBy))]
    const users = await Promise.all(
      userIds.map((userId) => ctx.db.get('users', userId)),
    )
    const userNamesById = new Map(
      users
        .filter((user) => user !== null)
        .map((user) => [user._id, user.name ?? user.email ?? 'Unknown user']),
    )
    const logBySlot = new Map(
      logs.map((log) => [getSlotKey(log.medicationId, log.scheduledFor), log]),
    )

    return medications
      .flatMap((medication) =>
        getScheduledSlotTimestamps(
          now,
          medication.scheduledTimes,
          patient.timezone,
        ).map((slot) => {
          const log = logBySlot.get(
            getSlotKey(medication._id, slot.scheduledFor),
          )

          return {
            medicationId: medication._id,
            medicationName: medication.name,
            medicationDosage: medication.dosage,
            scheduledHour: slot.scheduledHour,
            scheduledFor: slot.scheduledFor,
            status: log?.status ?? 'pending',
            logId: log?._id ?? null,
            loggedByUserName: log
              ? (userNamesById.get(log.loggedBy) ?? null)
              : null,
            takenAt: log?.takenAt ?? null,
            notes: log?.notes ?? null,
          }
        }),
      )
      .sort((a, b) => a.scheduledFor - b.scheduledFor)
  },
})

export const listLogs = query({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    await requirePatientMembership(ctx, args.patientId)

    return await ctx.db
      .query('logs')
      .withIndex('by_patientId_and_scheduledFor', (q) =>
        q.eq('patientId', args.patientId),
      )
      .order('desc')
      .take(200)
  },
})

export const getHistory = query({
  args: {
    patientId: v.id('patients'),
    daysBack: v.union(v.literal(7), v.literal(14), v.literal(30)),
    medicationId: v.optional(v.id('medications')),
  },
  handler: async (ctx, args) => {
    await requirePatientMembership(ctx, args.patientId)
    const patient = await ctx.db.get('patients', args.patientId)
    if (!patient) {
      throw new Error('Patient not found')
    }

    const now = Date.now()
    const windowStart = getHistoryWindowStart(
      now,
      args.daysBack,
      patient.timezone,
    )
    const { nextDayStart } = getLocalDayBounds(now, patient.timezone)

    let logs
    if (args.medicationId) {
      const medicationId = args.medicationId

      logs = await ctx.db
        .query('logs')
        .withIndex('by_patientId_and_medicationId_and_scheduledFor', (q) =>
          q
            .eq('patientId', args.patientId)
            .eq('medicationId', medicationId)
            .gte('scheduledFor', windowStart)
            .lt('scheduledFor', nextDayStart),
        )
        .collect()
    } else {
      logs = await ctx.db
        .query('logs')
        .withIndex('by_patientId_and_scheduledFor', (q) =>
          q
            .eq('patientId', args.patientId)
            .gte('scheduledFor', windowStart)
            .lt('scheduledFor', nextDayStart),
        )
        .collect()
    }

    const medicationIds = [...new Set(logs.map((log) => log.medicationId))]
    const userIds = [...new Set(logs.map((log) => log.loggedBy))]
    const [medications, users] = await Promise.all([
      Promise.all(
        medicationIds.map((medicationId) =>
          ctx.db.get('medications', medicationId),
        ),
      ),
      Promise.all(userIds.map((userId) => ctx.db.get('users', userId))),
    ])

    const medicationsById = new Map(
      medications
        .filter((medication) => medication !== null)
        .map((medication) => [medication._id, medication]),
    )
    const userNamesById = new Map(
      users
        .filter((user) => user !== null)
        .map((user) => [user._id, user.name ?? user.email ?? 'Unknown user']),
    )

    const joinedLogs = logs
      .map((log) => {
        const medication = medicationsById.get(log.medicationId)

        return {
          ...log,
          medicationName: medication?.name ?? null,
          medicationDosage: medication?.dosage ?? null,
          loggedByUserName: userNamesById.get(log.loggedBy) ?? null,
        }
      })
      .sort((a, b) => {
        if (b.scheduledFor !== a.scheduledFor) {
          return b.scheduledFor - a.scheduledFor
        }

        return b.takenAt - a.takenAt
      })

    return {
      logs: joinedLogs,
      stats: {
        total: joinedLogs.length,
        taken: joinedLogs.filter((log) => log.status === 'taken').length,
        late: joinedLogs.filter((log) => log.status === 'late').length,
        missed: joinedLogs.filter((log) => log.status === 'missed').length,
      },
    }
  },
})

export const getExportPreview = query({
  args: {
    patientId: v.id('patients'),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePatientMembership(ctx, args.patientId)

    if (args.startDate > args.endDate) {
      throw new Error('Start date must be on or before end date')
    }

    const patient = await ctx.db.get('patients', args.patientId)
    if (!patient) {
      throw new Error('Patient not found')
    }

    const { start, endExclusive } = getUtcRangeForLocalDateRange(
      args.startDate,
      args.endDate,
      patient.timezone,
    )
    const now = Date.now()

    const [logs, medications] = await Promise.all([
      ctx.db
        .query('logs')
        .withIndex('by_patientId_and_scheduledFor', (q) =>
          q
            .eq('patientId', args.patientId)
            .gte('scheduledFor', start)
            .lt('scheduledFor', endExclusive),
        )
        .collect(),
      ctx.db
        .query('medications')
        .withIndex('patientId', (q) => q.eq('patientId', args.patientId))
        .collect(),
    ])

    const userIds = [...new Set(logs.map((log) => log.loggedBy))]
    const users = await Promise.all(
      userIds.map((userId) => ctx.db.get('users', userId)),
    )

    const userNamesById = new Map(
      users
        .filter((user) => user !== null)
        .map((user) => [user._id, user.name ?? user.email ?? 'Unknown user']),
    )
    const medicationsById = new Map(
      medications.map((medication) => [medication._id, medication]),
    )
    const activeMedications = medications
      .filter((medication) => medication.active)
      .sort((a, b) => a.name.localeCompare(b.name))

    const logRows = logs.map((log) => {
      const medication = medicationsById.get(log.medicationId)

      return {
        key: `log:${log._id}`,
        medicationId: log.medicationId,
        medicationName: medication?.name ?? 'Deleted medication',
        medicationDosage: medication?.dosage ?? null,
        scheduledHour: log.scheduledHour,
        scheduledFor: log.scheduledFor,
        takenAt: log.takenAt,
        status: log.status,
        isInferred: false,
        loggedByUserName: userNamesById.get(log.loggedBy) ?? null,
        notes: log.notes ?? null,
      }
    })

    const loggedSlotKeys = new Set(
      logs.map((log) => getSlotKey(log.medicationId, log.scheduledFor)),
    )

    const inferredRows = activeMedications.flatMap((medication) =>
      getScheduledSlotsInDateRange(
        args.startDate,
        args.endDate,
        medication.scheduledTimes,
        patient.timezone,
      ).flatMap((slot) => {
        if (slot.scheduledFor >= now) {
          return []
        }

        const slotKey = getSlotKey(medication._id, slot.scheduledFor)
        if (loggedSlotKeys.has(slotKey)) {
          return []
        }

        return [
          {
            key: `inferred:${slotKey}`,
            medicationId: medication._id,
            medicationName: medication.name,
            medicationDosage: medication.dosage,
            scheduledHour: slot.scheduledHour,
            scheduledFor: slot.scheduledFor,
            takenAt: null,
            status: 'missed' as const,
            isInferred: true,
            loggedByUserName: null,
            notes: null,
          },
        ]
      }),
    )

    const rows = [...logRows, ...inferredRows].sort((a, b) => {
      if (a.scheduledFor !== b.scheduledFor) {
        return a.scheduledFor - b.scheduledFor
      }

      return a.medicationName.localeCompare(b.medicationName)
    })

    return {
      patient: {
        _id: patient._id,
        name: patient.name,
        birthDate: patient.birthDate,
        timezone: patient.timezone,
      },
      period: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      summary: {
        total: rows.length,
        taken: rows.filter((row) => row.status === 'taken').length,
        late: rows.filter((row) => row.status === 'late').length,
        missed: rows.filter((row) => row.status === 'missed').length,
      },
      medications: activeMedications.map((medication) => ({
        _id: medication._id,
        name: medication.name,
        dosage: medication.dosage,
        scheduledTimes: medication.scheduledTimes,
      })),
      rows,
    }
  },
})
