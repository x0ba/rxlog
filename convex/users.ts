import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

export const profile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || user.deleted) return null

    return {
      email: user.email ?? '',
      name: user.name,
      imageUrl: user.imageUrl,
    }
  },
})

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email ?? '',
        name: args.name ?? '',
        imageUrl: args.imageUrl ?? '',
        deleted: false,
      })
      return existing._id
    }

    return await ctx.db.insert('users', {
      clerkId: args.clerkId,
      email: args.email ?? '',
      name: args.name ?? '',
      imageUrl: args.imageUrl ?? '',
      deleted: false,
    })
  },
})

export const deleteFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()

    if (!existing) return null

    await ctx.db.patch(existing._id, { deleted: true })
    return existing._id
  },
})

export const getUserById = query({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})
