import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  CharacterGroup,
  CharacterSprites,
  ChoicePanel,
  DialogueBox,
  VFXOverlay,
} from '@/entities/visual-novel/ui'
import {
  FloatingText,
  type FloatingTextEvent,
} from '@/features/dreyzab-combat-simulator'
import { cn } from '@/shared/lib/utils/cn'
import type { CheckParticipant, SkillCheckResult } from '@/shared/lib/skillChecks'
import { performSkillCheck } from '@/shared/lib/skillChecks'
import type {
  VisualNovelChoiceView,
  VisualNovelLine,
  VisualNovelSceneDefinition,
} from '@/shared/types/visualNovel'
import { STARTING_VOICE_LEVELS, type VoiceId } from '@/shared/types/parliament'
import { getVoiceDefinition, useConsultationMode } from '@/features/visual-novel/consultation'
import { Routes } from '@/shared/lib/utils/navigation'

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
  onChoice: (choiceId: string, options?: { skillCheck?: { success: boolean } }) => void
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

type SkillCheckOverlayState = {
  id: string
  choiceId: string
  voiceId: VoiceId
  label?: string
  rawDifficulty: number
  dc: number
  skillLevel: number
  stage: 'rolling' | 'result'
  result: SkillCheckResult
  successText?: string
  failureText?: string
}

type ChoiceSkillCheck = NonNullable<NonNullable<VisualNovelChoiceView['requirements']>['skillCheck']>

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
  const navigate = useNavigate()
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
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [skillCheckOverlay, setSkillCheckOverlay] = useState<SkillCheckOverlayState | null>(null)
  const activeSkillCheckIdRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)
  const shakeControls = useAnimationControls()
  const [screenFlash, setScreenFlash] = useState<null | { id: string; kind: 'damage' | 'heal' }>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

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
      const delta = hp - prevHp
      setPrevHp(hp)
      setHpHudPulseKey((k) => k + 1)
      setHpHudVisible(true)

      if (Number.isFinite(delta) && delta !== 0) {
        const id = `vn_hpfx_${Date.now()}_${Math.random().toString(16).slice(2)}`

        if (delta < 0) {
          setScreenFlash({ id, kind: 'damage' })
          shakeControls
            .start({
              x: [0, -8, 8, -6, 6, 0],
              y: [0, 2, -2, 1, -1, 0],
              transition: { duration: 0.35, ease: 'easeOut' },
            })
            .catch(() => { })
        } else {
          setScreenFlash({ id, kind: 'heal' })
        }
      }
    }
  }, [hp, prevHp, shakeControls, shouldShowHp])

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

  const skillCheckVoice = useMemo(() => {
    if (!skillCheckOverlay) return null
    return getVoiceDefinition(skillCheckOverlay.voiceId)
  }, [skillCheckOverlay])

  const runSkillCheck = useCallback(
    async (choice: VisualNovelChoiceView, check: ChoiceSkillCheck) => {
      if (activeSkillCheckIdRef.current) return

      const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
      const normalizeDc = (rawDifficulty: number) => {
        const raw = Number(rawDifficulty)
        if (!Number.isFinite(raw) || raw <= 0) return 50
        if (raw <= 20) return clamp(Math.round(raw * 5), 5, 95)
        return clamp(Math.round(raw), 5, 95)
      }

      const dc =
        typeof check.dc === 'number' && Number.isFinite(check.dc) ? clamp(Math.round(check.dc), 5, 95) : normalizeDc(check.difficulty)

      const rawSkill = (skills as any)?.[check.skill]
      const skillValue = typeof rawSkill === 'number' && Number.isFinite(rawSkill) ? rawSkill : Number(rawSkill)
      const skillLevel = Number.isFinite(skillValue) ? Math.round(skillValue) : 0

      const base = STARTING_VOICE_LEVELS[check.skill] ?? 0
      const leader: CheckParticipant = {
        id: 'vn_player',
        name: 'Player',
        voiceLevels: {
          [check.skill]: skillLevel - base,
        },
      }

      const result = performSkillCheck(leader, [], check.skill, dc)

      const overlayId = `vn_check_${Date.now()}_${Math.random().toString(16).slice(2)}`
      activeSkillCheckIdRef.current = overlayId

      setSkillCheckOverlay({
        id: overlayId,
        choiceId: choice.id,
        voiceId: check.skill,
        label: check.label,
        rawDifficulty: check.difficulty,
        dc,
        skillLevel,
        stage: 'rolling',
        result,
        successText: check.successText,
        failureText: check.failureText,
      })

      const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

      await delay(650)
      if (!isMountedRef.current || activeSkillCheckIdRef.current !== overlayId) return
      setSkillCheckOverlay((prev) => (prev && prev.id === overlayId ? { ...prev, stage: 'result' } : prev))

      await delay(850)
      if (!isMountedRef.current || activeSkillCheckIdRef.current !== overlayId) return

      setSkillCheckOverlay(null)
      activeSkillCheckIdRef.current = null

      onChoice(choice.id, { skillCheck: { success: result.success } })
    },
    [onChoice, skills]
  )

  const handleChoiceSelect = useCallback(
    (choiceId: string) => {
      if (!isLineRevealed || isPending || isSceneCompleted) return
      if (skillCheckOverlay) return

      const selected = visibleChoices.find((choice) => choice.id === choiceId)
      if (!selected || selected.disabled) return

      const check = selected.requirements?.skillCheck as ChoiceSkillCheck | undefined
      if (check) {
        runSkillCheck(selected, check).catch((error) => {
          console.error('[VN] skill check failed', error)
          activeSkillCheckIdRef.current = null
          setSkillCheckOverlay(null)
        })
        return
      }

      onChoice(choiceId)
    },
    [isLineRevealed, isPending, isSceneCompleted, onChoice, runSkillCheck, skillCheckOverlay, visibleChoices]
  )

  return (
    <motion.div
      className="vn-chronicles relative w-screen h-screen overflow-hidden bg-[#020617]"
      animate={shakeControls}
    >
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

      <AnimatePresence>
        {screenFlash ? (
          <motion.div
            key={screenFlash.id}
            className="absolute inset-0 pointer-events-none z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, screenFlash.kind === 'damage' ? 0.55 : 0.35, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: screenFlash.kind === 'damage' ? 0.45 : 0.35, ease: 'easeOut', times: [0, 0.22, 1] }}
            style={{
              background:
                screenFlash.kind === 'damage'
                  ? 'radial-gradient(circle at 50% 70%, rgba(239, 68, 68, 0.35), rgba(239, 68, 68, 0.08) 55%, rgba(0,0,0,0) 75%)'
                  : 'radial-gradient(circle at 50% 70%, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.06) 55%, rgba(0,0,0,0) 75%)',
            }}
            onAnimationComplete={() => {
              setScreenFlash((prev) => (prev?.id === screenFlash.id ? null : prev))
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {skillCheckOverlay ? (
          <motion.div
            key={skillCheckOverlay.id}
            className="absolute inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
            <motion.div
              className="relative w-full max-w-md rounded-2xl border border-white/15 bg-slate-950/80 backdrop-blur-xl shadow-2xl p-5"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
                    Проверка
                  </div>
                  <div className="mt-1 font-cinzel text-lg text-white">
                    {skillCheckVoice?.name ?? skillCheckOverlay.voiceId.toUpperCase()}
                  </div>
                  <div className="mt-1 text-xs text-slate-300">
                    DC {skillCheckOverlay.dc} • Навык {skillCheckOverlay.skillLevel}
                  </div>
                </div>
                <div
                  className="px-2 py-1 rounded-lg border border-white/10 text-[10px] uppercase tracking-widest text-slate-300"
                  style={
                    skillCheckVoice?.color
                      ? { borderColor: `${skillCheckVoice.color}55`, color: skillCheckVoice.color }
                      : undefined
                  }
                >
                  {skillCheckOverlay.voiceId.toUpperCase()}
                </div>
              </div>

              {skillCheckOverlay.label && (
                <div className="mt-2 text-[11px] text-slate-400">{skillCheckOverlay.label}</div>
              )}

              <div className="mt-4">
                <AnimatePresence mode="wait" initial={false}>
                  {skillCheckOverlay.stage === 'rolling' ? (
                    <motion.div
                      key="rolling"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center gap-3 py-6"
                    >
                      <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-cyan-400 animate-spin" />
                      <div className="text-sm text-slate-200 font-bold">Бросок...</div>
                      <div className="text-[11px] text-slate-400">Секунда.</div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center gap-3 py-4 text-center"
                    >
                      <div
                        className={cn(
                          'inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold shadow-xl',
                          skillCheckOverlay.result.success
                            ? skillCheckOverlay.result.isCritical
                              ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white'
                              : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                            : skillCheckOverlay.result.isCritical
                              ? 'bg-gradient-to-br from-rose-600 to-red-700 text-white'
                              : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
                        )}
                      >
                        {skillCheckOverlay.result.roll}
                      </div>

                      <div
                        className={cn(
                          'text-xl font-bold',
                          skillCheckOverlay.result.success ? 'text-emerald-300' : 'text-rose-300'
                        )}
                      >
                        {skillCheckOverlay.result.isCritical ? 'КРИТ. ' : ''}
                        {skillCheckOverlay.result.success ? 'УСПЕХ' : 'ПРОВАЛ'}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Бросок {skillCheckOverlay.result.roll} • Эфф. {skillCheckOverlay.result.effectiveSkill} • DC{' '}
                        {skillCheckOverlay.result.effectiveDC}
                      </div>

                      {(skillCheckOverlay.result.success ? skillCheckOverlay.successText : skillCheckOverlay.failureText) && (
                        <div className="mt-1 text-sm text-slate-100 leading-snug">
                          {skillCheckOverlay.result.success ? skillCheckOverlay.successText : skillCheckOverlay.failureText}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
              onRevealComplete={() => { }}
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
              onOpenMenu={() => setMenuOpen((v) => !v)}
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

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            className="absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
            <motion.div
              className="absolute bottom-6 right-6 w-[260px] rounded-2xl border border-white/15 bg-slate-950/80 backdrop-blur-xl shadow-2xl p-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400 px-2 py-1">
                Меню
              </div>
              <div className="grid gap-2 mt-2">
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left text-sm text-white transition"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate(Routes.HOME)
                  }}
                >
                  Домой
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left text-sm text-white transition"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate(Routes.MAP)
                  }}
                >
                  На карту
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-xl border border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/15 text-left text-sm text-rose-100 transition"
                  onClick={() => {
                    setMenuOpen(false)
                    onExit()
                  }}
                >
                  Выйти
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 text-left text-sm text-slate-200 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

export default VNScreen
