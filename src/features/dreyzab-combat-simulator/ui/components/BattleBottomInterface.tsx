import { useMemo, type TouchEventHandler } from 'react'
import { Hourglass, RefreshCw, SquareTerminal } from 'lucide-react'
import type { BattleSession, CombatCard, Combatant } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'
import { canPlayCard } from '@/entities/dreyzab-combat-simulator/model/utils'
import DraggableCombatCard from './DraggableCombatCard'
import GaugeUI from './GaugeUI'
import type { CardActivationEvent } from '../../model/useDreyzabBattle'

type BattleBottomInterfaceProps = {
    battle: BattleSession
    activeUnit: Combatant | null
    activePlayer: Combatant | null
    activeHandCards: CombatCard[]
    selectedTargetId: string | null
    cardActivationEvents?: CardActivationEvent[]
    onPlayCard: (card: CombatCard) => void
    onAdvanceTurn: () => void
    resolvePortrait: (unit: Combatant) => string
    onTouchStart?: TouchEventHandler<HTMLDivElement>
    onTouchMove?: TouchEventHandler<HTMLDivElement>
    onTouchEnd?: TouchEventHandler<HTMLDivElement>
}

const BattleBottomInterface = ({
    battle,
    activeUnit,
    activePlayer,
    activeHandCards,
    selectedTargetId,
    cardActivationEvents = [],
    onPlayCard,
    onAdvanceTurn,
    resolvePortrait,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
}: BattleBottomInterfaceProps) => {
    const activationByCardId = useMemo(() => {
        const map = new Map<string, CardActivationEvent>()
        cardActivationEvents.forEach((event) => {
            map.set(event.cardId, event)
        })
        return map
    }, [cardActivationEvents])

    return (
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
                                        onClick={onAdvanceTurn}
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
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {activeHandCards.map((card, i) => {
                        const activationEvent = activationByCardId.get(card.id)
                        return (
                            <DraggableCombatCard
                                key={card.id}
                                card={card}
                                disabled={!canPlayCard({ session: battle, card })}
                                onClick={() => onPlayCard(card)}
                                activationToken={activationEvent?.id}
                                style={{
                                    transform: `rotate(${(i - (activeHandCards.length - 1) / 2) * 5}deg) scale(1.0) translateY(${Math.abs(i - (activeHandCards.length - 1) / 2) * 2}px)`,
                                    margin: '0 -10px',
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
    )
}

export default BattleBottomInterface
