import { ConvexClient } from 'convex/browser'
import { api as generatedApi } from '../../../convex/_generated/api'
import type { DangerZone, MapPoint, SafeZone } from '@/shared/types/map'
import type { Player, PlayerProgress } from '@/shared/types/player'
import type { VisualNovelChoiceEffect } from '@/shared/types/visualNovel'
import { DEFAULT_VN_SCENE_ID } from '@/shared/data/visualNovel/scenes'
import { loadLocalState, updateLocalState, type LocalQuest, type LocalState } from './localFallbackState'
import { SEED_MAP_POINTS } from '../../../convex/seedData'
import type { ItemState, InventoryContainer, EquipmentSlots } from '@/entities/item/model/types'

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
      effects?: VisualNovelChoiceEffect[]
    }>
    addFlags?: string[]
    removeFlags?: string[]
    xpDelta?: number
    reputation?: Record<string, number>
    items?: { itemId: string; quantity: number }[]
    quests?: string[]
    advancePhaseTo?: number
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
    id: 'reach_locomotive',
    title: 'Reach the Locomotive',
    description: 'Fight your way through the train to the head of the composition.',
    status: 'completed',
  },
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
  {
    id: 'whispers_of_rift',
    title: 'Whispers of the Rift',
    description: 'Investigate the strange occurrences at Schlossberg for Dieter.',
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

// Convex function references generated by `npx convex dev` for use with `useQuery`/`useMutation`.
// We re-export them under the same name that the rest of the app expects.
export const api = generatedApi

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
          if (!entry.effects?.length) {
            return
          }
          const add: string[] = []
          const remove: string[] = []
          entry.effects.forEach((effect) => {
            switch (effect.type) {
              case 'flag': {
                if (!effect.flag) return
                if (effect.value) {
                  add.push(effect.flag)
                } else {
                  remove.push(effect.flag)
                }
                break
              }
              case 'stat_modifier': {
                if (!effect.stat?.startsWith('flag:')) return
                const flagName = effect.stat.slice(5)
                if (!flagName) return
                if (effect.delta > 0) {
                  add.push(flagName)
                } else if (effect.delta < 0) {
                  remove.push(flagName)
                }
                break
              }
              default:
                break
            }
          })
          if (add.length > 0 || remove.length > 0) {
            applyFlags(draft, add, remove)
          }
        })

        ensurePrologueQuests(draft)
      })

      return { success: true }
    },
    logCharacterAdviceViewed: async (args: {
      deviceId?: string
      userId?: string
      sceneId: string
      lineId: string
      characterId: string
      choiceContext: string[]
      skillLevel: number
      viewOrder: number
    }) => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.mutation('vn:logCharacterAdviceViewed', args)
        } catch (e) {
          console.warn('Convex mutation vn:logCharacterAdviceViewed failed', e)
        }
      }

      console.log('vn.logCharacterAdviceViewed called with:', args)
      return { success: true, timestamp: Date.now() }
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
  inventory: {
    seed: async (args: { deviceId: string }) => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.mutation('inventory:seedInventory', args)
        } catch (e) {
          console.warn('Convex mutation inventory:seedInventory failed', e)
        }
      }
      return { success: false }
    }
  }
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
        points: SEED_MAP_POINTS,
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
      return []
    },
    listSafeZones: async (
      args: { bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number } } = {}
    ): Promise<SafeZone[]> => {
      return convexQueries.zones.listActiveSafeZones(args)
    },
    listDangerZones: async (): Promise<DangerZone[]> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('zones:listDangerZones', {})
        } catch (e) {
          console.warn('Convex query zones:listDangerZones failed; returning demo data', e)
        }
      }

      console.log('zones.listDangerZones called')
      return []
    },
  },
  inventory: {
    get: async (args: { deviceId?: string; userId?: string }): Promise<{ items: ItemState[]; containers: InventoryContainer[]; equipment: EquipmentSlots } | null> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('inventory:get', args)
        } catch (e) {
          console.warn('Convex query inventory:get failed', e)
        }
      }

      console.log('inventory.get called with:', args)
      return {
        items: [],
        containers: [],
        equipment: {
          primary: null,
          secondary: null,
          melee: null,
          helmet: null,
          armor: null,
          clothing_top: null,
          clothing_bottom: null,
          backpack: null,
          rig: null,
          artifacts: [],
          quick: [null, null, null, null, null],
        },
      }
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
    getAvailable: async (args: { deviceId?: string; userId?: string; pointId?: string }): Promise<Array<{ id: string; title: string; description: string; recommendedLevel?: number }>> => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('quests:getAvailable', args)
        } catch (e) {
          console.warn('Convex query quests:getAvailable failed; returning empty list', e)
        }
      }
      return []
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
