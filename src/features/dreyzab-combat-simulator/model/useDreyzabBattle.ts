import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Achievement, BattleSession, Combatant, CombatCard, CardPlayTarget } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side, CardType } from '@/entities/dreyzab-combat-simulator/model/types'
import type { ScenarioId } from '@/entities/dreyzab-combat-simulator/model/scenarios'
import { canPlayCard } from '@/entities/dreyzab-combat-simulator/model/utils'
import type { FloatingTextEvent } from '../ui/components/FloatingText'
import { createInitialSession } from './battleCore'
import { readAchievements, writeAchievements } from './achievementStore'
import { createBattleReducer } from './createBattleReducer'
import { resolveUnitAsset } from '../lib/resolveUnitAsset'

// --- Types ---

export type DreyzabBattleResult = 'victory' | 'defeat'



type CombatEvent = FloatingTextEvent & { unitId: string }
export type VoiceEvent = { id: string; text: string; source?: string; duration?: number }
export type CardActivationEvent = {
    id: string
    cardId: string
    cardType: CardType
    sourceUnitId: string | null
    target?: CardPlayTarget
}

// --- Hook ---

type UseDreyzabBattleProps = {
    onBattleEnd?: (result: DreyzabBattleResult, finalSession?: BattleSession) => void
    scenarioId?: ScenarioId
    initialSession?: BattleSession
}

export const useDreyzabBattle = ({ onBattleEnd, scenarioId = 'default', initialSession }: UseDreyzabBattleProps) => {
    // 1. Initialize State
    const [initial] = useState(() => createInitialSession({ scenarioId, initialSession }))

    // 2. Reducer
    const reducer = useMemo(() => createBattleReducer(), [])
    const [battle, dispatch] = useReducer(reducer, initial.session)

    // 3. Local UI State
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(initial.defaultTargetId)
    const [achievements, setAchievements] = useState<Achievement[]>(() => readAchievements())
    const [showAchievements, setShowAchievements] = useState(false)
    const [showEquipment, setShowEquipment] = useState(false)
    const [combatEvents, setCombatEvents] = useState<CombatEvent[]>([])
    const [voiceEvents, setVoiceEvents] = useState<VoiceEvent[]>([])
    const [activeDragCardId, setActiveDragCardId] = useState<string | null>(null)
    const [cardActivationEvents, setCardActivationEvents] = useState<CardActivationEvent[]>([])

    // 4. Refs
    const enemyActionTimerRef = useRef<number | null>(null)
    const autoAdvanceTimerRef = useRef<number | null>(null)
    const reportedResultRef = useRef<DreyzabBattleResult | null>(null)
    const scriptedEventTriggeredRef = useRef(false)
    const cardActivationTimersRef = useRef<number[]>([])

    // 5. Actions
    const addCombatEvent = useCallback((unitId: string, text: string, type: 'damage' | 'heal' | 'miss' | 'debuff' | 'buff') => {
        const id = Math.random().toString(36).substr(2, 9)
        const color = type === 'damage' ? '#ef4444' :
            type === 'heal' ? '#10b981' :
                type === 'debuff' ? '#a855f7' :
                    type === 'buff' ? '#3b82f6' :
                        '#fbbf24'
        setCombatEvents((prev) => [...prev, { id, text, color, unitId }])
        setTimeout(() => {
            setCombatEvents((prev) => prev.filter((e) => e.id !== id))
        }, 2000)
    }, [])

    const addVoiceEvent = useCallback((text: string, source: string = 'Unknown') => {
        const id = Math.random().toString(36).substr(2, 9)
        setVoiceEvents(prev => [...prev, { id, text, source }])
        setTimeout(() => {
            setVoiceEvents(prev => prev.filter(e => e.id !== id))
        }, 4000)
    }, [])

    const addCardActivationEvent = useCallback((payload: Omit<CardActivationEvent, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9)
        setCardActivationEvents((prev) => [...prev, { id, ...payload }])
        const timer = window.setTimeout(() => {
            setCardActivationEvents((prev) => prev.filter((event) => event.id !== id))
        }, 650)
        cardActivationTimersRef.current.push(timer)
    }, [])

    const unlockAchievement = useCallback((id: string) => {
        setAchievements((prev) => {
            const achievement = prev.find((a) => a.id === id)
            if (achievement && !achievement.unlocked) {
                return prev.map((a) => (a.id === id ? { ...a, unlocked: true } : a))
            }
            return prev
        })
    }, [])

    const advanceTurn = useCallback(() => {
        // Clear timers
        if (enemyActionTimerRef.current !== null) {
            window.clearTimeout(enemyActionTimerRef.current)
            enemyActionTimerRef.current = null
        }
        if (autoAdvanceTimerRef.current !== null) {
            window.clearTimeout(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = null
        }
        if (autoAdvanceTimerRef.current !== null) {
            window.clearTimeout(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = null
        }

        // Passive Voice Logic (Turn Start)
        // If stamina is low (<30%), chance for whisper
        const activeUnits = [...battle.players, ...battle.enemies].filter(u => !u.isDead)
        const player = activeUnits.find(u => u.side === Side.PLAYER && u.id === 'p1')
        if (player) {
            if (player.resources.stamina < player.resources.maxStamina * 0.3) {
                if (Math.random() < 0.3) {
                    const whispers = ["Push harder...", "The flesh is weak.", "Ignore the pain.", "They are watching."]
                    addVoiceEvent(whispers[Math.floor(Math.random() * whispers.length)], "Inner Voice")
                }
            }
        }

        dispatch({ type: 'ADVANCE_TURN' })
    }, [battle.players, battle.enemies, addVoiceEvent])

    const playCard = useCallback((card: CombatCard, target?: CardPlayTarget) => {
        if (!canPlayCard({ session: battle, card })) return

        // Optimistic UI check for range/target is done in reducer
        dispatch({
            type: 'PLAY_CARD',
            card,
            target,
            selectedTargetId,
            onLog: (_msg) => console.log(_msg),
            onEvent: addCombatEvent,
            onUnlockObj: unlockAchievement
        })

        const activePlayer = battle.players.find((p) => p.id === battle.activeUnitId) ?? null
        let activationTarget = target

        if (!activationTarget && (card.type === CardType.ATTACK || card.type === CardType.ANALYSIS) && selectedTargetId) {
            activationTarget = { type: 'enemy', enemyId: selectedTargetId }
        }

        if (!activationTarget && card.type === CardType.MOVEMENT && activePlayer) {
            const desiredRank = Math.max(1, Math.min(4, activePlayer.rank - 1))
            activationTarget = { type: 'player-rank', rank: desiredRank }
        }

        if (!activationTarget && battle.activeUnitId && card.type !== CardType.ATTACK && card.type !== CardType.ANALYSIS) {
            activationTarget = { type: 'unit', unitId: battle.activeUnitId }
        }

        addCardActivationEvent({
            cardId: card.id,
            cardType: card.type,
            sourceUnitId: battle.activeUnitId ?? null,
            target: activationTarget,
        })

        // Hook-level side effects (Voice Cards)
        if (card.type === CardType.VOICE) {
            const voiceLines = ["Focus. Breathe.", "The noise... it stops.", "Clarity returns.", "I am in control."]
            const line = voiceLines[Math.floor(Math.random() * voiceLines.length)]
            addVoiceEvent(line, "Inner Voice")
        }
    }, [battle, selectedTargetId, addCombatEvent, unlockAchievement, addVoiceEvent, addCardActivationEvent])

    // 6. Effects

    // Scripted Event
    useEffect(() => {
        if (scenarioId !== 'boss_train_prologue') return
        if (scriptedEventTriggeredRef.current) return

        if (battle.turnCount >= 2 && battle.phase === 'ENEMY_TURN') {
            const condIdx = battle.players.findIndex(p => p.id === 'npc_cond' && !p.isDead)
            if (condIdx >= 0) {
                scriptedEventTriggeredRef.current = true
                setTimeout(() => {
                    dispatch({
                        type: 'SCRIPTED_EVENT_PROLOGUE_KILL',
                        onEvent: addCombatEvent
                    })
                }, 1500)
            }
        }
    }, [battle.turnCount, battle.phase, battle.players, scenarioId, addCombatEvent])

    // End Battle & Achievements Persistence
    useEffect(() => {
        if (!onBattleEnd) return

        if (battle.phase === 'VICTORY' && reportedResultRef.current !== 'victory') {
            reportedResultRef.current = 'victory'
            onBattleEnd('victory', battle)
        }

        if (battle.phase === 'DEFEAT' && reportedResultRef.current !== 'defeat') {
            reportedResultRef.current = 'defeat'
            onBattleEnd('defeat', battle)
        }

        if (battle.phase !== 'VICTORY' && battle.phase !== 'DEFEAT') {
            reportedResultRef.current = null
        }
    }, [battle.phase, onBattleEnd, battle])

    useEffect(() => {
        writeAchievements(achievements)
    }, [achievements])

    useEffect(() => {
        return () => {
            cardActivationTimersRef.current.forEach((timer) => window.clearTimeout(timer))
            cardActivationTimersRef.current = []
        }
    }, [])

    // Enemy AI Action
    useEffect(() => {
        if (enemyActionTimerRef.current !== null) window.clearTimeout(enemyActionTimerRef.current)

        if (battle.phase !== 'ENEMY_TURN' || !battle.activeUnitId) return
        const activeUnit = [...battle.players, ...battle.enemies].find((u) => u.id === battle.activeUnitId)
        if (!activeUnit || activeUnit.side !== Side.ENEMY || activeUnit.isDead) return

        enemyActionTimerRef.current = window.setTimeout(() => {
            dispatch({
                type: 'ENEMY_ACTION',
                enemyId: activeUnit.id,
                onLog: () => { },
                onEvent: addCombatEvent
            })
            // Auto advance after enemy move
            if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = window.setTimeout(() => {
                advanceTurn()
            }, 500)
        }, 1000)

        return () => {
            if (enemyActionTimerRef.current !== null) window.clearTimeout(enemyActionTimerRef.current)
        }
    }, [battle.activeUnitId, battle.phase, battle.players, battle.enemies, addCombatEvent, advanceTurn])

    // Auto Advance Player Turn
    const activeHandCards = useMemo(
        () => battle.playerHand.filter((card) => card.ownerId === battle.activeUnitId),
        [battle.activeUnitId, battle.playerHand]
    )

    useEffect(() => {
        if (battle.phase !== 'PLAYER_TURN') return

        const activePlayer = battle.players.find((p) => p.id === battle.activeUnitId)
        if (!activePlayer || activePlayer.isDead) return
        if (battle.enemies.every((e) => e.isDead)) return

        const hasPlayableCard = activeHandCards.some((card) => canPlayCard({ session: battle, card }))
        const shouldAutoAdvance = activePlayer.resources.ap <= 0 || !hasPlayableCard
        if (!shouldAutoAdvance) return

        if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current)
        autoAdvanceTimerRef.current = window.setTimeout(() => {
            advanceTurn()
        }, 800)

        return () => {
            if (autoAdvanceTimerRef.current !== null) {
                window.clearTimeout(autoAdvanceTimerRef.current)
                autoAdvanceTimerRef.current = null
            }
        }
    }, [battle, activeHandCards, advanceTurn])

    // 7. Drag Logic Handlers
    const activeDraggedCard = useMemo(() => {
        if (!activeDragCardId) return null
        return battle.playerHand.find((c) => c.id === activeDragCardId) ?? null
    }, [activeDragCardId, battle.playerHand])

    const dragHighlightClassName = useMemo(() => {
        if (!activeDraggedCard) return ''
        switch (activeDraggedCard.type) {
            case CardType.ATTACK: return 'ring-red-500/60 bg-red-950/10'
            case CardType.MOVEMENT: return 'ring-blue-500/60 bg-blue-950/10'
            case CardType.DEFENSE: return 'ring-emerald-500/60 bg-emerald-950/10'
            case CardType.VOICE: return 'ring-amber-500/60 bg-amber-950/10'
            case CardType.ANALYSIS: return 'ring-purple-500/60 bg-purple-950/10'
            default: return ''
        }
    }, [activeDraggedCard])

    const activePlayer = useMemo(() => {
        if (!battle.activeUnitId) return null
        return battle.players.find(p => p.id === battle.activeUnitId) ?? null
    }, [battle.activeUnitId, battle.players])

    const validEnemyDropIds = useMemo(() => {
        const ids = new Set<string>()
        if (!activeDraggedCard || !activePlayer) return ids
        if (activeDraggedCard.type !== CardType.ATTACK && activeDraggedCard.type !== CardType.ANALYSIS) return ids

        for (const enemy of battle.enemies) {
            if (enemy.isDead) continue
            const dist = Math.abs(enemy.rank + activePlayer.rank - 1)
            if (activeDraggedCard.optimalRange.length === 0 || activeDraggedCard.optimalRange.includes(dist)) {
                ids.add(enemy.id)
            }
        }
        return ids
    }, [activeDraggedCard, activePlayer, battle.enemies])

    const validPlayerRankDrops = useMemo(() => {
        const ranks = new Set<number>()
        if (!activeDraggedCard || !activePlayer) return ranks

        if (activeDraggedCard.targetAllies) {
            // Allow dropping on any rank with an ally (or empty if it's a move? No, targeting implies unit)
            // For now, let's enable all occupied ranks primarily.
            // Actually, usually we can target any ally.
            battle.players.forEach(p => {
                if (!p.isDead) ranks.add(p.rank)
            })
            // Also add self rank explicitly if not already
            ranks.add(activePlayer.rank)
        } else if (activeDraggedCard.type === CardType.MOVEMENT) {
            if (activePlayer.rank > 1) ranks.add(activePlayer.rank - 1)
            if (activePlayer.rank < 4) ranks.add(activePlayer.rank + 1)
        } else if (activeDraggedCard.type === CardType.VOICE || activeDraggedCard.type === CardType.DEFENSE) {
            ranks.add(activePlayer.rank)
        }
        return ranks
    }, [activeDraggedCard, activePlayer, battle.players])

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveDragCardId(event.active.id as string)
    }, [])

    const handleDragCancel = useCallback(() => {
        setActiveDragCardId(null)
    }, [])

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event
            setActiveDragCardId(null)

            if (!over) return
            const cardFromData = active.data.current?.card as CombatCard | undefined
            const card =
                cardFromData ??
                battle.playerHand.find((c) => c.id === String(active.id)) ??
                null

            if (!card) {
                console.warn('[Battle] DragEnd: missing card payload', {
                    activeId: String(active.id),
                    overId: String(over.id),
                    hasActiveData: Boolean(active.data?.current),
                })
                return
            }

            if (over.data.current?.type === 'enemy') {
                const enemyId = over.data.current.enemyId as string | undefined
                if (!enemyId) return
                setSelectedTargetId(enemyId)
                playCard(card, { type: 'enemy', enemyId })
                return
            }

            if (over.data.current?.type === 'player-rank') {
                const rank = over.data.current.rank as number | undefined
                const unitId = over.data.current.unitId as string | undefined

                if (typeof rank !== 'number') return

                // Priority: Unit Target if available and supported by card
                if (unitId && (card.targetAllies || card.type === CardType.VOICE)) {
                    playCard(card, { type: 'unit', unitId })
                } else {
                    playCard(card, { type: 'player-rank', rank })
                }
            }
        },
        [battle.playerHand, playCard]
    )

    const resetBattle = useCallback(() => {
        const next = createInitialSession({ scenarioId, initialSession })
        dispatch({ type: 'SET_SESSION', session: next.session })
        setSelectedTargetId(next.defaultTargetId)
        setShowAchievements(false)
        reportedResultRef.current = null
    }, [scenarioId, initialSession])

    // 8. Portrait Logic
    const resolvePortrait = useCallback((unit: Combatant): string => resolveUnitAsset(unit, 'portrait'), [])

    return {
        // State
        battle,
        achievements,
        showAchievements,
        setShowAchievements,
        showEquipment,
        setShowEquipment,
        combatEvents,
        voiceEvents,
        cardActivationEvents,
        selectedTargetId,
        setSelectedTargetId,
        activeDragCardId,
        activeDraggedCard,
        dragHighlightClassName,
        validEnemyDropIds,
        validPlayerRankDrops,
        activeHandCards,
        activePlayer,

        // Actions
        playCard,
        advanceTurn,
        handleDragStart,
        handleDragCancel,
        handleDragEnd,
        resetBattle,
        resolvePortrait,
        activeUnit: [...battle.players, ...battle.enemies].find(u => u.id === battle.activeUnitId) ?? null
    }
}
