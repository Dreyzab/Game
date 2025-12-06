import React from 'react'
import clsx from 'clsx'
import { INVENTORY_QUICK_SLOTS } from '@/entities/item/model/constants'
import type { ItemState } from '@/entities/item/model/types'
import { useDroppable } from '@dnd-kit/core'

type QuickAccessBarProps = {
  slots: Array<ItemState | null>
}

const QuickSlot = ({ index, item }: { index: number; item: ItemState | null }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `quick-${index + 1}`, // Assuming 1-based index for logic, or match handling in parent
  })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'relative rounded-lg border px-2 py-3 text-center transition-colors',
        item ? 'border-amber-500/80 bg-amber-500/10' : 'border-slate-700 bg-slate-900/60',
        isOver && 'ring-2 ring-amber-300/80 bg-amber-500/20'
      )}
    >
      <span className="absolute left-1 top-1 text-[10px] text-slate-500">#{index + 1}</span>
      {item ? (
        <div className="flex flex-col items-center gap-1">
          <div className="text-xl leading-none">{item.icon}</div>
          <div className="text-xs font-semibold text-(--color-text-primary)">{item.name}</div>
        </div>
      ) : (
        <div className="text-[11px] text-slate-500">Empty</div>
      )}
    </div>
  )
}

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({ slots }) => {
  const normalized = Array.from({ length: INVENTORY_QUICK_SLOTS }, (_, idx) => slots[idx] ?? null)

  return (
    <div className="glass-panel space-y-3 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
        <span>Quick Access</span>
        <span>{INVENTORY_QUICK_SLOTS} slots</span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {normalized.map((item, index) => (
          <QuickSlot key={index} index={index} item={item} />
        ))}
      </div>
    </div>
  )
}

export default QuickAccessBar
