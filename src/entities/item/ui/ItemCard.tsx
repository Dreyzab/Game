import { motion } from 'framer-motion'
import type { ItemState } from '../model/types'
import { RARITY_COLORS } from '../model/types'
import { cn } from '@/shared/lib/utils/cn'

interface Props {
    item: ItemState
    isCompact?: boolean
    onClick?: () => void
    onContextMenu?: (e: React.MouseEvent) => void
}

export const ItemCard = ({ item, isCompact, onClick, onContextMenu }: Props) => {
    const durabilityPercent = item.stats.maxDurability
        ? ((item.condition ?? item.stats.maxDurability) / item.stats.maxDurability) * 100
        : 100

    return (
        <motion.div
            layoutId={item.instanceId}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={onClick}
            onContextMenu={onContextMenu}
            className={cn(
                "relative flex flex-col items-center justify-center rounded-md border-2 p-1 transition-colors cursor-pointer backdrop-blur-sm select-none",
                RARITY_COLORS[item.rarity],
                isCompact ? "h-12 w-12" : "h-20 w-20" // Slightly smaller to fit grids
            )}
        >
            {/* Icon */}
            <div className="text-2xl filter drop-shadow-md">
                {item.icon}
            </div>

            {/* Stack Count */}
            {item.quantity > 1 && (
                <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-black/60 px-1 rounded">
                    x{item.quantity}
                </span>
            )}

            {/* Durability Bar */}
            {item.stats.maxDurability && (
                <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-800/80 rounded-b-sm overflow-hidden">
                    <div
                        className={cn("h-full transition-all",
                            durabilityPercent < 20 ? "bg-red-500" :
                                durabilityPercent < 50 ? "bg-yellow-500" : "bg-green-500"
                        )}
                        style={{ width: `${durabilityPercent}%` }}
                    />
                </div>
            )}

            {/* Container Indicator (if it holds items) */}
            {item.stats.containerConfig && (
                <div className="absolute top-0 right-0 p-0.5">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                </div>
            )}
        </motion.div>
    )
}
