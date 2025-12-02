/**
 * =====================================================
 * ARENA BATTLE - Zero-Range Combat UI
 * Kinetic Layer Visual Component (Arena Mode)
 * =====================================================
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/shared/api/convex'
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

interface PlayerState {
    hp: number
    maxHp: number
    morale: number
    maxMorale: number
    stamina: number
    maxStamina: number
    exhaustionLevel: 'none' | 'winded' | 'exhausted' | 'collapsed'
    currentAmmo: number
    weaponCondition: number
    weaponHeat: number
    activeEffects: Array<{ type: string; value: number; remainingTurns: number; source: string }>
    posture?: 'neutral' | 'aggressive' | 'defensive' | 'evasive'
    jamState?: {
        isJammed: boolean
        jamChance: number
        accumulatedHeat: number
    }
}

interface ArenaBattleProps {
    sessionId: string
    deviceId: string
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

// ================== COMBATANT CARD (ARENA) ==================

const CombatantCard = ({
    combatant,
    isPlayer = false,
    isCurrentTurn = false,
    onClick
}: {
    combatant: CombatantState | { name: string; hp: number; maxHp: number; stamina?: number; maxStamina?: number; morale?: number; maxMorale?: number; posture?: string }
    isPlayer?: boolean
    isCurrentTurn?: boolean
    onClick?: () => void
}) => {
    const hpPercent = (combatant.hp / combatant.maxHp) * 100

    return (
        <motion.div
            className={cn(
                'relative p-4 rounded-xl border-2 cursor-pointer transition-all w-64',
                isPlayer
                    ? 'bg-gradient-to-br from-blue-900/80 to-blue-800/60 border-blue-400/50'
                    : 'bg-gradient-to-br from-red-900/80 to-red-800/60 border-red-400/50',
                isCurrentTurn && 'ring-4 ring-yellow-400 shadow-xl shadow-yellow-400/30 scale-105 z-10'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            {/* Posture Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded-full border border-white/20 shadow-lg">
                <PostureIndicator posture={combatant.posture} />
            </div>

            {/* Name */}
            <div className="text-lg font-bold text-white mb-4 mt-2 text-center truncate">
                {combatant.name}
            </div>

            {/* HP Bar */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-red-300 font-bold">HP</span>
                    <div className="flex-1 h-4 bg-black/50 rounded-full overflow-hidden border border-white/10">
                        <motion.div
                            className={cn(
                                'h-full rounded-full',
                                hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${hpPercent}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
                <div className="text-right text-xs text-white/70 font-mono">{combatant.hp}/{combatant.maxHp}</div>

                {/* Stamina Bar (Player only) */}
                {'stamina' in combatant && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-yellow-300 font-bold">ST</span>
                        <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-yellow-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(combatant.stamina! / combatant.maxStamina!) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Current Turn Indicator */}
            {isCurrentTurn && (
                <motion.div
                    className="absolute -right-3 top-1/2 -translate-y-1/2 text-4xl filter drop-shadow-lg"
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                >
                    👈
                </motion.div>
            )}
        </motion.div>
    )
}

// ================== CARD HAND (ARENA) ==================

const CardHand = ({
    cards,
    onPlayCard,
    currentStamina,
    currentAmmo,
    disabled,
    jammed
}: {
    cards: any[]
    onPlayCard: (cardId: string) => void
    currentStamina: number
    currentAmmo: number
    disabled?: boolean
    jammed?: boolean
}) => {
    const [selectedCard, setSelectedCard] = useState<string | null>(null)

    return (
        <div className="flex gap-2 justify-center flex-wrap p-4 perspective-1000">
            {cards.map((card, index) => {
                const canAfford = currentStamina >= card.staminaCost
                const hasAmmo = !card.ammoCost || currentAmmo >= card.ammoCost
                const isJammedCard = card.type === 'jammed'
                const isPlayable = (canAfford && hasAmmo && !disabled) || (isJammedCard && canAfford && !disabled)

                return (
                    <motion.div
                        key={card.id}
                        className={cn(
                            'relative w-32 h-48 rounded-xl border-2 p-3 cursor-pointer transition-all shadow-xl',
                            'bg-gradient-to-b from-slate-800 to-slate-950',
                            isPlayable
                                ? 'border-amber-400/50 hover:border-amber-400 hover:shadow-amber-400/20'
                                : 'border-slate-600/50 opacity-50 grayscale',
                            selectedCard === card.id && 'ring-4 ring-amber-400 scale-110 z-20',
                            card.type === 'posture' && 'border-purple-400/50 bg-purple-900/20',
                            card.type === 'jammed' && 'border-red-500 bg-red-900/20 animate-pulse'
                        )}
                        initial={{ opacity: 0, y: 100, rotateX: 20 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        whileHover={isPlayable ? { y: -30, scale: 1.1, rotateX: 0 } : {}}
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
                        {/* Card Type Icon */}
                        <div className="text-4xl text-center mb-2 filter drop-shadow-md">
                            {card.type === 'attack' && '⚔️'}
                            {card.type === 'defense' && '🛡️'}
                            {card.type === 'posture' && '🧘'}
                            {card.type === 'voice' && '📢'}
                            {card.type === 'jammed' && '🚫'}
                            {card.type === 'cold_steel' && '🔪'}
                        </div>

                        {/* Card Name */}
                        <div className="text-sm font-bold text-white text-center mb-2 leading-tight min-h-[2.5em] flex items-center justify-center">
                            {card.name}
                        </div>

                        {/* Card Description/Stats */}
                        <div className="text-[10px] text-white/60 text-center mb-4 leading-tight">
                            {card.effects?.[0]?.description || '...'}
                        </div>

                        {/* Footer Stats */}
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            {card.damage && (
                                <div className="text-sm text-red-400 font-bold flex flex-col items-center">
                                    <span>💥</span>
                                    <span>{card.damage}</span>
                                </div>
                            )}

                            <div className={cn(
                                'text-sm font-bold flex flex-col items-center',
                                canAfford ? 'text-yellow-400' : 'text-red-500'
                            )}>
                                <span>⚡</span>
                                <span>{card.staminaCost}</span>
                            </div>

                            {card.ammoCost && (
                                <div className={cn(
                                    'text-sm font-bold flex flex-col items-center',
                                    hasAmmo ? 'text-blue-400' : 'text-red-500'
                                )}>
                                    <span>🔫</span>
                                    <span>{card.ammoCost}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

// ================== BATTLE LOG ==================

const BattleLog = ({ log }: { log: any[] }) => {
    return (
        <div className="h-40 overflow-y-auto bg-black/60 rounded-xl p-3 text-xs space-y-2 font-mono border border-white/10">
            <AnimatePresence>
                {log.slice(-10).reverse().map((entry, i) => (
                    <motion.div
                        key={entry.timestamp}
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
                            <span>TURN {entry.turn}</span>
                            <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div>
                            <span className="font-bold text-white">{entry.actorName}</span>{' '}
                            <span className="text-amber-300">{entry.action}</span>
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

export function ArenaBattle({ sessionId, deviceId, onBattleEnd }: ArenaBattleProps) {
    const battle = useQuery(api.battleSystem.getActiveBattle, { deviceId })
    const playCard = useMutation(api.battleSystem.playCard)
    const endTurn = useMutation(api.battleSystem.endTurn)

    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Handle battle end
    useEffect(() => {
        if (battle && !battle.isActive) {
            const result = battle.phase as 'victory' | 'defeat' | 'flee'
            onBattleEnd?.(result)
        }
    }, [battle?.isActive, battle?.phase, onBattleEnd])

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

            await playCard({
                deviceId,
                sessionId: battle._id,
                cardId,
                targetEnemyId: targetId
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
            await endTurn({ deviceId, sessionId: battle._id })
        } catch (error) {
            console.error('Error ending turn:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col">
            {/* Top Bar */}
            <div className="bg-slate-900/80 p-4 flex justify-between items-center border-b border-white/10 backdrop-blur-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="text-xl font-bold tracking-widest text-amber-500">ARENA PROTOCOL</div>
                    <div className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-slate-400">
                        TURN {battle.turn}
                    </div>
                </div>

                <button
                    onClick={handleEndTurn}
                    disabled={!isPlayerTurn || isProcessing}
                    className={cn(
                        'px-6 py-2 rounded-full font-bold transition-all shadow-lg',
                        isPlayerTurn
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-600'
                    )}
                >
                    {isPlayerTurn ? 'ЗАВЕРШИТЬ ХОД' : 'ОЖИДАНИЕ...'}
                </button>
            </div>

            {/* Main Combat Area */}
            <div className="flex-1 relative flex items-center justify-center gap-12 p-8">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[url('/images/arena_bg.png')] bg-cover bg-center -z-20" />
                <div className="absolute inset-0 bg-black/60 -z-10" />
                <div className="absolute inset-0 opacity-20 bg-[url('/images/noise.png')] mix-blend-overlay -z-10" />

                {/* Player Side */}
                <div className="relative group">
                    <CombatantCard
                        combatant={{
                            name: 'ОПЕРАТОР',
                            hp: battle.playerState.hp,
                            maxHp: battle.playerState.maxHp,
                            stamina: battle.playerState.stamina,
                            maxStamina: battle.playerState.maxStamina,
                            morale: battle.playerState.morale,
                            maxMorale: battle.playerState.maxMorale,
                            posture: battle.playerState.posture
                        }}
                        isPlayer
                        isCurrentTurn={currentActor === 'player'}
                    />

                    {/* Weapon Status Panel */}
                    <div className="absolute -left-48 top-0 w-40">
                        <WeaponStatus
                            condition={battle.playerState.weaponCondition}
                            heat={battle.playerState.weaponHeat}
                            jamState={battle.playerState.jamState}
                        />
                    </div>
                </div>

                {/* VS Indicator */}
                <div className="text-4xl font-black text-white/10 italic">VS</div>

                {/* Enemy Side */}
                <div className="relative">
                    {battle.enemyStates.filter((e: any) => e.hp > 0).map((enemy: any) => (
                        <CombatantCard
                            key={enemy.id}
                            combatant={enemy}
                            isCurrentTurn={currentActor === enemy.id}
                            onClick={() => setSelectedTarget(enemy.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Control Panel */}
            <div className="bg-slate-900/90 border-t border-white/10 p-4 backdrop-blur-md">
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4">
                    {/* Log */}
                    <div className="col-span-3">
                        <BattleLog log={battle.log} />
                    </div>

                    {/* Hand */}
                    <div className="col-span-9">
                        <CardHand
                            cards={battle.hand}
                            onPlayCard={handlePlayCard}
                            currentStamina={battle.playerState.stamina}
                            currentAmmo={battle.playerState.currentAmmo}
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
