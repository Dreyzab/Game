import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { STARTING_SKILLS } from './gameProgress'

type PlayerDoc = Doc<'players'>
type GameProgressDoc = Doc<'game_progress'>

const xpRequiredForLevel = (level: number) => 50 * level + 50

async function getPlayerByDeviceOrUser(
  ctx: QueryCtx | MutationCtx,
  args: { deviceId?: string; userId?: string }
): Promise<PlayerDoc | null> {
  if (!args.deviceId && !args.userId) return null

  if (args.deviceId) {
    const player = await ctx.db
      .query('players')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId!))
      .first()
    return player ?? null
  }

  if (args.userId) {
    const player = await ctx.db
      .query('players')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId!))
      .first()
    return player ?? null
  }

  const player = await ctx.db.query('players').first()
  return player ?? null
}

type ProgressLookupArgs = { deviceId?: string; userId?: string }

const buildInitialGameProgress = (args: ProgressLookupArgs, now: number) => ({
  deviceId: args.deviceId,
  userId: args.userId,
  currentScene: 'prologue_start',
  visitedScenes: [] as string[],
  flags: {} as Record<string, unknown>,
  skills: { ...STARTING_SKILLS },
  level: 1,
  xp: 0,
  skillPoints: 0,
  phase: 1,
  reputation: {} as Record<string, number>,
  createdAt: now,
  updatedAt: now,
  lastAppliedSeq: -1,
})

async function findGameProgress(
  ctx: QueryCtx | MutationCtx,
  args: ProgressLookupArgs
): Promise<GameProgressDoc | null> {
  if (args.deviceId) {
    const existing = await ctx.db
      .query('game_progress')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId!))
      .first()
    return existing ?? null
  }
  if (args.userId) {
    const existing = await ctx.db
      .query('game_progress')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId!))
      .first()
    return existing ?? null
  }
  const existing = await ctx.db.query('game_progress').first()
  return existing ?? null
}

async function ensureGameProgress(
  ctx: MutationCtx,
  args: ProgressLookupArgs
): Promise<GameProgressDoc> {
  const existing = await findGameProgress(ctx, args)
  if (existing) {
    return existing
  }
  const now = Date.now()
  const id = await ctx.db.insert('game_progress', buildInitialGameProgress(args, now))
  const created = await ctx.db.get(id)
  if (!created) throw new Error('Failed to create game_progress')
  return created
}

export const ensureByDevice = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Upsert player by deviceId
    let player = await ctx.db
      .query('players')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
      .first()

    if (!player) {
      await ctx.db.insert('players', {
        deviceId: args.deviceId,
        userId: undefined,
        name: `Guest-${args.deviceId.slice(-4)}`,
        fame: 0,
        createdAt: now,
        updatedAt: now,
      })
    } else {
      await ctx.db.patch(player._id, { updatedAt: now })
    }

    // Ensure minimal game_progress exists
    await ensureGameProgress(ctx, { deviceId: args.deviceId })
  },
})

export const create = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('players')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: now })
      return existing._id
    }
    const id = await ctx.db.insert('players', {
      deviceId: args.deviceId,
      userId: undefined,
      name: `Guest-${args.deviceId.slice(-4)}`,
      fame: 0,
      createdAt: now,
      updatedAt: now,
    })

    // Also create initial progress
    await ensureGameProgress(ctx, { deviceId: args.deviceId })

    return id
  },
})

export const get = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const player = await getPlayerByDeviceOrUser(ctx, { deviceId: args.deviceId })
    if (!player) return null
    return {
      id: player._id,
      deviceId: player.deviceId ?? '',
      createdAt: player.createdAt,
      status: 'Новичок',
      reputation: 0,
      level: undefined,
      xp: undefined,
      completedQuests: undefined,
      fame: player.fame ?? 0,
      points: undefined,
      daysInGame: undefined,
      developmentPhase: 'alpha',
    }
  },
})

export const getProgress = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const existing = await findGameProgress(ctx, { deviceId: args.deviceId })
    const progress =
      existing ??
      buildInitialGameProgress(
        { deviceId: args.deviceId },
        Date.now()
      )

    // Compute derived counters
    const level = progress.level ?? 1
    const xp = progress.xp ?? 0
    const skillPoints = progress.skillPoints ?? 0
    const maxXp = xpRequiredForLevel(level)

    // Completed quests
    const player = await getPlayerByDeviceOrUser(ctx, { deviceId: args.deviceId })
    let completedQuests = 0
    let completedQuestIds: string[] = []
    if (player) {
      const all = await ctx.db
        .query('quest_progress')
        .withIndex('by_player', (q) => q.eq('playerId', player._id))
        .collect()
      const completed = all.filter((q: Doc<'quest_progress'>) => q.completedAt)
      completedQuests = completed.length
      completedQuestIds = completed.map((q: Doc<'quest_progress'>) => q.questId)
    }

    const reputationByFaction = (progress as unknown as { reputation?: Record<string, number> }).reputation ?? {}

    return {
      level,
      xp,
      maxXp,
      skillPoints,
      reputation: 0,
      completedQuests,
      fame: 0,
      points: 0,
      daysInGame: 1,
      flags: (progress.flags ?? {}) as Record<string, unknown>,
      visitedScenes: progress.visitedScenes ?? [],
      completedQuestIds,
      currentScene: progress.currentScene,
      phase: (progress as unknown as { phase?: number }).phase ?? 1,
      reputationByFaction,
      lastUpdatedAt: progress.updatedAt,
    }
  },
})

