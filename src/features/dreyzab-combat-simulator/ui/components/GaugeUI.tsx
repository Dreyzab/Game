
import { memo } from 'react'
import { motion } from 'framer-motion'
import { toClampedPercent } from './combatUiMath'

interface Props {
    value: number
    max: number
    label: string
    color: string
}

const GaugeUI = ({ value, max, label, color }: Props) => {
    const safeValue = Number.isFinite(value) ? value : 0
    const safeMax = Number.isFinite(max) ? max : 0

    const percent = toClampedPercent(safeValue, safeMax)
    const ratio = safeMax > 0 ? safeValue / safeMax : 0
    const rotation = -90 + percent * 1.8

    const isCritical = ratio <= 0.25 && safeMax > 0
    const isWarn = ratio <= 0.5 && !isCritical && safeMax > 0

    const displayValue = Math.floor(safeValue)
    const displayMax = safeMax > 0 ? Math.floor(safeMax) : 0
    const title = safeMax > 0
        ? `${label}: ${displayValue}/${displayMax} (${Math.round(percent)}%)`
        : `${label}: ${displayValue} (${Math.round(percent)}%)`

    return (
        <motion.div
            className="flex flex-col items-center w-14"
            title={title}
            aria-label={title}
            role="img"
            animate={isCritical ? { x: [0, -1, 1, -1, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.2, repeatDelay: Math.random() * 0.5 }}
        >
            <div className={`relative w-12 h-8 bg-zinc-950 rounded-t-full border overflow-hidden shadow-inner ${isCritical ? 'border-red-500/50 shadow-red-900/20' : 'border-zinc-800'}`}>
                <div className="absolute inset-0 opacity-20 border-b border-zinc-800" />

                {/* Needle */}
                <div
                    className="absolute bottom-0 left-1/2 w-0.5 h-6 origin-bottom transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, backgroundColor: isCritical ? '#ef4444' : color }}
                />

                {/* Pivot */}
                <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-600" />

                {/* Warning Glow */}
                {isCritical && (
                    <motion.div
                        className="absolute inset-0 bg-red-500/20 mix-blend-overlay"
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    />
                )}
            </div>

            <div className={`text-[9px] font-bold mt-1 uppercase leading-none ${isCritical ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`}>
                {label} <span className={isCritical ? 'text-red-400' : isWarn ? 'text-amber-200' : 'text-zinc-300'}>{displayValue}</span>
            </div>
        </motion.div>
    )
}

export default memo(GaugeUI)
