import React from 'react'
import { cn } from '@/shared/lib/utils/cn'

interface DetectiveMarkerProps {
    className?: string
    style?: React.CSSProperties
}

/**
 * A custom map marker for the Detective Mode.
 * Fixed pixel size, anchored at the bottom center.
 * Visual: A stylized token/pawn or a detective icon.
 */
export const DetectiveMarker: React.FC<DetectiveMarkerProps> = ({ className, style }) => {
    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-end pointer-events-none transform -translate-x-1/2 -translate-y-full",
                className
            )}
            style={style}
        >
            {/* Icon / Avatar */}
            <div className="w-12 h-12 rounded-full border-2 border-[#d4c5a3] bg-[#1a1612] shadow-lg flex items-center justify-center overflow-hidden relative z-10">
                <span className="text-2xl filter drop-shadow-md">🕵️‍♂️</span>
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
            </div>

            {/* Pin Point / Shadow */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#d4c5a3] -mt-[1px]" />

            {/* Ground Shadow */}
            <div className="absolute -bottom-1 w-8 h-2 bg-black/40 blur-[2px] rounded-full z-0" />
        </div>
    )
}
