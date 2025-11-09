import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import type { UnlockRequirements } from '../src/shared/types/map'
import { STARTING_SKILLS, awardXPAndLevelUp } from './gameProgress'

// Types
type PointMetadata = { danger_level?: 'low' | 'medium' | 'high' | string }
type PlayerFlags = Record<string, boolean | number | string | undefined>
type GameProgressInsert = {
  deviceId?: string
  userId?: string
  currentScene: string
  visitedScenes: string[]
  flags: PlayerFlags
  skills: Record<string, number>
  level: number
  xp: number
  skillPoints: number
  createdAt: number
  updatedAt: number
}
type GameProgressDoc = Doc<'game_progress'>
type SceneBindingDoc = {
  sceneId?: string
}

const isUnlockRequirements = (value: unknown): value is UnlockRequirements =>
  typeof value === 'object' && value !== null

const hasSceneBindings = (value: unknown): value is SceneBindingDoc[] => Array.isArray(value)

// Helper function: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

 // Get visible map points for current user
export const listVisible = query({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    bbox: v.optional(v.object({
      minLat: v.number(),
      maxLat: v.number(),
      minLng: v.number(),
      maxLng: v.number(),
    })),
    phase: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId, bbox, phase, limit = 100 } = args

    // Get player flags for unlockRequirements checking
    let playerFlags: PlayerFlags = {}
    let playerPhase: number | undefined = phase
    
    if (deviceId || userId) {
      let progressQuery = ctx.db.query('game_progress')
      if (deviceId) {
        progressQuery = progressQuery.filter((q) => q.eq(q.field('deviceId'), deviceId))
      } else if (userId) {
        progressQuery = progressQuery.filter((q) => q.eq(q.field('userId'), userId))
      }
      const progress = await progressQuery.first()
      if (progress) {
        playerFlags = progress.flags || {}
        // If phase is not provided in args, use player's phase
        // Если прогресс найден, используем сохранённые флаги и фазу игрока для фильтрации точек
        if (phase === undefined && progress.phase !== undefined) {
          playerPhase = progress.phase
        }
      }
    }

    // Query active map points
    let pointsQuery = ctx.db.query('map_points')
      .filter((q) => q.eq(q.field('isActive'), true))

    // Filter by phase if specified
    if (playerPhase !== undefined) {
      pointsQuery = pointsQuery.filter((q) => 
        q.or(
          q.eq(q.field('phase'), playerPhase),
          q.eq(q.field('phase'), undefined)
        )
      )
    }

    // Get points (we'll filter by bbox in memory for better performance)
    const allPoints = await pointsQuery.take(limit * 2)

    // Filter by bounding box if provided
    let filteredPoints = allPoints
    if (bbox) {
      filteredPoints = allPoints.filter(point => 
        point.coordinates.lat >= bbox.minLat &&
        point.coordinates.lat <= bbox.maxLat &&
        point.coordinates.lng >= bbox.minLng &&
        point.coordinates.lng <= bbox.maxLng
      )
    }

    // Filter by unlockRequirements
    filteredPoints = filteredPoints.filter(point => {
      const unlockData = point.metadata?.unlockRequirements
      const unlockReqs = isUnlockRequirements(unlockData) ? unlockData : undefined
      if (!unlockReqs) return true // No requirements - the point is accessible
      
      if (Array.isArray(unlockReqs.flags)) {
        const hasAllFlags = unlockReqs.flags.every((flag) => playerFlags[flag] === true)
        if (!hasAllFlags) return false
      }
      
      if (unlockReqs.phase !== undefined && playerPhase !== undefined) {
        if (playerPhase < unlockReqs.phase) return false
      }
      
      // TODO: Add questCompleted and reputation checks when implemented
      
      return true
    })

    // Helpers to enrich legacy metadata that might be missing new bindings
    const withEnrichedMetadata = filteredPoints.map((point) => {
      if (point.id === 'info_bureau') {
        const metadata = { ...(point.metadata ?? {}) }
        const hasModernBinding =
          hasSceneBindings(metadata.sceneBindings) &&
          metadata.sceneBindings.some((binding: SceneBindingDoc) => binding?.sceneId === 'info_bureau_meeting')
        if (!hasModernBinding) {
          metadata.sceneBindings = [
            {
              sceneId: 'info_bureau_meeting',
              triggerType: 'click',
              conditions: { flags: ['arrived_at_freiburg'] },
              priority: 10,
            },
          ]
        }
        if (!metadata.unlockRequirements) {
          metadata.unlockRequirements = { flags: ['arrived_at_freiburg'] }
        }
        if (!metadata.category) metadata.category = 'information'
        if (!metadata.characterName) metadata.characterName = 'Старшая регистраторша'
        return { ...point, metadata }
      }
      return point
    })

    // Limit results
    const limitedPoints = withEnrichedMetadata.slice(0, limit)

    // Get discovery status for each point
    const pointsWithStatus = await Promise.all(
      limitedPoints.map(async (point) => {
        // Query discovery record
        let discoveryQuery = ctx.db.query('point_discoveries')
          .filter((q) => q.eq(q.field('pointKey'), point.id))

        if (deviceId) {
          discoveryQuery = discoveryQuery.filter((q) => 
            q.eq(q.field('deviceId'), deviceId)
          )
        } else if (userId) {
          discoveryQuery = discoveryQuery.filter((q) => 
            q.eq(q.field('userId'), userId)
          )
        }

        const discovery = await discoveryQuery.first()

        return {
          ...point,
          status: discovery?.researchedAt ? 'researched' as const :
                  discovery?.discoveredAt ? 'discovered' as const : 'not_found' as const,
          discoveredAt: discovery?.discoveredAt,
          researchedAt: discovery?.researchedAt,
          discoveredBy: discovery?.deviceId || discovery?.userId,
        }
      })
    )

    return {
      points: pointsWithStatus,
      ttlMs: 5 * 60 * 1000, // 5 minutes cache
      timestamp: Date.now(),
    }
  },
})

// Mark point as researched
export const markResearched = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    pointKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId, pointKey } = args

    if (!deviceId && !userId) {
      throw new Error('Either deviceId or userId must be provided')
    }

    // Verify point exists
    const point = await ctx.db
      .query('map_points')
      .filter((q) => q.eq(q.field('id'), pointKey))
      .first()

    if (!point) {
      throw new Error('Map point not found')
    }

    // Find or create discovery record
    let discoveryQuery = ctx.db.query('point_discoveries')
      .filter((q) => q.eq(q.field('pointKey'), pointKey))

    if (deviceId) {
      discoveryQuery = discoveryQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      discoveryQuery = discoveryQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const existing = await discoveryQuery.first()
    const now = Date.now()

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        researchedAt: now,
        updatedAt: now,
      })
    } else {
      // Create new record
      await ctx.db.insert('point_discoveries', {
        deviceId,
        userId,
        pointKey,
        discoveredAt: now,
        researchedAt: now,
        updatedAt: now,
      })
    }

    // Award experience for research based on danger level
    // Tuned mapping: low=50, medium=75, high=125
    const rawDanger = (point.metadata as PointMetadata | undefined)?.danger_level
    type DangerLevel = 'low' | 'medium' | 'high'
    const danger: DangerLevel = (rawDanger === 'low' || rawDanger === 'medium' || rawDanger === 'high') ? rawDanger : 'low'
    const xpGain = danger === 'medium' ? 75 : danger === 'high' ? 125 : 50

    // Update game_progress XP with level-up handling
    let progressQuery = ctx.db.query('game_progress')
    if (deviceId) {
      progressQuery = progressQuery.filter((q) => q.eq(q.field('deviceId'), deviceId))
    } else if (userId) {
      progressQuery = progressQuery.filter((q) => q.eq(q.field('userId'), userId))
    }
    const progress = await progressQuery.first()

    if (!progress) {
      const toInsert: GameProgressInsert = {
        deviceId,
        userId,
        currentScene: 'prologue_start',
        visitedScenes: [],
        flags: {},
        skills: STARTING_SKILLS,
        level: 1,
        xp: xpGain,
        skillPoints: 3,
        createdAt: now,
        updatedAt: now,
      }
      await ctx.db.insert('game_progress', toInsert)
    } else {
      const gp = progress as GameProgressDoc
      const { level, xp, skillPoints } = awardXPAndLevelUp(gp.level, gp.xp, gp.skillPoints, xpGain)
      const patch: Partial<Pick<GameProgressInsert, 'level' | 'xp' | 'skillPoints' | 'updatedAt'>> = {
        level,
        xp,
        skillPoints,
        updatedAt: now,
      }
      await ctx.db.patch(gp._id, patch)
    }

    return {
      success: true,
      pointKey,
      researchedAt: now,
      xpGain,
      timestamp: Date.now(),
    }
  },
})

// Get points within radius from position
export const getPointsInRadius = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal('poi'),
      v.literal('quest'),
      v.literal('npc'),
      v.literal('location')
    )),
    phase: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { lat, lng, radiusKm = 1, type, phase, limit = 50 } = args

    // Get all active points
    let pointsQuery = ctx.db.query('map_points')
      .filter((q) => q.eq(q.field('isActive'), true))

    if (type) {
      pointsQuery = pointsQuery.filter((q) => q.eq(q.field('type'), type))
    }

    if (phase !== undefined) {
      pointsQuery = pointsQuery.filter((q) => 
        q.or(
          q.eq(q.field('phase'), phase),
          q.eq(q.field('phase'), undefined)
        )
      )
    }

    const allPoints = await pointsQuery.take(1000)

    // Filter by distance
    const pointsInRadius = allPoints
      .map(point => ({
        ...point,
        distance: calculateDistance(
          lat, lng,
          point.coordinates.lat, point.coordinates.lng
        )
      }))
      .filter(point => point.distance <= radiusKm * 1000)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return {
      points: pointsInRadius,
      totalCount: pointsInRadius.length,
      radiusKm,
      center: { lat, lng },
    }
  },
})

// Test function to add QR code to a point
export const addTestQRCode = mutation({
  args: {
    pointId: v.string(),
  },
  handler: async (ctx, args) => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('addTestQRCode is not available in production')
    }
    const { pointId } = args

    const point = await ctx.db
      .query('map_points')
      .filter((q) => q.eq(q.field('id'), pointId))
      .first()

    if (!point) {
      throw new Error(`Point ${pointId} not found`)
    }

    await ctx.db.patch(point._id, {
      qrCode: `TEST_QR_${pointId.toUpperCase()}`,
      metadata: {
        ...(point.metadata ?? {}),
        qrHint: `Найдите QR-код рядом с ${point.title}`,
        qrRequired: true
      }
    })

    return { success: true, pointId, qrCode: `TEST_QR_${pointId.toUpperCase()}` }
  }
})

// Activate a map point via QR code (awards XP and marks as researched)
export const activateByQR = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    qrCode: v.string(),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId, qrCode } = args
    if (!deviceId && !userId) {
      throw new Error('Either deviceId or userId must be provided')
    }

    // Find point by QR code via indexed column, fallback to metadata lookup
    let point = await ctx.db
      .query('map_points')
      .withIndex('by_qr_code', (q) => q.eq('qrCode', qrCode))
      .first()
    if (!point) {
      const allActive = await ctx.db
        .query('map_points')
        .filter((q) => q.eq(q.field('isActive'), true))
        .collect()
      const fallbackPoint = allActive.find((p) => p.qrCode === qrCode)
      if (fallbackPoint) {
        point = fallbackPoint
      }
    }
    if (!point) {
      throw new Error('QR code not recognized')
    }

    // Upsert discovery for this player/point
    let discoveryQuery = ctx.db
      .query('point_discoveries')
      .filter((q) => q.eq(q.field('pointKey'), point.id))

    if (deviceId) {
      discoveryQuery = discoveryQuery.filter((q) => q.eq(q.field('deviceId'), deviceId))
    } else if (userId) {
      discoveryQuery = discoveryQuery.filter((q) => q.eq(q.field('userId'), userId))
    }

    const existing = await discoveryQuery.first()
    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, {
        discoveredAt: existing.discoveredAt ?? now,
        researchedAt: now,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('point_discoveries', {
        deviceId,
        userId,
        pointKey: point.id,
        discoveredAt: now,
        researchedAt: now,
        updatedAt: now,
      })
    }

    // Award XP similarly to research
    const rawDanger = (point.metadata as PointMetadata | undefined)?.danger_level
    type DangerLevel = 'low' | 'medium' | 'high'
    const danger: DangerLevel = (rawDanger === 'low' || rawDanger === 'medium' || rawDanger === 'high') ? rawDanger : 'low'
    const xpGain = danger === 'medium' ? 75 : danger === 'high' ? 125 : 50

    // Update or create game_progress
    let progressQuery = ctx.db.query('game_progress')
    if (deviceId) {
      progressQuery = progressQuery.filter((q) => q.eq(q.field('deviceId'), deviceId))
    } else if (userId) {
      progressQuery = progressQuery.filter((q) => q.eq(q.field('userId'), userId))
    }
    const progress = await progressQuery.first()

    if (!progress) {
      const toInsert: GameProgressInsert = {
        deviceId,
        userId,
        currentScene: 'prologue_start',
        visitedScenes: [],
        flags: {},
        skills: STARTING_SKILLS,
        level: 1,
        xp: xpGain,
        skillPoints: 3,
        createdAt: now,
        updatedAt: now,
      }
      await ctx.db.insert('game_progress', toInsert)
    } else {
      const { level, xp, skillPoints } = awardXPAndLevelUp(progress.level, progress.xp, progress.skillPoints, xpGain)
      await ctx.db.patch(progress._id, {
        xp,
        level,
        skillPoints,
        updatedAt: now,
      })
    }

    return { success: true, point: { ...point, status: 'researched' as const }, xpGain }
  },
})

// Get discovery statistics for player
export const getDiscoveryStats = query({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { deviceId, userId } = args

    if (!deviceId && !userId) {
      return {
        totalDiscovered: 0,
        totalResearched: 0,
        byType: {},
        byPhase: {},
        recentDiscoveries: [],
      }
    }

    // Get all discoveries for player
    let discoveriesQuery = ctx.db.query('point_discoveries')

    if (deviceId) {
      discoveriesQuery = discoveriesQuery.filter((q) => 
        q.eq(q.field('deviceId'), deviceId)
      )
    } else if (userId) {
      discoveriesQuery = discoveriesQuery.filter((q) => 
        q.eq(q.field('userId'), userId)
      )
    }

    const discoveries = await discoveriesQuery.collect()

    // Get point information
    const pointKeys = [...new Set(discoveries.map(d => d.pointKey))]
    const points = await Promise.all(
      pointKeys.map(key =>
        ctx.db.query('map_points')
          .filter((q) => q.eq(q.field('id'), key))
          .first()
      )
    )

    const pointsMap = new Map(
      points.filter((p): p is NonNullable<typeof p> => p !== null).map(p => [p.id, p])
    )

    // Calculate statistics
    const stats = {
      totalDiscovered: discoveries.filter(d => d.discoveredAt).length,
      totalResearched: discoveries.filter(d => d.researchedAt).length,
      byType: {} as Record<string, number>,
      byPhase: {} as Record<number, number>,
      recentDiscoveries: discoveries
        .filter(d => d.discoveredAt)
        .sort((a, b) => (b.discoveredAt ?? 0) - (a.discoveredAt ?? 0))
        .slice(0, 10)
        .map(d => {
          const point = pointsMap.get(d.pointKey)
          return {
            pointKey: d.pointKey,
            pointTitle: point?.title || 'Unknown Point',
            discoveredAt: d.discoveredAt,
            researchedAt: d.researchedAt,
            type: point?.type,
            coordinates: point?.coordinates,
          }
        }),
    }

    // Count by type and phase
    discoveries.forEach(discovery => {
      const point = pointsMap.get(discovery.pointKey)
      if (point) {
        stats.byType[point.type] = (stats.byType[point.type] || 0) + 1
        
        if (point.phase !== undefined) {
          stats.byPhase[point.phase] = (stats.byPhase[point.phase] || 0) + 1
        }
      }
    })

    return stats
  },
})

