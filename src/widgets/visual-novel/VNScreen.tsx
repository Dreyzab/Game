import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  CharacterGroup,
  CharacterSprites,
  ChoicePanel,
  DialogueBox,
  VFXOverlay,
} from '@/entities/visual-novel/ui'
import { cn } from '@/shared/lib/utils/cn'
import type {
  VisualNovelChoiceView,
  VisualNovelLine,
  VisualNovelSceneDefinition,
} from '@/shared/types/visualNovel'
import type { VoiceId } from '@/shared/types/parliament'
import { getVoiceDefinition, useConsultationMode } from '@/features/visual-novel/consultation'

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
  const speaker = useMemo(() => {
    if (!currentLine?.speakerId) return undefined
    return (
      scene.characters.find((character) => character.id === currentLine.speakerId) ??
      scene.characters[0]
    )
  }, [currentLine?.speakerId, scene.characters])

  const backgroundImage = currentLine?.backgroundOverride ?? scene.background
  const [isLineRevealed, setLineRevealed] = useState(false)
  const [isWaitingForAdvance, setWaitingForAdvance] = useState(false)
  const [forceShowText, setForceShowText] = useState(false)
  const autoAdvanceTimeoutRef = useRef<number | null>(null)

  const consultation = useConsultationMode({
    currentLine,
    choices,
    skills: skills as Partial<Record<VoiceId, number>>,
    flags,
    onAdviceViewed: onAdviceViewed as any,
    sceneId: scene.id,
  })

  const activeVoice = useMemo(
    () => (consultation.activeVoiceId ? getVoiceDefinition(consultation.activeVoiceId) : null),
    [consultation.activeVoiceId]
  )

  const visibleChoices = useMemo(
    () => (isLineRevealed && !isPending && !consultation.isConsultationMode ? choices : []),
    [choices, isLineRevealed, isPending, consultation.isConsultationMode]
  )

  const showVoiceTabs =
    isLineRevealed && choices.length > 0 && consultation.availableVoiceIds.length > 0

  const spritesActiveSpeakerId = useMemo(() => {
    if (consultation.isConsultationMode) return null
    return currentLine?.speakerId ?? null
  }, [consultation.isConsultationMode, currentLine?.speakerId])

  const exitConsultation = useCallback(() => {
    consultation.exitConsultationMode()
    if (isLineRevealed) {
      setForceShowText(true)
    }
  }, [consultation, isLineRevealed])

  useEffect(() => {
    setLineRevealed(false)
    setWaitingForAdvance(false)
    setForceShowText(false)
  }, [currentLine?.id, scene.id])

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

    const PAUSE_BEFORE_ADVANCE = 5000
    setWaitingForAdvance(true)

    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      setWaitingForAdvance(false)
      onAdvance()
      autoAdvanceTimeoutRef.current = null
    }, PAUSE_BEFORE_ADVANCE)

    return () => {
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
    onAdvance,
  ])

  const handleChoiceSelect = useCallback(
    (choiceId: string) => {
      if (!isLineRevealed || isPending || isSceneCompleted) return
      onChoice(choiceId)
    },
    [isLineRevealed, isPending, isSceneCompleted, onChoice]
  )

  const skipPause = useCallback(() => {
    if (autoAdvanceTimeoutRef.current !== null) {
      clearTimeout(autoAdvanceTimeoutRef.current)
      autoAdvanceTimeoutRef.current = null
      setWaitingForAdvance(false)
      onAdvance()
    }
  }, [onAdvance])

  return (
    <div className="vn-chronicles relative w-screen h-screen overflow-hidden bg-[#020617]">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      <VFXOverlay />

      <CharacterSprites characters={scene.characters} activeSpeakerId={spritesActiveSpeakerId} />

      <div className="absolute top-0 left-0 w-full z-30 p-6 flex justify-between items-start pointer-events-none">
        <div className="animate-fade-in">
          <h1 className="font-cinzel text-xs tracking-[0.5em] text-white/40 uppercase">
            {scene.location}
          </h1>
          <h2 className="font-playfair text-2xl text-white mt-1">{scene.title}</h2>
        </div>
        <div className="flex gap-4 animate-fade-in pointer-events-auto">
          {isCommitting && (
            <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-md">
              <span className="text-[10px] font-cinzel text-slate-400 block uppercase tracking-widest">
                Saving
              </span>
              <span className="text-white font-bold">...</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end z-40 pb-4">
        <div className="w-full mb-4">
          {showVoiceTabs ? (
            <div className="flex justify-center gap-3 animate-slide-up">
              <button
                onClick={exitConsultation}
                className={cn(
                  'px-6 py-2 rounded-t-xl border-x border-t font-cinzel text-[10px] tracking-widest transition-all uppercase',
                  !consultation.isConsultationMode
                    ? 'bg-blue-500/30 border-blue-400 text-white shadow-[0_-4px_15px_rgba(59,130,246,0.3)]'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20'
                )}
              >
                Dialogue
              </button>
              {consultation.availableVoiceIds.map((voiceId) => {
                const def = getVoiceDefinition(voiceId)
                const isActive = consultation.activeVoiceId === voiceId
                if (!def) return null

                return (
                  <button
                    key={voiceId}
                    onClick={() => consultation.consultVoice(voiceId)}
                    className={cn(
                      'px-6 py-2 rounded-t-xl border-x border-t font-cinzel text-[10px] tracking-widest transition-all uppercase',
                      isActive
                        ? 'bg-blue-500/30 border-blue-400 text-white shadow-[0_-4px_15px_rgba(59,130,246,0.3)]'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20'
                    )}
                    style={isActive ? { borderColor: def.color } : undefined}
                  >
                    Voice: {def.name}
                  </button>
                )
              })}
            </div>
          ) : (
            !isSceneCompleted &&
            !consultation.isConsultationMode && (
              <CharacterGroup
                characters={scene.characters}
                activeCharacterId={currentLine?.speakerId}
              />
            )
          )}
        </div>

        <AnimatePresence mode="wait">
          {consultation.isConsultationMode && consultation.currentAdvice && activeVoice ? (
            <DialogueBox
              key={`advice-${consultation.activeVoiceId}`}
              speakerName={activeVoice.name}
              speakerTitle={`Internal voice (lvl ${skills[consultation.activeVoiceId || ''] ?? 0})`}
              text={consultation.currentAdvice.text}
              mood={consultation.currentAdvice.mood}
              stageDirection={consultation.currentAdvice.stageDirection}
              disabled={false}
              isPending={false}
              onAdvance={exitConsultation}
              onRevealComplete={() => {}}
              style={{
                borderLeft: `4px solid ${activeVoice.color}`,
                boxShadow: `inset 10px 0 20px -10px ${activeVoice.color}22`,
              }}
            />
          ) : (
            <DialogueBox
              key={`dialogue-${currentLine?.id}`}
              speakerName={speaker?.name}
              speakerTitle={speaker?.title}
              text={currentLine?.text}
              mood={currentLine?.mood}
              stageDirection={currentLine?.stageDirection}
              disabled={visibleChoices.length > 0 || isSceneCompleted}
              isPending={isPending || isWaitingForAdvance}
              onAdvance={isWaitingForAdvance ? skipPause : onAdvance}
              onRevealComplete={() => setLineRevealed(true)}
              forceShow={forceShowText}
            />
          )}
        </AnimatePresence>

        <ChoicePanel choices={visibleChoices} onSelect={handleChoiceSelect} skills={skills} />

        {isSceneCompleted && (
          <div className="flex justify-center mb-12 animate-fade-in">
            <button
              onClick={onExit}
              disabled={isCommitting}
              className={cn(
                'px-10 py-4 bg-white/5 border border-white/20 rounded-xl font-cinzel text-white tracking-[0.3em] transition-all uppercase',
                isCommitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'
              )}
            >
              {isCommitting ? 'Saving...' : 'Save & Exit'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VNScreen
