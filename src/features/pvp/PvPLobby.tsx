import React from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/utils/cn'

// Reusing simple UI components
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

export const PvPLobby = () => {
    const { deviceId } = useDeviceId()
    const navigate = useNavigate()
    const openBattles = useQuery(api.pvp.getOpenBattles)
    const createBattle = useMutation(api.pvp.createBattle)
    const joinBattle = useMutation(api.pvp.joinBattle)

    const handleCreate = async () => {
        if (!deviceId) return
        try {
            const battleId = await createBattle({ deviceId })
            navigate(`/pvp/${battleId}`)
        } catch (e) {
            console.error(e)
            alert("Failed to create battle")
        }
    }

    const handleJoin = async (battleId: string) => {
        if (!deviceId) return
        try {
            // @ts-ignore - ID type mismatch workaround for MVP
            await joinBattle({ deviceId, battleId })
            navigate(`/pvp/${battleId}`)
        } catch (e) {
            console.error(e)
            alert("Failed to join battle: " + e)
        }
    }

    if (!deviceId) return <div className="p-8 text-center text-white">Authorizing...</div>

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-400">PvP Arena Lobby</h1>
                    <Button onClick={handleCreate}>Create New Battle</Button>
                </div>

                <div className="grid gap-4">
                    <h2 className="text-xl font-semibold mb-2">Open Battles</h2>
                    {!openBattles ? (
                        <div>Loading...</div>
                    ) : openBattles.length === 0 ? (
                        <div className="text-gray-400 italic">No open battles found. Create one!</div>
                    ) : (
                        openBattles.map((battle) => (
                            <div key={battle._id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-lg">Battle #{battle._id.slice(-4)}</div>
                                    <div className="text-sm text-gray-400">
                                        Created {new Date(battle._creationTime).toLocaleTimeString()}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleJoin(battle._id)}
                                    variant="secondary"
                                >
                                    Join Fight
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
