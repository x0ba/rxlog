import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requirePrimaryPatientMembership } from './auth'

export const updateRole = mutation({
  args: {
    patientId: v.id('patients'),
    memberId: v.id('patientMembers'),
    role: v.union(v.literal('primary'), v.literal('caretaker')),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePrimaryPatientMembership(ctx, args.patientId)

    const targetMembership = await ctx.db.get('patientMembers', args.memberId)
    if (!targetMembership || targetMembership.patientId !== args.patientId) {
      throw new Error('Unauthorized')
    }

    if (targetMembership.userId === user._id) {
      throw new Error('You cannot change your own role.')
    }

    if (targetMembership.role !== args.role) {
      await ctx.db.patch('patientMembers', args.memberId, {
        role: args.role,
      })
    }

    return {
      memberId: args.memberId,
      patientId: args.patientId,
      role: args.role,
    }
  },
})
