import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'

export interface PlayerStatusWidgetProps {
    hp: number
    maxHp: number
    className?: string
}

export const PlayerStatusWidget: React.FC<PlayerStatusWidgetProps> = ({
    hp,
    maxHp,
    className,
}) => {
    const [isVisible, setIsVisible] = useState(false)
    const lastHpRef = useRef(hp)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    useEffect(() => {
        // Show whenever HP changes
        if (hp !== lastHpRef.current) {
            setIsVisible(true)
            lastHpRef.current = hp

            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            // Hide after 3 seconds
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false)
            }, 3000)
        }
    }, [hp])

    return (
        <div
            className={cn(
                'fixed top-4 right-4 z-50 transition-opacity duration-500',
                isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
                className
            )}
        >
            <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-xl">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
                    {/* Placeholder for player avatar */}
                    <User className="w-8 h-8 text-slate-400" />
                </div>

                <div className="flex flex-col min-w-[100px] mr-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-200">HP</span>
                        <span className="text-xs font-mono text-slate-300">{hp} / {maxHp}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-red-500"
                            initial={{ width: `${(hp / maxHp) * 100}%` }}
                            animate={{ width: `${(hp / maxHp) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
