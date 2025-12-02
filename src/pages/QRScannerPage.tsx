import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { QRPointActivation } from '@/entities/map-point/ui/QRPointActivation'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { Routes } from '@/shared/lib/utils/navigation'

const QRScannerPage: React.FC = () => {
    const navigate = useNavigate()
    const { deviceId } = useDeviceId()
    const activateByQR = useMutation(api.mapPoints.activateByQR)

    const [scanResult, setScanResult] = useState<{ success: boolean; message: string; xp?: number } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleScan = async (qrCode: string) => {
        if (isProcessing) return
        setIsProcessing(true)

        try {
            const result = await activateByQR({
                deviceId,
                qrCode,
            })

            if (result.success) {
                setScanResult({
                    success: true,
                    message: `Точка "${result.point.title}" открыта!`,
                    xp: result.xpGain,
                })
            }
        } catch (error) {
            console.error('QR Activation failed:', error)
            setScanResult({
                success: false,
                message: 'Неверный QR-код или ошибка сети.',
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleClose = () => {
        navigate(Routes.MAP)
    }

    if (scanResult) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${scanResult.success ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {scanResult.success ? (
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                    {scanResult.success ? 'Успех!' : 'Ошибка'}
                </h2>

                <p className="text-gray-300 mb-6">
                    {scanResult.message}
                </p>

                {scanResult.success && scanResult.xp && (
                    <div className="mb-8 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 font-mono">
                        +{scanResult.xp} XP
                    </div>
                )}

                <div className="flex gap-4 w-full max-w-xs">
                    <button
                        onClick={() => setScanResult(null)}
                        className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                        Сканировать ещё
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                    >
                        На карту
                    </button>
                </div>
                {isProcessing && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black relative">
            <QRPointActivation
                pointTitle="Поиск объекта"
                onScan={handleScan}
                onClose={handleClose}
                className="!fixed !inset-0 !bg-black !p-0" // Override modal styles to fill screen
            />

            {isProcessing && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
        </div>
    )
}

export default QRScannerPage
