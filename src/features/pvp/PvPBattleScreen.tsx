import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { cn } from '@/shared/lib/utils/cn'

// Simple UI components
const Button = ({ onClick, disabled, variant, children, className }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "px-4 py-2 rounded font-bold transition-colors",
            variant === "secondary" ? "bg-gray-600 hover:bg-gray-500" : "bg-blue-600 hover:bg-blue-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
        )}
    >
        {children}
    </button>
)

const Card = ({ onClick, className, children, efficacy = 1.0 }: any) => (
    <div onClick={onClick} className={cn(
        "bg-slate-700 rounded border border-slate-600 relative overflow-hidden",
        className
    )}>
        {efficacy < 1.0 && (
            <div className="absolute top-0 left-0 right-0 bg-red-500/50 text-xs text-center font-bold">
                PENALTY: {Math.round(efficacy * 100)}%
            </div>
        )}
        {children}
    </div>
)

const RankSlot = ({ rank, player, isMe }: { rank: number, player: any, isMe: boolean }) => (
    <div className={cn(
        "h-32 border-2 rounded-lg p-2 flex flex-col justify-between relative transition-all",
        player ? "bg-slate-800 border-blue-500" : "bg-slate-900/50 border-slate-700 border-dashed",
        isMe && "ring-2 ring-yellow-400"
    )}>
        <div className="absolute top-1 left-2 text-xs font-bold text-gray-500">RANK {rank}</div>
        {player ? (
            <>
                <div className="text-center font-bold mt-4">{player.classId || "Unknown"}</div>
                <div className="text-xs text-center text-gray-400">{player.playerId.slice(0, 6)}...</div>
                <div className="mt-auto">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-400">HP {player.health}</span>
                        <span className="text-blue-400">EN {player.energy}</span>
                    </div>
                    <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full" style={{ width: `${(player.health / player.maxHealth) * 100}%` }} />
                    </div>
                </div>
            </>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">Empty</div>
        )}
    </div>
)

const BattleContent = ({ battleId, deviceId }: { battleId: Id<"battles">, deviceId: string }) => {
    const battle = useQuery(api.pvp.getBattle, { battleId })
    const lobbyQR = useQuery(api.pvp.getLobbyQR, { battleId })
    const me = useQuery(api.player.getPlayerByDeviceId, { deviceId })

    const playCardMutation = useMutation(api.pvp.playCard)
    const endTurnMutation = useMutation(api.pvp.endTurn)

    if (!battle || !me) return <div className="p-8 text-center">Loading Battle...</div>

    const myParticipant = battle.participants.find((p: any) => p.playerId === me._id)
    const myRank = myParticipant?.rank
    const myState = myRank ? battle.state.formation[myRank.toString()] : null

    const handlePlayCard = async (index: number) => {
        try {
            await playCardMutation({ deviceId, battleId, cardIndex: index })
        } catch (e) {
            console.error(e)
            alert("Error: " + e)
        }
    }

    const handleEndTurn = async () => {
        await endTurnMutation({ deviceId, battleId })
    }

    // Lobby View
    if (battle.status === "waiting") {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
                <h1 className="text-3xl font-bold mb-4">Squad Lobby</h1>
                <div className="bg-white p-4 rounded-lg mb-8">
                    {/* QR Code Placeholder if library missing, else real QR */}
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lobbyQR || "")}`}
                        alt="Scan to Join"
                        className="w-48 h-48"
                    />
                </div>
                <div className="text-xl mb-8">Scan to Join!</div>

                <div className="grid grid-cols-4 gap-4 w-full max-w-4xl mb-8">
                    {[1, 2, 3, 4].map(rank => {
                        const pState = battle.state.formation[rank.toString()]
                        const participant = battle.participants.find((p: any) => p.rank === rank)
                        return (
                            <RankSlot
                                key={rank}
                                rank={rank}
                                player={pState ? { ...pState, classId: participant?.classId, playerId: participant?.playerId } : null}
                                isMe={participant?.playerId === me._id}
                            />
                        )
                    })}
                </div>

                {/* Only Host can start? For MVP anyone */}
                <Button onClick={() => alert("Start Battle not implemented yet (needs mutation)")}>Start Mission</Button>
            </div>
        )
    }

    // Combat View
    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white p-4">
            {/* Enemy Area */}
            <div className="flex justify-center items-center p-4 bg-slate-800 rounded-lg mb-4 min-h-[150px]">
                {battle.state.enemies.map((enemy: any, i: number) => (
                    <div key={i} className="w-32 h-32 bg-red-900/50 border-2 border-red-500 rounded-lg flex flex-col items-center justify-center m-2">
                        <div className="font-bold">{enemy.name}</div>
                        <div className="text-2xl">{enemy.health} HP</div>
                    </div>
                ))}
            </div>

            {/* Formation Grid */}
            <div className="grid grid-cols-4 gap-4 mb-4">
                {[1, 2, 3, 4].map(rank => {
                    const pState = battle.state.formation[rank.toString()]
                    const participant = battle.participants.find((p: any) => p.rank === rank)
                    return (
                        <RankSlot
                            key={rank}
                            rank={rank}
                            player={pState ? { ...pState, classId: participant?.classId, playerId: participant?.playerId } : null}
                            isMe={participant?.playerId === me._id}
                        />
                    )
                })}
            </div>

            {/* Battle Log */}
            <div className="flex-1 overflow-y-auto bg-black/30 p-2 rounded mb-4 text-sm font-mono h-32">
                {battle.logs.map((log: any, i: number) => (
                    <div key={i} className="mb-1">
                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                    </div>
                ))}
            </div>

            {/* Player Controls */}
            {myState && (
                <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-green-400">My Hand (Rank {myRank})</h2>
                            <div className="text-blue-300">Energy: {myState.energy} / {myState.maxEnergy}</div>
                        </div>
                        <Button
                            onClick={handleEndTurn}
                            disabled={battle.currentTurnPlayerId !== me._id}
                            variant={battle.currentTurnPlayerId === me._id ? "default" : "secondary"}
                        >
                            {battle.currentTurnPlayerId === me._id ? "End Turn" : "Waiting..."}
                        </Button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {myState.hand.map((card: any, i: number) => {
                            // Calculate efficacy for display
                            const eff = card.range && !card.range.includes(myRank) ? 0.6 : 1.0
                            return (
                                <Card
                                    key={i}
                                    className={cn(
                                        "w-32 h-48 flex-shrink-0 p-2 cursor-pointer transition-transform hover:-translate-y-2 relative",
                                        myState.energy < card.cost ? "opacity-50 grayscale" : "hover:shadow-lg hover:shadow-blue-500/50",
                                        battle.currentTurnPlayerId !== me._id && "opacity-70 cursor-not-allowed"
                                    )}
                                    onClick={() => battle.currentTurnPlayerId === me._id && handlePlayCard(i)}
                                    efficacy={eff}
                                >
                                    <div className="text-xs font-bold mb-1">{card.name}</div>
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        {card.cost}
                                    </div>
                                    <div className="mt-4 text-xs text-center text-gray-300">
                                        {card.type}
                                        {card.damage && ` Dmg: ${card.damage}`}
                                        {card.heal && ` Heal: ${card.heal}`}
                                    </div>
                                    {card.range && (
                                        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-400">
                                            Range: {card.range.join(',')}
                                        </div>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PvPBattleScreenWrapper({ battleId }: { battleId: string }) {
    const { deviceId } = useDeviceId()
    if (!deviceId) return <div>Authorizing...</div>
    return <BattleContent battleId={battleId as Id<"battles">} deviceId={deviceId} />
}
