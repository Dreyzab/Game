import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DialogueBox, ChoicePanel, CharacterGroup } from '@/entities/visual-novel/ui'
import type {
  VisualNovelChoiceView,
  VisualNovelLine,
  VisualNovelSceneDefinition,
} from '@/shared/types/visualNovel'
import { Button } from '@/shared/ui/components/Button'
import { useConsultationMode, getVoiceDefinition } from '@/features/visual-novel/consultation'

export interface VNScreenProps {
  scene: VisualNovelSceneDefinition
  currentLine: VisualNovelLine | null
  choices: VisualNovelChoiceView[]
  isSceneCompleted: boolean
  isPending: boolean
  skills?: Record<string, number>
  flags?: Set<string>
  onAdvance: () => void
  onChoice: (choiceId: string) => void
  onExit: () => void
  onAdviceViewed?: (payload: {
    sceneId: string
    lineId: string
    characterId: string
    choiceContext: string[]
    skillLevel: number
    viewOrder: number
  }) => void
  isCommitting?: boolean
}

export const VNScreen: React.FC<VNScreenProps> = ({
  scene,
  currentLine,
  choices,
  isSceneCompleted,
  isPending,
  skills = {},
  flags = new Set<string>(),
  onAdvance,
  onChoice,
  onExit,
  onAdviceViewed,
  isCommitting = false,
}) => {
  const log = useCallback((...args: unknown[]) => {
    console.log('🖼️ [VN Screen]', ...args)
  }, [])
  const speaker = useMemo(
    () => scene.characters.find((character) => character.id === currentLine?.speakerId),
    [currentLine?.speakerId, scene.characters]
  )

  const backgroundImage = currentLine?.backgroundOverride ?? scene.background
  const [isLineRevealed, setLineRevealed] = useState(false)
  const [isWaitingForAdvance, setWaitingForAdvance] = useState(false)
  const autoAdvanceTimeoutRef = useRef<number | null>(null)

  // Система консультаций с внутренними голосами
  const consultation = useConsultationMode({
    currentLine,
    choices,
    skills,
    flags,
    onAdviceViewed,
    sceneId: scene.id,
  })

  // Получаем определение активного голоса
  const activeVoice = useMemo(
    () => (consultation.activeVoiceId ? getVoiceDefinition(consultation.activeVoiceId) : null),
    [consultation.activeVoiceId]
  )

  // Выборы видны только если: 1) реплика раскрыта, 2) не в режиме консультации, 3) нет pending
  const visibleChoices = useMemo(
    () => (isLineRevealed && !isPending && !consultation.isConsultationMode ? choices : []),
    [choices, isLineRevealed, isPending, consultation.isConsultationMode]
  )

  const showVoiceTabs =
    isLineRevealed && choices.length > 0 && consultation.availableVoiceIds.length > 0
  const hasCharacterCards = scene.characters.length > 0

  const [isTextTyping, setIsTextTyping] = useState(false)
  const [forceShowText, setForceShowText] = useState(false)

  const exitConsultation = useCallback(() => {
    consultation.exitConsultationMode()
    if (isLineRevealed) {
      setForceShowText(true)
    }
  }, [consultation, isLineRevealed])

  useEffect(() => {
    log('🆕 Активная реплика изменена', { lineId: currentLine?.id, sceneId: scene.id })
    setLineRevealed(false)
    setWaitingForAdvance(false)
    setForceShowText(false)
  }, [currentLine?.id, log, scene.id])

  // Очищаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current !== null) {
        clearTimeout(autoAdvanceTimeoutRef.current)
        autoAdvanceTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isLineRevealed) return
    if (choices.length > 0) return
    if (isSceneCompleted) return
    if (isPending) return

    const hasNext = Boolean(currentLine?.nextLineId || currentLine?.transition?.nextSceneId)
    if (!hasNext) return

    // Пауза между репликами - 5 секунд
    const PAUSE_BEFORE_ADVANCE = 5000
    log('⏳ Пауза перед следующей репликой', {
      lineId: currentLine?.id,
      nextLineId: currentLine?.nextLineId,
      nextSceneId: currentLine?.transition?.nextSceneId,
      delay: PAUSE_BEFORE_ADVANCE,
    })

    setWaitingForAdvance(true)

    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      log('⏩ Автоматический переход после паузы', { fromLineId: currentLine?.id })
      setWaitingForAdvance(false)
      onAdvance()
      autoAdvanceTimeoutRef.current = null
    }, PAUSE_BEFORE_ADVANCE)

    return () => {
      log('🧹 Отмена паузы', { lineId: currentLine?.id })
      if (autoAdvanceTimeoutRef.current !== null) {
        clearTimeout(autoAdvanceTimeoutRef.current)
        autoAdvanceTimeoutRef.current = null
      }
      setWaitingForAdvance(false)
    }
  }, [
    choices.length,
    currentLine?.id,
    currentLine?.nextLineId,
    currentLine?.transition?.nextSceneId,
    isLineRevealed,
    isPending,
    isSceneCompleted,
    log,
    onAdvance,
  ])

  const handleChoiceSelect = useCallback(
    (choiceId: string) => {
      if (!isLineRevealed || isPending || isSceneCompleted) {
        log('🚫 Выбор заблокирован', {
          choiceId,
          isLineRevealed,
          isPending,
          isSceneCompleted,
        })
        return
      }
      log('🟢 Выбор передан во viewModel', { choiceId })
      onChoice(choiceId)
    },
    [isLineRevealed, isPending, isSceneCompleted, log, onChoice]
  )

  const skipPause = useCallback(() => {
    if (autoAdvanceTimeoutRef.current !== null) {
      log('⏭️ Пропуск паузы по клику')
      clearTimeout(autoAdvanceTimeoutRef.current)
      autoAdvanceTimeoutRef.current = null
      setWaitingForAdvance(false)
      onAdvance()
    }
  }, [log, onAdvance])

  const handleScreenClick = useCallback(() => {
    // В режиме консультации - выходим из него
    if (consultation.isConsultationMode) {
      exitConsultation()
      return
    }

    // Если текст печатается - ускоряем его
    if (isTextTyping) {
      setForceShowText(true)
      return
    }

    // Если есть выборы или сцена завершена, не обрабатываем клик
    if (visibleChoices.length > 0 || isSceneCompleted || isPending) {
      return
    }
    // Если ждём автоматического перехода - пропускаем паузу
    if (isWaitingForAdvance) {
      skipPause()
      return
    }

    // Если ничего не происходит, но кликнули - пробуем перейти дальше (если текст уже показан)
    if (isLineRevealed && !isWaitingForAdvance) {
      onAdvance()
    }
  }, [
    consultation,
    exitConsultation,
    isTextTyping,
    visibleChoices.length,
    isSceneCompleted,
    isPending,
    isWaitingForAdvance,
    skipPause,
    isLineRevealed,
    onAdvance
  ])

  return (
    <div className="relative min-h-svh w-full overflow-hidden text-white">
      <motion.div
        key={backgroundImage}
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        initial={{ opacity: 0.6, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: scene.ambientColor ?? 'rgba(2, 6, 23, 0.78)',
        }}
      />
      <div
        className="relative z-10 flex min-h-svh flex-col gap-6 px-4 pb-8 pt-10 md:px-10"
        onClick={handleScreenClick}
      >
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-[0.4em] text-white/60">
            {scene.location}
          </div>
          <h1 className="text-2xl font-semibold md:text-3xl">{scene.title}</h1>
          {scene.description && (
            <p className="max-w-2xl text-sm text-white/70">{scene.description}</p>
          )}
        </div>

        {(showVoiceTabs || hasCharacterCards) && (
          <div className="flex flex-col gap-4">
            {showVoiceTabs ? (
              <div className="flex flex-wrap gap-3">
                <div
                  onClick={exitConsultation}
                  className={`min-w-[160px] flex-1 rounded-2xl border px-4 py-3 backdrop-blur cursor-pointer transition-all duration-200 ${!consultation.isConsultationMode
                    ? 'border-white/70 bg-white/15 shadow-lg'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <p
                    className="text-xs uppercase tracking-[0.35em] text-white/60"
                    style={{ color: 'rgb(125, 211, 252)' }}
                  >
                    Рассказчик
                  </p>
                </div>

                {consultation.availableVoiceIds.map((voiceId) => {
                  const def = getVoiceDefinition(voiceId)
                  const isActive = consultation.activeVoiceId === voiceId
                  if (!def) return null

                  return (
                    <div
                      key={voiceId}
                      onClick={() => consultation.consultVoice(voiceId)}
                      className={`min-w-[160px] flex-1 rounded-2xl border px-4 py-3 backdrop-blur cursor-pointer transition-all duration-200 ${isActive
                        ? 'border-white/70 bg-white/15 shadow-lg'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <p
                        className="text-xs uppercase tracking-[0.35em] text-white/60"
                        style={{ color: def.color }}
                      >
                        {def.name}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <CharacterGroup characters={scene.characters} activeCharacterId={currentLine?.speakerId} />
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-4">
          {/* DialogueBox - показываем совет голоса ИЛИ обычный диалог */}
          <AnimatePresence mode="wait">
            {consultation.isConsultationMode && consultation.currentAdvice && activeVoice ? (
              // Режим консультации - показываем совет голоса
              <DialogueBox
                key={`advice-${consultation.activeVoiceId}`}
                // Скрываем имя, если есть табы (чтобы не дублировать)
                speakerName={undefined}
                speakerTitle={`Уровень: ${skills[consultation.activeVoiceId || ''] ?? 0}`}
                text={consultation.currentAdvice.text}
                mood={consultation.currentAdvice.mood}
                stageDirection={consultation.currentAdvice.stageDirection}
                disabled={false}
                isPending={false}
                onAdvance={exitConsultation}
                onRevealComplete={() => { }}
              />
            ) : (
              // Обычный режим - показываем диалог сцены
              <DialogueBox
                key={`dialogue-${currentLine?.id}`}
                // Скрываем имя, если есть табы и они активны (есть выборы и голоса)
                speakerName={
                  (isLineRevealed && choices.length > 0 && consultation.availableVoiceIds.length > 0)
                    ? undefined
                    : speaker?.name
                }
                speakerTitle={speaker?.title}
                text={currentLine?.text}
                mood={currentLine?.mood}
                stageDirection={currentLine?.stageDirection}
                disabled={visibleChoices.length > 0 || isSceneCompleted}
                isPending={isPending || isWaitingForAdvance}
                onAdvance={isWaitingForAdvance ? skipPause : onAdvance}
                onRevealComplete={() => setLineRevealed(true)}
                onTypingStatusChange={setIsTextTyping}
                forceShow={forceShowText}
              />
            )}
          </AnimatePresence>

          <ChoicePanel choices={visibleChoices} onSelect={handleChoiceSelect} />

          <AnimatePresence>
            {isSceneCompleted && (
              <motion.div
                className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-black/50 px-4 py-3 backdrop-blur-md"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
              >
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                    Сцена завершена
                  </p>
                  <p className="text-xs text-white/60">Можно вернуться на карту или выбрать другую сцену.</p>
                </div>
                <Button size="sm" variant="secondary" onClick={onExit} disabled={isCommitting}>
                  {isCommitting ? 'Сохранение...' : 'Завершить'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default VNScreen
