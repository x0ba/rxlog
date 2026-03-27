import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requirePatientMembership } from './auth'

export const addMedication = mutation({
  args: {
    patientId: v.id('patients'),
    name: v.string(),
    dosage: v.string(),
    scheduledTimes: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePatientMembership(ctx, args.patientId)

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
    const medication = await ctx.db.get(args.medicationId)
    if (!medication) throw new Error('Not found')
    await requirePatientMembership(ctx, medication.patientId)

    return await ctx.db.patch(args.medicationId, { active: false })
  },
})

export const unarchiveMedication = mutation({
  args: {
    medicationId: v.id('medications'),
  },
  handler: async (ctx, args) => {
    const medication = await ctx.db.get(args.medicationId)
    if (!medication) throw new Error('Not found')
    await requirePatientMembership(ctx, medication.patientId)

    return await ctx.db.patch(args.medicationId, { active: true })
  },
})

export const deleteMedication = mutation({
  args: {
    medicationId: v.id('medications'),
  },
  handler: async (ctx, args) => {
    const medication = await ctx.db.get(args.medicationId)
    if (!medication) throw new Error('Not found')
    await requirePatientMembership(ctx, medication.patientId)

    return await ctx.db.delete(args.medicationId)
  },
})
