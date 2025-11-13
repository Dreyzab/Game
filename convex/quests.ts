import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import type { QueryCtx, MutationCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'

type QuestProgressDoc = Doc<'quest_progress'>
type PlayerDoc = Doc<'players'>
type GameProgressDoc = Doc<'game_progress'>
type AnalyticsFailure = { questId: string; seq: number; reason?: string }

const reportQuestError = (error: unknown, context: Record<string, unknown>) => {
  console.error('[quests]', {
    error,
    ...context,
  })
}

const PROLOGUE_QUESTS = [
  {
    id: 'delivery_for_dieter',
    title: 'Delivery for Dieter',
    description: 'Bring the parcel to Dieter at the Freiburg market square.',
  },
  {
    id: 'delivery_for_professor',
    title: 'Letter for the Professor',
    description: 'Deliver the professor’s documents to advance the global questline.',
  },
]

async function resolvePlayer(
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

async function ensurePlayer(
  ctx: MutationCtx,
  args: { deviceId?: string; userId?: string }
): Promise<PlayerDoc> {
  const existing = await resolvePlayer(ctx, args)
  if (existing) {
    return existing
  }
  if (!args.deviceId && !args.userId) {
    throw new Error('deviceId or userId is required')
  }
  const now = Date.now()
  // Используем уникальный префикс для синтезированных deviceId, чтобы избежать коллизий с реальными
  const deviceId = args.deviceId ?? `__synthetic_user:${args.userId!}`
  const id = await ctx.db.insert('players', {
    deviceId,
    userId: args.userId,
    name: `Guest-${deviceId.slice(-8)}`,
    fame: 0,
    createdAt: now,
    updatedAt: now,
  })
  const created = await ctx.db.get(id)
  return created as PlayerDoc
}

async function getFlags(ctx: QueryCtx | MutationCtx, args: { deviceId?: string; userId?: string }) {
  if (args.deviceId) {
    const gp = await ctx.db
      .query('game_progress')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId!))
      .first()
    return (gp?.flags ?? {}) as Record<string, unknown>
  }
  if (args.userId) {
    const gp = await ctx.db
      .query('game_progress')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId!))
      .first()
    return (gp?.flags ?? {}) as Record<string, unknown>
  }
  const gp = await ctx.db.query('game_progress').first()
  return (gp?.flags ?? {}) as Record<string, unknown>
}

async function getQuestById(ctx: QueryCtx | MutationCtx, questId: string): Promise<Doc<'quests'> | null> {
  const quest = await ctx.db
    .query('quests')
    .withIndex('byQuestId', (q) => q.eq('id', questId))
    .first()
  return quest ?? null
}

// Shared core helpers used by mutations and sync
async function coreStart(ctx: MutationCtx, player: PlayerDoc, questId: string) {
  const quest = await getQuestById(ctx, questId)
  if (!quest || !quest.isActive) throw new Error('Quest is not active or missing')

  if (Array.isArray(quest.prerequisites) && quest.prerequisites.length > 0) {
    const prev = await ctx.db
      .query('quest_progress')
      .withIndex('by_player', (q) => q.eq('playerId', player._id))
      .collect()
    const completedIds = new Set(prev.filter((p) => p.completedAt).map((p) => p.questId))
    const unmet = quest.prerequisites.filter((id) => !completedIds.has(id))
    if (unmet.length > 0) throw new Error('Prerequisites not met')
  }

  const firstStep = Array.isArray(quest.steps) && quest.steps.length > 0 ? quest.steps[0].id : ''
  const tplVersion = quest.templateVersion ?? 1
  const existing = await ctx.db
    .query('quest_progress')
    .withIndex('by_player_quest', (q) => q.eq('playerId', player._id).eq('questId', questId))
    .first()
  if (existing) {
    // If already exists and completed, allow restart for repeatable quests by resetting state and incrementing attempt
    if (existing.completedAt && quest.repeatable === true) {
      const now2 = Date.now()
      const nextAttempt = (existing.attempt ?? 1) + 1
      await ctx.db.patch(existing._id, {
        currentStep: firstStep,
        startedAt: now2,
        completedAt: undefined,
        // abandonedAt reset on restart
        progress: 0,
        attempt: nextAttempt,
        templateVersion: tplVersion,
        updatedAt: now2,
      } as Partial<QuestProgressDoc>)
      const restarted = await ctx.db.get(existing._id)
      return restarted as QuestProgressDoc
    }
    return existing
  }

  const now = Date.now()
  const id = await ctx.db.insert('quest_progress', {
    playerId: player._id,
    questId,
    currentStep: firstStep,
    startedAt: now,
    attempt: 1,
    progress: 0,
    templateVersion: tplVersion,
    updatedAt: now,
  })
  const created = await ctx.db.get(id)
  return created as QuestProgressDoc
}

async function coreUpdate(
  ctx: MutationCtx,
  player: PlayerDoc,
  questId: string,
  args: { expectedStep?: string; nextStepId?: string; deltaProgress?: number; setProgress?: number }
) {
  const progress = await ctx.db
    .query('quest_progress')
    .withIndex('by_player_quest', (q) => q.eq('playerId', player._id).eq('questId', questId))
    .first()
  if (!progress) throw new Error('Quest not started')
  if (progress.completedAt) return progress

  if (args.expectedStep !== undefined && args.expectedStep !== progress.currentStep) {
    throw new Error('Step conflict')
  }

  const quest = await getQuestById(ctx, questId)
  const steps = quest?.steps ?? []
  const stepIndex = steps.findIndex((s) => s.id === progress.currentStep)

  let newStep = progress.currentStep
  if (args.nextStepId) {
    const nextIndex = steps.findIndex((s) => s.id === args.nextStepId)
    if (nextIndex === -1) throw new Error('Invalid next step')
    if (stepIndex !== -1 && nextIndex > stepIndex + 1) throw new Error('Cannot skip steps')
    newStep = args.nextStepId
  }

  let newProgress: unknown = progress.progress
  if (typeof args.deltaProgress === 'number') {
    const current = typeof progress.progress === 'number' ? (progress.progress as number) : 0
    newProgress = current + args.deltaProgress
  } else if (typeof args.setProgress === 'number') {
    newProgress = args.setProgress
  }

  await ctx.db.patch(progress._id, {
    currentStep: newStep,
    progress: newProgress,
    updatedAt: Date.now(),
  } as Partial<QuestProgressDoc>)

  const updated = await ctx.db.get(progress._id)
  return updated as QuestProgressDoc
}

async function coreComplete(
  ctx: MutationCtx,
  player: PlayerDoc,
  args: { deviceId?: string; userId?: string; questId: string; expectedStep?: string }
) {
  const progress = await ctx.db
    .query('quest_progress')
    .withIndex('by_player_quest', (q) => q.eq('playerId', player._id).eq('questId', args.questId))
    .first()
  if (!progress) throw new Error('Quest not started')
  if (progress.completedAt) return progress

  const quest = await getQuestById(ctx, args.questId)
  if (!quest) throw new Error('Quest missing')

  if (args.expectedStep !== undefined && args.expectedStep !== progress.currentStep) {
    throw new Error('Step conflict')
  }

  if (Array.isArray(quest.steps) && quest.steps.length > 0) {
    const lastId = quest.steps[quest.steps.length - 1].id
    if (progress.currentStep !== lastId) {
      throw new Error('Quest cannot be completed at this step')
    }
  }

  const now = Date.now()
  await ctx.db.patch(progress._id, { completedAt: now, updatedAt: now } as Partial<QuestProgressDoc>)

  // Award rewards once
  if (quest.rewards?.fame && typeof quest.rewards.fame === 'number') {
    const currentFame = typeof player.fame === 'number' ? player.fame : 0
    await ctx.db.patch(player._id, { fame: currentFame + quest.rewards.fame, updatedAt: now } as Partial<PlayerDoc>)
  }

  if (Array.isArray(quest.rewards?.flags) && quest.rewards.flags.length > 0) {
    const gp = await (args.deviceId
      ? ctx.db.query('game_progress').withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId!)).first()
      : args.userId
        ? ctx.db.query('game_progress').withIndex('by_userId', (q) => q.eq('userId', args.userId!)).first()
        : ctx.db.query('game_progress').first())
    if (gp) {
      const nextFlags = { ...(gp.flags as Record<string, unknown> | undefined) } as Record<string, unknown>
      for (const f of quest.rewards.flags) nextFlags[f] = true
      await ctx.db.patch(gp._id, { flags: nextFlags, updatedAt: now } as Partial<GameProgressDoc>)
    }
  }

  const updated = await ctx.db.get(progress._id)
  return updated as QuestProgressDoc
}

export const getActive = query({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prefer authoritative quest_progress if player exists
    const player = await resolvePlayer(ctx, args)
    const activeFromProgress: Array<{ id: string; title: string; description?: string; status: 'active'; createdAt?: number; progress?: number; maxProgress?: number; currentStep?: string; templateVersion?: number; completedAt?: number; attempt?: number; abandonedAt?: number }> = []

    if (player) {
      const docs = await ctx.db
        .query('quest_progress')
        .withIndex('by_player', (q) => q.eq('playerId', player._id))
        .collect()
      for (const doc of docs) {
        if (!doc.completedAt) {
          // Try to fetch quest template for title/description
          const match = await getQuestById(ctx, doc.questId)
          activeFromProgress.push({
            id: doc.questId,
            title: match?.title ?? `Quest ${doc.questId}`,
            description: match?.description,
            status: 'active',
            createdAt: doc.startedAt,
            progress: typeof doc.progress === 'number' ? (doc.progress as number) : undefined,
            maxProgress: typeof match?.steps?.length === 'number' ? match!.steps!.length : undefined,
            currentStep: doc.currentStep,
            templateVersion: (doc as any).templateVersion ?? (match as any)?.templateVersion,
            attempt: (doc as any).attempt,
            abandonedAt: (doc as any).abandonedAt,
          })
        }
      }
    }

    // Derive contextual quests from flags (prologue baseline)
    const flags = await getFlags(ctx, args)
    const hasArrival = flags['arrived_at_freiburg'] === true || flags['need_info_bureau'] === true
    const derived: typeof activeFromProgress = hasArrival
      ? PROLOGUE_QUESTS.map((q, idx) => ({ ...q, status: 'active' as const, createdAt: Date.now() - idx * 1000 }))
      : []

    // Merge, prefer explicit progress-based entries
    const byId = new Map<string, (typeof activeFromProgress)[number]>()
    for (const q of derived) byId.set(q.id, q)
    for (const q of activeFromProgress) byId.set(q.id, q)

    // Return stable order by createdAt then id
    const result = Array.from(byId.values()).sort((a, b) => {
      const ca = a.createdAt ?? 0
      const cb = b.createdAt ?? 0
      if (ca !== cb) return cb - ca
      return a.id.localeCompare(b.id)
    })

    return result
  },
})

export const getById = query({
  args: { questId: v.string() },
  handler: async (ctx, args) => {
    const quest = await getQuestById(ctx, args.questId)
    if (!quest) return null
    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      phase: quest.phase,
      isActive: quest.isActive,
      stepsCount: Array.isArray(quest.steps) ? quest.steps.length : 0,
      repeatable: (quest as any).repeatable === true,
      templateVersion: (quest as any).templateVersion ?? 1,
    }
  },
})

export const getCompleted = query({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const player = await resolvePlayer(ctx, args)
    if (!player) return []
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500))

    // Fetch completed by index
    const completed = await ctx.db
      .query('quest_progress')
      .withIndex('by_player_completed', (q) => q.eq('playerId', player._id))
      .collect()
    // Fetch abandoned by index
    const abandoned = await ctx.db
      .query('quest_progress')
      .withIndex('by_player_abandoned', (q) => q.eq('playerId', player._id))
      .collect()

    const rows = [...completed.filter((d: any) => d.completedAt), ...abandoned.filter((d: any) => d.abandonedAt)]
      .sort((a: any, b: any) => Math.max(a.completedAt ?? 0, a.abandonedAt ?? 0) - Math.max(b.completedAt ?? 0, b.abandonedAt ?? 0))
      .slice(0, limit)

    const result: Array<{ id: string; title: string; status: 'completed' | 'abandoned'; completedAt?: number; abandonedAt?: number; attempt?: number; templateVersion?: number; currentStep?: string; startedAt?: number }> = []
    for (const doc of rows) {
      const quest = await getQuestById(ctx, doc.questId)
      result.push({
        id: doc.questId,
        title: quest?.title ?? `Quest ${doc.questId}`,
        status: doc.completedAt ? 'completed' : 'abandoned',
        completedAt: doc.completedAt ?? undefined,
        abandonedAt: (doc as any).abandonedAt ?? undefined,
        attempt: (doc as any).attempt ?? undefined,
        templateVersion: (doc as any).templateVersion ?? (quest as any)?.templateVersion,
        currentStep: doc.currentStep,
        startedAt: doc.startedAt,
      })
    }

    return result
  },
})

export const start = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    questId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.deviceId && !args.userId) throw new Error('deviceId or userId is required')

    const player = await ensurePlayer(ctx, args)
    await coreStart(ctx, player, args.questId)
    return { started: true, questId: args.questId }
  },
})

export const updateProgress = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    questId: v.string(),
    expectedStep: v.optional(v.string()),
    nextStepId: v.optional(v.string()),
    deltaProgress: v.optional(v.number()),
    setProgress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.deviceId && !args.userId) throw new Error('deviceId or userId is required')
    const player = await ensurePlayer(ctx, args)

    const updated = await coreUpdate(ctx, player, args.questId, args)
    return { updated: true, questId: args.questId, currentStep: updated.currentStep, progress: updated.progress }
  },
})

export const complete = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    questId: v.string(),
    expectedStep: v.optional(v.string()),
    resultDetails: v.optional(
      v.object({
        templateVersion: v.optional(v.number()),
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
      })
    ),
  },
  handler: async (ctx, args) => {
    if (!args.deviceId && !args.userId) throw new Error('deviceId or userId is required')
    const player = await ensurePlayer(ctx, args)

    const updated = await coreComplete(ctx, player, args)

    // Write quest completion analytics into scene_logs
    let analyticsSaved = true
    try {
      const now = Date.now()
      const quest = await getQuestById(ctx, args.questId)
      const tplVersion = (updated as any).templateVersion ?? (quest as any)?.templateVersion ?? args.resultDetails?.templateVersion
      await ctx.db.insert('scene_logs', {
        deviceId: args.deviceId,
        userId: args.userId,
        sceneId: `quest:${args.questId}:complete`,
        choices: undefined as any,
        startedAt: (updated as any).startedAt ?? now,
        finishedAt: now,
        payload: {
          type: 'quest_complete',
          questId: args.questId,
          attempt: (updated as any).attempt ?? 1,
          templateVersion: tplVersion ?? 1,
          sceneLog: args.resultDetails?.sceneLog ?? [],
        },
        createdAt: now,
      })
    } catch (error) {
      analyticsSaved = false
      reportQuestError(error, {
        where: 'complete',
        questId: args.questId,
        playerId: player._id,
        deviceId: args.deviceId ?? null,
        userId: args.userId ?? null,
        sceneLogLength: args.resultDetails?.sceneLog?.length ?? 0,
      })
    }

    return { completed: true, questId: args.questId, analyticsSaved }
  },
})

/**
 * Applies quest delta events sequentially.
 * Returns the last acknowledged sequence in `ack`. If `partialSuccess` is true,
 * clients must retry starting from `ack + 1` to recover from the failure.
 */
export const sync = mutation({
  args: {
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    lastKnownSeq: v.number(),
    events: v.array(
      v.object({
        seq: v.number(),
        type: v.union(v.literal('start'), v.literal('update'), v.literal('complete'), v.literal('abandon')),
        questId: v.string(),
        payload: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (!args.deviceId && !args.userId) throw new Error('deviceId or userId is required')
    const player = (await resolvePlayer(ctx, args)) ?? (await ensurePlayer(ctx, args))

    // Find game_progress for lastAppliedSeq tracking
    const gameProgressQuery =
      args.deviceId
        ? ctx.db.query('game_progress').withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId!))
        : args.userId
          ? ctx.db.query('game_progress').withIndex('by_userId', (q) => q.eq('userId', args.userId!))
          : ctx.db.query('game_progress')
    let gp = (await gameProgressQuery.first()) as GameProgressDoc | null
    const createdAt = Date.now()
    if (!gp) {
      const id = await ctx.db.insert('game_progress', {
        deviceId: args.deviceId,
        userId: args.userId,
        currentScene: 'prologue_start',
        visitedScenes: [],
        flags: {},
        level: 1,
        xp: 0,
        skillPoints: 0,
        createdAt,
        updatedAt: createdAt,
        phase: 1,
        reputation: {},
        lastAppliedSeq: -1,
      })
      gp = (await ctx.db.get(id)) as GameProgressDoc
    }

    const storedLast = typeof gp.lastAppliedSeq === 'number' ? gp.lastAppliedSeq : -1
    const events = [...args.events].sort((a, b) => a.seq - b.seq)
    if (events.length === 0) {
      return { ack: storedLast, echos: [], nextExpectedSeq: storedLast + 1, partialSuccess: false, analyticsFailures: [] as AnalyticsFailure[] }
    }
    // Strict ordering
    if (events[0].seq !== storedLast + 1) {
      return { ack: storedLast, error: 'out_of_order', expectedNextSeq: storedLast + 1, partialSuccess: false, analyticsFailures: [] as AnalyticsFailure[] }
    }
    for (let i = 1; i < events.length; i++) {
      if (events[i].seq !== events[i - 1].seq + 1) {
        return { ack: storedLast, error: 'gap_in_sequence', expectedNextSeq: events[i - 1].seq + 1, partialSuccess: false, analyticsFailures: [] as AnalyticsFailure[] }
      }
    }

    const touched = new Set<string>()
    const analyticsFailures: AnalyticsFailure[] = []
    for (const ev of events) {
      try {
        if (ev.type === 'start') {
          await coreStart(ctx, player, ev.questId)
        } else if (ev.type === 'update') {
          const payload = (ev.payload ?? {}) as { expectedStep?: string; nextStepId?: string; deltaProgress?: number; setProgress?: number }
          await coreUpdate(ctx, player, ev.questId, payload)
        } else if (ev.type === 'complete') {
          const payload = (ev.payload ?? {}) as { expectedStep?: string; resultDetails?: { templateVersion?: number; sceneLog?: Array<{ stepId: string; choiceId?: string; success?: boolean; reward?: unknown }> } }
          const updated = await coreComplete(ctx, player, { deviceId: args.deviceId, userId: args.userId, questId: ev.questId, expectedStep: payload.expectedStep })
          try {
            const finishedAt = Date.now()
            await ctx.db.insert('scene_logs', {
              deviceId: args.deviceId,
              userId: args.userId,
              sceneId: `quest:${ev.questId}:complete`,
              choices: undefined as any,
              startedAt: (updated as any).startedAt ?? finishedAt,
              finishedAt,
              payload: {
                type: 'quest_complete',
                questId: ev.questId,
                attempt: (updated as any).attempt ?? 1,
                templateVersion: (updated as any).templateVersion ?? payload.resultDetails?.templateVersion ?? 1,
                sceneLog: payload.resultDetails?.sceneLog ?? [],
              },
              createdAt: Date.now(),
            })
          } catch (error) {
            analyticsFailures.push({ questId: ev.questId, seq: ev.seq, reason: error instanceof Error ? error.message : 'unknown' })
            reportQuestError(error, {
              where: 'sync.scene_logs',
              questId: ev.questId,
              seq: ev.seq,
              deviceId: args.deviceId ?? null,
              userId: args.userId ?? null,
            })
          }
        } else if (ev.type === 'abandon') {
          const prog = await ctx.db
            .query('quest_progress')
            .withIndex('by_player_quest', (q) => q.eq('playerId', player._id).eq('questId', ev.questId))
            .first()
          if (prog && !prog.completedAt) {
            await ctx.db.patch(prog._id, { abandonedAt: Date.now(), updatedAt: Date.now() } as Partial<QuestProgressDoc>)
          }
        }
        touched.add(ev.questId)
      } catch (e) {
        // Stop on first failure to keep strict ordering
        reportQuestError(e, {
          where: 'sync.event',
          questId: ev.questId,
          seq: ev.seq,
          eventType: ev.type,
          deviceId: args.deviceId ?? null,
          userId: args.userId ?? null,
        })
        return {
          ack: ev.seq - 1,
          error: e instanceof Error ? e.message : String(e),
          failedSeq: ev.seq,
          partialSuccess: true,
          nextExpectedSeq: ev.seq,
          analyticsFailures,
        }
      }
    }

    const newLast = events[events.length - 1].seq
    await ctx.db.patch(gp._id, { lastAppliedSeq: newLast, updatedAt: Date.now() } as Partial<GameProgressDoc>)

    // Build echo states
    const echos: Array<{ questId: string; status: 'active' | 'completed'; currentStep?: string; progress?: number; completedAt?: number }> = []
    for (const qid of touched) {
      const prog = await ctx.db
        .query('quest_progress')
        .withIndex('by_player_quest', (q) => q.eq('playerId', player._id).eq('questId', qid))
        .first()
      if (prog) {
        echos.push({
          questId: qid,
          status: prog.completedAt ? 'completed' : 'active',
          currentStep: prog.currentStep,
          progress: typeof prog.progress === 'number' ? (prog.progress as number) : undefined,
          completedAt: prog.completedAt ?? undefined,
        })
      }
    }

    return { ack: newLast, nextExpectedSeq: newLast + 1, echos, partialSuccess: false, analyticsFailures }
  },
})
