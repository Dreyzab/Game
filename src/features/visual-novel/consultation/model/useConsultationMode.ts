import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { VisualNovelAdvice, VisualNovelChoiceView, VisualNovelLine } from '@/shared/types/visualNovel'
import { filterAvailableAdvices } from '../lib/consultationUtils'
import { getVoiceDefinition } from '../lib/voiceDefinitions'

export interface ConsultationModeState {
  isConsultationMode: boolean
  activeVoiceId: string | null
  viewedVoiceIds: Set<string>
  availableVoiceIds: string[]
  currentAdvice: VisualNovelAdvice | null
}

export interface ConsultationModeActions {
  enterConsultationMode: () => void
  exitConsultationMode: () => void
  consultVoice: (voiceId: string) => void
  reset: () => void
}

export interface UseConsultationModeParams {
  currentLine: VisualNovelLine | null
  choices: VisualNovelChoiceView[]
  skills: Record<string, number>
  flags: Set<string>
  onAdviceViewed?: (payload: {
    sceneId: string
    lineId: string
    characterId: string
    choiceContext: string[]
    skillLevel: number
    viewOrder: number
  }) => void
  sceneId: string
}

export interface UseConsultationModeReturn extends ConsultationModeState, ConsultationModeActions { }

export function useConsultationMode({
  currentLine,
  choices,
  skills,
  flags,
  onAdviceViewed,
  sceneId,
}: UseConsultationModeParams): UseConsultationModeReturn {
  const [isConsultationMode, setConsultationMode] = useState(false)
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null)
  const [viewedVoiceIds, setViewedVoiceIds] = useState<Set<string>>(new Set())
  const viewOrderRef = useRef(0)
  const viewStartTimeRef = useRef<number>(0)

  // Фильтруем доступные советы
  const availableAdvices = useMemo(() => {
    return filterAvailableAdvices(currentLine?.characterAdvices, skills, flags)
  }, [currentLine?.characterAdvices, skills, flags])

  // Получаем ID доступных голосов
  const availableVoiceIds = useMemo(
    () => availableAdvices.map(a => a.characterId),
    [availableAdvices]
  )

  // Находим текущий активный совет
  const currentAdvice = useMemo(() => {
    if (!activeVoiceId) return null
    return availableAdvices.find((advice) => advice.characterId === activeVoiceId) ?? null
  }, [activeVoiceId, availableAdvices])

  // Сбрасываем состояние при смене сцены или реплики
  useEffect(() => {
    setConsultationMode(false)
    setActiveVoiceId(null)
    setViewedVoiceIds(new Set())
    viewOrderRef.current = 0
  }, [currentLine?.id, sceneId])

  const enterConsultationMode = useCallback(() => {
    setConsultationMode(true)
  }, [])

  const exitConsultationMode = useCallback(() => {
    // Логируем время просмотра, если был активный голос
    if (activeVoiceId && viewStartTimeRef.current > 0) {
      const timeSpent = Date.now() - viewStartTimeRef.current
      console.log('🕒 [Consultation] Время просмотра:', {
        voiceId: activeVoiceId,
        timeSpent,
      })
    }

    setConsultationMode(false)
    setActiveVoiceId(null)
    viewStartTimeRef.current = 0
  }, [activeVoiceId])

  const consultVoice = useCallback(
    (voiceId: string) => {
      // Проверяем доступность
      if (!availableVoiceIds.includes(voiceId)) {
        console.warn('⚠️ [Consultation] Голос недоступен:', voiceId)
        return
      }

      const advice = availableAdvices.find((a) => a.characterId === voiceId)
      if (!advice) {
        console.warn('⚠️ [Consultation] Совет не найден для голоса:', voiceId)
        return
      }

      // Логируем завершение просмотра предыдущего голоса
      if (activeVoiceId && activeVoiceId !== voiceId && viewStartTimeRef.current > 0) {
        const timeSpent = Date.now() - viewStartTimeRef.current
        console.log('🕒 [Consultation] Переключение голоса:', {
          from: activeVoiceId,
          to: voiceId,
          timeSpent,
        })
      }

      // Если это новый голос (не повторный просмотр)
      const isFirstView = !viewedVoiceIds.has(voiceId)
      if (isFirstView) {
        setViewedVoiceIds((prev) => new Set(prev).add(voiceId))
        viewOrderRef.current += 1

        // Логируем просмотр совета
        if (onAdviceViewed && currentLine) {
          const skillLevel = skills[voiceId] ?? 0
          const choiceContext = choices.map((c) => c.id)

          onAdviceViewed({
            sceneId,
            lineId: currentLine.id,
            characterId: voiceId,
            choiceContext,
            skillLevel,
            viewOrder: viewOrderRef.current,
          })

          console.log('📊 [Consultation] Совет просмотрен:', {
            voiceId,
            voiceName: getVoiceDefinition(voiceId)?.name,
            skillLevel,
            viewOrder: viewOrderRef.current,
            choiceContext,
          })
        }
      }

      setActiveVoiceId(voiceId)
      setConsultationMode(true)
      viewStartTimeRef.current = Date.now()

      console.log('💬 [Consultation] Консультация с голосом:', {
        voiceId,
        voiceName: getVoiceDefinition(voiceId)?.name,
        isFirstView,
      })
    },
    [
      availableVoiceIds,
      availableAdvices,
      activeVoiceId,
      viewedVoiceIds,
      onAdviceViewed,
      currentLine,
      sceneId,
      choices,
      skills,
    ]
  )

  const reset = useCallback(() => {
    setConsultationMode(false)
    setActiveVoiceId(null)
    setViewedVoiceIds(new Set())
    viewOrderRef.current = 0
    viewStartTimeRef.current = 0
  }, [])

  return {
    isConsultationMode,
    activeVoiceId,
    viewedVoiceIds,
    availableVoiceIds,
    currentAdvice,
    enterConsultationMode,
    exitConsultationMode,
    consultVoice,
    reset,
  }
}
