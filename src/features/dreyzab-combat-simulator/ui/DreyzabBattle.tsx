import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import type { BattleSession } from '@/entities/dreyzab-combat-simulator/model/types'
import type { ScenarioId } from '@/entities/dreyzab-combat-simulator/model/scenarios'
import AchievementsOverlay from './components/AchievementsOverlay'
import BattleBottomInterface from './components/BattleBottomInterface'
import BattleHUD from './components/BattleHUD'
import BattleResultOverlay from './components/BattleResultOverlay'
import TurnOrderDisplay from './components/TurnOrderDisplay'
import RankLane from './components/RankLane'
import CombatCardUI from './components/CombatCardUI'
import VoiceOverlay from './components/VoiceOverlay'
import BattleDropZone from './components/BattleDropZone'
import CombatLogPanel from './components/CombatLogPanel'
import { useDreyzabBattle, type DreyzabBattleResult, type CardActivationEvent } from '../model/useDreyzabBattle'
import { playCombatSound } from './combatSound'
import { getCardFxColors } from './combatFx'

type DreyzabBattleProps = {
    onBattleEnd?: (result: DreyzabBattleResult, finalSession?: BattleSession) => void
    side?: 'player' | 'enemy' // For future pvp?
    scenarioId?: ScenarioId
    initialSession?: BattleSession
    renderEquipmentOverlay?: (props: { onClose: () => void; title?: string }) => ReactNode
}



// Battle component
export default function DreyzabBattle({ onBattleEnd, scenarioId = 'default', initialSession, renderEquipmentOverlay }: DreyzabBattleProps) {
    const {
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

        activeDraggedCard,
        dragHighlightClassName,
        validEnemyDropIds,
        validPlayerRankDrops,
        activeHandCards,
        activePlayer,
        activeUnit,
        playCard,
        advanceTurn,
        handleDragStart,
        handleDragCancel,
        handleDragEnd,
        resetBattle,
        resolvePortrait
    } = useDreyzabBattle({ onBattleEnd, scenarioId, initialSession })

    const logEndRef = useRef<HTMLDivElement>(null)

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        })
    )

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })

        // Sound Triggers based on log content (heuristic)
        const lastLog = battle.logs[battle.logs.length - 1]
        if (!lastLog) return

        if (lastLog.includes('DMG')) {
            playCombatSound('hit')
        } else if (lastLog.includes('dodges')) {
            playCombatSound('evade')
        } else if (lastLog.includes('stabilizes')) {
            playCombatSound('heal')
        } else if (lastLog.includes('CLICK')) {
            playCombatSound('block')
        }
    }, [battle.logs])

    // Screen Shake state
    const [shake, setShake] = useState(false)
    useEffect(() => {
        const lastLog = battle.logs[battle.logs.length - 1]
        if (lastLog && lastLog.includes('DMG')) {
            setShake(true)
            const t = setTimeout(() => setShake(false), 300)
            return () => clearTimeout(t)
        }
    }, [battle.logs])

    const handleTouchScrub = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0]
        const { clientX, clientY } = touch

        // Расширенный поиск: проверяем не только точку касания, но и область над/под ней
        // Это позволяет легче выбирать карты, не удерживая палец точно на них
        const verticalOffsets = [0, -20, 20, -40, 40, -60, 60, -100, 100]
        let foundId: string | null = null

        for (const offset of verticalOffsets) {
            const el = document.elementFromPoint(clientX, clientY + offset)
            const cardEl = el?.closest('[data-card-id]')
            if (cardEl) {
                foundId = cardEl.getAttribute('data-card-id')
                break
            }
        }

        if (foundId) {
            return
        } else {
            // Если мы всё еще в горизонтальной зоне карт, но выше/ниже допустимого,
            // можно не сбрасывать выделение сразу для плавности (опционально)
            return
        }
    }, [])

    const handleTouchEnd = useCallback(() => {
    }, [])

    const cardActivationMaps = useMemo(() => {
        const byEnemyId = new Map<string, CardActivationEvent>()
        const byUnitId = new Map<string, CardActivationEvent>()
        const byRank = new Map<number, CardActivationEvent>()

        cardActivationEvents.forEach((event) => {
            if (event.target?.type === 'enemy') {
                byEnemyId.set(event.target.enemyId, event)
            } else if (event.target?.type === 'unit') {
                byUnitId.set(event.target.unitId, event)
            } else if (event.target?.type === 'player-rank') {
                byRank.set(event.target.rank, event)
            }
        })

        return { byEnemyId, byUnitId, byRank }
    }, [cardActivationEvents])

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
            <div
                className={`dreyzab-battle h-screen w-full flex flex-col arena-bg relative overflow-hidden text-xs md:text-sm select-none ${shake ? 'animate-shake' : ''}`}
            >
                {/* Critical Vignette Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-[60] transition-opacity duration-500"
                    style={{
                        opacity: activePlayer ? Math.max(0, 1 - (activePlayer.resources.hp / activePlayer.resources.maxHp) * 2.5) : 0,
                        background: 'radial-gradient(circle, transparent 40%, rgba(220, 38, 38, 0.4) 100%)',
                        mixBlendMode: 'multiply'
                    }}
                >
                    <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay animate-pulse" />
                </div>

                {/* Voice Overlay */}
                <VoiceOverlay events={voiceEvents} />

                <TurnOrderDisplay
                    turnQueue={battle.turnQueue}
                    players={battle.players}
                    enemies={battle.enemies}
                    activeUnitId={battle.activeUnitId}
                    resolvePortrait={resolvePortrait}
                />

                <BattleHUD
                    turnCount={battle.turnCount}
                    onShowEquipment={() => setShowEquipment(true)}
                    onShowAchievements={() => setShowAchievements(true)}
                />

                {/* Battlefield */}
                <div className="flex-1 relative flex overflow-hidden pt-12 pb-28 md:pb-36 dreyzab-battlefield">

                    {/* Player Lanes */}
                    <div className="flex-1 grid grid-cols-4 h-full">
                        {[4, 3, 2, 1].map((rank) => {
                            const player = battle.players.find((p) => p.rank === rank && !p.isDead)
                            const isValidDrop = validPlayerRankDrops.has(rank)
                            const laneEvent =
                                (player ? cardActivationMaps.byUnitId.get(player.id) : undefined) ??
                                cardActivationMaps.byRank.get(rank)
                            return (
                                <BattleDropZone
                                    key={`p-rank-${rank}`}
                                    id={`player-rank-${rank}`}
                                    data={{ type: 'player-rank', rank, unitId: player?.id }}
                                    disabled={!activeDraggedCard || !isValidDrop}
                                    isActive={!!activeDraggedCard}
                                    isValid={isValidDrop}
                                    highlightClassName={dragHighlightClassName}
                                >
                                    <RankLane
                                        combatant={player}
                                        isActive={activePlayer?.id === player?.id}
                                        activationPulse={
                                            laneEvent
                                                ? { id: laneEvent.id, color: getCardFxColors(laneEvent.cardType).glow }
                                                : undefined
                                        }
                                        events={combatEvents.filter((e) => e.unitId === player?.id)}
                                    />
                                </BattleDropZone>
                            )
                        })}
                    </div>

                    <div className="w-0 md:w-16 h-full shrink-0 relative">
                    </div>

                    {/* Enemy Lanes */}
                    <div className="flex-1 grid grid-cols-4 h-full">
                        {[1, 2, 3, 4].map((rank) => {
                            const enemyInRank = battle.enemies.find((e) => e.rank === rank && !e.isDead)
                            const isValidDrop = enemyInRank ? validEnemyDropIds.has(enemyInRank.id) : false
                            const laneEvent = enemyInRank
                                ? cardActivationMaps.byEnemyId.get(enemyInRank.id) ?? cardActivationMaps.byUnitId.get(enemyInRank.id)
                                : undefined
                            return (
                                <BattleDropZone
                                    key={`e-rank-${rank}`}
                                    id={`enemy-rank-${rank}`}
                                    data={{ type: 'enemy', enemyId: enemyInRank?.id ?? null }}
                                    disabled={!activeDraggedCard || !isValidDrop}
                                    isActive={!!activeDraggedCard}
                                    isValid={isValidDrop}
                                    highlightClassName={dragHighlightClassName}
                                >
                                    <RankLane
                                        combatant={enemyInRank}
                                        isTargeted={selectedTargetId === enemyInRank?.id}
                                        isActive={battle.activeUnitId === enemyInRank?.id}
                                        activationPulse={
                                            laneEvent
                                                ? { id: laneEvent.id, color: getCardFxColors(laneEvent.cardType).glow }
                                                : undefined
                                        }
                                        onTarget={() => {
                                            if (enemyInRank) setSelectedTargetId(enemyInRank.id)
                                        }}
                                        events={combatEvents.filter((e) => e.unitId === enemyInRank?.id)}
                                    />
                                </BattleDropZone>
                            )
                        })}
                    </div>

                    {/* Combat Log Panel */}
                    <CombatLogPanel logs={battle.logs} turnCount={battle.turnCount} />
                </div>

                <BattleBottomInterface
                    battle={battle}
                    activeUnit={activeUnit}
                    activePlayer={activePlayer}
                    activeHandCards={activeHandCards}
                    selectedTargetId={selectedTargetId}
                    cardActivationEvents={cardActivationEvents}
                    onPlayCard={playCard}
                    onAdvanceTurn={advanceTurn}
                    resolvePortrait={resolvePortrait}
                    onTouchStart={handleTouchScrub}
                    onTouchMove={handleTouchScrub}
                    onTouchEnd={handleTouchEnd}
                />

                {showEquipment && renderEquipmentOverlay && (
                    renderEquipmentOverlay({
                        onClose: () => setShowEquipment(false),
                        title: activePlayer?.name
                    })
                )}

                {showAchievements && (
                    <AchievementsOverlay
                        achievements={achievements}
                        onClose={() => setShowAchievements(false)}
                    />
                )}

                <BattleResultOverlay phase={battle.phase} onReset={resetBattle} />
            </div>

            <DragOverlay>
                {activeDraggedCard ? (
                    <CombatCardUI card={activeDraggedCard} onClick={() => { }} className="cursor-grabbing" />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
