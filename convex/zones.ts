import { query } from './_generated/server'
import { v } from 'convex/values'

export const listSafeZones = query({
  args: {
    // Optional bbox to reduce payload
    bbox: v.optional(v.object({
      minLat: v.number(),
      maxLat: v.number(),
      minLng: v.number(),
      maxLng: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const zones = await ctx.db.query('safe_zones').collect()
    const active = zones.filter((z) => z.isActive)
    if (!args.bbox) return active
    const { minLat, maxLat, minLng, maxLng } = args.bbox
    // Rough bbox filter: any vertex inside bbox
    return active.filter((z) =>
      z.polygon?.some((p) => p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng)
    )
  },
})

export const listDangerZones = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query('danger_zones')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect()
  },
})
