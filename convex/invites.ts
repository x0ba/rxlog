import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requirePatientMembership } from './auth'

const EXPIRATION_TIME_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export const createInvite = mutation({
  args: {
    email: v.string(),
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    const { user: authedUser } = await requirePatientMembership(
      ctx,
      args.patientId,
    )

    const trimmedEmail = args.email.trim().toLowerCase()
    const existingInvite = await ctx.db
      .query('patientInvites')
      .withIndex('by_patientId_and_email', (q) =>
        q.eq('patientId', args.patientId).eq('email', trimmedEmail),
      )
      .unique()
    if (existingInvite) {
      throw new Error('Invite already exists')
    }

    const invite = await ctx.db.insert('patientInvites', {
      email: trimmedEmail,
      invitedBy: authedUser._id,
      patientId: args.patientId,
      status: 'pending',
      expiresAt: Date.now() + EXPIRATION_TIME_MS,
      token: crypto.randomUUID(),
    })

    return invite
  },
})

export const deleteInvite = mutation({
  args: {
    inviteId: v.id('patientInvites'),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get('patientInvites', args.inviteId)
    if (!invite) {
      throw new Error('Invite not found')
    }

    const { user: authedUser } = await requirePatientMembership(
      ctx,
      invite.patientId,
    )

    if (invite.invitedBy !== authedUser._id) {
      throw new Error('Unauthorized')
    }
    await ctx.db.delete('patientInvites', args.inviteId)

    return invite
  },
})
