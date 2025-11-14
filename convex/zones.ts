import { query } from './_generated/server'
import { v } from 'convex/values'

const bboxArgs = {
  // Optional bbox to reduce payload
  bbox: v.optional(
    v.object({
      minLat: v.number(),
      maxLat: v.number(),
      minLng: v.number(),
      maxLng: v.number(),
    }),
  ),
}

const filterActiveSafeZones = (zones: any[], bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
  const active = zones.filter((z) => z.isActive)
  if (!bbox) return active
  const { minLat, maxLat, minLng, maxLng } = bbox
  // Rough bbox filter: any vertex inside bbox
  return active.filter((z) =>
    z.polygon?.some((p: any) => p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng),
  )
}

export const listActiveSafeZones = query({
  args: bboxArgs,
  handler: async (ctx, args) => {
    const zones = await ctx.db.query('safe_zones').collect()
    return filterActiveSafeZones(zones, args.bbox ?? undefined)
  },
})

// Backwards-compatible alias that returns the same data as listActiveSafeZones
export const listSafeZones = query({
  args: bboxArgs,
  handler: async (ctx, args) => {
    const zones = await ctx.db.query('safe_zones').collect()
    return filterActiveSafeZones(zones, args.bbox ?? undefined)
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
