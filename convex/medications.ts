import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const addMedication = mutation({
  args: {
    patientId: v.id('patients'),
    name: v.string(),
    dosage: v.string(),
    scheduledTimes: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const user = await ctx.db
      .query('users')
      .withIndex('clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || user.deleted) throw new Error('Unauthorized')

    const membership = await ctx.db
      .query('patientMembers')
      .withIndex('patientId_userId', (q) =>
        q.eq('patientId', args.patientId).eq('userId', user._id),
      )
      .unique()

    if (!membership) throw new Error('Unauthorized')

    return await ctx.db.insert('medications', { ...args })
  },
})

export const listMedications = query({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const user = await ctx.db
      .query('users')
      .withIndex('clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || user.deleted) throw new Error('Unauthorized')

    const membership = await ctx.db
      .query('patientMembers')
      .withIndex('patientId_userId', (q) =>
        q.eq('patientId', args.patientId).eq('userId', user._id),
      )
      .unique()

    if (!membership) throw new Error('Unauthorized')

    return await ctx.db
      .query('medications')
      .withIndex('patientId', (q) => q.eq('patientId', args.patientId))
      .collect()
  },
})
