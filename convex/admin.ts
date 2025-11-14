import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const register = mutation({
  args: {
    name: v.string(),
  },
  handler: async (_ctx, args) => {
    console.log('[admin.register] New admin registration request:', {
      name: args.name,
      at: Date.now(),
    })
    // For now we just log the registration request.
    // A dedicated `admins` table can be added later if persistent admin records are needed.
  },
})

