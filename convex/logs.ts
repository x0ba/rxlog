import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import { requirePatientMembership } from './auth'
import { getLocalDayBounds, getScheduledSlotTimestamps } from './timezone'

const onTimeWindowMs = 60 * 60 * 1000

function getSlotKey(medicationId: string, scheduledFor: number) {
  return `${medicationId}:${scheduledFor}`
}

function pickNearestOpenSlot(
  slots: ReturnType<typeof getScheduledSlotTimestamps>,
  takenAt: number,
  occupiedScheduledFors: Set<number>,
) {
  const availableSlots = slots.filter(
    (slot) => !occupiedScheduledFors.has(slot.scheduledFor),
  )

  if (availableSlots.length === 0) {
    throw new Error(
      'All scheduled doses for this medication are already logged',
    )
  }

  return availableSlots.reduce((closestSlot, slot) => {
    const slotDistance = Math.abs(slot.scheduledFor - takenAt)
    const closestDistance = Math.abs(closestSlot.scheduledFor - takenAt)

    if (slotDistance < closestDistance) return slot
    return closestSlot
  })
}

async function getAuthorizedMedication(
  ctx: MutationCtx,
  patientId: Id<'patients'>,
  medicationId: Id<'medications'>,
) {
  const { user } = await requirePatientMembership(ctx, patientId)
  const medication = await ctx.db.get(medicationId)

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
    const patient = await ctx.db.get(args.patientId)
    if (!patient) {
      throw new Error('Patient not found')
    }

    const { dayStart, nextDayStart } = getLocalDayBounds(
      takenAt,
      patient.timezone,
    )
    const slots = getScheduledSlotTimestamps(
      takenAt,
      medication.scheduledTimes,
      patient.timezone,
    )
    const existingLogs = await ctx.db
      .query('logs')
      .withIndex('by_medicationId_and_scheduledFor', (q) =>
        q
          .eq('medicationId', args.medicationId)
          .gte('scheduledFor', dayStart)
          .lt('scheduledFor', nextDayStart),
      )
      .collect()
    const occupiedScheduledFors = new Set(
      existingLogs.map((log) => log.scheduledFor),
    )
    const slot = pickNearestOpenSlot(slots, takenAt, occupiedScheduledFors)
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
    const patient = await ctx.db.get(args.patientId)
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
    const patient = await ctx.db.get(args.patientId)
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
    const users = await Promise.all(userIds.map((userId) => ctx.db.get(userId)))
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
