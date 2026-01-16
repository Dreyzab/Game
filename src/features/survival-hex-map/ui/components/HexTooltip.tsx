import { cn } from '@/shared/lib/utils/cn'
import type { HexCell } from '../../types'

interface HexTooltipProps {
    hex: HexCell | null
    position: { x: number; y: number } | null
    isRevealed: boolean
}

const BIOME_NAMES: Record<string, string> = {
    BUNKER: 'Бункер',
    WASTELAND: 'Пустошь',
    FOREST: 'Лес',
    URBAN: 'Город',
    INDUSTRIAL: 'Промзона',
    WATER: 'Вода',
    HOSPITAL: 'Госпиталь',
    POLICE: 'Полиция',
    FACTORY: 'Завод',
    CITY_HIGH: 'Высотки',
    ADMIN: 'Администрация',
    FIRE_STATION: 'Пожарка',
    MALL: 'ТЦ',
    GAS_STATION: 'АЗС',
    WAREHOUSE: 'Склад',
}

const THREAT_COLORS: Record<string, string> = {
    SAFE: 'text-emerald-400',
    LOW: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400',
    EXTREME: 'text-red-400',
}

const RESOURCE_ICONS: Record<string, string> = {
    SCRAP: '🔩',
    FOOD: '🍖',
    WATER: '💧',
    FUEL: '⛽',
    TECH: '💾',
}

export function HexTooltip({ hex, position, isRevealed }: HexTooltipProps) {
    if (!hex || !position) return null

    return (
        <div
            className={cn(
                'fixed z-tooltip pointer-events-none',
                'bg-terminal-black/95 border border-terminal-green/50 rounded-lg',
                'px-3 py-2 font-mono text-xs shadow-lg',
                'backdrop-blur-sm'
            )}
            style={{
                left: position.x + 16,
                top: position.y + 16,
            }}
        >
            {isRevealed ? (
                <>
                    <div className="text-terminal-green font-bold mb-1">
                        {BIOME_NAMES[hex.biome] || hex.biome}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <span className={THREAT_COLORS[hex.threatLevel]}>
                            ⚠ {hex.threatLevel}
                        </span>
                        {hex.resource !== 'NONE' && (
                            <span>
                                {RESOURCE_ICONS[hex.resource]} {hex.resource}
                            </span>
                        )}
                    </div>
                    <div className="text-gray-500 mt-1">
                        [{hex.q}, {hex.r}]
                    </div>
                </>
            ) : (
                <div className="text-gray-500">
                    <span className="text-terminal-dim">???</span>
                    <div className="text-xs mt-1">[{hex.q}, {hex.r}]</div>
                </div>
            )}
        </div>
    )
}
