import React from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { cn } from '@/shared/lib/utils/cn'

// Simple UI components for MVP if shared ones are missing
const Button = ({ onClick, disabled, variant, children }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "px-4 py-2 rounded font-bold transition-colors",
            variant === "secondary" ? "bg-gray-600 hover:bg-gray-500" : "bg-blue-600 hover:bg-blue-500",
            disabled && "opacity-50 cursor-not-allowed"
        )}
    >
        {children}
    </button>
)

const Card = ({ onClick, className, children }: any) => (
    <div onClick={onClick} className={cn("bg-slate-700 rounded border border-slate-600", className)}>
        {children}
    </div>
)

interface PvPBattleScreenProps {
    battleId: string
}

// Helper component to wrap the logic
const BattleContent = ({ battleId, deviceId }: { battleId: Id<"battles">, deviceId: string }) => {
    const battle = useQuery(api.pvp.getBattle, { battleId })
    // We need to find out which player ID matches our device ID.
    // Since we can't easily query that here without a new backend query,
    // let's assume the user knows or we add a "whoAmI" query.

    // Let's add a simple query to pvp.ts or use an existing one?
    // Actually, let's just use `api.players.getByDevice` if it exists.
    // Or just iterate if we had the player list.

    // Workaround: The battle object has player IDs.
    // We don't know OUR player ID on the client easily without fetching.
    // Let's just fetch the player by deviceId.
    const me = useQuery(api.player.getPlayerByDeviceId, { deviceId })

    if (!battle || !me) return <div>Загрузка...</div>

    const isP1 = battle.player1Id === me._id
    const isP2 = battle.player2Id === me._id

    if (!isP1 && !isP2) return <div>Вы не участник этой битвы (Spectator mode not implemented)</div>

    const myState = isP1 ? {
        health: battle.state.p1Health,
        maxHealth: battle.state.p1MaxHealth,
        energy: battle.state.p1Energy,
        hand: battle.state.p1Hand,
    } : {
        health: battle.state.p2Health,
        maxHealth: battle.state.p2MaxHealth,
        energy: battle.state.p2Energy,
        hand: battle.state.p2Hand,
    }

    const enemyState = isP1 ? {
        health: battle.state.p2Health,
        maxHealth: battle.state.p2MaxHealth,
        energy: battle.state.p2Energy,
        handCount: battle.state.p2Hand.length,
    } : {
        health: battle.state.p1Health,
        maxHealth: battle.state.p1MaxHealth,
        energy: battle.state.p1Energy,
        handCount: battle.state.p1Hand.length,
    }

    const isMyTurn = battle.currentTurnPlayerId === me._id
    const playCardMutation = useMutation(api.pvp.playCard)
    const endTurnMutation = useMutation(api.pvp.endTurn)

    const handlePlayCard = async (index: number) => {
        try {
            await playCardMutation({ deviceId, battleId, cardIndex: index })
        } catch (e) {
            console.error(e)
            alert("Ошибка: " + e)
        }
    }

    const handleEndTurn = async () => {
        await endTurnMutation({ deviceId, battleId })
    }

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white p-4">
            {/* Enemy Area */}
            <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg mb-4">
                <div>
                    <h2 className="text-xl font-bold text-red-400">Враг</h2>
                    <div className="text-2xl">{enemyState.health} / {enemyState.maxHealth} HP</div>
                    <div className="text-blue-300">Energy: {enemyState.energy}</div>
                </div>
                <div className="flex gap-2">
                    {Array.from({ length: enemyState.handCount }).map((_, i) => (
                        <div key={i} className="w-16 h-24 bg-slate-600 rounded border border-slate-500" />
                    ))}
                </div>
            </div>

            {/* Battle Log */}
            <div className="flex-1 overflow-y-auto bg-black/30 p-2 rounded mb-4 text-sm font-mono">
                {battle.logs.map((log, i) => (
                    <div key={i} className="mb-1">
                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                    </div>
                ))}
            </div>

            {/* Player Area */}
            <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-green-400">Вы ({me.name})</h2>
                        <div className="text-2xl">{myState.health} / {myState.maxHealth} HP</div>
                        <div className="text-blue-300">Energy: {myState.energy}</div>
                    </div>
                    <Button
                        onClick={handleEndTurn}
                        disabled={!isMyTurn}
                        variant={isMyTurn ? "default" : "secondary"}
                    >
                        {isMyTurn ? "Завершить ход" : "Ход противника..."}
                    </Button>
                </div>

                {/* Hand */}
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {myState.hand.map((card: any, i: number) => (
                        <Card
                            key={i}
                            className={cn(
                                "w-32 h-48 flex-shrink-0 p-2 cursor-pointer transition-transform hover:-translate-y-2 relative",
                                myState.energy < card.cost ? "opacity-50 grayscale" : "hover:shadow-lg hover:shadow-blue-500/50",
                                !isMyTurn && "opacity-70 cursor-not-allowed"
                            )}
                            onClick={() => isMyTurn && handlePlayCard(i)}
                        >
                            <div className="text-xs font-bold mb-1">{card.name}</div>
                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {card.cost}
                            </div>
                            <div className="mt-4 text-xs text-center text-gray-300">
                                {card.type === 'attack' && `Урон: ${card.damage}`}
                                {card.type === 'defense' && `Защита: ${card.defense}`}
                                {card.type === 'heal' && `Лечение: ${card.heal}`}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function PvPBattleScreenWrapper({ battleId }: { battleId: string }) {
    const { deviceId } = useDeviceId()
    if (!deviceId) return <div>Authorizing...</div>
    return <BattleContent battleId={battleId as Id<"battles">} deviceId={deviceId} />
}
