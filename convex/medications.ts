import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requirePatientMembership } from './auth'

function hasInvalidScheduledTimes(scheduledTimes: Array<number>) {
  return (
    scheduledTimes.length === 0 ||
    scheduledTimes.some(
      (scheduledTime) =>
        !Number.isInteger(scheduledTime) ||
        scheduledTime < 0 ||
        scheduledTime > 23,
    )
  )
}

export const addMedication = mutation({
  args: {
    patientId: v.id('patients'),
    name: v.string(),
    dosage: v.string(),
    scheduledTimes: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePatientMembership(ctx, args.patientId)

    if (hasInvalidScheduledTimes(args.scheduledTimes)) {
      throw new Error('Scheduled times must be whole hours between 0 and 23')
    }

    return await ctx.db.insert('medications', { ...args, active: true })
  },
})

export const listMedications = query({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    await requirePatientMembership(ctx, args.patientId)

    return await ctx.db
      .query('medications')
      .withIndex('patientId', (q) => q.eq('patientId', args.patientId))
      .collect()
  },
})

export const archiveMedication = mutation({
  args: {
    medicationId: v.id('medications'),
  },
  handler: async (ctx, args) => {
    const medication = await ctx.db.get('medications', args.medicationId)
    if (!medication) throw new Error('Not found')
    await requirePatientMembership(ctx, medication.patientId)

    return await ctx.db.patch('medications', args.medicationId, {
      active: false,
    })
  },
})

export const unarchiveMedication = mutation({
  args: {
    medicationId: v.id('medications'),
  },
  handler: async (ctx, args) => {
    const medication = await ctx.db.get('medications', args.medicationId)
    if (!medication) throw new Error('Not found')
    await requirePatientMembership(ctx, medication.patientId)

    return await ctx.db.patch('medications', args.medicationId, {
      active: true,
    })
  },
})

export const deleteMedication = mutation({
  args: {
    medicationId: v.id('medications'),
  },
  handler: async (ctx, args) => {
    const medication = await ctx.db.get('medications', args.medicationId)
    if (!medication) throw new Error('Not found')
    await requirePatientMembership(ctx, medication.patientId)

    return await ctx.db.delete('medications', args.medicationId)
  },
})
