import React from 'react'
import type { ItemState } from '@/entities/item/model/types'

type ItemTooltipProps = {
  item: ItemState
  position: { x: number; y: number }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, position }) => {
  const offset = 18
  const width = 220
  const height = 140
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : width + 24
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : height + 24
  const left = clamp(position.x + offset, 12, viewportWidth - width - 12)
  const top = clamp(position.y + offset, 12, viewportHeight - height - 12)

  return (
    <div
      className="pointer-events-none fixed z-50 w-[220px] rounded-lg border border-amber-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur"
      style={{ left, top }}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{item.icon}</div>
        <div>
          <div className="text-sm font-semibold text-[color:var(--color-text-primary)]">{item.name}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300">{item.rarity}</div>
        </div>
      </div>
      <p className="mt-2 text-xs text-[color:var(--color-text-secondary)] line-clamp-3">{item.description}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
        {item.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-slate-600 px-2 py-0.5">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default ItemTooltip
