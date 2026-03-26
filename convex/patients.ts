import { query } from './_generated/server'
import { v } from 'convex/values'

export const listPatients = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')
  },
})
