import React from 'react'
import { cn } from '@/shared/lib/utils/cn'
import type { DetectivePointState, DetectivePointType } from './types'

interface DetectivePointMarkerProps {
    type: DetectivePointType
    state: DetectivePointState
    title?: string
    isSelected?: boolean
    isHovered?: boolean
    onClick?: () => void
}

/**
 * Renders a specific Detective Point (Not the player pawn).
 * Visual style depends on Type and State.
 */
export const DetectivePointMarker: React.FC<DetectivePointMarkerProps> = ({
    type,
    state,
    title,
    isSelected,
    isHovered,
    onClick
}) => {
    // Icons mapping
    const getIcon = () => {
        switch (type) {
            case 'bureau': return '🛡️'
            case 'crime': return '🔍' // Or 🩸
            case 'npc': return '👤'
            case 'support':
                if (title?.toLowerCase().includes('bank')) return '🏦'
                if (title?.toLowerCase().includes('pub')) return '🍺'
                if (title?.toLowerCase().includes('archive')) return '📚'
                return '📍'
            default: return '📍'
        }
    }

    // Color/Style mapping
    const getStyles = () => {
        if (state === 'active') {
            return 'bg-red-900 border-red-500 text-red-100 animate-pulse-slow shadow-[0_0_15px_rgba(220,38,38,0.7)]'
        }
        if (state === 'cleared') {
            return 'bg-gray-800 border-gray-600 text-gray-400 opacity-80 grayscale'
        }
        if (type === 'bureau') {
            return 'bg-[#d4af37] border-[#fffeb8] text-[#3e2e04] shadow-[0_0_10px_rgba(212,175,55,0.5)]'
        }
        // Discovered / Default
        return 'bg-[#2a2420] border-[#d4c5a3] text-[#d4c5a3]'
    }

    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                isSelected ? "scale-125 z-50" : "scale-100 z-10",
                isHovered ? "scale-110 z-40" : "",
                // Pulse animation for active leads
                state === 'active' && "animate-bounce-slight"
            )}
            onClick={(e) => {
                e.stopPropagation()
                onClick?.()
            }}
        >
            <div className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center font-serif text-lg shadow-md",
                getStyles()
            )}>
                {getIcon()}
            </div>

            {/* Label on Hover/Select/Active */}
            {(isHovered || isSelected || state === 'active' || type === 'bureau') && (
                <div className="absolute -bottom-8 bg-[#1a1612] text-[#d4c5a3] text-xs px-2 py-1 rounded border border-[#d4c5a3] whitespace-nowrap font-bold tracking-widest uppercase shadow-lg z-50">
                    {title}
                </div>
            )}
        </div>
    )
}
