import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import {
  ensureAuthedUser,
  getAuthedUserOrNull,
  requireAuthedUser,
} from './auth'
import type { Doc } from './_generated/dataModel'
import type { QueryCtx } from './_generated/server'

const MAX_PATIENT_AGE_YEARS = 150
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function formatDateOnly(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeDate(value: Date) {
  const normalized = new Date(value)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function isValidDateOnly(value: string) {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  )
}

function getPatientBirthDateValidationError(value: string, today = new Date()) {
  if (value.length === 0) {
    return 'Date of birth is required'
  }

  if (!isValidDateOnly(value)) {
    return 'Enter a valid date of birth'
  }

  const latestAllowedBirthDate = formatDateOnly(normalizeDate(today))
  if (value > latestAllowedBirthDate) {
    return 'Date of birth cannot be in the future'
  }

  const earliestAllowedBirthDate = normalizeDate(today)
  earliestAllowedBirthDate.setFullYear(
    earliestAllowedBirthDate.getFullYear() - MAX_PATIENT_AGE_YEARS,
  )

  if (value < formatDateOnly(earliestAllowedBirthDate)) {
    return `Date of birth cannot be more than ${MAX_PATIENT_AGE_YEARS} years ago`
  }
}

async function getAuthedActiveUser(ctx: QueryCtx) {
  return await getAuthedUserOrNull(ctx)
}

export const listPatients = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedActiveUser(ctx)
    if (!user) return []

    const memberships = await ctx.db
      .query('patientMembers')
      .withIndex('userId', (q) => q.eq('userId', user._id))
      .collect()

    const out: Array<Doc<'patients'> & { role: string; memberCount: number }> =
      []

    for (const m of memberships) {
      const patient = await ctx.db.get('patients', m.patientId)
      if (patient) {
        const membersOnPatient = await ctx.db
          .query('patientMembers')
          .withIndex('patientId', (q) => q.eq('patientId', m.patientId))
          .collect()
        out.push({
          ...patient,
          role: m.role,
          memberCount: membersOnPatient.length,
        })
      }
    }

    return out
  },
})

export const listPatientsDigest = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedActiveUser(ctx)
    if (!user) return []

    const memberships = await ctx.db
      .query('patientMembers')
      .withIndex('userId', (q) => q.eq('userId', user._id))
      .collect()

    const patientIds = [
      ...new Set(memberships.map((membership) => membership.patientId)),
    ]
    const [patients, memberCounts] = await Promise.all([
      Promise.all(
        patientIds.map((patientId) => ctx.db.get('patients', patientId)),
      ),
      Promise.all(
        patientIds.map(async (patientId) => {
          const members = await ctx.db
            .query('patientMembers')
            .withIndex('patientId', (q) => q.eq('patientId', patientId))
            .collect()

          return [patientId, members.length] as const
        }),
      ),
    ])

    const patientsById = new Map(
      patients
        .filter((patient) => patient !== null)
        .map((patient) => [patient._id, patient]),
    )
    const memberCountByPatientId = new Map(memberCounts)

    return memberships.flatMap((membership) => {
      const patient = patientsById.get(membership.patientId)
      if (!patient) return []

      return [
        {
          _id: patient._id,
          name: patient.name,
          birthDate: patient.birthDate,
          timezone: patient.timezone,
          role: membership.role,
          memberCount: memberCountByPatientId.get(patient._id) ?? 0,
        },
      ]
    })
  },
})

export const addPatient = mutation({
  args: {
    name: v.string(),
    birthDate: v.string(),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ensureAuthedUser(ctx)
    const birthDateValidationError = getPatientBirthDateValidationError(
      args.birthDate,
    )

    if (birthDateValidationError) {
      throw new Error(birthDateValidationError)
    }

    const patientId = await ctx.db.insert('patients', {
      ...args,
      timezone: args.timezone ?? 'UTC',
    })

    await ctx.db.insert('patientMembers', {
      patientId,
      userId: user._id,
      role: 'primary',
    })

    return patientId
  },
})

export const getPatient = query({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, { patientId }) => {
    const user = await getAuthedActiveUser(ctx)
    if (!user) return null

    const memberships = await ctx.db
      .query('patientMembers')
      .withIndex('userId', (q) => q.eq('userId', user._id))
      .collect()

    const membership = memberships.find((m) => m.patientId === patientId)
    if (!membership) return null

    const patient = await ctx.db.get('patients', patientId)
    if (!patient) return null

    const membersOnPatient = await ctx.db
      .query('patientMembers')
      .withIndex('patientId', (q) => q.eq('patientId', patientId))
      .collect()

    return {
      ...patient,
      role: membership.role,
      memberCount: membersOnPatient.length,
    }
  },
})

export const getPatientSummary = query({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, { patientId }) => {
    const user = await getAuthedActiveUser(ctx)
    if (!user) return null

    const membership = await ctx.db
      .query('patientMembers')
      .withIndex('patientId_userId', (q) =>
        q.eq('patientId', patientId).eq('userId', user._id),
      )
      .unique()

    if (!membership) return null

    const patient = await ctx.db.get('patients', patientId)
    if (!patient) return null

    const membersOnPatient = await ctx.db
      .query('patientMembers')
      .withIndex('patientId', (q) => q.eq('patientId', patientId))
      .collect()

    return {
      _id: patient._id,
      name: patient.name,
      birthDate: patient.birthDate,
      timezone: patient.timezone,
      role: membership.role,
      memberCount: membersOnPatient.length,
    }
  },
})

/** Removes the patient and all related data. Only the primary member may delete. */
export const deletePatient = mutation({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, { patientId }) => {
    const user = await requireAuthedUser(ctx)

    const membership = await ctx.db
      .query('patientMembers')
      .withIndex('patientId_userId', (q) =>
        q.eq('patientId', patientId).eq('userId', user._id),
      )
      .unique()

    if (!membership || membership.role !== 'primary') {
      throw new Error('Unauthorized')
    }

    const patient = await ctx.db.get('patients', patientId)
    if (!patient) throw new Error('Not found')

    const logs = await ctx.db
      .query('logs')
      .withIndex('patientId', (q) => q.eq('patientId', patientId))
      .collect()
    for (const log of logs) {
      await ctx.db.delete('logs', log._id)
    }

    const medications = await ctx.db
      .query('medications')
      .withIndex('patientId', (q) => q.eq('patientId', patientId))
      .collect()
    for (const med of medications) {
      await ctx.db.delete('medications', med._id)
    }

    const members = await ctx.db
      .query('patientMembers')
      .withIndex('patientId', (q) => q.eq('patientId', patientId))
      .collect()
    for (const m of members) {
      await ctx.db.delete('patientMembers', m._id)
    }

    await ctx.db.delete('patients', patientId)
  },
})
