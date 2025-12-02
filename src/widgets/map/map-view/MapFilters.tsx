import React from 'react'
import { cn } from '@/shared/lib/utils/cn'

export type MapFilterType = 'quest' | 'npc' | 'poi' | 'board' | 'anomaly' | 'other'

interface MapFiltersProps {
    activeFilters: MapFilterType[]
    onChange: (filters: MapFilterType[]) => void
    className?: string
}

const FILTERS: { id: MapFilterType; label: string }[] = [
    { id: 'quest', label: 'Квесты' },
    { id: 'npc', label: 'NPC' },
    { id: 'poi', label: 'Места' },
    { id: 'board', label: 'Доски' },
    { id: 'anomaly', label: 'Аномалии' },
]

export const MapFilters: React.FC<MapFiltersProps> = ({
    activeFilters,
    onChange,
    className
}) => {
    const toggleFilter = (id: MapFilterType) => {
        if (activeFilters.includes(id)) {
            onChange(activeFilters.filter(f => f !== id))
        } else {
            onChange([...activeFilters, id])
        }
    }

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            {FILTERS.map(filter => (
                <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                        activeFilters.includes(filter.id)
                            ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                            : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    )}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    )
}
