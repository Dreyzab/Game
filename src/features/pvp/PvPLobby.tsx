import { useState } from 'react'
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

const CLASSES = [
    { id: 'assault', name: 'Assault', icon: '⚔️', desc: 'Frontline Damage' },
    { id: 'medic', name: 'Medic', icon: '⚕️', desc: 'Healer (Rank 3)' },
    { id: 'sniper', name: 'Sniper', icon: '🎯', desc: 'Long Range (Rank 4)' },
    { id: 'scout', name: 'Scout', icon: '🔭', desc: 'Evasion & Intel' },
]

export const PvPLobby = () => {
    const { deviceId } = useDeviceId()
    const navigate = useNavigate()
    const openBattles = useQuery(api.pvp.getOpenBattles)
    const createBattle = useMutation(api.pvp.createBattle)
    const joinBattle = useMutation(api.pvp.joinBattle)

    const [selectedClass, setSelectedClass] = useState('assault')

    const handleCreate = async () => {
        if (!deviceId) return
        try {
            const battleId = await createBattle({ deviceId, classId: selectedClass })
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
            const result = await joinBattle({ deviceId, battleId, classId: selectedClass })
            if (result.success) {
                navigate(`/pvp/${battleId}`)
            } else {
                alert(result.message || "Failed to join")
            }
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
                    <div className="flex gap-2">
                        <Button onClick={() => navigate('/qr-scanner')} variant="secondary">Scan QR</Button>
                        <Button onClick={handleCreate}>Create Squad</Button>
                    </div>
                </div>

                {/* Class Selection */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Select Your Class</h2>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {CLASSES.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedClass(c.id)}
                                className={cn(
                                    "p-4 rounded-lg border-2 cursor-pointer w-32 flex-shrink-0 transition-all",
                                    selectedClass === c.id
                                        ? "border-blue-500 bg-blue-900/30"
                                        : "border-slate-700 bg-slate-800 hover:border-slate-600"
                                )}
                            >
                                <div className="text-2xl mb-2">{c.icon}</div>
                                <div className="font-bold">{c.name}</div>
                                <div className="text-xs text-gray-400">{c.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4">
                    <h2 className="text-xl font-semibold mb-2">Open Squads</h2>
                    {!openBattles ? (
                        <div>Loading...</div>
                    ) : openBattles.length === 0 ? (
                        <div className="text-gray-400 italic">No open squads found. Create one!</div>
                    ) : (
                        openBattles.map((battle) => (
                            <div key={battle._id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-lg">Squad #{battle._id.slice(-4)}</div>
                                    <div className="text-sm text-gray-400">
                                        Host: {battle.hostId.slice(0, 8)}...
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleJoin(battle._id)}
                                    variant="secondary"
                                >
                                    Join
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
