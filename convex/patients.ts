import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { mutation, query } from './_generated/server'

/** Ensures a `users` row exists (e.g. local dev before Clerk webhooks deliver). */
async function requireAuthedUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthorized')

  let user = await ctx.db
    .query('users')
    .withIndex('clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique()

  if (!user) {
    await ctx.db.insert('users', {
      clerkId: identity.subject,
      email: identity.email ?? '',
      name: identity.name ?? '',
      imageUrl: identity.pictureUrl ?? '',
      deleted: false,
    })
    user = await ctx.db
      .query('users')
      .withIndex('clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
  }

  if (!user || user.deleted) throw new Error('Unauthorized')
  return user
}

export const listPatients = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const user = await ctx.db
      .query('users')
      .withIndex('clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || user.deleted) return []

    const memberships = await ctx.db
      .query('patientMembers')
      .withIndex('userId', (q) => q.eq('userId', user._id))
      .collect()

    const out: Array<
      Doc<'patients'> & { role: string; memberCount: number }
    > = []

    for (const m of memberships) {
      const patient = await ctx.db.get(m.patientId)
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

export const addPatient = mutation({
  args: {
    name: v.string(),
    birthDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthedUser(ctx)

    const patientId = await ctx.db.insert('patients', { ...args })

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
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const user = await ctx.db
      .query('users')
      .withIndex('clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || user.deleted) return null

    const memberships = await ctx.db
      .query('patientMembers')
      .withIndex('userId', (q) => q.eq('userId', user._id))
      .collect()

    const membership = memberships.find((m) => m.patientId === patientId)
    if (!membership) return null

    const patient = await ctx.db.get(patientId)
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

    const patient = await ctx.db.get(patientId)
    if (!patient) throw new Error('Not found')

    const logs = await ctx.db
      .query('logs')
      .withIndex('patientId', (q) => q.eq('patientId', patientId))
      .collect()
    for (const log of logs) {
      await ctx.db.delete(log._id)
    }

    const medications = await ctx.db
      .query('medications')
      .withIndex('patientId', (q) => q.eq('patientId', patientId))
      .collect()
    for (const med of medications) {
      await ctx.db.delete(med._id)
    }

    const members = await ctx.db
      .query('patientMembers')
      .withIndex('patientId', (q) => q.eq('patientId', patientId))
      .collect()
    for (const m of members) {
      await ctx.db.delete(m._id)
    }

    await ctx.db.delete(patientId)
  },
})
