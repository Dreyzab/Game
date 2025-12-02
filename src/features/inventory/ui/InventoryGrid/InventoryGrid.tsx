import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { INVENTORY_GRID_COLUMNS, INVENTORY_GRID_ROWS } from '@/entities/item/model/constants'
import type { ItemState } from '@/entities/item/model/types'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import { useInventoryDragStore } from '@/features/inventory/model/useInventoryDrag'
import { useInventoryStore } from '@/shared/stores/inventoryStore'
import { ItemTooltip } from '../ItemTooltip/ItemTooltip'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'

type InventoryGridProps = {
  items: ItemState[]
  selectedItemId?: string | null
  onSelect?: (itemId: string) => void
  onCompare?: (item: ItemState) => void
  isQuestItem?: (itemId: string) => boolean
}

type GridCell = {
  x: number
  y: number
}

type Rect = {
  left: number
  top: number
  width: number
  height: number
}

type TooltipState = {
  item: ItemState
  cellRect: Rect
  containerRect: Rect
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  selectedItemId,
  onSelect,
  onCompare,
  isQuestItem,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate background grid cells
  const gridCells = useMemo(() => {
    const cells: GridCell[] = []
    for (let y = 0; y < INVENTORY_GRID_ROWS; y++) {
      for (let x = 0; x < INVENTORY_GRID_COLUMNS; x++) {
        cells.push({ x, y })
      }
    }
    return cells
  }, [])

  const itemsById = useMemo(
    () =>
      items.reduce<Record<string, ItemState>>((acc, item) => {
        acc[item.id] = item
        return acc
      }, {}),
    [items]
  )

  const moveItemWithinGrid = useInventoryStore((state) => state.moveItemWithinGrid)
  const equipItem = useInventoryStore((state) => state.equipItem)
  const setQuickSlot = useInventoryStore((state) => state.setQuickSlot)

  const { isDragging, itemId: draggedItemId, target: dropTarget, startDrag, setDropTarget, updateCursor, endDrag, cursor } = useInventoryDragStore()

  const draggedItem = draggedItemId ? itemsById[draggedItemId] ?? null : null
  const isQuestItemFn = isQuestItem ?? (() => false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Interaction State
  const lastTapRef = useRef<{ time: number; id: string } | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isDragging) setTooltip(null)
  }, [isDragging])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moveMutation = useMutation((api as any).inventory.move)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const equipMutation = useMutation((api as any).inventory.equip)

  useEffect(() => {
    const handlePointerUp = () => {
      if (!isDragging) return
      if (draggedItemId && dropTarget) {
        if (dropTarget.kind === 'grid') {
          moveItemWithinGrid(draggedItemId, dropTarget.cell)
          moveMutation({
            itemId: draggedItemId,
            toGridPosition: dropTarget.cell
          }).catch(console.error)
        } else if (dropTarget.kind === 'equipment') {
          // Cast to string as slotId is generic string in mutation but specific in store
          equipItem(draggedItemId, dropTarget.slotId)
          equipMutation({
            itemId: draggedItemId,
            slot: dropTarget.slotId
          }).catch(console.error)
        } else if (dropTarget.kind === 'quick') {
          setQuickSlot(dropTarget.index, draggedItemId)
          equipMutation({
            itemId: draggedItemId,
            slot: `quick_${dropTarget.index}`
          }).catch(console.error)
        }
      }
      endDrag()
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [isDragging, draggedItemId, dropTarget, moveItemWithinGrid, equipItem, setQuickSlot, endDrag, moveMutation, equipMutation])


  const handleItemInteraction = (event: React.PointerEvent, item: ItemState) => {
    event.preventDefault()
    const now = Date.now()
    const isDoubleTap = lastTapRef.current &&
      lastTapRef.current.id === item.id &&
      (now - lastTapRef.current.time) < 300

    if (isDoubleTap) {
      console.log('Double tap on', item.name)
      // TODO: Implement auto-equip logic based on item kind
    } else {
      // Single Tap: Select
      if (onSelect) onSelect(item.id)
      lastTapRef.current = { time: now, id: item.id }

      // Long Press Logic
      longPressTimerRef.current = setTimeout(() => {
        console.log('Long press on', item.name)
        if (onCompare) onCompare(item)
      }, 500)
    }
  }

  const handlePointerUpItem = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handlePointerDownItem = (event: React.PointerEvent, item: ItemState) => {
    handleItemInteraction(event, item)

    startDrag(item.id, { type: 'grid' })
    if (item.gridPosition) {
      setDropTarget({ kind: 'grid', cell: item.gridPosition })
    }
    updateCursor({ x: event.clientX, y: event.clientY })
  }

  const handlePointerMoveGrid = (event: React.PointerEvent) => {
    if (!isDragging) return
    updateCursor({ x: event.clientX, y: event.clientY })

    // Calculate drop target based on cursor position relative to grid
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const cellWidth = rect.width / INVENTORY_GRID_COLUMNS
      const cellHeight = rect.height / INVENTORY_GRID_ROWS

      const col = Math.floor(x / cellWidth)
      const row = Math.floor(y / cellHeight)

      if (col >= 0 && col < INVENTORY_GRID_COLUMNS && row >= 0 && row < INVENTORY_GRID_ROWS) {
        setDropTarget({ kind: 'grid', cell: { x: col, y: row } })
      }
    }
  }

  const updateTooltipPosition = (target: HTMLElement, item: ItemState) => {
    const container = containerRef.current
    if (!container) return
    const nextCellRect = target.getBoundingClientRect()
    const nextContainerRect = container.getBoundingClientRect()
    const nextState: TooltipState = {
      item,
      cellRect: {
        left: nextCellRect.left,
        top: nextCellRect.top,
        width: nextCellRect.width,
        height: nextCellRect.height,
      },
      containerRect: {
        left: nextContainerRect.left,
        top: nextContainerRect.top,
        width: nextContainerRect.width,
        height: nextContainerRect.height,
      },
    }

    setTooltip((prev) => {
      if (
        prev &&
        prev.item.id === nextState.item.id &&
        Math.abs(prev.cellRect.left - nextState.cellRect.left) < 0.5 &&
        Math.abs(prev.cellRect.top - nextState.cellRect.top) < 0.5 &&
        Math.abs(prev.cellRect.width - nextState.cellRect.width) < 0.5 &&
        Math.abs(prev.cellRect.height - nextState.cellRect.height) < 0.5 &&
        Math.abs(prev.containerRect.left - nextState.containerRect.left) < 0.5 &&
        Math.abs(prev.containerRect.top - nextState.containerRect.top) < 0.5 &&
        Math.abs(prev.containerRect.width - nextState.containerRect.width) < 0.5 &&
        Math.abs(prev.containerRect.height - nextState.containerRect.height) < 0.5
      ) {
        return prev
      }
      return nextState
    })
  }

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>, item: ItemState | null) => {
    if (!item || isDragging) return
    updateTooltipPosition(event.currentTarget, item)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>, item: ItemState | null) => {
    if (!item || isDragging) return
    updateTooltipPosition(event.currentTarget, item)
  }

  const handleMouseLeave = () => setTooltip(null)

  const showTooltip = tooltip && !isDragging

  return (
    <div
      className="glass-panel relative h-[600px] w-full select-none overflow-hidden p-4"
      ref={containerRef}
      onPointerMove={handlePointerMoveGrid}
      onPointerLeave={() => isDragging && setDropTarget(null)}
    >
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
        <span>Stash</span>
        <span>{items.length} items</span>
      </div>

      {/* The Grid Container */}
      <div
        className="relative grid h-full w-full border border-slate-800 bg-slate-950/80"
        style={{
          gridTemplateColumns: `repeat(${INVENTORY_GRID_COLUMNS}, 1fr)`,
          gridTemplateRows: `repeat(${INVENTORY_GRID_ROWS}, 1fr)`
        }}
      >
        {/* Background Cells */}
        {gridCells.map((cell) => (
          <div
            key={`${cell.x}:${cell.y}`}
            className={clsx(
              "border-r border-b border-slate-800/50",
              isDragging && dropTarget?.kind === 'grid' && dropTarget.cell.x === cell.x && dropTarget.cell.y === cell.y && "bg-emerald-500/20"
            )}
          />
        ))}

        {/* Items Layer */}
        {items.map((item) => {
          if (!item.gridPosition) return null
          const template = ITEM_TEMPLATES[item.templateId]
          const w = template?.baseStats.width ?? 1
          const h = template?.baseStats.height ?? 1
          const isSelected = item.id === selectedItemId
          const isQuestProtected = isQuestItemFn(item.id)

          return (
            <div
              key={item.id}
              className={clsx(
                "absolute m-[1px] rounded border transition-all cursor-pointer z-10",
                isSelected ? "border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)] z-20" : "border-slate-700 hover:border-slate-500",
                "bg-slate-900/90 flex items-center justify-center",
                isDragging && draggedItemId === item.id && "opacity-50"
              )}
              style={{
                gridColumnStart: item.gridPosition.x + 1,
                gridColumnEnd: `span ${w}`,
                gridRowStart: item.gridPosition.y + 1,
                gridRowEnd: `span ${h}`,
                position: 'relative',
                width: 'calc(100% - 2px)',
                height: 'calc(100% - 2px)'
              }}
              onPointerDown={(e) => handlePointerDownItem(e, item)}
              onPointerUp={handlePointerUpItem}
              onPointerCancel={handlePointerUpItem}
              onMouseEnter={(e) => handleMouseEnter(e, item)}
              onMouseMove={(e) => handleMouseMove(e, item)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex flex-col items-center justify-center p-1 text-center overflow-hidden w-full h-full">
                <div className="text-xl">{template?.icon ?? item.templateId.slice(0, 2)}</div>
                {w > 1 && <div className="text-[10px] font-medium truncate w-full">{item.name}</div>}
                {isQuestProtected && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-bl" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Drag Preview */}
      {isDragging && draggedItem && cursor && typeof document !== 'undefined'
        ? createPortal(
          <div
            className="pointer-events-none fixed z-[9999] flex select-none items-center gap-2 rounded-xl border border-amber-500/40 bg-slate-900/95 px-4 py-2 text-sm text-amber-50 shadow-2xl backdrop-blur"
            style={{ left: cursor.x + 16, top: cursor.y + 16 }}
          >
            <span className="text-2xl">{ITEM_TEMPLATES[draggedItem.templateId]?.icon}</span>
            <div>
              <div className="font-semibold leading-tight">{draggedItem.name}</div>
            </div>
          </div>,
          document.body
        )
        : null}

      {showTooltip ? (
        <ItemTooltip
          item={tooltip.item}
          anchor={{ cellRect: tooltip.cellRect, containerRect: tooltip.containerRect }}
        />
      ) : null}
    </div>
  )
}

export default InventoryGrid
