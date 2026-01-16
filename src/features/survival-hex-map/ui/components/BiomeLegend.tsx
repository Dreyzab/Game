import { useState } from 'react'
import { cn } from '@/shared/lib/utils/cn'

// Main biomes to display in legend (excluding roads)
const LEGEND_ITEMS: { key: string; name: string; color: string }[] = [
    { key: 'BUNKER', name: 'Бункер', color: '#00ff41' },
    { key: 'WASTELAND', name: 'Пустошь', color: '#8b7765' },
    { key: 'FOREST', name: 'Лес', color: '#2d5a27' },
    { key: 'URBAN', name: 'Город', color: '#696969' },
    { key: 'INDUSTRIAL', name: 'Промзона', color: '#4a4a4a' },
    { key: 'WATER', name: 'Вода', color: '#4169e1' },
    { key: 'HOSPITAL', name: 'Госпиталь', color: '#ff6347' },
    { key: 'POLICE', name: 'Полиция', color: '#4682b4' },
    { key: 'FACTORY', name: 'Завод', color: '#a0522d' },
    { key: 'MALL', name: 'ТЦ', color: '#ff69b4' },
    { key: 'GAS_STATION', name: 'АЗС', color: '#ffa500' },
    { key: 'ARMY_BASE', name: 'Военная база', color: '#006400' },
]

interface BiomeLegendProps {
    className?: string
}

/**
 * Collapsible biome legend for the survival map.
 * Shows main biome types with their colors.
 */
export function BiomeLegend({ className }: BiomeLegendProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div
            className={cn(
                'fixed top-4 left-4 z-overlay font-mono text-xs',
                'bg-terminal-black/90 border border-terminal-green/30 rounded-lg',
                'backdrop-blur-sm shadow-lg',
                className
            )}
        >
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    'w-full px-3 py-2 flex items-center justify-between gap-2',
                    'text-terminal-green hover:bg-terminal-green/10 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg'
                )}
                aria-expanded={isExpanded}
            >
                <span className="font-bold">ЛЕГЕНДА</span>
                <span className="text-terminal-dim">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {LEGEND_ITEMS.map((item) => (
                        <div key={item.key} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-sm shrink-0 border border-white/20"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-gray-300 truncate">{item.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
