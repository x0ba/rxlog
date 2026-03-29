import { findUserByIdentifiers, syncUser } from './userSync'
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
  return await findUserByIdentifiers(ctx, {
    authIdentifier: identity.tokenIdentifier,
    clerkUserId: identity.subject,
  })
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
  const identity = await getIdentity(ctx)
  const syncedUser = await syncUser(ctx, {
    authIdentifier: identity.tokenIdentifier,
    clerkUserId: identity.subject,
    email: identity.email ?? '',
    name: identity.name ?? '',
    imageUrl: identity.pictureUrl ?? '',
  })

  if (syncedUser.deleted) throw new Error('Unauthorized')
  return syncedUser
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

export async function requirePrimaryPatientMembership(
  ctx: AuthedCtx,
  patientId: Id<'patients'>,
) {
  const { membership, user } = await requirePatientMembership(ctx, patientId)
  if (membership.role !== 'primary') throw new Error('Unauthorized')
  return { membership, user }
}
