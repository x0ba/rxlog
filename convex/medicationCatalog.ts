import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const searchAndCache = mutation({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {},
})
