import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { INVENTORY_GRID_COLUMNS, INVENTORY_GRID_ROWS } from '@/entities/item/model/constants'
import type { ItemState } from '@/entities/item/model/types'
import { useInventoryDragStore } from '@/features/inventory/model/useInventoryDrag'
import { useInventoryStore } from '@/shared/stores/inventoryStore'
import { ItemTooltip } from '../ItemTooltip/ItemTooltip'

type InventoryGridProps = {
  items: ItemState[]
  selectedItemId?: string | null
  onSelect?: (itemId: string) => void
  isQuestItem?: (itemId: string) => boolean
}

type GridCell = {
  key: string
  x: number
  y: number
  item: ItemState | null
}

const totalCells = INVENTORY_GRID_COLUMNS * INVENTORY_GRID_ROWS

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  selectedItemId,
  onSelect,
  isQuestItem,
}) => {
  const cells = useMemo(() => {
    const byCoordinates = new Map<string, ItemState>()
    const unplaced: ItemState[] = []

    items.forEach((item) => {
      if (item.gridPosition) {
        const { x, y } = item.gridPosition
        const key = `${Math.max(0, Math.min(INVENTORY_GRID_COLUMNS - 1, x))}:${Math.max(
          0,
          Math.min(INVENTORY_GRID_ROWS - 1, y)
        )}`
        if (!byCoordinates.has(key)) {
          byCoordinates.set(key, item)
          return
        }
      }
      unplaced.push(item)
    })

    const result: GridCell[] = []
    let fallbackIndex = 0

    for (let y = 0; y < INVENTORY_GRID_ROWS; y += 1) {
      for (let x = 0; x < INVENTORY_GRID_COLUMNS; x += 1) {
        const key = `${x}:${y}`
        let cellItem = byCoordinates.get(key) ?? null

        if (!cellItem && fallbackIndex < unplaced.length) {
          cellItem = unplaced[fallbackIndex]
          fallbackIndex += 1
        }

        result.push({ key, x, y, item: cellItem })
      }
    }

    return result
  }, [items])

  const itemsById = useMemo(
    () =>
      items.reduce<Record<string, ItemState>>((acc, item) => {
        acc[item.id] = item
        return acc
      }, {}),
    [items]
  )

  const cellMap = useMemo(() => {
    const map = new Map<string, GridCell>()
    cells.forEach((cell) => map.set(cell.key, cell))
    return map
  }, [cells])

  const moveItemWithinGrid = useInventoryStore((state) => state.moveItemWithinGrid)
  const equipItem = useInventoryStore((state) => state.equipItem)
  const setQuickSlot = useInventoryStore((state) => state.setQuickSlot)

  const isDragging = useInventoryDragStore((state) => state.isDragging)
  const draggedItemId = useInventoryDragStore((state) => state.itemId)
  const dropTarget = useInventoryDragStore((state) => state.target)
  const startDrag = useInventoryDragStore((state) => state.startDrag)
  const setDropTarget = useInventoryDragStore((state) => state.setDropTarget)
  const updateCursor = useInventoryDragStore((state) => state.updateCursor)
  const endDrag = useInventoryDragStore((state) => state.endDrag)
  const cursor = useInventoryDragStore((state) => state.cursor)

  const draggedItem = draggedItemId ? itemsById[draggedItemId] ?? null : null
  const isQuestItemFn = isQuestItem ?? (() => false)
  const [tooltip, setTooltip] = useState<{ item: ItemState; x: number; y: number } | null>(null)
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (isDragging) setTooltip(null)
  }, [isDragging])

  useEffect(() => {
    const handlePointerUp = () => {
      if (!isDragging) return
      if (draggedItemId && dropTarget) {
        if (dropTarget.kind === 'grid') {
          moveItemWithinGrid(draggedItemId, dropTarget.cell)
        } else if (dropTarget.kind === 'equipment') {
          equipItem(draggedItemId, dropTarget.slotId)
        } else if (dropTarget.kind === 'quick') {
          setQuickSlot(dropTarget.index, draggedItemId)
        }
      }
      endDrag()
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [isDragging, draggedItemId, dropTarget, moveItemWithinGrid, equipItem, setQuickSlot, endDrag])

  const selectedCell = selectedItemId ? itemsById[selectedItemId]?.gridPosition ?? null : null

  useEffect(() => {
    if (selectedCell) {
      setFocusedCell((prev) =>
        prev && prev.x === selectedCell.x && prev.y === selectedCell.y ? prev : selectedCell
      )
    } else if (!focusedCell) {
      setFocusedCell({ x: 0, y: 0 })
    }
  }, [selectedCell, focusedCell])

  const handleSelect = (item: ItemState | null) => {
    if (!item || !onSelect) return
    onSelect(item.id)
  }

  const handleCellInteraction = (cell: GridCell) => {
    setFocusedCell({ x: cell.x, y: cell.y })
    handleSelect(cell.item)
  }

  const handlePointerDown = (event: React.PointerEvent, cell: GridCell) => {
    if (!cell.item) return
    event.preventDefault()
    setFocusedCell({ x: cell.x, y: cell.y })
    startDrag(cell.item.id, { type: 'grid' })
    setDropTarget({ kind: 'grid', cell: { x: cell.x, y: cell.y } })
    updateCursor({ x: event.clientX, y: event.clientY })
  }

  const handlePointerEnterCell = (cell: GridCell) => {
    if (!isDragging) return
    setDropTarget({ kind: 'grid', cell: { x: cell.x, y: cell.y } })
  }

  const handlePointerMoveGrid = (event: React.PointerEvent) => {
    if (!isDragging) return
    updateCursor({ x: event.clientX, y: event.clientY })
  }

  const handlePointerLeaveGrid = () => {
    if (isDragging && dropTarget?.kind === 'grid') {
      setDropTarget(null)
    }
  }

  const handleMouseEnter = (event: React.MouseEvent, item: ItemState | null) => {
    if (!item || isDragging) return
    setTooltip({ item, x: event.clientX, y: event.clientY })
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!tooltip || isDragging) return
    setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : prev))
  }

  const handleMouseLeave = () => setTooltip(null)

  const showTooltip = tooltip && !isDragging

  const maxX = INVENTORY_GRID_COLUMNS - 1
  const maxY = INVENTORY_GRID_ROWS - 1

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = event
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (!arrowKeys.includes(key) && key !== 'Enter' && key !== ' ') {
      return
    }

    event.preventDefault()

    if (!focusedCell) {
      const initialCell = selectedCell ?? { x: 0, y: 0 }
      setFocusedCell(initialCell)
      const cell = cellMap.get(`${initialCell.x}:${initialCell.y}`)
      if (cell?.item) {
        handleSelect(cell.item)
      }
      return
    }

    if (arrowKeys.includes(key)) {
      let { x, y } = focusedCell
      if (key === 'ArrowUp') y = Math.max(0, y - 1)
      if (key === 'ArrowDown') y = Math.min(maxY, y + 1)
      if (key === 'ArrowLeft') x = Math.max(0, x - 1)
      if (key === 'ArrowRight') x = Math.min(maxX, x + 1)
      const nextCell = { x, y }
      setFocusedCell(nextCell)
      const cell = cellMap.get(`${x}:${y}`)
      if (cell?.item) {
        handleSelect(cell.item)
      }
      return
    }

    const active = focusedCell ? cellMap.get(`${focusedCell.x}:${focusedCell.y}`) : null
    if (active) {
      handleCellInteraction(active)
    }
  }

  return (
    <div
      className="glass-panel relative space-y-4 p-4"
      tabIndex={0}
      role="grid"
      aria-label="Inventory grid"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
        <span>Inventory Grid</span>
        <span>
          {items.length}/{totalCells} items
        </span>
      </div>

      <div
        className="grid gap-2"
        onPointerMove={handlePointerMoveGrid}
        onPointerLeave={handlePointerLeaveGrid}
        style={{ gridTemplateColumns: `repeat(${INVENTORY_GRID_COLUMNS}, minmax(0, 1fr))` }}
      >
        {cells.map((cell) => {
          const isSelected = cell.item?.id === selectedItemId
          const isQuestProtected = cell.item ? isQuestItemFn(cell.item.id) : false
          const isDropTarget =
            isDragging &&
            dropTarget?.kind === 'grid' &&
            dropTarget.cell.x === cell.x &&
            dropTarget.cell.y === cell.y
          return (
            <motion.button
              key={cell.key}
              type="button"
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleCellInteraction(cell)}
              onPointerDown={(event) => handlePointerDown(event, cell)}
              onPointerEnter={() => handlePointerEnterCell(cell)}
              onMouseEnter={(event) => handleMouseEnter(event, cell.item)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={clsx(
                'relative rounded border bg-slate-950/70 p-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/70',
                cell.item
                  ? isSelected
                    ? 'border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.55)]'
                    : 'border-amber-500/70 shadow-[0_0_12px_rgba(251,191,36,0.35)] hover:border-amber-400/90'
                  : 'border-slate-800 hover:border-slate-600/80',
                isDropTarget && 'ring-2 ring-emerald-400/80 ring-offset-0',
                focusedCell && focusedCell.x === cell.x && focusedCell.y === cell.y && 'ring-1 ring-sky-400/80'
              )}
            >
              <span className="absolute left-1 top-1 text-[10px] font-semibold text-slate-500">
                {cell.x + 1}-{cell.y + 1}
              </span>
              {isQuestProtected ? (
                <span className="absolute right-1 top-1 rounded bg-amber-500/80 px-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-900">
                  Quest
                </span>
              ) : null}
              <div className="flex h-20 flex-col items-center justify-center gap-1 text-center">
                {cell.item ? (
                  <>
                    <div className="text-2xl">{cell.item.icon}</div>
                    <div className="text-[11px] font-semibold text-[color:var(--color-text-primary)]">
                      {cell.item.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400">{cell.item.rarity}</div>
                  </>
                ) : (
                  <div className="text-[10px] text-slate-600">Empty</div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {isDragging && draggedItem ? (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-4 rounded-full bg-slate-900/90 px-4 py-2 text-sm text-slate-100 shadow-lg ring-1 ring-amber-500/30"
          >
            Move <span className="font-semibold text-amber-200">{draggedItem.name}</span>{' '}
            {dropTarget
              ? dropTarget.kind === 'grid'
                ? `to cell ${dropTarget.cell.x + 1}-${dropTarget.cell.y + 1}`
                : dropTarget.kind === 'equipment'
                  ? `to ${dropTarget.slotId} slot`
                  : `to quick slot #${dropTarget.index + 1}`
              : '— select a slot'}
          </motion.div>
        </div>
      ) : null}

      {showTooltip ? <ItemTooltip item={tooltip.item} position={{ x: tooltip.x, y: tooltip.y }} /> : null}

      {isDragging && draggedItem && cursor && typeof document !== 'undefined'
        ? createPortal(
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-none fixed z-[9999] flex select-none items-center gap-2 rounded-xl border border-amber-500/40 bg-slate-900/95 px-4 py-2 text-sm text-amber-50 shadow-2xl backdrop-blur"
              style={{ left: cursor.x + 16, top: cursor.y + 16 }}
            >
              <span className="text-2xl">{draggedItem.icon}</span>
              <div>
                <div className="font-semibold leading-tight">{draggedItem.name}</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-amber-300">{draggedItem.rarity}</div>
              </div>
            </motion.div>,
            document.body
          )
        : null}
    </div>
  )
}

export default InventoryGrid
