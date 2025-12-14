import React, { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { X, Camera, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/lib/utils/cn'

interface QRPointActivationProps {
    pointTitle: string
    onScan: (data: string) => void
    onClose: () => void
    simulateData?: string
    className?: string
}

export const QRPointActivation: React.FC<QRPointActivationProps> = ({
    pointTitle,
    onScan,
    onClose,
    simulateData,
    className,
}) => {
    const [error, setError] = useState<string | null>(null)
    const [isScanning, setIsScanning] = useState(true)

    // Debug mode for development without camera
    const isDev = import.meta.env.DEV

    const handleScan = (result: { rawValue: string }[]) => {
        if (result && result.length > 0) {
            setIsScanning(false)
            onScan(result[0].rawValue)
        }
    }

    const handleError = (err: unknown) => {
        console.error('QR Scan Error:', err)
        setError('Не удалось получить доступ к камере. Проверьте разрешения.')
    }

    // Debug simulation
    const handleSimulateScan = () => {
        setIsScanning(false)
        onScan(simulateData ?? 'simulated-qr-code')
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                    'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4',
                    className
                )}
            >
                <div className="relative w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                        <h3 className="text-white font-bold text-lg drop-shadow-md">
                            Сканирование: {pointTitle}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-black/40 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Scanner Area */}
                    <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
                        {isScanning && !error ? (
                            <>
                                <Scanner
                                    onScan={handleScan}
                                    onError={handleError}
                                    components={{
                                        onOff: false,
                                        torch: true,
                                        zoom: true,
                                        finder: true,
                                    }}
                                    styles={{
                                        container: { width: '100%', height: '100%' },
                                        video: { objectFit: 'cover' },
                                    }}
                                />
                                {/* Overlay Text */}
                                <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                                    <p className="text-white/80 text-sm bg-black/50 inline-block px-4 py-2 rounded-full backdrop-blur-md">
                                        Наведите камеру на QR-код
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                {error ? (
                                    <>
                                        <AlertTriangle className="text-red-500 mb-4" size={48} />
                                        <p className="text-white mb-4">{error}</p>
                                        <button
                                            onClick={() => setError(null)}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                        >
                                            Попробовать снова
                                        </button>
                                    </>
                                ) : (
                                    <div className="animate-pulse flex flex-col items-center">
                                        <div className="w-16 h-16 border-4 border-green-500 rounded-full flex items-center justify-center mb-4">
                                            <Camera className="text-green-500" size={32} />
                                        </div>
                                        <p className="text-green-400 font-bold">Обработка...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer / Debug Controls */}
                    <div className="p-4 bg-gray-900 border-t border-white/10">
                        <p className="text-xs text-gray-500 text-center mb-2">
                            Используйте QR-код, расположенный на объекте
                        </p>

                        {isDev && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                                <button
                                    onClick={handleSimulateScan}
                                    className="w-full py-2 px-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-xs font-mono uppercase tracking-wider rounded transition-colors border border-yellow-500/20"
                                >
                                    [DEV] Симулировать успешный скан
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
