import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CharacterGroup,
  CharacterSprites,
  ChoicePanel,
  DialogueBox,
  VFXOverlay,
} from '@/entities/visual-novel/ui'
import FloatingText, {
  type FloatingTextEvent,
} from '@/features/dreyzab-combat-simulator/ui/components/FloatingText'
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
  hp?: number
  maxHp?: number
  floatingEvents?: FloatingTextEvent[]
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
  hp,
  maxHp,
  floatingEvents = [],
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

  const backgroundFocus = useMemo<'left' | 'center' | 'right'>(() => {
    // Default: gentle center pan
    if (scene.id === 'prologue_coupe_otto' && currentLine?.speakerId === 'otto') {
      // Otto in this artwork sits on the right side (cup is near right edge).
      return 'right'
    }
    return 'center'
  }, [currentLine?.speakerId, scene.id])

  const backgroundImage = currentLine?.backgroundOverride ?? scene.background
  const isVideoBackground = backgroundImage.toLowerCase().endsWith('.mp4') || 
                          backgroundImage.toLowerCase().endsWith('.webm')

  const backgroundPanClass = useMemo(() => {
    if (backgroundFocus === 'right') return 'vn-bg-pan-right'
    if (backgroundFocus === 'left') return 'vn-bg-pan-left'
    return 'vn-bg-pan'
  }, [backgroundFocus])

  const backgroundPosition = useMemo(() => {
    if (backgroundFocus === 'right') return 'right center'
    if (backgroundFocus === 'left') return 'left center'
    return 'center center'
  }, [backgroundFocus])

  const [isLineRevealed, setLineRevealed] = useState(false)
  const [forceShowText, setForceShowText] = useState(false)

  const shouldShowHp = typeof hp === 'number' && typeof maxHp === 'number'
  const [hpHudPulseKey, setHpHudPulseKey] = useState(0)
  const [isHpHudVisible, setHpHudVisible] = useState(false)
  const [prevHp, setPrevHp] = useState<number | null>(null)

  useEffect(() => {
    if (!shouldShowHp) return
    if (prevHp === null) {
      // Initialize without showing HUD on first paint
      setPrevHp(hp)
      return
    }
    if (hp !== prevHp) {
      setPrevHp(hp)
      setHpHudPulseKey((k) => k + 1)
      setHpHudVisible(true)
    }
  }, [hp, prevHp, shouldShowHp])

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

  const applySequentialChoiceReveal = scene.id === 'prologue_coupe_intro'

  const sequentiallyRevealChoices = useCallback((input: VisualNovelChoiceView[]) => {
    if (input.length === 0) return input

    // Hide choices that are not yet available due to flag-gates (e.g. "Посмотреть на Отто." before others).
    // Keep already visited choices visible for feedback (✓).
    const available = input.filter((choice) => choice.isVisited || !choice.disabled)

    const nextUnvisitedIndex = available.findIndex((choice) => !choice.isVisited)
    if (nextUnvisitedIndex === -1) return available

    return available.filter((choice, index) => choice.isVisited || index === nextUnvisitedIndex)
  }, [])

  const visibleChoices = useMemo(
    () => {
      const base = isLineRevealed && !isPending && !consultation.isConsultationMode ? choices : []
      if (!applySequentialChoiceReveal) return base
      return sequentiallyRevealChoices(base)
    },
    [
      choices,
      isLineRevealed,
      isPending,
      consultation.isConsultationMode,
      applySequentialChoiceReveal,
      sequentiallyRevealChoices,
    ]
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
    setForceShowText(false)
  }, [currentLine?.id, scene.id])

  const handleChoiceSelect = useCallback(
    (choiceId: string) => {
      if (!isLineRevealed || isPending || isSceneCompleted) return
      onChoice(choiceId)
    },
    [isLineRevealed, isPending, isSceneCompleted, onChoice]
  )

  return (
    <div className="vn-chronicles relative w-screen h-screen overflow-hidden bg-[#020617]">
      {isVideoBackground ? (
        <video
          key={backgroundImage}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 scale-105"
        >
          <source src={backgroundImage} type={`video/${backgroundImage.split('.').pop()}`} />
        </video>
      ) : (
        <div className="absolute inset-0 overflow-hidden">
          <div
            key={`${backgroundImage}__${backgroundPanClass}`}
            className={cn('absolute inset-[-8%] bg-cover', backgroundPanClass)}
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundPosition }}
          />
        </div>
      )}

      <VFXOverlay />

      <CharacterSprites characters={scene.characters} activeSpeakerId={spritesActiveSpeakerId} />

      <div className="absolute top-0 left-0 w-full z-30 p-4 sm:p-6 flex flex-col sm:flex-row justify-end items-center sm:items-start pointer-events-none">
        <div className="w-full flex justify-between items-start gap-4 animate-fade-in pointer-events-auto">
          <div className="pointer-events-none select-none">
            <div className="relative h-0 w-[170px]">
              <FloatingText events={floatingEvents} />
            </div>

            <AnimatePresence initial={false}>
              {shouldShowHp && isHpHudVisible ? (
                <motion.div
                  // key restarts the keyframe animation on each hp change
                  key={`hp-hud-${hpHudPulseKey}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 4, ease: 'easeOut', times: [0, 0.12, 0.55, 1] }}
                  onAnimationComplete={() => setHpHudVisible(false)}
                  className="bg-black/40 border border-white/10 px-3 py-2 rounded-lg backdrop-blur-md w-[170px]"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-cinzel text-slate-400 block uppercase tracking-widest">
                      HP
                    </span>
                    <span className="text-[10px] font-bold text-white">
                      {Math.max(0, Math.min(maxHp!, Math.trunc(hp!)))} / {Math.max(1, Math.trunc(maxHp!))}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, (Math.max(0, Math.min(maxHp!, hp!)) / Math.max(1, maxHp!)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
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

      <div className="absolute inset-0 flex flex-col justify-end items-center z-40 pb-4">
        <div className="w-full mb-4 flex flex-col items-center">
          {showVoiceTabs ? (
            <div className="flex justify-center gap-2 sm:gap-3 animate-slide-up flex-wrap px-4">
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
          ) : null}

          {!isSceneCompleted && (
            <div className="w-full">
              {consultation.isConsultationMode && activeVoice ? (
                <div className="flex justify-center mt-4 sm:mt-8 px-4 w-full max-w-5xl mx-auto animate-fade-in">
                  <div className="flex flex-col items-center min-w-[140px]">
                    <div
                      className="bg-slate-900/70 border border-slate-200/20 shadow-[0_0_20px_rgba(0,0,0,0.35)] p-3 rounded-lg backdrop-blur-md flex flex-col items-center text-center"
                      style={{ borderLeft: `4px solid ${activeVoice.color}` }}
                    >
                      <span className="text-xs sm:text-sm font-cinzel tracking-[0.2em] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                        {activeVoice.name.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider leading-none">
                        Internal voice (lvl {skills[consultation.activeVoiceId || ''] ?? 0})
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <CharacterGroup
                  characters={scene.characters}
                  activeCharacterId={currentLine?.speakerId}
                />
              )}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {consultation.isConsultationMode && consultation.currentAdvice && activeVoice ? (
            <DialogueBox
              key={`advice-${consultation.activeVoiceId}`}
              speakerName={activeVoice.name}
              speakerTitle={`Internal voice (lvl ${skills[consultation.activeVoiceId || ''] ?? 0})`}
              text={consultation.currentAdvice.text}
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
              stageDirection={currentLine?.stageDirection}
              disabled={visibleChoices.length > 0 || isSceneCompleted}
              isPending={isPending}
              onAdvance={onAdvance}
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
