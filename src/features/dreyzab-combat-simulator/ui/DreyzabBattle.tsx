import { useCallback, useEffect, useRef, type ReactNode, memo } from 'react'
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDroppable,
} from '@dnd-kit/core'
import { Backpack, Trophy, X, Terminal, Hourglass, RefreshCw, SquareTerminal } from 'lucide-react'
import type { BattleSession } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'
import type { ScenarioId } from '@/entities/dreyzab-combat-simulator/model/scenarios'
import RankLane from './components/RankLane'
import { canPlayCard } from '@/entities/dreyzab-combat-simulator/model/utils'
import CombatCardUI from './components/CombatCardUI'
import DraggableCombatCard from './components/DraggableCombatCard'
import GaugeUI from './components/GaugeUI'
import VoiceOverlay from './components/VoiceOverlay'
import { toClampedPercent } from './components/combatUiMath'
import { useDreyzabBattle, type DreyzabBattleResult } from '../model/useDreyzabBattle'

type DreyzabBattleProps = {
    onBattleEnd?: (result: DreyzabBattleResult, finalSession?: BattleSession) => void
    side?: 'player' | 'enemy' // For future pvp?
    scenarioId?: ScenarioId
    initialSession?: BattleSession
    renderEquipmentOverlay?: (props: { onClose: () => void; title?: string }) => ReactNode
}

type BattleDropZoneProps = {
    id: string
    disabled: boolean
    data: Record<string, unknown>
    isActive: boolean
    isValid: boolean
    highlightClassName: string
    children: ReactNode
}

const BattleDropZone = memo(({ id, disabled, data, isActive, isValid, highlightClassName, children }: BattleDropZoneProps) => {
    const { setNodeRef, isOver } = useDroppable({ id, disabled, data })

    return (
        <div ref={setNodeRef} className="relative h-full">
            {children}
            {isActive && isValid && (
                <div
                    className={[
                        'absolute inset-1 rounded-xl pointer-events-none transition-all',
                        highlightClassName,
                        isOver ? 'ring-4 opacity-100' : 'ring-2 opacity-40',
                    ].join(' ')}
                />
            )}
        </div>
    )
})



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

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
            <div
                className="dreyzab-battle h-screen w-full flex flex-col arena-bg relative overflow-hidden text-xs md:text-sm select-none"
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

                {/* Turn Order Display (Original Style) */}
                <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none flex flex-col items-center">
                    <div className="flex items-start gap-1 p-1 bg-black/60 backdrop-blur-md border-x border-b border-white/10 rounded-b-2xl shadow-2xl pointer-events-auto overflow-x-auto max-w-[calc(100%-120px)] no-scrollbar">
                        {battle.turnQueue.map((id) => {
                            const unit = [...battle.players, ...battle.enemies].find((u) => u.id === id)
                            if (!unit || unit.isDead) return null
                            const isActive = battle.activeUnitId === id
                            const isPlayer = unit.side === Side.PLAYER
                            return (
                                <div key={id} className={`flex flex-col transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-40 grayscale scale-90'}`}>
                                    <div className={`relative w-9 h-9 md:w-14 md:h-14 bg-zinc-950 border-2 overflow-hidden rounded-lg shadow-xl ${isActive ? (isPlayer ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-red-600 ring-1 ring-red-600/30') : 'border-zinc-800'}`}>
                                        <img
                                            src={resolvePortrait(unit)}
                                            className="w-full h-full object-cover"
                                            alt="portrait"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-zinc-900">
                                            <div className="h-full bg-red-600" style={{ width: `${toClampedPercent(unit.resources.hp, unit.resources.maxHp)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Top HUD Controls */}
                <div className="relative z-50 pt-2 px-4 flex justify-between items-start pointer-events-none dreyzab-top-hud">
                    <div className="flex items-center gap-2 pointer-events-auto mt-2">
                        <button
                            onClick={() => setShowEquipment(true)}
                            className="p-2 bg-black/40 backdrop-blur-md border border-white/10 text-zinc-400 rounded-full hover:text-blue-400 transition-colors shadow-xl"
                            title="Equipment"
                            type="button"
                        >
                            <Backpack size={16} />
                        </button>
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 flex items-center gap-2 shadow-xl">
                            <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Round</span>
                            <span className="text-amber-500 font-mono font-black text-xs">{battle.turnCount}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pointer-events-auto mt-2">
                        <button
                            onClick={() => setShowAchievements(true)}
                            className="p-2 bg-black/40 backdrop-blur-md border border-white/10 text-zinc-400 rounded-full hover:text-amber-500 transition-colors shadow-xl"
                            type="button"
                        >
                            <Trophy size={16} />
                        </button>
                    </div>
                </div>

                {/* Battlefield */}
                <div className="flex-1 relative flex overflow-hidden pt-12 pb-28 md:pb-36 dreyzab-battlefield">

                    {/* Player Lanes */}
                    <div className="flex-1 grid grid-cols-4 h-full">
                        {[4, 3, 2, 1].map((rank) => {
                            const player = battle.players.find((p) => p.rank === rank && !p.isDead)
                            const isValidDrop = validPlayerRankDrops.has(rank)
                            return (
                                <BattleDropZone
                                    key={`p-rank-${rank}`}
                                    id={`player-rank-${rank}`}
                                    data={{ type: 'player-rank', rank }}
                                    disabled={!activeDraggedCard || !isValidDrop}
                                    isActive={!!activeDraggedCard}
                                    isValid={isValidDrop}
                                    highlightClassName={dragHighlightClassName}
                                >
                                    <RankLane
                                        combatant={player}
                                        isActive={activePlayer?.id === player?.id}
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
                    <div className="hidden lg:flex absolute bottom-4 left-4 w-64 h-40 bg-black/60 backdrop-blur-md border border-zinc-800 p-2 z-30 flex-col rounded-xl overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-1 text-[8px] text-zinc-500 mb-1 border-b border-zinc-800 font-bold uppercase pb-1">
                            <Terminal size={10} /> Logic_Stream
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] text-zinc-400 space-y-1">
                            {battle.logs.slice().reverse().map((log, i) => (
                                <div
                                    key={`${battle.turnCount}-${i}`}
                                    className={log.includes('strike') || log.includes('DMG') ? 'text-red-400' : 'text-zinc-400'}
                                >
                                    &gt; {log}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>

                {/* Bottom Interface: Floating & Transparent (Original Style) */}
                <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 z-50 flex items-end gap-1 md:gap-4 pointer-events-none">
                    {/* Left Side: Status & Portrait Cluster */}
                    <div className="flex flex-col items-start gap-1 pointer-events-auto">
                        <div className="flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl">
                            {activeUnit ? (
                                <>
                                    {/* Portrait & Action Cluster */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="relative">
                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-950/80 border border-white/20 rounded-lg overflow-hidden flex items-center justify-center grayscale opacity-90 shadow-inner">
                                                <img src={resolvePortrait(activeUnit)} alt="avatar" />
                                            </div>
                                            {/* AP Dots on the portrait corner */}
                                            {activeUnit.side === Side.PLAYER ? (
                                                <div className="absolute -top-1.5 -right-1.5 flex flex-wrap-reverse gap-0.5 justify-end max-w-[30px] z-10">
                                                    {Array.from({ length: Math.min(activeUnit.resources.ap, activeUnit.resources.maxAp) }).map((_, i) => (
                                                        <div key={`std-${i}`} className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                                    ))}
                                                    {Array.from({ length: Math.max(0, activeUnit.resources.ap - activeUnit.resources.maxAp) }).map((_, i) => (
                                                        <div key={`bonus-${i}`} className="w-2.5 h-2.5 bg-amber-500 rounded-full border border-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                        {/* End Turn (Hourglass) */}
                                        {activeUnit.side === Side.PLAYER ? (
                                            <button
                                                onClick={advanceTurn}
                                                className="w-full py-1.5 flex items-center justify-center bg-zinc-900/80 border border-white/10 hover:border-red-500 hover:bg-red-950/40 text-zinc-400 rounded-lg transition-all shadow-lg group"
                                                title="End Turn"
                                                type="button"
                                            >
                                                <Hourglass size={14} className="group-hover:animate-spin" />
                                            </button>
                                        ) : (
                                            <div className="w-full py-1.5 flex items-center justify-center bg-zinc-900/60 border border-white/5 text-zinc-500 rounded-lg shadow-lg">
                                                <Hourglass size={14} className="animate-pulse" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Vertical Indicators */}
                                    {activePlayer ? (
                                        <div className="flex flex-col gap-2 scale-90 md:scale-100 origin-left">
                                            <GaugeUI value={activePlayer.resources.hp} max={activePlayer.resources.maxHp} label="HP" color="#ef4444" />
                                            <GaugeUI value={activePlayer.resources.stamina} max={activePlayer.resources.maxStamina} label="STM" color="#3b82f6" />
                                            <GaugeUI value={activePlayer.resources.stagger} max={activePlayer.resources.maxStagger} label="STG" color="#eab308" />
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div className="p-4"><RefreshCw className="animate-spin text-zinc-600" size={24} /></div>
                            )}
                        </div>
                    </div>

                    {/* Center: Cards (Original Floating Style) */}
                    <div className="flex-1 h-32 md:h-40 flex items-end justify-center pointer-events-none mb-4">
                        <div
                            className="flex items-center justify-center card-fan pointer-events-auto py-32 -my-32"
                            onTouchStart={handleTouchScrub}
                            onTouchMove={handleTouchScrub}
                            onTouchEnd={handleTouchEnd}
                        >
                            {battle.playerHand
                                .filter(card => card.ownerId === battle.activeUnitId)
                                .map((card, i) => {
                                    // Double check (redundant given filter, but safe)
                                    if (card.ownerId !== battle.activeUnitId) return null
                                    return (
                                        <DraggableCombatCard
                                            key={card.id}
                                            card={card}
                                            disabled={!canPlayCard({ session: battle, card })}
                                            onClick={() => playCard(card)}
                                            style={{
                                                transform: `rotate(${(i - (activeHandCards.length - 1) / 2) * 5}deg) scale(1.0) translateY(${Math.abs(i - (activeHandCards.length - 1) / 2) * 2}px)`,
                                                margin: '0 -10px'
                                            }}
                                            className="cursor-grab active:cursor-grabbing hover:z-100 transition-all duration-300 hover:-translate-y-12 md:hover:-translate-y-16"
                                        />
                                    )
                                })}
                        </div>
                    </div>

                    {/* Right Side: Small Target Icon (Unobtrusive) */}
                    <div className="shrink-0 mb-4 mr-2 pointer-events-auto">
                        {selectedTargetId ? (
                            <div className="flex flex-col items-center p-1.5 bg-black/40 backdrop-blur border border-white/10 rounded-xl shadow-2xl">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-red-950/20 border border-red-500/30 rounded-lg overflow-hidden grayscale">
                                    <img
                                        src={
                                            (() => {
                                                const targetUnit = [...battle.players, ...battle.enemies].find((u) => u.id === selectedTargetId)
                                                if (targetUnit) return resolvePortrait(targetUnit)
                                                return `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedTargetId}`
                                            })()
                                        }
                                        alt="target"
                                    />
                                </div>
                                <span className="text-[6px] md:text-[8px] text-zinc-500 mt-1 uppercase font-black">
                                    {battle.enemies.find(e => e.id === selectedTargetId)?.name.split(' ')[0]}
                                </span>
                            </div>
                        ) : (
                            <div className="p-2 bg-black/40 backdrop-blur border border-white/10 rounded-xl">
                                <SquareTerminal className="text-zinc-600" size={16} />
                            </div>
                        )}
                    </div>
                </div>

                {showEquipment && renderEquipmentOverlay && (
                    renderEquipmentOverlay({
                        onClose: () => setShowEquipment(false),
                        title: activePlayer?.name
                    })
                )}

                {showAchievements && (
                    <div className="fixed inset-0 bg-black/95 z-110 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-[#1a1a15] border-2 border-zinc-800 w-full max-w-xl rounded-2xl flex flex-col max-h-[80vh] shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/40">
                                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                    <Trophy className="text-amber-500" /> Archives
                                </h2>
                                <button
                                    onClick={() => setShowAchievements(false)}
                                    className="p-1 bg-zinc-900 rounded-lg text-zinc-500"
                                    type="button"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto grid grid-cols-1 gap-2 custom-scrollbar">
                                {achievements.map((a) => (
                                    <div
                                        key={a.id}
                                        className={[
                                            'p-3 border rounded-xl flex gap-4',
                                            a.unlocked
                                                ? 'bg-amber-950/20 border-amber-900/50'
                                                : 'bg-zinc-950 border-zinc-900 opacity-40',
                                        ].join(' ')}
                                    >
                                        <span className="text-3xl">{a.icon}</span>
                                        <div>
                                            <div className="font-bold text-sm text-white">{a.title}</div>
                                            <div className="text-[10px] text-zinc-500 italic">{a.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {battle.phase === 'VICTORY' && (
                    <div className="fixed inset-0 bg-green-950/80 backdrop-blur-xl z-120 flex flex-col items-center justify-center p-8">
                        <div className="text-5xl md:text-9xl font-black text-green-500 uppercase tracking-tighter drop-shadow-2xl">
                            Victory
                        </div>
                        <button
                            onClick={resetBattle}
                            className="mt-8 px-8 py-3 bg-black border-2 border-green-600 text-green-500 font-black rounded-full hover:bg-green-600 hover:text-black transition-all"
                            type="button"
                        >
                            RE-DEPLOY
                        </button>
                    </div>
                )}

                {battle.phase === 'DEFEAT' && (
                    <div className="fixed inset-0 bg-red-950/80 backdrop-blur-xl z-120 flex flex-col items-center justify-center p-8">
                        <div className="text-5xl md:text-9xl font-black text-red-600 uppercase tracking-tighter glitch-text">
                            Lost
                        </div>
                        <button
                            onClick={resetBattle}
                            className="mt-8 px-8 py-3 bg-black border-2 border-red-600 text-red-500 font-black rounded-full hover:bg-red-600 hover:text-black transition-all"
                            type="button"
                        >
                            RESTORE LINK
                        </button>
                    </div>
                )}
            </div>

            <DragOverlay>
                {activeDraggedCard ? (
                    <CombatCardUI card={activeDraggedCard} onClick={() => { }} className="cursor-grabbing" />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
