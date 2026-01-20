/**
 * RegionCard - Glassmorphism region selection card
 */

import { memo } from 'react'
import { cn } from '@/shared/lib/utils/cn'
import type { RegionConfig } from '@/shared/hexmap'

interface RegionCardProps {
    region: RegionConfig
    selected: boolean
    onSelect: (regionId: string) => void
}

const RegionCard = ({ region, selected, onSelect }: RegionCardProps) => {
    return (
        <button
            type="button"
            onClick={() => onSelect(region.id)}
            className={cn(
                'relative p-4 rounded-xl border transition-all duration-300 cursor-pointer',
                'backdrop-blur-md bg-gradient-to-br from-zinc-900/80 to-zinc-950/90',
                'hover:scale-105 hover:shadow-xl hover:shadow-amber-500/10',
                'focus:outline-none focus:ring-2 focus:ring-amber-500/50',
                selected
                    ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'border-zinc-700/50 hover:border-amber-500/50'
            )}
            aria-pressed={selected}
            aria-label={`Select ${region.name} region`}
        >
            {/* Background Image Overlay */}
            {region.imageUrl && (
                <div
                    className="absolute inset-0 rounded-xl opacity-20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${region.imageUrl})` }}
                />
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                <div className="text-2xl">🗺️</div>
                <div className="text-lg font-bold text-white">{region.name}</div>
                <div className="text-xs text-zinc-400">{region.nameRu}</div>

                {/* Features */}
                <div className="flex gap-2 mt-2 flex-wrap justify-center">
                    {region.features?.river && (
                        <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 rounded-full">
                            🌊 Река
                        </span>
                    )}
                    {(region.resourceWeights?.TECH ?? 1) > 1.5 && (
                        <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded-full">
                            💻 Технологии
                        </span>
                    )}
                    {(region.biomeWeights?.ADMIN ?? 1) > 1.5 && (
                        <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 rounded-full">
                            🏛️ Администрация
                        </span>
                    )}
                </div>

                {/* Selection Indicator */}
                {selected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-black text-xs font-bold">✓</span>
                    </div>
                )}
            </div>
        </button>
    )
}

export default memo(RegionCard)
