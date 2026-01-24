import { useDroppable } from '@dnd-kit/core'
import { memo, type ReactNode } from 'react'

export type BattleDropZoneProps = {
    id: string
    disabled: boolean
    data: Record<string, unknown>
    isActive: boolean
    isValid: boolean
    highlightClassName: string
    children: ReactNode
}

const BattleDropZone = memo(({ id, disabled, data, isActive, isValid, highlightClassName, children }: BattleDropZoneProps) => {
    const { setNodeRef, isOver } = useDroppable({ id, disabled, data })

    return (
        <div ref={setNodeRef} className="relative h-full">
            {children}
            {isActive && isValid && (
                <div
                    className={[
                        'absolute inset-1 rounded-xl pointer-events-none transition-all',
                        highlightClassName,
                        isOver ? 'ring-4 opacity-100' : 'ring-2 opacity-40',
                    ].join(' ')}
                />
            )}
        </div>
    )
})

export default BattleDropZone
