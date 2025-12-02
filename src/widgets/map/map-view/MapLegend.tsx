import React from 'react'
import { cn } from '@/shared/lib/utils/cn'

interface MapLegendProps {
    className?: string
}

export const MapLegend: React.FC<MapLegendProps> = ({ className }) => {
    return (
        <div className={cn('bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg border border-gray-800 text-sm text-gray-300', className)}>
            <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Легенда</h4>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500"></div>
                    <span>Безопасная зона</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></div>
                    <span>Опасная зона</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Игрок</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-yellow-500"></div>
                    <span>Квест</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Аномалия</span>
                </div>
            </div>
        </div>
    )
}
