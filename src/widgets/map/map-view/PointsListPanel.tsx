import React from 'react'
import type { MapPoint, BBox } from '@/shared/types/map'
import { useVisibleMapPoints } from '@/shared/hooks/useMapData'
import { cn } from '@/shared/lib/utils/cn'
import { X } from 'lucide-react'

interface PointsListPanelProps {
    bbox?: BBox
    activeFilters?: string[]
    onSelectPoint: (point: MapPoint) => void
    onClose: () => void
    className?: string
}

export const PointsListPanel: React.FC<PointsListPanelProps> = ({
    bbox,
    activeFilters,
    onSelectPoint,
    onClose,
    className,
}) => {
    const { points, isLoading } = useVisibleMapPoints({ bbox, limit: 50 })

    const filteredPoints = points.filter((p) => {
        if (!activeFilters) return true
        const type = p.type
        if (activeFilters.includes(type)) return true
        if (type === 'settlement' || type === 'location') return activeFilters.includes('poi')
        return false
    })

    return (
        <div className={cn('bg-gray-900/95 backdrop-blur-md border-l border-white/10 flex flex-col h-full', className)}>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Объекты ({filteredPoints.length})</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {isLoading ? (
                    <div className="text-center text-gray-500 py-4">Загрузка...</div>
                ) : filteredPoints.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">Нет объектов в этой области</div>
                ) : (
                    filteredPoints.map((point) => (
                        <button
                            key={point.id}
                            onClick={() => onSelectPoint(point)}
                            className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 group"
                        >
                            <div className="flex items-start justify-between">
                                <span className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                    {point.title}
                                </span>
                                {point.distance !== undefined && (
                                    <span className="text-xs text-gray-500">
                                        {point.distance < 1
                                            ? `${Math.round(point.distance * 1000)} м`
                                            : `${point.distance.toFixed(1)} км`}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 line-clamp-1">{point.description}</div>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40 text-gray-400">
                                    {point.type}
                                </span>
                                {point.status === 'researched' && (
                                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-900/40 text-green-400">
                                        Изучено
                                    </span>
                                )}
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
