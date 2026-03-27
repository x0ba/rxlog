import { v } from 'convex/values'
import { internalMutation, query } from './_generated/server'
import { getAuthedUserOrNull } from './auth'

export const profile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUserOrNull(ctx)
    if (!user) return null

    return {
      email: user.email ?? '',
      name: user.name,
      imageUrl: user.imageUrl,
    }
  },
})

export const upsertFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', args.clerkUserId))
      .unique()

    if (existing) {
      await ctx.db.patch("users", existing._id, {
        clerkUserId: args.clerkUserId,
        email: args.email ?? '',
        name: args.name ?? '',
        imageUrl: args.imageUrl ?? '',
        deleted: false,
      })
      return existing._id
    }

    return await ctx.db.insert('users', {
      authIdentifier: args.clerkUserId,
      clerkUserId: args.clerkUserId,
      email: args.email ?? '',
      name: args.name ?? '',
      imageUrl: args.imageUrl ?? '',
      deleted: false,
    })
  },
})

export const deleteFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, { clerkUserId }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
      .unique()

    if (!existing) return null

    await ctx.db.patch("users", existing._id, { deleted: true })
    return existing._id
  },
})

export const getUserById = query({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get("users", args.id)
  },
})
