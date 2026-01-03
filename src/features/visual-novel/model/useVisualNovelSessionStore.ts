import { create } from 'zustand'
import type { VisualNovelChoice, VisualNovelChoiceEffect } from '@/shared/types/visualNovel'

interface SessionChoiceEntry {
  sceneId: string
  lineId?: string
  choiceId: string
  effects?: VisualNovelChoiceEffect[]
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
  pendingHpDelta: number
  pendingAttributeDeltas: Record<string, number>
  pendingReputation: Record<string, number>
  pendingItems: { itemId: string; quantity: number }[]
  pendingQuests: string[]
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
    items: { itemId: string; quantity: number }[]
    quests: string[]
  }
  reset: () => void
}

const uniquePush = (list: string[], value: string) =>
  list.includes(value) ? list : [...list, value]

const withoutValue = (list: string[], value: string) => list.filter((item) => item !== value)

const upsertItemCollection = (
  collection: { itemId: string; quantity: number }[],
  itemId: string,
  delta: number
) => {
  if (!itemId || delta === 0) {
    return collection
  }
  const existingIndex = collection.findIndex((item) => item.itemId === itemId)
  if (existingIndex >= 0) {
    const updatedQuantity = collection[existingIndex].quantity + delta
    if (updatedQuantity <= 0) {
      return collection.filter((_, index) => index !== existingIndex)
    }
    const next = [...collection]
    next[existingIndex] = { itemId, quantity: updatedQuantity }
    return next
  }

  if (delta < 0) {
    // Игнорируем отрицательные значения, если предмета ещё нет
    return collection
  }

  return [...collection, { itemId, quantity: delta }]
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
  pendingHpDelta: 0,
  pendingAttributeDeltas: {},
  pendingReputation: {},
  pendingItems: [],
  pendingQuests: [],
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
      pendingHpDelta: 0,
      pendingAttributeDeltas: {},
      pendingReputation: {},
      pendingItems: [],
      pendingQuests: [],
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
      let nextAddFlags = [...state.pendingAddFlags]
      let nextRemoveFlags = [...state.pendingRemoveFlags]
      let nextXp = state.pendingXp
      let nextHpDelta = state.pendingHpDelta
      let nextAttributeDeltas = { ...state.pendingAttributeDeltas }
      let nextReputation = { ...state.pendingReputation }
      let nextItems = [...state.pendingItems]
      let nextQuests = [...state.pendingQuests]
      let xpDelta = 0

      const effectsList: VisualNovelChoiceEffect[] = choice.effects ?? []

      effectsList.forEach((effect) => {
        switch (effect.type) {
          case 'flag': {
            if (!effect.flag) return
            if (effect.value) {
              nextAddFlags = uniquePush(nextAddFlags, effect.flag)
              nextRemoveFlags = withoutValue(nextRemoveFlags, effect.flag)
            } else {
              nextRemoveFlags = uniquePush(nextRemoveFlags, effect.flag)
              nextAddFlags = withoutValue(nextAddFlags, effect.flag)
            }
            break
          }
          case 'stat_modifier': {
            if (effect.stat === 'xp') {
              nextXp += effect.delta
              xpDelta += effect.delta
              break
            }

            const statKey = typeof effect.stat === 'string' ? effect.stat.trim() : ''
            if (!statKey) break
            // Treat non-xp stat modifiers as skill/attribute deltas during the VN session.
            // Server-side, these are applied to `game_progress.skills` today.
            const skillId = statKey.startsWith('skill:') ? statKey.slice('skill:'.length) : statKey
            if (!skillId) break
            if (typeof effect.delta !== 'number' || !Number.isFinite(effect.delta) || effect.delta === 0) break
            nextAttributeDeltas = {
              ...nextAttributeDeltas,
              [skillId]: (nextAttributeDeltas[skillId] ?? 0) + effect.delta,
            }
            break
          }
          case 'xp': {
            nextXp += effect.amount
            xpDelta += effect.amount
            break
          }
          case 'immediate': {
            if (effect.action === 'hp_delta') {
              const data = (effect.data ?? {}) as { amount?: unknown }
              const amount = typeof data.amount === 'number' ? data.amount : 0
              if (Number.isFinite(amount) && amount !== 0) {
                nextHpDelta += amount
              }
            }

            if (effect.action === 'skill_boost') {
              const data = (effect.data ?? {}) as { skillId?: unknown; amount?: unknown }
              const skillId = typeof data.skillId === 'string' ? data.skillId.trim() : ''
              const amount = typeof data.amount === 'number' ? data.amount : 0
              if (skillId && Number.isFinite(amount) && amount !== 0) {
                nextAttributeDeltas = {
                  ...nextAttributeDeltas,
                  [skillId]: (nextAttributeDeltas[skillId] ?? 0) + amount,
                }
              }
            }
            break
          }
          case 'relationship_change': {
            if (!effect.targetId) return
            nextReputation = {
              ...nextReputation,
              [effect.targetId]: (nextReputation[effect.targetId] ?? 0) + effect.delta,
            }
            break
          }
          case 'add_item': {
            if (!effect.itemId) return
            const quantity = effect.quantity ?? 1
            nextItems = upsertItemCollection(nextItems, effect.itemId, quantity)
            break
          }
          case 'add_quest': {
            if (!effect.questId) return
            nextQuests = uniquePush(nextQuests, effect.questId)
            break
          }
          default: {
            break
          }
        }
      })

      const recordedEffects = effectsList.length > 0 ? effectsList : undefined

      const entry: SessionChoiceEntry = {
        sceneId,
        lineId,
        choiceId: choice.id,
        effects: recordedEffects,
        timestamp: Date.now(),
      }

      log('✅ Выбор записан в сессию', {
        sceneId,
        lineId,
        choiceId: choice.id,
        effectTypes: effectsList.map((effect) => effect.type),
        xpDelta,
        totalFlags: nextAddFlags.length + nextRemoveFlags.length,
        items: nextItems.length,
        quests: nextQuests.length,
      })

      return {
        choices: [...state.choices, entry],
        pendingAddFlags: nextAddFlags,
        pendingRemoveFlags: nextRemoveFlags,
        pendingXp: nextXp,
        pendingHpDelta: nextHpDelta,
        pendingAttributeDeltas: nextAttributeDeltas,
        pendingReputation: nextReputation,
        pendingItems: nextItems,
        pendingQuests: nextQuests,
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
      Object.keys(state.pendingReputation).length > 0 ||
      state.pendingItems.length > 0 ||
      state.pendingQuests.length > 0

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
      items: state.pendingItems,
      quests: state.pendingQuests,
    }
    log('📤 Формируем payload для сохранения', { ...payload, hasEffects })

    set({
      rootSceneId: null,
      visitedScenes: [],
      startedAt: null,
      choices: [],
      pendingAddFlags: [],
      pendingRemoveFlags: [],
      pendingXp: 0,
      pendingHpDelta: 0,
      pendingAttributeDeltas: {},
      pendingReputation: {},
      pendingItems: [],
      pendingQuests: [],
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
      pendingHpDelta: 0,
      pendingAttributeDeltas: {},
      pendingReputation: {},
      pendingItems: [],
      pendingQuests: [],
    })
  },
}))
