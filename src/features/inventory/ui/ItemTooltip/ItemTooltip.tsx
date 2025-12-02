import React from 'react'
import type { ItemState } from '@/entities/item/model/types'

type Rect = {
  left: number
  top: number
  width: number
  height: number
}

type ItemTooltipProps = {
  item: ItemState
  anchor: {
    cellRect: Rect
    containerRect: Rect
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, anchor }) => {
  const width = 220
  const height = 140
  const gap = 12

  const relativeLeft = anchor.cellRect.left - anchor.containerRect.left
  const relativeTop = anchor.cellRect.top - anchor.containerRect.top

  const containerWidth = anchor.containerRect.width
  const containerHeight = anchor.containerRect.height

  const spaceRight = containerWidth - (relativeLeft + anchor.cellRect.width)
  const spaceLeft = relativeLeft

  let left: number
  if (spaceRight >= width + gap) {
    left = relativeLeft + anchor.cellRect.width + gap
  } else if (spaceLeft >= width + gap) {
    left = relativeLeft - width - gap
  } else {
    left = clamp(
      relativeLeft + anchor.cellRect.width / 2 - width / 2,
      0,
      Math.max(0, containerWidth - width)
    )
  }

  const centerAlignedTop = relativeTop + anchor.cellRect.height / 2 - height / 2
  const top = clamp(centerAlignedTop, 0, Math.max(0, containerHeight - height))

  return (
    <div
      className="pointer-events-none absolute z-50 w-[220px] rounded-lg border border-amber-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur"
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
