import type { CSSProperties } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { CombatCard } from '@/entities/dreyzab-combat-simulator/model/types'
import CombatCardUI from './CombatCardUI'

type Props = {
    card: CombatCard
    disabled?: boolean
    onClick: () => void
    style?: CSSProperties
    className?: string
}

export default function DraggableCombatCard({ card, disabled = false, onClick, style, className }: Props) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: card.id,
        disabled,
        data: { card },
    })

    const mergedStyle: CSSProperties = {
        ...style,
        opacity: isDragging ? 0 : style?.opacity ?? 1,
        touchAction: 'none',
    }

    return (
        <CombatCardUI
            ref={setNodeRef}
            card={card}
            disabled={disabled}
            onClick={onClick}
            style={mergedStyle}
            className={className}
            {...listeners}
            {...attributes}
        />
    )
}
