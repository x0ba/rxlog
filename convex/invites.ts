import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import {
  requireAuthedUser,
  requirePatientMembership,
  requirePrimaryPatientMembership,
} from './auth'
import type { Id } from './_generated/dataModel'

const EXPIRATION_TIME_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export const createInvite = mutation({
  args: {
    email: v.string(),
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    const { user: authedUser } = await requirePrimaryPatientMembership(
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

    if (
      existingInvite?.status === 'pending' &&
      existingInvite.expiresAt > Date.now()
    ) {
      throw new Error('This email has already been invited.')
    } else if (existingInvite?.status === 'rejected') {
      await ctx.db.patch('patientInvites', existingInvite._id, {
        status: 'pending',
        invitedAt: Date.now(),
        invitedBy: authedUser._id,
        respondedAt: undefined,
        expiresAt: Date.now() + EXPIRATION_TIME_MS,
        token: crypto.randomUUID(),
      })

      return existingInvite._id
    }

    const invite = await ctx.db.insert('patientInvites', {
      patientId: args.patientId,
      email: trimmedEmail,
      invitedBy: authedUser._id,
      invitedAt: Date.now(),
      status: 'pending',
      expiresAt: Date.now() + EXPIRATION_TIME_MS,
      token: crypto.randomUUID(),
    })

    return invite
  },
})

export const acceptInvite = mutation({
  args: {
    inviteId: v.id('patientInvites'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthedUser(ctx)
    const trimmedEmail = user.email?.trim().toLowerCase()

    const invite = await ctx.db.get('patientInvites', args.inviteId)

    if (!invite) throw new Error('Invite not found')
    if (invite.status !== 'pending') throw new Error('Invite not pending')
    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch('patientInvites', args.inviteId, {
        status: 'expired',
      })
      throw new Error('Invite expired')
    }
    if (invite.email !== trimmedEmail)
      throw new Error('Invite not for this email')

    const existingMembership = await ctx.db
      .query('patientMembers')
      .withIndex('patientId_userId', (q) =>
        q.eq('patientId', invite.patientId).eq('userId', user._id),
      )
      .unique()

    if (!existingMembership) {
      await ctx.db.insert('patientMembers', {
        patientId: invite.patientId,
        userId: user._id,
        role: 'caretaker',
      })
    }

    const acceptedInvite = await ctx.db.patch('patientInvites', args.inviteId, {
      status: 'accepted',
      respondedAt: Date.now(),
    })

    return acceptedInvite
  },
})

export const rejectInvite = mutation({
  args: {
    inviteId: v.id('patientInvites'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthedUser(ctx)
    const trimmedEmail = user.email?.trim().toLowerCase()

    const invite = await ctx.db.get('patientInvites', args.inviteId)

    if (!invite) throw new Error('Invite not found')
    if (invite.status !== 'pending') throw new Error('Invite not pending')
    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch('patientInvites', args.inviteId, {
        status: 'expired',
      })
      throw new Error('Invite expired')
    }
    if (invite.email !== trimmedEmail)
      throw new Error('Invite not for this email')

    const rejectedInvite = await ctx.db.patch('patientInvites', args.inviteId, {
      status: 'rejected',
      respondedAt: Date.now(),
    })

    return rejectedInvite
  },
})

export const listIncomingInvites = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthedUser(ctx)
    const trimmedEmail = user.email?.trim().toLowerCase()

    const now = Date.now()
    const invites = await ctx.db
      .query('patientInvites')
      .withIndex('by_email_and_status', (q) =>
        q.eq('email', trimmedEmail!).eq('status', 'pending'),
      )
      .collect()

    const existingMemberships = await ctx.db
      .query('patientMembers')
      .withIndex('userId', (q) => q.eq('userId', user._id))
      .collect()

    const memberPatientIds = new Set(
      existingMemberships.map((m) => m.patientId),
    )

    const filteredInvites = invites.filter(
      (invite) =>
        !memberPatientIds.has(invite.patientId) && invite.expiresAt > now,
    )

    const patientIds = [...new Set(filteredInvites.map((i) => i.patientId))]
    const inviterIds = [...new Set(filteredInvites.map((i) => i.invitedBy))]

    const [patientPairs, inviterPairs] = await Promise.all([
      Promise.all(
        patientIds.map(
          async (id) => [id, await ctx.db.get('patients', id)] as const,
        ),
      ),
      Promise.all(
        inviterIds.map(
          async (id) => [id, await ctx.db.get('users', id)] as const,
        ),
      ),
    ])

    const patientsById = new Map(patientPairs)
    const invitersById = new Map(inviterPairs)

    return filteredInvites.map((invite) => {
      const patient = patientsById.get(invite.patientId)
      const inviter = invitersById.get(invite.invitedBy)
      return {
        inviteId: invite._id,
        patientId: invite.patientId,
        patientName: patient?.name,
        patientBirthDate: patient?.birthDate,
        patientTimezone: patient?.timezone,
        invitedByName: inviter?.name,
        invitedByEmail: inviter?.email,
        expiresAt: invite.expiresAt,
      }
    })
  },
})

export const getPatientTeam = query({
  args: {
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    const { membership } = await requirePatientMembership(ctx, args.patientId)

    const memberRows = await ctx.db
      .query('patientMembers')
      .withIndex('patientId', (q) => q.eq('patientId', args.patientId))
      .collect()

    const usersById = new Map(
      await Promise.all(
        memberRows.map(async (row) => {
          const userDoc = await ctx.db.get('users', row.userId)
          return [row.userId, userDoc] as const
        }),
      ),
    )

    const members = memberRows
      .map((row) => {
        const userDoc = usersById.get(row.userId)
        return {
          _id: row._id,
          userId: row.userId,
          role: row.role,
          user: {
            _id: row.userId,
            name: userDoc?.deleted ? '' : (userDoc?.name ?? ''),
            email: userDoc?.deleted ? '' : (userDoc?.email ?? ''),
            imageUrl:
              userDoc && !userDoc.deleted ? userDoc.imageUrl : undefined,
          },
        }
      })
      .sort((a, b) => {
        if (a.userId !== b.userId) {
          if (a.userId === membership.userId) return -1
          if (b.userId === membership.userId) return 1
        }

        const an = (a.user.name || a.user.email).toLowerCase()
        const bn = (b.user.name || b.user.email).toLowerCase()
        return an.localeCompare(bn)
      })

    const now = Date.now()
    let pendingInvites: Array<{
      inviteId: Id<'patientInvites'>
      email: string
      invitedAt: number
      expiresAt: number
      invitedByName?: string
    }> = []

    if (membership.role === 'primary') {
      const rawPending = await ctx.db
        .query('patientInvites')
        .withIndex('by_patientId_and_status', (q) =>
          q.eq('patientId', args.patientId).eq('status', 'pending'),
        )
        .collect()

      const activePending = rawPending.filter((inv) => inv.expiresAt > now)
      const inviterIds = [...new Set(activePending.map((i) => i.invitedBy))]
      const inviters = new Map(
        await Promise.all(
          inviterIds.map(async (id) => {
            const u = await ctx.db.get('users', id)
            return [id, u] as const
          }),
        ),
      )

      pendingInvites = activePending
        .map((inv) => {
          const inviter = inviters.get(inv.invitedBy)
          return {
            inviteId: inv._id,
            email: inv.email,
            invitedAt: inv.invitedAt,
            expiresAt: inv.expiresAt,
            invitedByName:
              inviter && !inviter.deleted
                ? (inviter.name ?? inviter.email ?? undefined)
                : undefined,
          }
        })
        .sort((a, b) => a.invitedAt - b.invitedAt)
    }

    return {
      viewerUserId: membership.userId,
      members,
      pendingInvites,
    }
  },
})
