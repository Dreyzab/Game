import { v } from 'convex/values'
import { mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { STARTING_SKILLS, awardXPAndLevelUp } from './gameProgress'

type SceneChoiceLog = {
  sceneId: string
  lineId: string
  choiceId: string
  effects?: Record<string, unknown>
}

type GameProgressDoc = Doc<'game_progress'>

const ensureProgress = async (
  ctx: MutationCtx,
  args: { deviceId?: string; userId?: string }
): Promise<GameProgressDoc | null> => {
  if (!args.deviceId && !args.userId) {
    throw new Error('deviceId or userId is required')
  }

  let progressQuery = ctx.db.query('game_progress')
  if (args.deviceId) {
    progressQuery = progressQuery.filter((q) => q.eq(q.field('deviceId'), args.deviceId))
  } else if (args.userId) {
    progressQuery = progressQuery.filter((q) => q.eq(q.field('userId'), args.userId))
  }

  return progressQuery.first()
}

const createProgress = async (
  ctx: MutationCtx,
  args: { deviceId?: string; userId?: string },
  sceneId: string
) => {
  const now = Date.now()
  return ctx.db.insert('game_progress', {
    deviceId: args.deviceId,
    userId: args.userId,
    currentScene: sceneId,
    visitedScenes: [],
    flags: {},
    skills: STARTING_SKILLS,
    level: 1,
    xp: 0,
    skillPoints: 0,
    phase: 1,
    createdAt: now,
    updatedAt: now,
    reputation: {},
  })
}

const applyFlagMutations = (
  flags: Record<string, unknown>,
  addFlags: string[] | undefined,
  removeFlags: string[] | undefined
) => {
  const nextFlags = { ...flags }
  addFlags?.forEach((flag) => {
    nextFlags[flag] = true
  })
  removeFlags?.forEach((flag) => {
    delete nextFlags[flag]
  })
  return nextFlags
}

const applyReputationMutations = (
  reputation: Record<string, number> | undefined,
  incoming: Record<string, number> | undefined
) => {
  if (!incoming) return reputation ?? {}
  const next = { ...(reputation ?? {}) }
  Object.entries(incoming).forEach(([faction, delta]) => {
    next[faction] = (next[faction] ?? 0) + delta
  })
  return next
}

export const commitScene = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    sceneId: v.string(),
    payload: v.object({
      startedAt: v.optional(v.number()),
      finishedAt: v.optional(v.number()),
      visitedScenes: v.optional(v.array(v.string())),
      choices: v.optional(
        v.array(
          v.object({
            sceneId: v.string(),
            lineId: v.string(),
            choiceId: v.string(),
            effects: v.optional(v.any()),
          })
        )
      ),
      questId: v.optional(v.string()),
      attempt: v.optional(v.number()),
      sceneLog: v.optional(
        v.array(
          v.object({
            stepId: v.string(),
            choiceId: v.optional(v.string()),
            success: v.optional(v.boolean()),
            reward: v.optional(v.any()),
          })
        )
      ),
      addFlags: v.optional(v.array(v.string())),
      removeFlags: v.optional(v.array(v.string())),
      xpDelta: v.optional(v.number()),
      reputation: v.optional(v.record(v.string(), v.number())),
      advancePhaseTo: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let progress = await ensureProgress(ctx, args)
    let progressId = progress?._id

    if (!progress) {
      progressId = await createProgress(ctx, args, args.sceneId)
      progress = await ctx.db.get(progressId!)
    }

    if (!progressId || !progress) {
      throw new Error('Unable to resolve game progress for player')
    }

    const visitedScenes = new Set(progress.visitedScenes ?? [])
    args.payload.visitedScenes?.forEach((sceneId) => visitedScenes.add(sceneId))
    visitedScenes.add(args.sceneId)

    const xpGain = args.payload.xpDelta ?? 0
    const xpResult = awardXPAndLevelUp(progress.level, progress.xp, progress.skillPoints, xpGain)
    const flags = applyFlagMutations(progress.flags ?? {}, args.payload.addFlags, args.payload.removeFlags)
    const reputation = applyReputationMutations(
      (progress as unknown as { reputation?: Record<string, number> }).reputation,
      args.payload.reputation
    )

    // Phase advancement
    let newPhase = (progress as unknown as { phase?: number }).phase ?? 1
    if (typeof args.payload.advancePhaseTo === 'number' && args.payload.advancePhaseTo > newPhase) {
      newPhase = args.payload.advancePhaseTo
    }

    await ctx.db.patch(progressId, {
      currentScene: args.sceneId,
      visitedScenes: Array.from(visitedScenes),
      flags,
      level: xpResult.level,
      xp: xpResult.xp,
      skillPoints: xpResult.skillPoints,
      phase: newPhase,
      updatedAt: now,
      reputation,
    })

    await ctx.db.insert('scene_logs', {
      deviceId: args.deviceId,
      userId: args.userId,
      sceneId: args.sceneId,
      choices: (args.payload.choices ?? []) as SceneChoiceLog[],
      startedAt: args.payload.startedAt ?? now,
      finishedAt: args.payload.finishedAt ?? now,
      payload: args.payload,
      createdAt: now,
    })

    return { success: true }
  },
})

/**
 * Логирует просмотр совета от внутреннего голоса (навыка)
 * Используется для аналитики популярности голосов и навыков
 */
export const logCharacterAdviceViewed = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    sceneId: v.string(),
    lineId: v.string(),
    characterId: v.string(), // ID навыка (logic, perception, etc.)
    choiceContext: v.array(v.string()), // ID доступных choices
    skillLevel: v.number(), // Уровень навыка в момент просмотра
    viewOrder: v.number(), // Порядковый номер просмотра (1-й, 2-й голос?)
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Логируем событие в scene_logs с типом 'advice_viewed'
    await ctx.db.insert('scene_logs', {
      deviceId: args.deviceId,
      userId: args.userId,
      sceneId: args.sceneId,
      choices: [], // Пустой массив, т.к. это не выбор, а просмотр совета
      startedAt: now,
      finishedAt: now,
      payload: {
        type: 'advice_viewed',
        lineId: args.lineId,
        characterId: args.characterId,
        choiceContext: args.choiceContext,
        skillLevel: args.skillLevel,
        viewOrder: args.viewOrder,
      },
      createdAt: now,
    })

    return { success: true, timestamp: now }
  },
})
