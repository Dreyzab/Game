import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { clsx } from 'clsx'
import { CELL_SIZE } from './constants'
import type { CoopInventoryItem } from './types'
import CoopInventoryItemView from './CoopInventoryItem'
import type { ItemTemplate } from '@/shared/data/itemTypes'

type PackInput = { templateId: string; quantity: number; w: number; h: number }
type PackedItem = PackInput & { x: number; y: number }

function packItems(items: PackInput[], gridWidth: number): PackedItem[] {
  const occupancy: boolean[][] = []

  const ensureRow = (y: number) => {
    while (occupancy.length <= y) occupancy.push(Array(gridWidth).fill(false))
  }

  const canPlace = (x: number, y: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) {
      ensureRow(y + dy)
      for (let dx = 0; dx < w; dx++) {
        if (occupancy[y + dy][x + dx]) return false
      }
    }
    return true
  }

  const occupy = (x: number, y: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) {
      ensureRow(y + dy)
      for (let dx = 0; dx < w; dx++) occupancy[y + dy][x + dx] = true
    }
  }

  const packed: PackedItem[] = []

  for (const item of items) {
    const w = Math.max(1, Math.min(gridWidth, item.w))
    const h = Math.max(1, item.h)

    let placed = false
    for (let y = 0; y < 200 && !placed; y++) {
      for (let x = 0; x <= gridWidth - w; x++) {
        if (!canPlace(x, y, w, h)) continue
        occupy(x, y, w, h)
        packed.push({ ...item, w, h, x, y })
        placed = true
        break
      }
    }

    if (!placed) {
      // Fallback: place at the next row start to avoid infinite loops.
      const y = occupancy.length
      occupy(0, y, w, h)
      packed.push({ ...item, w, h, x: 0, y })
    }
  }

  return packed
}

export interface CoopStashGridProps {
  containerId: string
  title: string
  inventory: Record<string, number>
  templates: Record<string, ItemTemplate>
  gridWidth: number
  viewportRows?: number
  className?: string
  emptyText?: string
}

export function CoopStashGrid({
  containerId,
  title,
  inventory,
  templates,
  gridWidth,
  viewportRows = 4,
  className,
  emptyText,
}: CoopStashGridProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container-${containerId}`,
    data: { type: 'container', containerId },
  })

  const { items, gridHeight, usedSlots, totalSlots } = useMemo(() => {
    const entries = Object.entries(inventory)
      .filter(([id, qty]) => id !== 'scrap' && Number(qty) > 0)
      .map(([templateId, qty]) => {
        const template = templates[templateId]
        const w = template?.baseStats?.width ?? 1
        const h = template?.baseStats?.height ?? 1
        return { templateId, quantity: Number(qty), w, h }
      })
      .filter((e) => templates[e.templateId])

    entries.sort((a, b) => {
      const areaA = a.w * a.h
      const areaB = b.w * b.h
      if (areaA !== areaB) return areaB - areaA
      return a.templateId.localeCompare(b.templateId)
    })

    const packed = packItems(entries, gridWidth)
    const height = Math.max(1, packed.reduce((acc, it) => Math.max(acc, it.y + it.h), 1))
    const used = packed.reduce((acc, it) => acc + it.w * it.h, 0)
    const total = gridWidth * height

    const out: CoopInventoryItem[] = packed.map((it) => ({
      instanceId: `${containerId}-${it.templateId}`,
      templateId: it.templateId,
      quantity: it.quantity,
      x: it.x,
      y: it.y,
      containerId,
    }))

    return { items: out, gridHeight: height, usedSlots: used, totalSlots: total }
  }, [containerId, gridWidth, inventory, templates])

  const widthPx = gridWidth * CELL_SIZE
  const heightPx = gridHeight * CELL_SIZE
  const viewportHeightPx = Math.min(gridHeight, viewportRows) * CELL_SIZE

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <div className="flex justify-between items-end border-b border-trinity-border pb-1 mb-1">
        <h3 className="text-trinity-accent font-bold tracking-widest text-sm uppercase">{title}</h3>
        <span className="text-[10px] text-gray-500 font-mono">
          {usedSlots}/{totalSlots} CELLS
        </span>
      </div>

      <div className="overflow-auto custom-scrollbar" style={{ height: viewportHeightPx }}>
        <div
          ref={setNodeRef}
          className={clsx(
            'relative bg-trinity-panel border transition-colors',
            isOver ? 'border-trinity-accent shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'border-trinity-border'
          )}
          style={{
            width: widthPx,
            height: heightPx,
            backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 1px, transparent 1px)',
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        >
          {items.length === 0 && emptyText && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-mono opacity-70 pointer-events-none">
              {emptyText}
            </div>
          )}

          {items.map((item) => (
            <CoopInventoryItemView key={item.instanceId} item={item} template={templates[item.templateId]} />
          ))}
        </div>
      </div>
    </div>
  )
}
