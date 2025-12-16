import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCombat } from '@/shared/hooks/useCombat'
import { cn } from '@/shared/lib/utils/cn'

// Types
interface CombatantState {
    id: string
    name: string
    rank: number
    hp: number
    maxHp: number
    morale: number
    armor: number
    activeEffects: Array<{ type: string; value: number; remainingTurns: number; source: string }>
    posture?: 'neutral' | 'aggressive' | 'defensive' | 'evasive'
}

interface ArenaBattleProps {
    onBattleEnd?: (result: 'victory' | 'defeat' | 'flee') => void
}

// ================== POSTURE INDICATOR ==================

const PostureIndicator = ({ posture }: { posture?: string }) => {
    const getPostureIcon = (p?: string) => {
        switch (p) {
            case 'aggressive': return '😤'
            case 'defensive': return '🛡️'
            case 'evasive': return '💨'
            default: return '😐'
        }
    }

    const getPostureColor = (p?: string) => {
        switch (p) {
            case 'aggressive': return 'text-red-400'
            case 'defensive': return 'text-blue-400'
            case 'evasive': return 'text-green-400'
            default: return 'text-gray-400'
        }
    }

    return (
        <div className={cn("flex items-center gap-2 font-bold", getPostureColor(posture))}>
            <span className="text-2xl">{getPostureIcon(posture)}</span>
            <span className="uppercase tracking-wider text-sm">
                {posture || 'NEUTRAL'}
            </span>
        </div>
    )
}

// ================== WEAPON STATUS ==================

const WeaponStatus = ({
    condition,
    heat,
    jamState
}: {
    condition: number
    heat: number
    jamState?: { isJammed: boolean, jamChance: number }
}) => {
    return (
        <div className="bg-black/40 p-2 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-xs text-white/70">
                <span>СОСТОЯНИЕ</span>
                <span className={condition < 50 ? 'text-red-400' : 'text-green-400'}>{condition}%</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={cn("h-full", condition < 50 ? 'bg-red-500' : 'bg-green-500')}
                    style={{ width: `${condition}%` }}
                />
            </div>

            <div className="flex justify-between items-center text-xs text-white/70">
                <span>НАГРЕВ</span>
                <span className={heat > 50 ? 'text-orange-400' : 'text-blue-400'}>{heat}%</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={cn("h-full", heat > 80 ? 'bg-red-500' : heat > 50 ? 'bg-orange-500' : 'bg-blue-500')}
                    style={{ width: `${Math.min(100, heat)}%` }}
                />
            </div>

            {jamState && (
                <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-white/50">Шанс клина:</span>
                    <span className={cn("font-bold", jamState.jamChance > 10 ? 'text-red-400' : 'text-gray-400')}>
                        {jamState.jamChance.toFixed(1)}%
                    </span>
                </div>
            )}

            {jamState?.isJammed && (
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-red-500 font-bold text-center text-sm border border-red-500 rounded px-1"
                >
                    ЗАКЛИНИЛО!
                </motion.div>
            )}
        </div>
    )
}

// ================== COMBATANT CARD ==================

const CombatantCard = ({
    combatant,
    isPlayer = false,
    isCurrentTurn = false,
    onClick
}: {
    combatant: CombatantState | { name: string; rank?: number; hp: number; maxHp: number; stamina?: number; maxStamina?: number; morale?: number; maxMorale?: number; posture?: string }
    isPlayer?: boolean
    isCurrentTurn?: boolean
    onClick?: () => void
}) => {
    const hpPercent = (combatant.hp / combatant.maxHp) * 100

    // Sprite Resolution (Temporary Mapping) - In real app this comes from DB or mapped better
    const getSprite = () => {
        if (isPlayer) return '/images/characters/player_combat.png';
        if (combatant.name === 'Rail Scorpion') return '/images/npcs/rail_scorpion.png';
        if (combatant.name === 'Scavenger Grunt') return '/images/npcs/ork.jpg';
        return '/images/placeholder_portrait.png'; // Make sure this exists or handle null
    }
    const spriteUrl = getSprite();

    return (
        <motion.div
            className={cn(
                'relative w-28 h-40 rounded-lg overflow-hidden cursor-pointer transition-all shadow-lg group',
                isPlayer ? 'border-2 border-blue-500/50' : 'border-2 border-red-500/50',
                isCurrentTurn && 'ring-2 ring-amber-400 scale-105 z-20',
                'bg-slate-900'
            )}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            {/* Background Portrait */}
            {spriteUrl && (
                <div className="absolute inset-0">
                    <img
                        src={spriteUrl}
                        alt={combatant.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                </div>
            )}

            {/* Vertical HP Bar Indicator (Left side) */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/50 overflow-hidden">
                <motion.div
                    className={cn(
                        "absolute bottom-0 left-0 right-0 w-full",
                        hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-600'
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${hpPercent}%` }}
                    transition={{ duration: 0.5, type: 'spring' }}
                />
            </div>

            {/* Posture Badge (Top Right) */}
            <div className="absolute top-1 right-1 scale-75 origin-top-right bg-black/60 rounded p-0.5 backdrop-blur-sm">
                <PostureIndicator posture={combatant.posture} />
            </div>

            {/* Name & Stats Overlay (Bottom) */}
            <div className="absolute inset-x-0 bottom-0 p-2 flex flex-col items-center">
                <div className="text-[10px] uppercase font-bold text-white/90 truncate max-w-full mb-1 leading-none shadow-black drop-shadow-md">
                    {combatant.name}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono leading-none">
                    {/* HP Text */}
                    <span className={cn(hpPercent < 30 && "text-red-400 animate-pulse font-bold")}>
                        {combatant.hp}
                    </span>

                    {/* Stamina (AP) for Player */}
                    {'stamina' in combatant && (
                        <span className="text-yellow-400 font-bold border-l border-white/20 pl-2">
                            {combatant.stamina} AP
                        </span>
                    )}
                </div>
            </div>

            {/* Active Turn Indicator (Pulse) */}
            {isCurrentTurn && (
                <div className="absolute inset-0 border-2 border-amber-400 animate-pulse rounded-lg pointer-events-none" />
            )}
        </motion.div>
    )
}

// ================== CARD HAND ==================

const CardHand = ({
    cards,
    onPlayCard,
    onHoverCard,
    currentStamina,
    currentAmmo,
    disabled,
    jammed
}: {
    cards: any[]
    onPlayCard: (cardId: string) => void
    onHoverCard?: (cardId: string | null) => void
    currentStamina: number
    currentAmmo: number
    disabled?: boolean
    jammed?: boolean
}) => {
    const [selectedCard, setSelectedCard] = useState<string | null>(null)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const isWeaponJammed = Boolean(jammed)

    // Fan calculations
    const totalCards = cards.length;
    const arcAngle = 40; // Total spread coverage
    const baseAngle = -arcAngle / 2;
    // Removed unused radius variable

    return (
        <div className="relative h-64 w-full flex justify-center items-end pointer-events-none perspective-1000 z-50">
            {/* Jammed Overlay */}
            {isWeaponJammed && (
                <div className="absolute top-0 left-0 right-0 text-center z-50 pointer-events-auto">
                    <span className="text-red-500 font-bold bg-black/80 px-4 py-1 rounded border border-red-500">WEAPON JAMMED</span>
                </div>
            )}

            <div className="relative w-[600px] h-[300px] flex justify-center items-end mb-[-80px]">
                {cards.map((card, index) => {
                    const canAfford = currentStamina >= card.cost
                    const hasAmmo = !card.ammoCost || currentAmmo >= card.ammoCost
                    const isJammedCard = card.type === 'jammed'
                    const isPlayable = (canAfford && hasAmmo && !disabled) || (isJammedCard && canAfford && !disabled)

                    // Calculate rotation
                    const angleStep = totalCards > 1 ? arcAngle / (totalCards - 1) : 0;
                    const rotation = totalCards === 1 ? 0 : baseAngle + (index * angleStep);

                    // Interaction states
                    const isHovered = hoveredIndex === index;
                    const isSelected = selectedCard === card.id;

                    // Dynamic Transform
                    const yOffset = isHovered ? -120 : isSelected ? -140 : 0;
                    const scale = isHovered || isSelected ? 1.2 : 1;
                    const zIndex = isHovered ? 50 : isSelected ? 40 : index;
                    const rotateVal = isHovered || isSelected ? 0 : rotation;

                    return (
                        <motion.div
                            key={`${card.id}-${index}`}
                            className={cn(
                                'absolute pointer-events-auto origin-bottom w-40 h-60 rounded-xl border-2 p-3 cursor-pointer transition-all duration-300 shadow-2xl',
                                'bg-gradient-to-b from-slate-800 to-slate-950',
                                isPlayable
                                    ? 'border-slate-600 hover:border-amber-400'
                                    : 'border-slate-700/50 opacity-60 grayscale',
                                isSelected && 'ring-4 ring-amber-400 border-amber-400',
                                card.type === 'jammed' && 'border-red-500 bg-red-900/20 animate-pulse'
                            )}
                            style={{
                                transformOrigin: 'center 150%', // Rotate around a point far below
                                left: '50%',
                                bottom: '50px',
                                marginLeft: '-80px', // Half width to center
                                zIndex
                            }}
                            initial={{ y: 200, opacity: 0 }}
                            animate={{
                                rotate: rotateVal,
                                y: yOffset,
                                scale: scale,
                                opacity: 1,
                                x: (index - (totalCards - 1) / 2) * 30 // Horizontal spread
                            }}
                            onMouseEnter={() => {
                                setHoveredIndex(index)
                                onHoverCard?.(card.id)
                            }}
                            onMouseLeave={() => {
                                setHoveredIndex(null)
                                onHoverCard?.(null)
                            }}
                            onClick={() => {
                                if (!isPlayable) return
                                if (selectedCard === card.id) {
                                    onPlayCard(card.id)
                                    setSelectedCard(null)
                                } else {
                                    setSelectedCard(card.id)
                                }
                            }}
                        >
                            {/* Card Type Icon (Top Right) */}
                            <div className="absolute top-2 right-2 text-xl opacity-50">
                                {card.type === 'attack' && '⚔️'}
                                {card.type === 'defense' && '🛡️'}
                                {card.type === 'posture' && '🧘'}
                                {card.type === 'heal' && '💊'}
                            </div>

                            {/* Card Image / Art Placeholder */}
                            <div className="w-full h-24 mb-2 bg-slate-900/50 rounded overflow-hidden flex items-center justify-center border border-white/5">
                                {/* Dynamic Icon based on card name/type */}
                                <span className="text-4xl filter drop-shadow-lg">
                                    {card.type === 'attack' ? '💥' : card.type === 'defense' ? '🛡️' : '✨'}
                                </span>
                            </div>

                            {/* Card Name */}
                            <div className="text-sm font-bold text-white text-center mb-1 truncate px-1">
                                {card.name}
                            </div>

                            {/* Description - expanded on hover */}
                            <div className={cn(
                                "text-[10px] text-zinc-400 text-center leading-tight overflow-hidden",
                                isHovered ? "h-auto max-h-20" : "h-8"
                            )}>
                                {card.effects?.[0]?.description || 'No description'}
                            </div>

                            {/* Cost / Stats Bar */}
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center border-t border-white/10 pt-1">
                                <div className={cn(
                                    "flex items-center gap-1 font-bold",
                                    canAfford ? "text-yellow-400" : "text-red-500"
                                )}>
                                    <span className="text-xs">⚡</span>
                                    <span>{card.cost || 0}</span>
                                </div>
                                {card.damage && (
                                    <div className="flex items-center gap-1 text-red-400 font-bold">
                                        <span className="text-xs">⚔</span>
                                        <span>{card.damage}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

// ================== BATTLE LOG ==================

const BattleLog = ({ log }: { log: any[] }) => {
    if (!log) return null;
    return (
        <div className="h-40 overflow-y-auto bg-black/60 rounded-xl p-3 text-xs space-y-2 font-mono border border-white/10">
            <AnimatePresence>
                {log.slice(-10).reverse().map((entry, i) => (
                    <motion.div
                        key={`${entry.timestamp}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            'p-2 rounded border-l-2',
                            entry.actorId === 'player' ? 'border-blue-500 bg-blue-900/20' :
                                entry.actorId === 'system' ? 'border-purple-500 bg-purple-900/20' :
                                    'border-red-500 bg-red-900/20'
                        )}
                    >
                        <div className="flex justify-between opacity-50 text-[10px] mb-1">
                            <span>TURN {entry.turn || '?'}</span>
                            <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div>
                            {/* Simplified log entry format handling */}
                            {entry.message || (
                                <>
                                    <span className="font-bold text-white">{entry.actorName}</span>{' '}
                                    <span className="text-amber-300">{entry.action}</span>
                                </>
                            )}
                        </div>
                        {entry.damage && <div className="text-red-400 font-bold">💥 -{entry.damage} HP</div>}
                        {entry.effects?.map((e: string, j: number) => (
                            <div key={j} className="text-green-400 text-[10px]"> • {e}</div>
                        ))}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

// ================== MAIN COMPONENT ==================

export function ArenaBattle({ onBattleEnd }: ArenaBattleProps) {
    const { battle, playCard, endTurn } = useCombat()

    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)

    const battleIsActive = battle?.isActive
    const battlePhase = battle?.phase

    // Handle battle end
    useEffect(() => {
        if (battleIsActive !== false) return
        if (!battlePhase) return
        const result = battlePhase as 'victory' | 'defeat' | 'flee'
        onBattleEnd?.(result)
    }, [battleIsActive, battlePhase, onBattleEnd])

    if (!battle) {
        return (
            <div className="flex items-center justify-center h-screen text-white bg-slate-950">
                <div className="animate-spin text-4xl">⚙️</div>
            </div>
        )
    }

    const isPlayerTurn = battle.phase === 'player_turn'
    const currentActor = battle.turnOrder[battle.currentActorIndex]
    const isJammed = battle.playerState.jamState?.isJammed

    // Determine highlights based on hovered/selected card
    const getHighlightedTargets = () => {
        const cardId = hoveredCardId || null; // Add logic for selected card if needed
        if (!cardId) return [];

        const card = battle.hand.find((c: any) => c.id === cardId);
        if (!card) return [];

        if (card.type === 'attack' || card.type === 'cold_steel') {
            // Highlight all enemies
            return battle.enemyStates.map((e: any) => e.id);
        }
        if (card.type === 'heal' || card.type === 'defense') {
            // Highlight player
            return ['player']; // Assuming player id is 'player' or check state
        }
        return [];
    }
    const highlightedTargets = getHighlightedTargets();

    const handlePlayCard = async (cardId: string) => {
        if (isProcessing || !isPlayerTurn) return

        const card = battle.hand.find((c: any) => c.id === cardId)

        // Auto-target for Arena (usually only 1 enemy in duel)
        if ((card?.type === 'attack' || card?.type === 'cold_steel') && !selectedTarget) {
            const firstAlive = battle.enemyStates.find((e: any) => e.hp > 0)
            if (firstAlive) setSelectedTarget(firstAlive.id)
            // Note: We continue to playCard with this target
        }

        setIsProcessing(true)
        try {
            // Use the target we just found or the one already selected
            const targetId = selectedTarget || battle.enemyStates.find((e: any) => e.hp > 0)?.id

            // If self-target card, ensure target is player
            const actualTargetId = (card?.type === 'heal' || card?.type === 'defense')
                ? 'player' // Or actual player ID
                : targetId;

            await playCard.mutateAsync({
                battleId: battle._id,
                cardId,
                targetId: actualTargetId
            })

            setSelectedTarget(null)
        } catch (error) {
            console.error('Error playing card:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleEndTurn = async () => {
        if (isProcessing || !isPlayerTurn) return

        setIsProcessing(true)
        try {
            await endTurn.mutateAsync({ battleId: battle._id })
        } catch (error) {
            console.error('Error ending turn:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col">
            {/* Top Bar & Turn Order */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-slate-950/90 to-transparent flex flex-col items-center gap-2">
                {/* Turn Order Strip */}
                <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-full border border-slate-700/50 backdrop-blur-md">
                    {battle.turnOrder.map((actorId: string, index: number) => {
                        const isCurrent = index === battle.currentActorIndex;
                        const actor = actorId === 'player'
                            ? battle.playerState
                            : battle.enemyStates.find((e: any) => e.id === actorId);

                        // Fallback if actor not found (e.g. dead enemy removed from state but not order?)
                        if (!actor) return null;

                        return (
                            <div key={`${actorId}-${index}`} className={cn(
                                "relative transition-all duration-300",
                                isCurrent ? "scale-125 mx-2 z-10" : "opacity-70 scale-90 grayscale"
                            )}>
                                <div className={cn(
                                    "w-10 h-10 rounded-full overflow-hidden border-2",
                                    actorId === 'player' ? "border-blue-400" : "border-red-400",
                                    isCurrent && "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                                )}>
                                    {/* Placeholder Avatar - replace with real getSprite later if needed or reuse logic */}
                                    <div className={cn(
                                        "w-full h-full",
                                        actorId === 'player' ? "bg-blue-900" : "bg-red-900"
                                    )}>
                                        {/* Mini sprite or icon */}
                                        <span className="flex items-center justify-center h-full text-[10px] font-bold">
                                            {actor.name.substring(0, 2)}
                                        </span>
                                    </div>
                                </div>
                                {isCurrent && (
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-400 whitespace-nowrap bg-black/80 px-2 rounded">
                                        ACTIVE
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="flex justify-between w-full max-w-7xl items-start pointer-events-none">
                    {/* Left: Branding/Turn Counter */}
                    <div className="pointer-events-auto">
                        <div className="text-xl font-bold tracking-widest text-amber-500/80">ARENA PROTOCOL</div>
                        <div className="text-xs font-mono text-slate-400">TURN {battle.turn}</div>
                    </div>

                    {/* Right: End Turn Button */}
                    <button
                        onClick={handleEndTurn}
                        disabled={!isPlayerTurn || isProcessing}
                        className={cn(
                            'pointer-events-auto px-6 py-2 rounded-full font-bold transition-all shadow-lg backdrop-blur-sm',
                            isPlayerTurn
                                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                                : 'bg-slate-800/80 text-slate-600'
                        )}
                    >
                        {isPlayerTurn ? 'ЗАВЕРШИТЬ ХОД' : 'ОЖИДАНИЕ...'}
                    </button>
                </div>
            </div>

            {/* Main Combat Area - Kinetic Tactical View */}
            <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden perspective-2000">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-slate-950 -z-30" />
                <div className="absolute inset-0 bg-[url('/images/arena_bg.png')] bg-cover bg-center opacity-40 mix-blend-overlay -z-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black -z-10" />

                {/* The Floor Plane */}
                <div
                    className="relative w-full max-w-6xl h-[600px] flex items-end justify-center gap-16 transform-style-3d rotate-x-12"
                    style={{ transform: 'perspective(1000px) rotateX(20deg) scale(0.9)' }}
                >
                    {/* Player Side (Ranks 4 -> 1) */}
                    <div className="flex-1 flex flex-col gap-2 transform-style-3d">
                        <div className="text-center text-blue-500/50 font-mono text-xs tracking-widest mb-2">ALLIED ZONES</div>
                        <div className="flex flex-row-reverse gap-4 justify-end">
                            {[4, 3, 2, 1].map(rank => {
                                const pState = battle.playerState as any;
                                const isOccupied = pState && (pState.rank === rank || (!pState.rank && rank === 2));
                                const isHighlighted = highlightedTargets.includes('player') && isOccupied; // Basic player targeting

                                return (
                                    <div
                                        key={`p-rank-${rank}`}
                                        className={cn(
                                            "relative w-32 h-96 border-b-4 border-x border-t-0 rounded-b-lg transition-all transform-style-3d group",
                                            "flex items-end justify-center pb-4",
                                            isOccupied
                                                ? "border-blue-500 bg-blue-900/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                                                : "border-slate-800 bg-slate-900/20 hover:border-blue-500/30",
                                            isHighlighted && "ring-2 ring-blue-400 bg-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.5)]"
                                        )}
                                    >
                                        {/* Rank Marker */}
                                        <div className="absolute top-2 text-center w-full text-slate-700 font-black text-6xl opacity-20 select-none group-hover:opacity-40 transition-opacity">
                                            {rank}
                                        </div>

                                        {/* Floor Grid Pattern */}
                                        <div className="absolute inset-x-0 bottom-0 h-full bg-[linear-gradient(0deg,transparent_48%,rgba(59,130,246,0.1)_50%,transparent_52%)] bg-[length:100%_20px] pointer-events-none" />

                                        {/* Occupant */}
                                        <AnimatePresence>
                                            {isOccupied && (
                                                <motion.div
                                                    layoutId="player-token"
                                                    initial={{ opacity: 0, y: -50 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="relative z-10 scale-110 origin-bottom"
                                                >
                                                    <CombatantCard
                                                        combatant={{
                                                            name: 'ОПЕРАТОР',
                                                            hp: battle.playerState.hp,
                                                            maxHp: battle.playerState.maxHp,
                                                            stamina: battle.playerState.stamina,
                                                            maxStamina: battle.playerState.maxStamina,
                                                            morale: battle.playerState.morale,
                                                            maxMorale: battle.playerState.maxMorale,
                                                            posture: battle.playerState.posture,
                                                            rank: (battle.playerState as { rank?: number }).rank
                                                        }}
                                                        isPlayer
                                                        isCurrentTurn={currentActor === 'player'} // Using ID 'player' which backend uses for client compatibility
                                                    />
                                                    {/* Weapon Status Floating Panel */}
                                                    <motion.div
                                                        className="absolute -right-48 top-10 w-44 pointer-events-none"
                                                        initial={{ x: -20, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                    >
                                                        <WeaponStatus
                                                            condition={battle.playerState.weaponCondition}
                                                            heat={battle.playerState.weaponHeat}
                                                            jamState={battle.playerState.jamState}
                                                        />
                                                    </motion.div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* VS Separator / Center Info Zone */}
                    <div className="relative w-64 h-full flex flex-col justify-end pb-8 group z-40 transform-style-3d">
                        {/* Info Panel - Shows details of hovered/selected entity or current actor */}
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 min-h-[160px] bg-slate-900/90 border border-slate-700/50 backdrop-blur-md rounded-lg p-3 text-center shadow-xl flex flex-col items-center justify-center transition-all duration-300">
                            {selectedTarget ? (
                                <>
                                    <div className="text-xs text-amber-500 font-bold mb-1">TARGET SELECTED</div>
                                    <div className="text-lg font-bold text-white mb-2">
                                        {battle.enemyStates.find((e: any) => e.id === selectedTarget)?.name || 'UNKNOWN'}
                                    </div>
                                    <div className="w-full h-px bg-white/10 mb-2" />
                                    <div className="text-xs text-slate-400">
                                        Tap card to apply effects
                                    </div>
                                </>
                            ) : (
                                <div className="text-xs text-slate-500 italic">
                                    Select a target or card...
                                </div>
                            )}
                        </div>

                        {/* Ground marker for center */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    </div>

                    {/* Enemy Side (Ranks 1 -> 4) */}
                    <div className="flex-1 flex flex-col gap-2 transform-style-3d">
                        <div className="text-center text-red-500/50 font-mono text-xs tracking-widest mb-2">HOSTILE ZONES</div>
                        <div className="flex gap-4 justify-start">
                            {[1, 2, 3, 4].map(rank => {
                                // Find enemies in this rank
                                const enemiesInRank = battle.enemyStates.filter((e: any) => (e.rank || 2) === rank);
                                const hasTarget = enemiesInRank.some((e: any) => highlightedTargets.includes(e.id));

                                return (
                                    <div
                                        key={`e-rank-${rank}`}
                                        className={cn(
                                            "relative w-32 h-96 border-b-4 border-x border-t-0 rounded-b-lg transition-all transform-style-3d group",
                                            "flex items-end justify-center pb-4",
                                            enemiesInRank.length > 0
                                                ? "border-red-500 bg-red-900/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                                                : "border-slate-800 bg-slate-900/20 hover:border-red-500/30",
                                            // Selected Target or Highlight
                                            (selectedTarget && enemiesInRank.some((e: any) => e.id === selectedTarget))
                                                ? "ring-2 ring-amber-400 bg-amber-900/20"
                                                : hasTarget
                                                    ? "ring-2 ring-red-400 bg-red-900/30 animate-pulse"
                                                    : ""
                                        )}
                                        onClick={() => {
                                            // Optional: tapping rank selects first enemy?
                                            // Better to tap enemy card directly.
                                        }}
                                    >
                                        <div className="absolute top-2 text-center w-full text-slate-700 font-black text-6xl opacity-20 select-none group-hover:opacity-40 transition-opacity">
                                            {rank}
                                        </div>

                                        {/* Floor Grid Pattern */}
                                        <div className="absolute inset-x-0 bottom-0 h-full bg-[linear-gradient(0deg,transparent_48%,rgba(239,68,68,0.1)_50%,transparent_52%)] bg-[length:100%_20px] pointer-events-none" />

                                        {/* Enemies Stacking */}
                                        <div className="relative z-10 flex flex-col items-center gap-4 -mb-4">
                                            <AnimatePresence>
                                                {enemiesInRank.map((enemy: any) => (
                                                    <motion.div
                                                        key={enemy.id}
                                                        layoutId={enemy.id}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0 }}
                                                        className={cn(
                                                            "transition-all cursor-pointer relative",
                                                            selectedTarget === enemy.id && "scale-110 z-20"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTarget(enemy.id === selectedTarget ? null : enemy.id);
                                                        }}
                                                    >
                                                        {selectedTarget === enemy.id && (
                                                            <motion.div
                                                                layoutId="target-marker"
                                                                className="absolute -top-12 left-1/2 -translate-x-1/2 text-amber-500 font-bold text-2xl animate-bounce"
                                                            >
                                                                🎯
                                                            </motion.div>
                                                        )}
                                                        <CombatantCard
                                                            combatant={enemy}
                                                            isPlayer={false}
                                                            isCurrentTurn={currentActor === enemy.id}
                                                            onClick={() => setSelectedTarget(enemy.id)}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Control Panel */}
            <div className="bg-slate-900/90 border-t border-white/10 p-4 backdrop-blur-md">
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4">
                    {/* Log */}
                    <div className="col-span-3">
                        <BattleLog log={battle.logs} />
                    </div>

                    {/* Hand */}
                    <div className="col-span-9">
                        <CardHand
                            cards={battle.hand}
                            onPlayCard={handlePlayCard}
                            onHoverCard={setHoveredCardId}
                            currentStamina={battle.playerState.stamina}
                            currentAmmo={battle.playerState.currentAmmo || 0}
                            disabled={!isPlayerTurn || isProcessing}
                            jammed={isJammed}
                        />
                    </div>
                </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {(battle.phase === 'victory' || battle.phase === 'defeat') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className={cn(
                                "text-8xl font-black mb-4 tracking-tighter",
                                battle.phase === 'victory' ? 'text-green-500' : 'text-red-600'
                            )}>
                                {battle.phase === 'victory' ? 'VICTORY' : 'DEFEATED'}
                            </div>
                            <div className="text-xl text-white/50 font-mono">
                                PROTOCOL ENDED
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ArenaBattle
