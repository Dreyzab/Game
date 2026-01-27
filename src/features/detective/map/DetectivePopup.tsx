import React from 'react'
import type { MapPoint } from '@/shared/types/map'
import type { DetectivePointMetadata } from './types'
import { cn } from '@/shared/lib/utils/cn'
import { useTranslation } from 'react-i18next'

interface DetectivePopupProps {
    point: MapPoint
    onClose: () => void
    onAction: (action: 'investigate' | 'interrogate' | 'review' | 'enter') => void
}

/**
 * Vintage-styled popup for Detective Mode interactions.
 * Shows specific actions based on the point type and state.
 */
export const DetectivePopup: React.FC<DetectivePopupProps> = ({
    point,
    onClose,
    onAction
}) => {
    const { t } = useTranslation('detective')
    const meta = point.metadata as DetectivePointMetadata | undefined
    const type = meta?.detectiveType || 'support'
    const state = meta?.detectiveState || 'discovered'

    const getActionLabel = () => {
        if (state === 'cleared') return t('ui.review_notes')
        switch (type) {
            case 'crime': return t('ui.investigate')
            case 'npc': return t('ui.interrogate')
            case 'bureau': return t('ui.open_dossier')
            default: return t('ui.details')
        }
    }

    const handlePrimaryAction = () => {
        if (type === 'bureau') onAction('enter')
        else if (type === 'npc') onAction('interrogate')
        else if (state === 'cleared') onAction('review')
        else onAction('investigate')
    }

    return (
        <div className="bg-[#fdfbf7] p-4 min-w-[280px] max-w-[320px] rounded-sm shadow-xl border-2 border-[#d4c5a3] font-serif relative"
            style={{ backgroundImage: 'url("/images/paper-texture.png")', backgroundSize: '200px' }}>

            {/* Close Button X */}
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-[#8b7e66] hover:text-[#5a4d33] font-bold"
            >
                ✕
            </button>

            {/* Title */}
            <h3 className="text-xl font-bold text-[#2a2420] mb-1 font-mono tracking-tighter uppercase border-b border-[#d4c5a3] pb-2">
                {point.title}
            </h3>

            {/* Description */}
            <p className="text-[#4a4036] text-sm leading-relaxed mb-4 italic">
                {point.description}
            </p>

            {/* State Indicator */}
            <div className="flex items-center gap-2 mb-4 justify-center">
                <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-widest",
                    state === 'active' ? "bg-red-50 text-red-800 border-red-200" :
                        state === 'cleared' ? "bg-gray-100 text-gray-500 border-gray-300" :
                            "bg-[#f0eadd] text-[#8b7e66] border-[#d4c5a3]"
                )}>
                    {t(`ui.${state}`)}
                </span>
            </div>

            {/* Primary Action Button */}
            <button
                onClick={handlePrimaryAction}
                className={cn(
                    "w-full py-3 px-4 font-bold text-sm tracking-[0.2em] uppercase transition-all transform hover:translate-y-[-1px] active:translate-y-[1px]",
                    state === 'active'
                        ? "bg-[#8b2323] text-[#fdfbf7] shadow-[2px_2px_0_0_#4a1212] hover:bg-[#a62b2b]"
                        : "bg-[#2a2420] text-[#d4c5a3] shadow-[2px_2px_0_0_#d4c5a3] hover:bg-[#3e3430]"
                )}
            >
                {getActionLabel()}
            </button>

        </div>
    )
}
