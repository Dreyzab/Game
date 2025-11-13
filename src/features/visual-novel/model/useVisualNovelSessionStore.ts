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

const log = (...args: unknown[]) => {
  console.log('🗂️ [VN Session]', ...args)
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
  startSession: (sceneId) => {
    log('🚀 Новая сессия визуальной новеллы', { sceneId })
    set({
      rootSceneId: sceneId,
      visitedScenes: [sceneId],
      startedAt: Date.now(),
      choices: [],
      pendingAddFlags: [],
      pendingRemoveFlags: [],
      pendingXp: 0,
      pendingReputation: {},
    })
  },
  trackScene: (sceneId) =>
    set((state) => {
      const visitedScenes = uniquePush(state.visitedScenes, sceneId)
      log('🧭 Посещение сцены', { sceneId, totalVisited: visitedScenes.length })
      return {
        visitedScenes,
      }
    }),
  recordChoice: ({ sceneId, lineId, choice }) =>
    set((state) => {
      const nextAddFlags = applyFlagCollection(state.pendingAddFlags, choice.effects?.addFlags)
      const nextRemoveFlags = applyRemovalCollection(
        state.pendingRemoveFlags,
        choice.effects?.removeFlags
      )
      const nextXp = state.pendingXp + (choice.effects?.xp ?? 0)
      const nextReputation = applyReputation(state.pendingReputation, choice.effects?.reputation)
      const entry = {
        sceneId,
        lineId,
        choiceId: choice.id,
        effects: choice.effects,
        timestamp: Date.now(),
      }
      log('✅ Выбор записан в сессию', {
        sceneId,
        lineId,
        choiceId: choice.id,
        addFlagsDelta: nextAddFlags.length - state.pendingAddFlags.length,
        removeFlagsDelta: nextRemoveFlags.length - state.pendingRemoveFlags.length,
        xpDelta: choice.effects?.xp ?? 0,
      })
      return {
        choices: [...state.choices, entry],
        pendingAddFlags: nextAddFlags,
        pendingRemoveFlags: nextRemoveFlags,
        pendingXp: nextXp,
        pendingReputation: nextReputation,
      }
    }),
  consumePayload: (finishedAt) => {
    const state = get()
    if (!state.rootSceneId) {
      log('ℹ️ Нет активной сессии для выгрузки')
      return null
    }
    const hasEffects =
      state.choices.length > 0 ||
      state.pendingAddFlags.length > 0 ||
      state.pendingRemoveFlags.length > 0 ||
      state.pendingXp !== 0 ||
      Object.keys(state.pendingReputation).length > 0

    if (!hasEffects) {
      log('🧹 Сессия завершена без изменений, сбрасываем состояние', { sceneId: state.rootSceneId })
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
    log('📤 Формируем payload для сохранения', payload)

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

    log('✅ Сессия очищена после выгрузки')
    return payload
  },
  reset: () => {
    log('♻️ Принудительный сброс состояния сессии')
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
  },
}))
