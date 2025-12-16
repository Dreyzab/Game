/**
 * useNarrativeStore — Zustand store для управления полифоническим нарративом
 * 
 * Хранит:
 * - Активные инъекции внутренних голосов
 * - Уровень визуальной энтропии для эффектов Разлома
 * - Историю просмотренных инъекций
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { ActiveInjection, VoiceGroup, VoiceId } from './types'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Группа цветов для визуализации голосов
 */
export const VOICE_GROUP_COLORS: Record<VoiceGroup, {
  primary: string
  secondary: string
  glow: string
  bg: string
}> = {
  body: {
    primary: '#EF4444',      // red-500
    secondary: '#DC2626',    // red-600
    glow: 'rgba(239, 68, 68, 0.4)',
    bg: 'rgba(239, 68, 68, 0.1)',
  },
  motorics: {
    primary: '#F59E0B',      // amber-500
    secondary: '#D97706',    // amber-600
    glow: 'rgba(245, 158, 11, 0.4)',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  mind: {
    primary: '#06B6D4',      // cyan-500
    secondary: '#0891B2',    // cyan-600
    glow: 'rgba(6, 182, 212, 0.4)',
    bg: 'rgba(6, 182, 212, 0.1)',
  },
  consciousness: {
    primary: '#8B5CF6',      // violet-500
    secondary: '#7C3AED',    // violet-600
    glow: 'rgba(139, 92, 246, 0.4)',
    bg: 'rgba(139, 92, 246, 0.1)',
  },
  psyche: {
    primary: '#EC4899',      // pink-500
    secondary: '#DB2777',    // pink-600
    glow: 'rgba(236, 72, 153, 0.4)',
    bg: 'rgba(236, 72, 153, 0.1)',
  },
  sociality: {
    primary: '#10B981',      // emerald-500
    secondary: '#059669',    // emerald-600
    glow: 'rgba(16, 185, 129, 0.4)',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
}

/**
 * Сопоставление голосов и их групп
 */
export const VOICE_TO_GROUP: Record<VoiceId, VoiceGroup> = {
  // Body
  force: 'body',
  resilience: 'body',
  endurance: 'body',
  // Motorics
  perception: 'motorics',
  reaction: 'motorics',
  coordination: 'motorics',
  // Mind
  logic: 'mind',
  rhetoric: 'mind',
  analysis: 'mind',
  // Consciousness
  authority: 'consciousness',
  suggestion: 'consciousness',
  courage: 'consciousness',
  // Psyche
  drama: 'psyche',
  creativity: 'psyche',
  gambling: 'psyche',
  // Sociality
  solidarity: 'sociality',
  honor: 'sociality',
  empathy: 'sociality',
}

/**
 * Человекочитаемые названия голосов
 */
export const VOICE_NAMES: Record<VoiceId, string> = {
  force: 'СИЛА',
  resilience: 'СТОЙКОСТЬ',
  endurance: 'ВЫНОСЛИВОСТЬ',
  perception: 'ВОСПРИЯТИЕ',
  reaction: 'РЕАКЦИЯ',
  coordination: 'КООРДИНАЦИЯ',
  logic: 'ЛОГИКА',
  rhetoric: 'РИТОРИКА',
  analysis: 'АНАЛИЗ',
  authority: 'АВТОРИТЕТ',
  suggestion: 'ВНУШЕНИЕ',
  courage: 'ОТВАГА',
  drama: 'ДРАМА',
  creativity: 'ТВОРЧЕСТВО',
  gambling: 'АЗАРТ',
  solidarity: 'СОЛИДАРНОСТЬ',
  honor: 'ЧЕСТЬ',
  empathy: 'ЭМПАТИЯ',
}

/**
 * История просмотра инъекции
 */
interface InjectionViewRecord {
  injectionId: string
  voiceId: VoiceId
  sceneId: string
  dialogueId: string
  timestamp: number
}

// ============================================================================
// STORE STATE
// ============================================================================

interface NarrativeState {
  // Активные инъекции для текущего диалога
  activeInjections: ActiveInjection[]
  
  // Уровень визуальной энтропии (0-100)
  entropyVisuals: number
  
  // ID текущего полифонического диалога
  currentDialogueId: string | null
  
  // История просмотренных инъекций (для аналитики и достижений)
  viewedInjections: InjectionViewRecord[]
  
  // Режим отображения инъекций
  displayMode: 'overlay' | 'sidebar' | 'inline'
  
  // Анимация активна
  isAnimating: boolean
  
  // Конфликтующие голоса (для визуализации внутренней борьбы)
  conflictingVoices: Array<{ voice1: VoiceId; voice2: VoiceId }>
}

interface NarrativeActions {
  // Управление инъекциями
  setActiveInjections: (injections: ActiveInjection[]) => void
  addInjection: (injection: ActiveInjection) => void
  removeInjection: (injectionId: string) => void
  clearInjections: () => void
  
  // Управление энтропией
  setEntropy: (level: number) => void
  incrementEntropy: (delta: number) => void
  decrementEntropy: (delta: number) => void
  
  // Навигация
  setCurrentDialogue: (dialogueId: string | null) => void
  
  // История
  recordInjectionView: (record: Omit<InjectionViewRecord, 'timestamp'>) => void
  clearViewHistory: () => void
  
  // Режим отображения
  setDisplayMode: (mode: NarrativeState['displayMode']) => void
  
  // Анимация
  setAnimating: (isAnimating: boolean) => void
  
  // Конфликты
  setConflictingVoices: (conflicts: NarrativeState['conflictingVoices']) => void
  
  // Утилиты
  getVoiceColor: (voiceId: VoiceId) => typeof VOICE_GROUP_COLORS[VoiceGroup]
  getVoiceName: (voiceId: VoiceId) => string
  hasViewedInjection: (injectionId: string) => boolean
}

// ============================================================================
// STORE
// ============================================================================

export const useNarrativeStore = create<NarrativeState & NarrativeActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        activeInjections: [],
        entropyVisuals: 0,
        currentDialogueId: null,
        viewedInjections: [],
        displayMode: 'overlay',
        isAnimating: false,
        conflictingVoices: [],

        // Injection management
        setActiveInjections: (injections) => {
          set({ activeInjections: injections, isAnimating: true })
          // Автоматически отключаем анимацию через 500ms
          setTimeout(() => set({ isAnimating: false }), 500)
        },

        addInjection: (injection) => {
          set((state) => ({
            activeInjections: [...state.activeInjections, injection],
            isAnimating: true,
          }))
          setTimeout(() => set({ isAnimating: false }), 500)
        },

        removeInjection: (injectionId) => {
          set((state) => ({
            activeInjections: state.activeInjections.filter(
              (inj) => inj.id !== injectionId
            ),
          }))
        },

        clearInjections: () => {
          set({ activeInjections: [], conflictingVoices: [] })
        },

        // Entropy management
        setEntropy: (level) => {
          const clampedLevel = Math.max(0, Math.min(100, level))
          set({ entropyVisuals: clampedLevel })
        },

        incrementEntropy: (delta) => {
          set((state) => ({
            entropyVisuals: Math.min(100, state.entropyVisuals + delta),
          }))
        },

        decrementEntropy: (delta) => {
          set((state) => ({
            entropyVisuals: Math.max(0, state.entropyVisuals - delta),
          }))
        },

        // Navigation
        setCurrentDialogue: (dialogueId) => {
          set({ currentDialogueId: dialogueId })
        },

        // History
        recordInjectionView: (record) => {
          const fullRecord: InjectionViewRecord = {
            ...record,
            timestamp: Date.now(),
          }
          set((state) => ({
            viewedInjections: [...state.viewedInjections, fullRecord],
          }))
        },

        clearViewHistory: () => {
          set({ viewedInjections: [] })
        },

        // Display mode
        setDisplayMode: (mode) => {
          set({ displayMode: mode })
        },

        // Animation
        setAnimating: (isAnimating) => {
          set({ isAnimating })
        },

        // Conflicts
        setConflictingVoices: (conflicts) => {
          set({ conflictingVoices: conflicts })
        },

        // Utilities
        getVoiceColor: (voiceId) => {
          const group = VOICE_TO_GROUP[voiceId]
          return VOICE_GROUP_COLORS[group]
        },

        getVoiceName: (voiceId) => {
          return VOICE_NAMES[voiceId]
        },

        hasViewedInjection: (injectionId) => {
          return get().viewedInjections.some(
            (record) => record.injectionId === injectionId
          )
        },
      }),
      {
        name: 'narrative-store',
        // Persist only viewedInjections and displayMode
        partialize: (state) => ({
          viewedInjections: state.viewedInjections,
          displayMode: state.displayMode,
        }),
      }
    ),
    { name: 'NarrativeStore' }
  )
)

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Получить инъекции отсортированные по приоритету
 */
export const selectSortedInjections = (state: NarrativeState) =>
  [...state.activeInjections].sort((a, b) => b.priority - a.priority)

/**
 * Получить доминирующий голос (с наивысшим приоритетом)
 */
export const selectDominantVoice = (state: NarrativeState) => {
  const sorted = selectSortedInjections(state)
  return sorted[0] ?? null
}

/**
 * Получить инъекции по группе голосов
 */
export const selectInjectionsByGroup = (state: NarrativeState, group: VoiceGroup) =>
  state.activeInjections.filter((inj) => inj.voiceGroup === group)

/**
 * Проверить, есть ли конфликт голосов
 */
export const selectHasConflict = (state: NarrativeState) =>
  state.conflictingVoices.length > 0

/**
 * Получить уровень интенсивности энтропии для CSS
 */
export const selectEntropyIntensity = (state: NarrativeState): 'none' | 'low' | 'medium' | 'high' | 'critical' => {
  const { entropyVisuals } = state
  if (entropyVisuals < 10) return 'none'
  if (entropyVisuals < 30) return 'low'
  if (entropyVisuals < 60) return 'medium'
  if (entropyVisuals < 85) return 'high'
  return 'critical'
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Фильтрует инъекции на основе навыков игрока
 */
export function filterInjectionsBySkills(
  injections: ActiveInjection[],
  skills: Record<string, number>,
  flags: Set<string> = new Set()
): ActiveInjection[] {
  return injections.filter((inj) => {
    const skillValue = skills[inj.voice] ?? 0
    
    // Проверка порога
    if (skillValue < inj.threshold) return false
    
    // Проверка максимального порога
    if (inj.maxThreshold !== undefined && skillValue > inj.maxThreshold) return false
    
    // Проверка требуемых флагов
    const requiredFlags = [
      ...(inj.requiredFlags ?? []),
      ...(inj.requiredFlag ? [inj.requiredFlag] : []),
    ]
    if (requiredFlags.some((flag) => !flags.has(flag))) return false

    // Проверка исключающих флагов
    const excludedFlags = [
      ...(inj.excludedFlags ?? []),
      ...(inj.excludedFlag ? [inj.excludedFlag] : []),
    ]
    if (excludedFlags.some((flag) => flags.has(flag))) return false
    
    return true
  })
}

/**
 * Разрешает конфликты между голосами, оставляя только с наивысшим приоритетом
 */
export function resolveInjectionConflicts(
  injections: ActiveInjection[],
  maxVisible: number = 3
): { visible: ActiveInjection[]; conflicts: Array<{ voice1: VoiceId; voice2: VoiceId }> } {
  const sorted = [...injections].sort((a, b) => {
    // Сначала по приоритету
    if (b.priority !== a.priority) return b.priority - a.priority
    // Затем по значению навыка
    return b.skillValue - a.skillValue
  })
  
  const visible = sorted.slice(0, maxVisible)
  const hidden = sorted.slice(maxVisible)
  
  // Определяем конфликты
  const conflicts: Array<{ voice1: VoiceId; voice2: VoiceId }> = []
  
  if (visible.length > 0 && hidden.length > 0) {
    // Есть голоса, которые «проиграли» в борьбе за внимание
    hidden.forEach((hiddenInj) => {
      const dominantInj = visible[0]
      if (dominantInj && dominantInj.voiceGroup !== hiddenInj.voiceGroup) {
        conflicts.push({
          voice1: dominantInj.voice,
          voice2: hiddenInj.voice,
        })
      }
    })
  }
  
  return { visible, conflicts }
}

export default useNarrativeStore







