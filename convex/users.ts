import { query, mutation, internalMutation } from './_generated/server'
import { ConvexError, v } from 'convex/values'

// export const upsertUser = mutation({
//   handler: async (ctx) => {
//     const identity = await ctx.auth.getUserIdentity()
//     if (!identity) throw new Error('Unauthorized')

//     const user = await ctx.db
//       .query('users')
//       .withIndex('tokenIdentifier', (q) =>
//         q.eq('tokenIdentifier', identity.tokenIdentifier),
//       )
//       .unique()

//     if (user) {
//       return await ctx.db.patch('users', user._id, {
//         name: identity.name ?? '',
//         email: identity.email ?? '',
//       })
//     }

//     return await ctx.db.insert('users', {
//       name: identity.name ?? '',
//       email: identity.email ?? '',
//       tokenIdentifier: identity.tokenIdentifier,
//     })
//   },
// })

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
