import React from 'react'
import { cn } from '@/shared/lib/utils/cn'
import { User } from 'lucide-react'

export interface PlayerMarkerProps {
    name: string
    status?: string
    factionId?: string
    onClick?: () => void
}

export const PlayerMarker: React.FC<PlayerMarkerProps> = ({
    name,
    status,
    factionId,
    onClick,
}) => {
    // Determine color based on faction or status
    // For MVP, just use a distinct color
    const bgColor = status === 'in_combat' ? 'bg-red-600' : 'bg-blue-600';
    const borderColor = 'border-white';

    return (
        <div
            className={cn(
                'relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110',
                'w-8 h-8 rounded-full border-2 shadow-lg',
                bgColor,
                borderColor
            )}
            onClick={onClick}
            title={name}
        >
            <User className="w-5 h-5 text-white" />

            {/* Status indicator */}
            {status === 'trading' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white" />
            )}

            {/* Name label (visible on hover via CSS or always visible if needed) */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                {name}
            </div>
        </div>
    )
}
