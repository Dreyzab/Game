import React, { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { cn } from '@/shared/lib/utils/cn'

export default function QRScannerPage() {
    const navigate = useNavigate()
    const { deviceId } = useDeviceId()
    const joinBattle = useMutation(api.pvp.joinBattle)
    const [error, setError] = useState<string | null>(null)

    const handleScan = async (result: string) => {
        if (!result) return

        // Parse URL: grezwanderer://join?battleId=...
        // Or just raw battleId if we simplify
        try {
            let battleId = result
            if (result.includes('battleId=')) {
                battleId = result.split('battleId=')[1]
            }

            if (!deviceId) return

            // Default class for QR join? Or prompt?
            // For MVP, assume "assault" or prompt before scan?
            // Let's just try to join as "default" for now
            // @ts-ignore
            const res = await joinBattle({ deviceId, battleId, classId: "default" })

            if (res.success) {
                navigate(`/pvp/${battleId}`)
            } else {
                setError(res.message || "Failed to join")
            }
        } catch (e) {
            console.error(e)
            setError("Invalid QR Code or Connection Error")
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">Scan Lobby QR</h1>

            <div className="w-full max-w-md aspect-square border-2 border-blue-500 rounded-lg overflow-hidden relative">
                <Scanner
                    onScan={(result) => result[0] && handleScan(result[0].rawValue)}
                    onError={(error) => setError(error.message)}
                />
                <div className="absolute inset-0 border-2 border-transparent pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
                    {error}
                </div>
            )}

            <button
                onClick={() => navigate(-1)}
                className="mt-8 px-6 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
                Cancel
            </button>
        </div>
    )
}
