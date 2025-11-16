import React from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { INVENTORY_QUICK_SLOTS } from '@/entities/item/model/constants'
import type { ItemState } from '@/entities/item/model/types'
import { useInventoryDragStore } from '@/features/inventory/model/useInventoryDrag'

type QuickAccessBarProps = {
  slots: Array<ItemState | null>
}

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({ slots }) => {
  const normalized = Array.from({ length: INVENTORY_QUICK_SLOTS }, (_, idx) => slots[idx] ?? null)
  const isDragging = useInventoryDragStore((state) => state.isDragging)
  const dropTarget = useInventoryDragStore((state) => state.target)
  const setDropTarget = useInventoryDragStore((state) => state.setDropTarget)

  return (
    <div className="glass-panel space-y-3 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
        <span>Quick Access</span>
        <span>{INVENTORY_QUICK_SLOTS} slots</span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {normalized.map((item, index) => (
          <motion.div
            key={index}
            layout
            whileHover={{ scale: 1.03 }}
            onPointerEnter={() => {
              if (!isDragging) return
              setDropTarget({ kind: 'quick', index })
            }}
            onPointerLeave={() => {
              if (dropTarget?.kind === 'quick' && dropTarget.index === index) {
                setDropTarget(null)
              }
            }}
            className={clsx(
              'relative rounded-lg border px-2 py-3 text-center transition',
              item ? 'border-amber-500/80 bg-amber-500/10' : 'border-slate-700 bg-slate-900/60',
              dropTarget?.kind === 'quick' && dropTarget.index === index && 'ring-2 ring-amber-300/80'
            )}
          >
            <span className="absolute left-1 top-1 text-[10px] text-slate-500">#{index + 1}</span>
            {item ? (
              <div className="flex flex-col items-center gap-1">
                <div className="text-xl leading-none">{item.icon}</div>
                <div className="text-xs font-semibold text-[color:var(--color-text-primary)]">{item.name}</div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">Empty</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default QuickAccessBar
