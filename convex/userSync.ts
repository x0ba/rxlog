import type { Doc } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'

type UserReadCtx = MutationCtx | QueryCtx

export type UserSyncFields = {
  authIdentifier: string
  clerkUserId: string
  email?: string
  name?: string
  imageUrl?: string
}

export function toUserProfile(
  user: Pick<Doc<'users'>, 'email' | 'imageUrl' | 'name'>,
) {
  return {
    email: user.email ?? '',
    name: user.name ?? '',
    imageUrl: user.imageUrl ?? '',
  }
}

export async function findUserByIdentifiers(
  ctx: UserReadCtx,
  identifiers: Pick<UserSyncFields, 'authIdentifier' | 'clerkUserId'>,
) {
  const userByAuthIdentifier = await ctx.db
    .query('users')
    .withIndex('by_authIdentifier', (q) =>
      q.eq('authIdentifier', identifiers.authIdentifier),
    )
    .unique()

  if (userByAuthIdentifier) {
    return userByAuthIdentifier
  }

  return await ctx.db
    .query('users')
    .withIndex('by_clerkUserId', (q) =>
      q.eq('clerkUserId', identifiers.clerkUserId),
    )
    .unique()
}

export async function findUserByClerkUserId(
  ctx: UserReadCtx,
  clerkUserId: string,
) {
  return await ctx.db
    .query('users')
    .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
    .unique()
}

export async function syncUser(ctx: MutationCtx, fields: UserSyncFields) {
  const existing = await findUserByIdentifiers(ctx, fields)
  const patch = {
    authIdentifier: fields.authIdentifier,
    clerkUserId: fields.clerkUserId,
    email: fields.email ?? '',
    name: fields.name ?? '',
    imageUrl: fields.imageUrl ?? '',
    deleted: false,
  } as const

  if (existing) {
    await ctx.db.patch('users', existing._id, patch)
    const syncedUser = await ctx.db.get('users', existing._id)
    if (!syncedUser) {
      throw new Error('Failed to sync user')
    }

    return syncedUser
  }

  const userId = await ctx.db.insert('users', patch)
  const createdUser = await ctx.db.get('users', userId)
  if (!createdUser) {
    throw new Error('Failed to create user')
  }

  return createdUser
}
