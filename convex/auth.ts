import type { Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'

type AuthedCtx = MutationCtx | QueryCtx

async function getIdentityAndUser(ctx: AuthedCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthorized')

  const user = await ctx.db
    .query('users')
    .withIndex('clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique()

  return { identity, user }
}

export async function requireAuthedUser(ctx: AuthedCtx) {
  const { user } = await getIdentityAndUser(ctx)

  if (!user || user.deleted) throw new Error('Unauthorized')
  return user
}

export async function ensureAuthedUser(ctx: MutationCtx) {
  const { identity, user } = await getIdentityAndUser(ctx)

  if (user && !user.deleted) return user

  if (user && user.deleted) {
    await ctx.db.patch(user._id, {
      email: identity.email ?? '',
      name: identity.name ?? '',
      imageUrl: identity.pictureUrl ?? '',
      deleted: false,
    })

    const restoredUser = await ctx.db.get(user._id)
    if (!restoredUser) throw new Error('Unauthorized')
    return restoredUser
  }

  const userId = await ctx.db.insert('users', {
    clerkId: identity.subject,
    email: identity.email ?? '',
    name: identity.name ?? '',
    imageUrl: identity.pictureUrl ?? '',
    deleted: false,
  })
  const createdUser = await ctx.db.get(userId)

  if (!createdUser) throw new Error('Unauthorized')
  return createdUser
}

export async function requirePatientMembership(
  ctx: AuthedCtx,
  patientId: Id<'patients'>,
) {
  const user = await requireAuthedUser(ctx)
  const membership = await ctx.db
    .query('patientMembers')
    .withIndex('patientId_userId', (q) =>
      q.eq('patientId', patientId).eq('userId', user._id),
    )
    .unique()

  if (!membership) throw new Error('Unauthorized')

  return { membership, user }
}
