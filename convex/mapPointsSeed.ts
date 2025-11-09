import { mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import { getSeedMapPoints, type SeedMapPoint } from './seedData'

async function insertSeedPoints(ctx: MutationCtx, points: SeedMapPoint[]): Promise<number> {
  let created = 0
  for (const p of points) {
    try {
      const qrTop = p.qrCode ?? p.metadata?.qrCode
      const now = Date.now()
      const payload: SeedMapPoint & { createdAt: number } = {
        ...p,
        createdAt: p.createdAt ?? now,
      }
      if (qrTop) {
        payload.qrCode = qrTop
      }
      await ctx.db.insert('map_points', payload)
      created++
      console.log('Created point: ', p.id)
    } catch (err) {
      console.error('Failed to insert point', p.id, err)
    }
  }
  return created
}

// Seed map points once (no duplicates)
export const seedMapPoints = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query('map_points').take(1)
    if (existing.length > 0) {
      console.log('Map points already seeded, skipping...')
      return { success: true, message: 'Already seeded', pointsCreated: 0 }
    }

    const created = await insertSeedPoints(ctx, getSeedMapPoints())
    return { success: true, message: `Seeded ${created} map points`, pointsCreated: created }
  }
})

// Clear all map points
export const clearMapPoints = mutation({
  handler: async (ctx) => {
    const points = await ctx.db.query('map_points').collect()
    for (const p of points) await ctx.db.delete(p._id)
    return { success: true, message: `Deleted ${points.length} map points` }
  }
})

// Add or update QR metadata for a point
export const addQRToPoint = mutation({
  args: {
    pointId: v.string(),
    qrCode: v.string(),
    qrHint: v.string(),
    qrRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { pointId, qrCode, qrHint, qrRequired = true } = args
    const point = await ctx.db
      .query('map_points')
      .filter((q) => q.eq(q.field('id'), pointId))
      .first()
    if (!point) throw new Error(`Point ${pointId} not found`)
    await ctx.db.patch(point._id, {
      qrCode,
      metadata: { ...(point.metadata ?? {}), qrHint, qrRequired },
    })
    return { success: true, pointId, qrCode }
  }
})

// Reseed: clear and insert UTF-8 seed data
export const reseedMapPoints = mutation({
  handler: async (ctx) => {
    const points = await ctx.db.query('map_points').collect()
    for (const p of points) await ctx.db.delete(p._id)

    const created = await insertSeedPoints(ctx, getSeedMapPoints())
    return { success: true, message: `Map points reseeded. Created ${created}.` }
  }
})
