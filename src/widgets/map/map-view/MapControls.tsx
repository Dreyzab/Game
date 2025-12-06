import React from 'react'
import { cn } from '@/shared/lib/utils/cn'

export interface MapControlsProps {
    onLocateUser: () => void
    isGeoLoading: boolean
    isPointsLoading: boolean
    isZonesLoading: boolean
    pointsCount: number
    className?: string
}

export const MapControls: React.FC<MapControlsProps> = ({
    onLocateUser,
    isGeoLoading,
    isPointsLoading,
    isZonesLoading,
    pointsCount,
    className,
}) => {
    return (
        <div className={cn('pointer-events-none absolute inset-0', className)}>
            {/* Кнопка центрирования на пользователе */}
            <div className="absolute bottom-20 right-4 z-10 pointer-events-auto">
                <button
                    onClick={onLocateUser}
                    disabled={isGeoLoading}
                    className={cn(
                        'bg-white text-gray-900 rounded-lg shadow-lg',
                        'px-4 py-2 font-medium',
                        'hover:bg-gray-100 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    title="Центрировать на моём местоположении"
                >
                    {isGeoLoading ? 'Определение...' : '📍 Моё местоположение'}
                </button>
            </div>

            {/* Индикатор загрузки */}
            {(isPointsLoading || isZonesLoading) && (
                <div className="absolute top-4 right-4 z-10 pointer-events-auto bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
                    Загрузка данных...
                </div>
            )}

            {/* Счётчик точек */}
            <div className="absolute bottom-4 right-4 z-10 pointer-events-auto bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
                Точек: {pointsCount}
            </div>
        </div>
    )
}
