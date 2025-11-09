import { create } from 'zustand'
import type { VisualNovelChoice, VisualNovelChoiceImpact } from '@/shared/types/visualNovel'

interface SessionChoiceEntry {
  sceneId: string
  lineId?: string
  choiceId: string
  effects?: VisualNovelChoiceImpact
  timestamp: number
}

interface VisualNovelSessionState {
  rootSceneId: string | null
  visitedScenes: string[]
  startedAt: number | null
  choices: SessionChoiceEntry[]
  pendingAddFlags: string[]
  pendingRemoveFlags: string[]
  pendingXp: number
  pendingReputation: Record<string, number>
  startSession: (sceneId: string) => void
  trackScene: (sceneId: string) => void
  recordChoice: (payload: { sceneId: string; lineId?: string; choice: VisualNovelChoice }) => void
  consumePayload: (finishedAt: number) => null | {
    sceneId: string
    startedAt: number
    finishedAt: number
    visitedScenes: string[]
    choices: SessionChoiceEntry[]
    addFlags: string[]
    removeFlags: string[]
    xpDelta: number
    reputation: Record<string, number>
  }
  reset: () => void
}

const uniquePush = (list: string[], value: string) =>
  list.includes(value) ? list : [...list, value]

const applyFlagCollection = (collection: string[], incoming?: string[]) => {
  if (!incoming?.length) return collection
  const set = new Set(collection)
  incoming.forEach((flag) => set.add(flag))
  return [...set]
}

const applyRemovalCollection = (collection: string[], incoming?: string[]) => {
  if (!incoming?.length) return collection
  const set = new Set(collection)
  incoming.forEach((flag) => set.delete(flag))
  return [...set]
}

const applyReputation = (
  current: Record<string, number>,
  incoming?: VisualNovelChoiceImpact['reputation']
) => {
  if (!incoming?.length) return current
  const next = { ...current }
  incoming.forEach(({ faction, delta }) => {
    next[faction] = (next[faction] ?? 0) + delta
  })
  return next
}

export const useVisualNovelSessionStore = create<VisualNovelSessionState>((set, get) => ({
  rootSceneId: null,
  visitedScenes: [],
  startedAt: null,
  choices: [],
  pendingAddFlags: [],
  pendingRemoveFlags: [],
  pendingXp: 0,
  pendingReputation: {},
  startSession: (sceneId) =>
    set({
      rootSceneId: sceneId,
      visitedScenes: [sceneId],
      startedAt: Date.now(),
      choices: [],
      pendingAddFlags: [],
      pendingRemoveFlags: [],
      pendingXp: 0,
      pendingReputation: {},
    }),
  trackScene: (sceneId) =>
    set((state) => ({
      visitedScenes: uniquePush(state.visitedScenes, sceneId),
    })),
  recordChoice: ({ sceneId, lineId, choice }) =>
    set((state) => ({
      choices: [
        ...state.choices,
        {
          sceneId,
          lineId,
          choiceId: choice.id,
          effects: choice.effects,
          timestamp: Date.now(),
        },
      ],
      pendingAddFlags: applyFlagCollection(state.pendingAddFlags, choice.effects?.addFlags),
      pendingRemoveFlags: applyRemovalCollection(
        state.pendingRemoveFlags,
        choice.effects?.removeFlags
      ),
      pendingXp: state.pendingXp + (choice.effects?.xp ?? 0),
      pendingReputation: applyReputation(state.pendingReputation, choice.effects?.reputation),
    })),
  consumePayload: (finishedAt) => {
    const state = get()
    if (!state.rootSceneId) {
      return null
    }
    const hasEffects =
      state.choices.length > 0 ||
      state.pendingAddFlags.length > 0 ||
      state.pendingRemoveFlags.length > 0 ||
      state.pendingXp !== 0 ||
      Object.keys(state.pendingReputation).length > 0

    if (!hasEffects) {
      set({
        rootSceneId: null,
        visitedScenes: [],
        startedAt: null,
        choices: [],
        pendingAddFlags: [],
        pendingRemoveFlags: [],
        pendingXp: 0,
        pendingReputation: {},
      })
      return null
    }

    const payload = {
      sceneId: state.rootSceneId,
      startedAt: state.startedAt ?? Date.now(),
      finishedAt,
      visitedScenes: state.visitedScenes,
      choices: state.choices,
      addFlags: state.pendingAddFlags,
      removeFlags: state.pendingRemoveFlags,
      xpDelta: state.pendingXp,
      reputation: state.pendingReputation,
    }

    set({
      rootSceneId: null,
      visitedScenes: [],
      startedAt: null,
      choices: [],
      pendingAddFlags: [],
      pendingRemoveFlags: [],
      pendingXp: 0,
      pendingReputation: {},
    })

    return payload
  },
  reset: () =>
    set({
      rootSceneId: null,
      visitedScenes: [],
      startedAt: null,
      choices: [],
      pendingAddFlags: [],
      pendingRemoveFlags: [],
      pendingXp: 0,
      pendingReputation: {},
    }),
}))
