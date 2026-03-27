import type { Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'

type AuthedCtx = MutationCtx | QueryCtx

async function getIdentity(ctx: AuthedCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthorized')

  return identity
}

async function findUserByIdentity(
  ctx: AuthedCtx,
  identity: Awaited<ReturnType<typeof getIdentity>>,
) {
  const userByAuthIdentifier = await ctx.db
    .query('users')
    .withIndex('by_authIdentifier', (q) =>
      q.eq('authIdentifier', identity.tokenIdentifier),
    )
    .unique()

  if (userByAuthIdentifier) {
    return userByAuthIdentifier
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', identity.subject))
    .unique()

  return user
}

function getUserPatch(identity: Awaited<ReturnType<typeof getIdentity>>) {
  return {
    authIdentifier: identity.tokenIdentifier,
    clerkUserId: identity.subject,
    email: identity.email ?? '',
    name: identity.name ?? '',
    imageUrl: identity.pictureUrl ?? '',
    deleted: false,
  }
}

async function getIdentityAndUser(ctx: AuthedCtx) {
  const identity = await getIdentity(ctx)
  const user = await findUserByIdentity(ctx, identity)

  return { identity, user }
}

export async function getAuthedUserOrNull(ctx: AuthedCtx) {
  const { user } = await getIdentityAndUser(ctx)

  if (!user || user.deleted) return null
  return user
}

export async function requireAuthedUser(ctx: AuthedCtx) {
  const user = await getAuthedUserOrNull(ctx)
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function ensureAuthedUser(ctx: MutationCtx) {
  const { identity, user } = await getIdentityAndUser(ctx)

  if (user) {
    await ctx.db.patch(user._id, getUserPatch(identity))

    const syncedUser = await ctx.db.get(user._id)
    if (!syncedUser || syncedUser.deleted) throw new Error('Unauthorized')
    return syncedUser
  }

  const userId = await ctx.db.insert('users', {
    ...getUserPatch(identity),
  })
  const createdUser = await ctx.db.get(userId)

  if (!createdUser || createdUser.deleted) throw new Error('Unauthorized')
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
