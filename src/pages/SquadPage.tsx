import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { cn } from '@/shared/lib/utils/cn'
import { useNavigate } from 'react-router-dom'

// Simple UI Components
const Button = ({ onClick, disabled, variant, children, className }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "px-4 py-2 rounded font-bold transition-colors",
            variant === "secondary" ? "bg-gray-600 hover:bg-gray-500" : "bg-blue-600 hover:bg-blue-500",
            variant === "danger" && "bg-red-600 hover:bg-red-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
        )}
    >
        {children}
    </button>
)

const RankSlot = ({ rank, memberDetail, isLeader, playerId }: any) => {
    return (
        <div className="border-2 border-slate-600 rounded-lg p-4 h-40 flex flex-col items-center justify-center bg-slate-800 relative">
            <div className="absolute top-2 left-2 text-xs text-gray-400 font-bold">RANK {rank}</div>
            {memberDetail ? (
                <>
                    <div className="text-2xl mb-2">👤</div>
                    <div className="font-bold">{memberDetail.name}</div>
                    <div className="text-xs text-gray-400">{memberDetail.classId || "No Class"}</div>
                    {isLeader && (
                        <div className="absolute top-2 right-2 text-xs text-yellow-400">LEADER</div>
                    )}
                </>
            ) : (
                <div className="text-gray-500 italic">Empty</div>
            )}

            {memberDetail && !isLeader && memberDetail._id !== playerId && (
                <div className="absolute bottom-2 right-2">
                    <button
                        className="bg-green-600 text-xs px-2 py-1 rounded hover:bg-green-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            // onInteract(playerId, "heal")
                            alert("Heal functionality coming soon!")
                        }}
                    >
                        Heal
                    </button>
                </div>
            )}
        </div>
    )
}

export default function SquadPage() {
    const { deviceId } = useDeviceId()
    const navigate = useNavigate()
    const squad = useQuery(api.squad.getSquad, { deviceId: deviceId || "" })
    const createSquad = useMutation(api.squad.createSquad)
    const leaveSquad = useMutation(api.squad.leaveSquad)
    const updateFormation = useMutation(api.squad.updateFormation)
    const deploySquad = useMutation(api.squad.deploySquad)

    const [newSquadName, setNewSquadName] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    if (!deviceId) return <div className="p-8 text-white">Authorizing...</div>

    const handleCreate = async () => {
        if (!newSquadName) return
        try {
            await createSquad({ deviceId, name: newSquadName })
            setIsCreating(false)
        } catch (e) {
            console.error(e)
            alert("Failed to create squad")
        }
    }

    const handleLeave = async () => {
        if (!confirm("Are you sure you want to leave the squad?")) return
        try {
            await leaveSquad({ deviceId })
        } catch (e) {
            console.error(e)
            alert("Failed to leave squad")
        }
    }

    // Simple formation update (swap rank 1 and 2 for demo if leader)
    const handleSwapDemo = async () => {
        if (!squad) return
        // @ts-ignore
        const p1 = squad.formation["1"]
        // @ts-ignore
        const p2 = squad.formation["2"]

        const newFormation = {
            ...squad.formation,
            "1": p2 ?? null,
            "2": p1 ?? null,
        }

        await updateFormation({
            deviceId,
            squadId: squad._id,
            formation: newFormation
        })
    }

    if (squad === undefined) return <div className="p-8 text-white">Loading Squad...</div>

    if (squad === null) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold mb-8 text-blue-400">Squad Management</h1>

                {isCreating ? (
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 w-full max-w-md">
                        <h2 className="text-xl mb-4">Create New Squad</h2>
                        <input
                            type="text"
                            value={newSquadName}
                            onChange={(e) => setNewSquadName(e.target.value)}
                            placeholder="Squad Name"
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 mb-4 text-white"
                        />
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setIsCreating(false)} variant="secondary">Cancel</Button>
                            <Button onClick={handleCreate}>Create</Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="mb-8 text-gray-400">You are not in a squad.</p>
                        <Button onClick={() => setIsCreating(true)} className="mr-4">Create Squad</Button>
                        <Button onClick={() => navigate('/pvp')} variant="secondary">Join via PvP Lobby</Button>
                    </div>
                )}
            </div>
        )
    }

    const isLeader = squad.leaderId === squad.membersDetail?.find((m: any) => m.deviceId === deviceId)?._id

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-400">{squad.name}</h1>
                        <div className="text-gray-400">Members: {squad.members.length}/4</div>
                    </div>
                    <div className="flex gap-2">
                        {/* Invite Code / QR would go here */}
                        <Button onClick={handleLeave} variant="danger">Leave Squad</Button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map(rank => {
                        // @ts-ignore
                        const playerId = squad.formation[rank.toString()]
                        // @ts-ignore
                        const member = squad.membersDetail?.find((m: any) => m._id === playerId)
                        return (
                            <RankSlot
                                key={rank}
                                rank={rank}
                                playerId={playerId}
                                memberDetail={member}
                                isLeader={playerId === squad.leaderId}
                            />
                        )
                    })}
                </div>

                {isLeader && (
                    <div className="bg-slate-800 p-4 rounded-lg mb-8">
                        <h3 className="font-bold mb-2">Leader Actions</h3>
                        <div className="flex gap-4">
                            <Button onClick={handleSwapDemo} variant="secondary">Swap Rank 1 & 2</Button>
                            <Button onClick={async () => {
                                try {
                                    const bid = await deploySquad({ deviceId, squadId: squad._id })
                                    navigate(`/pvp/${bid}`)
                                } catch (e) {
                                    alert("Deploy failed: " + e)
                                }
                            }}>Deploy to Zone (PvE)</Button>
                        </div>
                    </div>
                )}

                <div className="bg-slate-800 p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Squad Inventory (Stash)</h2>
                    <div className="text-gray-500 italic">Shared storage coming soon...</div>
                </div>
            </div>
        </div>
    )
}
