import { ConvexClient } from 'convex/browser'
import type { FunctionReference } from 'convex/server'
import type { MapPoint, SafeZone } from '@/shared/types/map'
import type { Player, PlayerProgress } from '@/shared/types/player'
import { DEFAULT_VN_SCENE_ID } from '@/shared/data/visualNovel/scenes'
import { loadLocalState, updateLocalState, type LocalQuest, type LocalState } from './localFallbackState'

/**
 * Convex client instance
 * Get the deployment URL from environment variables
 */
const getConvexUrl = (): string | null => {
  const url = import.meta.env.VITE_CONVEX_URL

  if (!url || url.trim() === '') {
    return null
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn('VITE_CONVEX_URL must start with "http://" or "https://"')
    return null
  }

  return url
}

const convexUrl = getConvexUrl()
export const convexClient = convexUrl ? new ConvexClient(convexUrl) : null

if (!convexUrl && import.meta.env.DEV) {
  console.info('VITE_CONVEX_URL is not set. Using placeholder functions for Convex features.')
}

type CommitSceneArgs = {
  deviceId?: string
  userId?: string
  sceneId: string
  payload: {
    startedAt?: number
    finishedAt?: number
    visitedScenes?: string[]
    choices?: Array<{
      sceneId: string
      lineId?: string
      choiceId: string
      effects?: {
        addFlags?: string[]
        removeFlags?: string[]
        xp?: number
        reputation?: Array<{ faction: string; delta: number }>
      }
    }>
    addFlags?: string[]
    removeFlags?: string[]
    xpDelta?: number
    reputation?: Record<string, number>
    advancePhaseTo?: number
  }
}

export type ConvexApi = {
  mapPoints: {
    listVisible: FunctionReference<
      'query',
      'public',
      {
        deviceId?: string
        userId?: string
        bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
        phase?: number
        limit?: number
      },
      MapPointsResponse
    >
  }
  zones: {
    listActiveSafeZones: FunctionReference<
      'query',
      'public',
      { bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number } },
      SafeZone[]
    >
    listSafeZones: FunctionReference<
      'query',
      'public',
      { bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number } },
      SafeZone[]
    >
  }
  player: {
    ensureByDevice: FunctionReference<'mutation', 'public', { deviceId: string }, void>
    create: FunctionReference<'mutation', 'public', { deviceId: string }, string>
    get: FunctionReference<'query', 'public', { deviceId: string }, Player | null>
    getProgress: FunctionReference<'query', 'public', { deviceId: string }, PlayerProgress>
  }
  quests: {
    getActive: FunctionReference<
      'query',
      'public',
      { deviceId: string },
      Array<{
        id: string
        title: string
        description?: string
        status: 'active' | 'completed'
        progress?: number
        maxProgress?: number
        createdAt?: number
      }>
    >
    getCompleted: FunctionReference<
      'query',
      'public',
      { deviceId: string; limit?: number },
      Array<{ id: string; title: string; status: 'completed' | 'abandoned'; completedAt?: number; abandonedAt?: number; attempt?: number; templateVersion?: number; currentStep?: string; startedAt?: number }>
    >
    start: FunctionReference<'mutation', 'public', { deviceId?: string; userId?: string; questId: string }, { started: true; questId: string; already?: boolean }>
    updateProgress: FunctionReference<'mutation', 'public', { deviceId?: string; userId?: string; questId: string; expectedStep?: string; nextStepId?: string; deltaProgress?: number; setProgress?: number }, { updated: boolean; questId: string; currentStep?: string; progress?: number; completed?: boolean }>
    complete: FunctionReference<'mutation', 'public', { deviceId?: string; userId?: string; questId: string; expectedStep?: string; resultDetails?: { templateVersion?: number; sceneLog?: Array<{ stepId: string; choiceId?: string; success?: boolean; reward?: unknown }> } }, { completed: true; questId: string; already?: boolean }>
    sync: FunctionReference<'mutation', 'public', { deviceId?: string; userId?: string; lastKnownSeq: number; events: Array<{ seq: number; type: 'start' | 'update' | 'complete' | 'abandon'; questId: string; payload?: any }> }, { ack: number; nextExpectedSeq: number; echos: Array<{ questId: string; status: 'active' | 'completed'; currentStep?: string; progress?: number; completedAt?: number }> }>
  }
  vn: {
    commitScene: FunctionReference<'mutation', 'public', CommitSceneArgs, { success: boolean }>
  }
  admin: {
    register: FunctionReference<'mutation', 'public', { name: string }, void>
  }
}

type MapPointsResponse = {
  points: MapPoint[]
  timestamp: number
  ttlMs: number
}

const createDemoPlayer = (deviceId?: string): Player => ({
  id: deviceId ? `${deviceId}-demo` : 'demo-player',
  deviceId: deviceId ?? 'demo-device',
  createdAt: Date.now() - 1000 * 60 * 60,
  status: 'active',
  reputation: 5,
  level: 2,
  xp: 30,
  completedQuests: 1,
  fame: 0,
  points: 0,
  daysInGame: 2,
  developmentPhase: 'alpha',
})

const createDemoProgress = (): PlayerProgress => ({
  level: 2,
  xp: 30,
  maxXp: 150,
  skillPoints: 1,
  reputation: 5,
  completedQuests: 0,
  fame: 0,
  points: 0,
  daysInGame: 2,
  flags: {},
  visitedScenes: [DEFAULT_VN_SCENE_ID],
  completedQuestIds: [],
  currentScene: DEFAULT_VN_SCENE_ID,
  phase: 1,
  reputationByFaction: {
    synthesis: 5,
    merchants: 2,
  },
  lastUpdatedAt: Date.now(),
})

const flagsArrayToRecord = (flags: string[]) =>
  flags.reduce<Record<string, true>>((acc, flag) => {
    if (!acc[flag]) {
      acc[flag] = true
    }
    return acc
  }, {})

const PROLOGUE_QUESTS: Array<Omit<LocalQuest, 'createdAt'>> = [
  {
    id: 'delivery_for_dieter',
    title: 'Delivery for Dieter',
    description: 'Bring the parcel to Dieter at the Freiburg market square.',
    status: 'active',
  },
  {
    id: 'delivery_for_professor',
    title: 'Letter for the Professor',
    description: 'Deliver the professor’s documents to advance the global questline.',
    status: 'active',
  },
]

const ensurePrologueQuests = (state: LocalState) => {
  const hasArrived =
    state.flags.includes('arrived_at_freiburg') || state.flags.includes('need_info_bureau')

  if (!hasArrived) {
    return
  }

  PROLOGUE_QUESTS.forEach((quest) => {
    const existing = state.quests.find((entry) => entry.id === quest.id)
    if (existing) {
      if (existing.status !== 'completed') {
        existing.title = quest.title
        existing.description = quest.description
        existing.status = quest.status
      }
      return
    }

    state.quests.push({
      ...quest,
      createdAt: Date.now(),
    })
  })
}

const applyFlags = (state: LocalState, add?: string[], remove?: string[]) => {
  if (add?.length) {
    add.forEach((flag) => {
      if (!state.flags.includes(flag)) {
        state.flags.push(flag)
      }
    })
  }

  if (remove?.length) {
    const removeSet = new Set(remove)
    state.flags = state.flags.filter((flag) => !removeSet.has(flag))
  }
}

const applyVisitedScenes = (state: LocalState, scenes?: string[]) => {
  if (!scenes?.length) {
    return
  }

  scenes.forEach((sceneId) => {
    if (!state.visitedScenes.includes(sceneId)) {
      state.visitedScenes.push(sceneId)
    }
  })
}

const DEMO_MAP_POINTS: MapPoint[] = [
  {
    id: 'info_bureau',
    title: 'Information Bureau',
    description: 'Start your journey here and gather details about the region and anomalies.',
    coordinates: { lng: 7.852, lat: 48 },
    type: 'poi',
    isActive: true,
    status: 'not_found',
    metadata: {
      faction: 'synthesis',
      danger_level: 'low',
      category: 'information',
      isActiveQuestTarget: true,
      sceneBindings: [
        {
          sceneId: 'info_bureau_meeting',
          triggerType: 'click',
          priority: 5,
          conditions: {
            flags: ['arrived_at_freiburg'],
          },
        },
      ],
    },
  },
  {
    id: 'market_square',
    title: 'Market Square',
    description: 'Merchants, Dieter, and the busiest place in Freiburg. Ideal for delivery quests.',
    coordinates: { lng: 7.845, lat: 47.998 },
    type: 'settlement',
    isActive: true,
    status: 'not_found',
    metadata: {
      faction: 'merchants',
      danger_level: 'low',
      services: ['trade', 'repair'],
      sceneBindings: [
        {
          sceneId: 'trader_first_meeting',
          triggerType: 'click',
          priority: 4,
          conditions: {
            flags: ['arrived_at_freiburg'],
          },
        },
      ],
    },
  },
  {
    id: 'safe_hub',
    title: 'Alliance Safe Hub',
    description: 'Headquarters where Synthesys operatives regroup and plan expeditions.',
    coordinates: { lng: 7.86, lat: 48.005 },
    type: 'location',
    isActive: true,
    status: 'not_found',
    metadata: {
      faction: 'synthesis',
      danger_level: 'low',
    },
  },
  {
    id: 'anomaly_zone_1',
    title: 'Anomaly Hotspot',
    description: 'An unstable anomaly detected on the outskirts. Approach with extreme caution.',
    coordinates: { lng: 7.855, lat: 48.01 },
    type: 'anomaly',
    isActive: true,
    status: 'not_found',
    metadata: {
      danger_level: 'high',
    },
  },
]

const DEMO_SAFE_ZONES: SafeZone[] = [
  {
    id: 'central_safe_zone',
    name: 'Central Station Perimeter',
    faction: 'synthesis',
    polygon: [
      { lng: 7.84, lat: 47.995 },
      { lng: 7.87, lat: 47.995 },
      { lng: 7.87, lat: 48.01 },
      { lng: 7.84, lat: 48.01 },
      { lng: 7.84, lat: 47.995 },
    ],
    isActive: true,
  },
]

const buildProgressFromState = (state: LocalState): PlayerProgress => {
  const base = createDemoProgress()
  const completedQuestIds = state.quests
    .filter((quest) => quest.status === 'completed')
    .map((quest) => quest.id)

  return {
    ...base,
    flags: {
      ...base.flags,
      ...flagsArrayToRecord(state.flags),
    },
    visitedScenes: Array.from(new Set([...base.visitedScenes, ...state.visitedScenes])),
    completedQuestIds: Array.from(new Set([...base.completedQuestIds, ...completedQuestIds])),
    completedQuests: completedQuestIds.length,
    lastUpdatedAt: state.lastUpdatedAt,
  }
}

const ensureLocalState = (): LocalState => {
  try {
    return updateLocalState((draft) => {
      ensurePrologueQuests(draft)
    })
  } catch (error) {
    console.warn('[convex] Failed to update local state, using in-memory fallback', error)
    const fallback = loadLocalState()
    ensurePrologueQuests(fallback)
    return fallback
  }
}

export const api = {
  mapPoints: {
    listVisible: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: ({
        deviceId: undefined,
        userId: undefined,
        bbox: undefined,
        phase: undefined,
        limit: undefined,
      } as {
        deviceId?: string
        userId?: string
        bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
        phase?: number
        limit?: number
      }),
      _returnType: {} as MapPointsResponse,
    } as ConvexApi['mapPoints']['listVisible'],
  },
  zones: {
    listActiveSafeZones: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: ({
        bbox: undefined,
      } as {
        bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
      }),
      _returnType: [] as SafeZone[],
    } as ConvexApi['zones']['listActiveSafeZones'],
    listSafeZones: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: ({
        bbox: undefined,
      } as {
        bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
      }),
      _returnType: [] as SafeZone[],
    } as ConvexApi['zones']['listSafeZones'],
  },
  player: {
    ensureByDevice: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: undefined as unknown as void,
    } as ConvexApi['player']['ensureByDevice'],
    create: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: '' as string,
    } as ConvexApi['player']['create'],
    get: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: null as Player | null,
    } as ConvexApi['player']['get'],
    getProgress: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: {} as PlayerProgress,
    } as ConvexApi['player']['getProgress'],
  },
  quests: {
    getActive: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: [] as Array<{
        id: string
        title: string
        description?: string
        status: 'active' | 'completed'
        progress?: number
        maxProgress?: number
        createdAt?: number
      }>,
    } as ConvexApi['quests']['getActive'],
    getCompleted: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string; limit?: number },
      _returnType: [] as Array<{ id: string; title: string; status: 'completed' | 'abandoned'; completedAt?: number; abandonedAt?: number; attempt?: number; templateVersion?: number; currentStep?: string; startedAt?: number }>,
    } as any,
    getById: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: {} as { questId: string },
      _returnType: null as { id: string; title: string; description: string; phase: number; isActive: boolean; stepsCount: number; repeatable: boolean; templateVersion: number } | null,
    } as any,
    start: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId?: string; userId?: string; questId: string },
      _returnType: { started: true, questId: '' },
    } as ConvexApi['quests']['start'],
    updateProgress: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId?: string; userId?: string; questId: string; expectedStep?: string; nextStepId?: string; deltaProgress?: number; setProgress?: number },
      _returnType: { updated: true, questId: '' },
    } as ConvexApi['quests']['updateProgress'],
    complete: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId?: string; userId?: string; questId: string; expectedStep?: string; resultDetails?: { templateVersion?: number; sceneLog?: Array<{ stepId: string; choiceId?: string; success?: boolean; reward?: unknown }> } },
      _returnType: { completed: true, questId: '' },
    } as ConvexApi['quests']['complete'],
    sync: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId?: string; userId?: string; lastKnownSeq: number; events: Array<{ seq: number; type: 'start' | 'update' | 'complete'; questId: string; payload?: any }> },
      _returnType: { ack: 0, nextExpectedSeq: 1, echos: [] as Array<{ questId: string; status: 'active' | 'completed'; currentStep?: string; progress?: number; completedAt?: number }> },
    } as ConvexApi['quests']['sync'],
  },
  vn: {
    commitScene: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as CommitSceneArgs,
      _returnType: { success: true },
    } as ConvexApi['vn']['commitScene'],
  },
  admin: {
    register: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { name: string },
      _returnType: undefined as unknown as void,
    } as ConvexApi['admin']['register'],
  },
}

export const convexMutations = {
  player: {
    ensureByDevice: async (args: { deviceId: string }) => {
      console.log('ensureByDevice called with:', args)
      return Promise.resolve()
    },
    create: async (args: { deviceId: string }) => {
      console.log('create player called with:', args)
      return Promise.resolve('player-id')
    },
  },
  vn: {
    commitScene: async (args: CommitSceneArgs) => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.mutation('vn:commitScene', args)
        } catch (e) {
          console.warn('Convex mutation vn:commitScene failed; falling back to demo', e)
        }
      }

      console.log('vn.commitScene called with:', args)

      updateLocalState((draft) => {
        applyVisitedScenes(draft, [args.sceneId])
        applyVisitedScenes(draft, args.payload.visitedScenes)

        applyFlags(draft, args.payload.addFlags, args.payload.removeFlags)

        args.payload.choices?.forEach((entry) => {
          applyFlags(draft, entry.effects?.addFlags, entry.effects?.removeFlags)
        })

        ensurePrologueQuests(draft)
      })

      return { success: true }
    },
  },
  admin: {
    register: async (args: { name: string }) => {
      console.log('register admin called with:', args)
      return Promise.resolve()
    },
  },
  quests: {
    start: async (args: { questId: string }) => {
      try {
        if (convexClient) {
          // Enqueue in outbox and attempt immediate sync, to ensure idempotent seq
          const { enqueueStart, syncOutboxNow } = await import('@/shared/stores/questOutbox')
          enqueueStart(args.questId)
          await syncOutboxNow()
          return { started: true, questId: args.questId }
        }
      } catch (e) {
        console.warn('quests.start failed; falling back to local state', e)
      }
      // Fallback: update local state
      updateLocalState((draft) => {
        const existing = draft.quests.find((q) => q.id === args.questId)
        if (!existing) {
          draft.quests.push({ id: args.questId, title: args.questId, status: 'active', createdAt: Date.now() })
        }
      })
      return { started: true, questId: args.questId }
    },
    updateProgress: async (args: { questId: string; expectedStep?: string; nextStepId?: string; deltaProgress?: number; setProgress?: number }) => {
      try {
        if (convexClient) {
          const { enqueueUpdate, syncOutboxNow } = await import('@/shared/stores/questOutbox')
          enqueueUpdate(args.questId, { expectedStep: args.expectedStep, nextStepId: args.nextStepId, deltaProgress: args.deltaProgress, setProgress: args.setProgress })
          await syncOutboxNow()
          return { updated: true, questId: args.questId }
        }
      } catch (e) {
        console.warn('quests.updateProgress failed; falling back to local state', e)
      }
      return { updated: true, questId: args.questId }
    },
    complete: async (args: { questId: string; expectedStep?: string; resultDetails?: { templateVersion?: number; sceneLog?: Array<{ stepId: string; choiceId?: string; success?: boolean; reward?: unknown }> } }) => {
      try {
        if (convexClient) {
          const { enqueueComplete, syncOutboxNow } = await import('@/shared/stores/questOutbox')
          enqueueComplete(args.questId, { expectedStep: args.expectedStep, resultDetails: args.resultDetails })
          await syncOutboxNow()
          return { completed: true, questId: args.questId, already: false }
        }
      } catch (e) {
        console.warn('quests.complete failed; falling back to local state', e)
      }
      // Fallback: mark local quest completed
      updateLocalState((draft) => {
        const q = draft.quests.find((x) => x.id === args.questId)
        if (q) q.status = 'completed'
      })
      return { completed: true, questId: args.questId }
    },
    sync: async () => {
      try {
        if (convexClient) {
          const { syncOutboxNow } = await import('@/shared/stores/questOutbox')
          return await syncOutboxNow()
        }
      } catch (e) {
        console.warn('quests.sync failed', e)
      }
      return null
    },
    abandon: async (args: { questId: string }) => {
      try {
        if (convexClient) {
          const { useQuestOutbox } = await import('@/shared/stores/questOutbox')
          useQuestOutbox.getState().enqueue({ type: 'abandon', questId: args.questId })
          const { syncOutboxNow } = await import('@/shared/stores/questOutbox')
          await syncOutboxNow()
          return { ok: true }
        }
      } catch (e) {
        console.warn('quests.abandon failed', e)
      }
      return { ok: false }
    },
  },
}

export const convexQueries = {
  mapPoints: {
    listVisible: async (args: {
      deviceId?: string
      userId?: string
      bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
      phase?: number
      limit?: number
    }): Promise<MapPointsResponse> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('mapPoints:listVisible', args)
        } catch (e) {
          console.warn('Convex query mapPoints:listVisible failed; falling back to demo', e)
        }
      }

      console.log('mapPoints.listVisible called with:', args)

      return {
        points: DEMO_MAP_POINTS,
        timestamp: Date.now(),
        ttlMs: 5 * 60 * 1000,
      }
    },
  },
  zones: {
    listActiveSafeZones: async (
      args: { bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number } } = {}
    ): Promise<SafeZone[]> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('zones:listSafeZones', args)
        } catch (e) {
          console.warn('Convex query zones:listSafeZones failed; returning demo data', e)
        }
      }

      console.log('zones.listActiveSafeZones called with:', args)
      return DEMO_SAFE_ZONES
    },
    listSafeZones: async (
      args: { bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number } } = {}
    ): Promise<SafeZone[]> => {
      return convexQueries.zones.listActiveSafeZones(args)
    },
  },
  player: {
    get: async (args: { deviceId: string }): Promise<Player | null> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('player:get', args)
        } catch (e) {
          console.warn('Convex query player:get failed; returning demo data', e)
        }
      }

      console.log('player.get called with:', args)
      return createDemoPlayer(args.deviceId)
    },
    getProgress: async (args: { deviceId: string }): Promise<PlayerProgress> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('player:getProgress', args)
        } catch (e) {
          console.warn('Convex query player:getProgress failed; returning demo data', e)
        }
      }

      console.log('player.getProgress called with:', args)
      const state = ensureLocalState()
      return buildProgressFromState(state)
    },
  },
  quests: {
    getActive: async (args: { deviceId: string }): Promise<LocalQuest[]> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('quests:getActive', args)
        } catch (e) {
          console.warn('Convex query quests:getActive failed; returning demo data', e)
        }
      }

      console.log('quests.getActive called with:', args)
      const state = ensureLocalState()
      return state.quests.map((quest) => ({ ...quest }))
    },
    getById: async (args: { questId: string }): Promise<{ id: string; title: string; description: string; phase: number; isActive: boolean; stepsCount: number; repeatable: boolean; templateVersion: number } | null> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('quests:getById', args)
        } catch (e) {
          console.warn('Convex query quests:getById failed; returning null', e)
        }
      }
      return null
    },
    getCompleted: async (args: { deviceId: string; limit?: number }): Promise<Array<{ id: string; title: string; status: 'completed' | 'abandoned'; completedAt?: number; abandonedAt?: number; attempt?: number; templateVersion?: number; currentStep?: string; startedAt?: number }>> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('quests:getCompleted', args)
        } catch (e) {
          console.warn('Convex query quests:getCompleted failed; returning empty list', e)
        }
      }
      return []
    },
  },
}
