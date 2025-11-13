import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DialogueBox, ChoicePanel, CharacterGroup } from '@/entities/visual-novel/ui'
import type {
  VisualNovelChoiceView,
  VisualNovelLine,
  VisualNovelSceneDefinition,
} from '@/shared/types/visualNovel'
import { Button } from '@/shared/ui/components/Button'

export interface VNScreenProps {
  scene: VisualNovelSceneDefinition
  currentLine: VisualNovelLine | null
  choices: VisualNovelChoiceView[]
  isSceneCompleted: boolean
  isPending: boolean
  onAdvance: () => void
  onChoice: (choiceId: string) => void
  onExit: () => void
  isCommitting?: boolean
}

export const VNScreen: React.FC<VNScreenProps> = ({
  scene,
  currentLine,
  choices,
  isSceneCompleted,
  isPending,
  onAdvance,
  onChoice,
  onExit,
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
  const visibleChoices = useMemo(
    () => (isLineRevealed && !isPending ? choices : []),
    [choices, isLineRevealed, isPending]
  )

  useEffect(() => {
    log('🆕 Активная реплика изменена', { lineId: currentLine?.id, sceneId: scene.id })
    setLineRevealed(false)
  }, [currentLine?.id, log, scene.id])

  useEffect(() => {
    if (!isLineRevealed) return
    if (choices.length > 0) return
    if (isSceneCompleted) return
    if (isPending) return

    const hasNext = Boolean(currentLine?.nextLineId || currentLine?.transition?.nextSceneId)
    if (!hasNext) return

    const AUTO_ADVANCE_DELAY = 900
    log('⏳ Планируем автоматический переход после реплики', {
      lineId: currentLine?.id,
      nextLineId: currentLine?.nextLineId,
      nextSceneId: currentLine?.transition?.nextSceneId,
      delay: AUTO_ADVANCE_DELAY,
    })
    const timeoutId = setTimeout(() => {
      log('⏩ Выполняем автоматический переход', { fromLineId: currentLine?.id })
      onAdvance()
    }, AUTO_ADVANCE_DELAY)

    return () => {
      log('🧹 Отмена автоматического перехода', { lineId: currentLine?.id })
      clearTimeout(timeoutId)
    }
  }, [
    choices.length,
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
      <div className="relative z-10 flex min-h-svh flex-col gap-6 px-4 pb-8 pt-10 md:px-10">
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-[0.4em] text-white/60">
            {scene.location}
          </div>
          <h1 className="text-2xl font-semibold md:text-3xl">{scene.title}</h1>
          {scene.description && (
            <p className="max-w-2xl text-sm text-white/70">{scene.description}</p>
          )}
        </div>

        <CharacterGroup characters={scene.characters} activeCharacterId={currentLine?.speakerId} />

        <div className="mt-auto flex flex-col gap-4">
          <DialogueBox
            speakerName={speaker?.name}
            speakerTitle={speaker?.title}
            text={currentLine?.text}
            mood={currentLine?.mood}
            stageDirection={currentLine?.stageDirection}
            disabled={visibleChoices.length > 0 || isSceneCompleted}
            isPending={isPending}
            onAdvance={onAdvance}
            onRevealComplete={() => setLineRevealed(true)}
            forceTypingAnimation
          />

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
