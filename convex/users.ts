import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { ensureAuthedUser, getAuthedUserOrNull } from './auth'
import { findUserByClerkUserId, syncUser, toUserProfile } from './userSync'

export const profile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUserOrNull(ctx)
    if (!user) return null

    return toUserProfile(user)
  },
})

export const upsertFromClerk = internalMutation({
  args: {
    authIdentifier: v.string(),
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await syncUser(ctx, {
      authIdentifier: args.authIdentifier,
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
    })

    return user._id
  },
})

export const deleteFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, { clerkUserId }) => {
    const existing = await findUserByClerkUserId(ctx, clerkUserId)

    if (!existing) return null

    await ctx.db.patch('users', existing._id, { deleted: true })
    return existing._id
  },
})

export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ensureAuthedUser(ctx)
    return toUserProfile(user)
  },
})

export const getUserById = query({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get('users', args.id)
  },
})
