/**
 * usePolyphonicNarrative — Хук для полифонического нарратива
 * 
 * Интегрирует:
 * - Фильтрацию privateInjections на основе skills игрока
 * - Управление состоянием Zustand store
 * - Получение skills из game_progress (Convex)
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import type { 
  PrivateInjection, 
  ActiveInjection,
  PolyphonicDialogue,
  PolyphonicScene,
  VoiceId,
  VoiceGroup,
} from '@/entities/visual-novel/model/types'
import { 
  useNarrativeStore,
  VOICE_TO_GROUP,
  VOICE_NAMES,
  filterInjectionsBySkills,
  resolveInjectionConflicts,
} from '@/shared/stores/useNarrativeStore'

// ============================================================================
// TYPES
// ============================================================================

interface UsePolyphonicNarrativeParams {
  /** Текущий полифонический диалог */
  dialogue: PolyphonicDialogue | null
  /** ID сцены */
  sceneId: string
  /** Максимальное количество видимых инъекций */
  maxVisibleInjections?: number
  /** Использовать внешние skills (вместо из Convex) */
  externalSkills?: Record<string, number>
  /** Использовать внешние флаги */
  externalFlags?: Set<string>
}

interface UsePolyphonicNarrativeResult {
  /** Обогащённые инъекции, прошедшие фильтрацию */
  activeInjections: ActiveInjection[]
  /** Все инъекции, включая скрытые */
  allFilteredInjections: ActiveInjection[]
  /** Конфликтующие голоса */
  conflicts: Array<{ voice1: VoiceId; voice2: VoiceId }>
  /** Текущие навыки игрока */
  skills: Record<string, number>
  /** Флаги игрока */
  flags: Set<string>
  /** Загружаются ли данные */
  isLoading: boolean
  /** Записать просмотр инъекции */
  recordView: (injectionId: string) => void
  /** Проверить, просмотрена ли инъекция */
  hasViewed: (injectionId: string) => boolean
  /** Получить доминирующий голос */
  dominantVoice: ActiveInjection | null
  /** Получить цвет голоса */
  getVoiceColor: (voiceId: VoiceId) => { primary: string; secondary: string; glow: string; bg: string }
  /** Получить название голоса */
  getVoiceName: (voiceId: VoiceId) => string
}

// ============================================================================
// DEFAULT SKILLS
// ============================================================================

const DEFAULT_SKILLS: Record<string, number> = {
  // BODY
  strength: 30,
  endurance: 30,
  stamina: 30,
  // MOTORICS
  perception: 35,
  reaction: 30,
  coordination: 30,
  // MIND
  logic: 45,
  rhetoric: 30,
  analysis: 30,
  // CONSCIOUSNESS
  authority: 30,
  suggestion: 30,
  courage: 30,
  // PSYCHE
  drama: 20,
  creativity: 20,
  gambling: 20,
  // SOCIALITY
  solidarity: 20,
  honor: 20,
  empathy: 20,
}

// ============================================================================
// HOOK
// ============================================================================

export function usePolyphonicNarrative({
  dialogue,
  sceneId,
  maxVisibleInjections = 3,
  externalSkills,
  externalFlags,
}: UsePolyphonicNarrativeParams): UsePolyphonicNarrativeResult {
  const { deviceId } = useDeviceId()
  
  // Получаем game_progress из Convex
  const gameProgress = useQuery(
    api.player.getProgress,
    deviceId ? { deviceId } : 'skip'
  )
  
  // Store actions
  const {
    setActiveInjections,
    setConflictingVoices,
    setCurrentDialogue,
    recordInjectionView,
    hasViewedInjection,
    getVoiceColor,
    getVoiceName,
  } = useNarrativeStore()
  
  // Объединяем skills из разных источников
  const skills = useMemo(() => {
    if (externalSkills) return externalSkills
    if (gameProgress?.skills) return gameProgress.skills as Record<string, number>
    return DEFAULT_SKILLS
  }, [externalSkills, gameProgress?.skills])
  
  // Объединяем флаги
  const flags = useMemo(() => {
    if (externalFlags) return externalFlags
    if (gameProgress?.flags) {
      const flagSet = new Set<string>()
      Object.entries(gameProgress.flags as Record<string, unknown>).forEach(([key, value]) => {
        if (value) flagSet.add(key)
      })
      return flagSet
    }
    return new Set<string>()
  }, [externalFlags, gameProgress?.flags])
  
  // Обновляем текущий диалог в store
  useEffect(() => {
    setCurrentDialogue(dialogue?.id ?? null)
    
    return () => {
      setCurrentDialogue(null)
    }
  }, [dialogue?.id, setCurrentDialogue])
  
  // Обогащаем инъекции данными о навыках
  const enrichedInjections = useMemo(() => {
    if (!dialogue?.privateInjections) return []
    
    return dialogue.privateInjections.map((inj): ActiveInjection => {
      const voiceGroup = (VOICE_TO_GROUP[inj.voice as VoiceId] ?? inj.voiceGroup) as VoiceGroup
      const skillValue = skills[inj.voice] ?? 0
      
      return {
        ...inj,
        voiceGroup,
        voiceName: inj.voiceName ?? VOICE_NAMES[inj.voice as VoiceId] ?? inj.voice,
        skillValue,
        isConflicted: false,
        conflictWith: undefined,
      }
    })
  }, [dialogue?.privateInjections, skills])
  
  // Фильтруем по навыкам и флагам
  const filteredInjections = useMemo(() => 
    filterInjectionsBySkills(enrichedInjections, skills, flags),
    [enrichedInjections, skills, flags]
  )
  
  // Разрешаем конфликты
  const { visible, conflicts } = useMemo(() => 
    resolveInjectionConflicts(filteredInjections, maxVisibleInjections),
    [filteredInjections, maxVisibleInjections]
  )
  
  // Обновляем store
  useEffect(() => {
    setActiveInjections(visible)
    setConflictingVoices(conflicts)
  }, [visible, conflicts, setActiveInjections, setConflictingVoices])
  
  // Callback для записи просмотра
  const recordView = useCallback((injectionId: string) => {
    const injection = visible.find((inj) => inj.id === injectionId)
    if (injection && dialogue) {
      recordInjectionView({
        injectionId,
        voiceId: injection.voice as VoiceId,
        sceneId,
        dialogueId: dialogue.id,
      })
    }
  }, [visible, dialogue, sceneId, recordInjectionView])
  
  // Доминирующий голос
  const dominantVoice = useMemo(() => {
    if (visible.length === 0) return null
    return visible[0]
  }, [visible])
  
  return {
    activeInjections: visible,
    allFilteredInjections: filteredInjections,
    conflicts,
    skills,
    flags,
    isLoading: deviceId ? gameProgress === undefined : false,
    recordView,
    hasViewed: hasViewedInjection,
    dominantVoice,
    getVoiceColor,
    getVoiceName,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Создаёт тестовые инъекции для разработки
 */
export function createTestInjections(): PrivateInjection[] {
  return [
    {
      id: 'test_logic_1',
      voice: 'logic',
      voiceGroup: 'mind',
      threshold: 40,
      text: 'Статистически, это ложь. Данные не сходятся.',
      effect: 'terminal',
      priority: 8,
    },
    {
      id: 'test_empathy_1',
      voice: 'empathy',
      voiceGroup: 'sociality',
      threshold: 35,
      text: 'У него дрожат руки. Он боится, но не за себя.',
      effect: 'glow',
      priority: 7,
    },
    {
      id: 'test_perception_1',
      voice: 'perception',
      voiceGroup: 'motorics',
      threshold: 45,
      text: 'Тень у вентиляции. Кто-то слушает.',
      effect: 'glitch',
      priority: 9,
    },
    {
      id: 'test_authority_1',
      voice: 'authority',
      voiceGroup: 'consciousness',
      threshold: 50,
      text: 'ОН НЕ ИМЕЕТ ПРАВА ГОВОРИТЬ С ТОБОЙ ТАК.',
      effect: 'pulse',
      priority: 6,
    },
  ]
}

/**
 * Создаёт тестовый полифонический диалог
 */
export function createTestPolyphonicDialogue(): PolyphonicDialogue {
  return {
    id: 'test_dialogue_1',
    sharedContent: {
      text: 'У нас есть окно в сорок минут. Ваша задача: зайти, изъять накопитель, выйти.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'serious', intensity: 80 },
    },
    privateInjections: createTestInjections(),
    options: [
      {
        id: 'accept',
        text: 'Принято, Командант.',
        nextDialogue: 'briefing_02',
      },
      {
        id: 'question',
        text: 'Сорок минут? Это мало.',
        nextDialogue: 'briefing_02_skeptic',
        requiredStat: { stat: 'logic', value: 45 },
      },
    ],
  }
}

export default usePolyphonicNarrative


