import React, { useMemo } from 'react'
import clsx from 'clsx'
import { INVENTORY_GRID_COLUMNS, INVENTORY_GRID_ROWS, INVENTORY_CELL_SIZE } from '@/entities/item/model/constants'
import type { ItemState } from '@/entities/item/model/types'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import { useDroppable, useDraggable } from '@dnd-kit/core'

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

// Droppable Cell Component
const DroppableCell = ({ x, y }: { x: number; y: number }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${x}-${y}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "border-r border-b border-slate-800/50 transition-colors",
        isOver && "bg-amber-500/20"
      )}
    />
  )
}

// Draggable Item Component
const DraggableItem = ({
  item,
  isSelected,
  isQuestProtected,
  onSelect,
}: {
  item: ItemState
  isSelected: boolean
  isQuestProtected: boolean
  onSelect?: (id: string) => void
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  })

  const template = ITEM_TEMPLATES[item.templateId]
  const w = template?.baseStats.width ?? 1
  const h = template?.baseStats.height ?? 1

  if (!item.gridPosition) return null

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelect?.(item.id)}
      className={clsx(
        "absolute m-[1px] rounded border transition-all cursor-pointer z-10 touch-none select-none",
        isSelected ? "border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)] z-20" : "border-slate-700 hover:border-slate-500",
        "bg-slate-900/90 flex items-center justify-center",
        isDragging && "opacity-30 z-50 pointer-events-none" // Hide original when dragging (or dim it)
      )}
      style={{
        gridColumnStart: item.gridPosition.x + 1,
        gridColumnEnd: `span ${w}`,
        gridRowStart: item.gridPosition.y + 1,
        gridRowEnd: `span ${h}`,
        width: 'calc(100% - 2px)',
        height: 'calc(100% - 2px)'
      }}
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
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  selectedItemId,
  onSelect,
  isQuestItem,
}) => {
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

  const isQuestItemFn = isQuestItem ?? (() => false)

  return (
    <div className="glass-panel relative w-fit select-none overflow-hidden p-4">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
        <span>Stash</span>
        <span>{items.length} items</span>
      </div>

      {/* The Grid Container */}
      <div
        className="relative grid border border-slate-800 bg-slate-950/80"
        style={{
          width: INVENTORY_GRID_COLUMNS * INVENTORY_CELL_SIZE,
          height: INVENTORY_GRID_ROWS * INVENTORY_CELL_SIZE,
          gridTemplateColumns: `repeat(${INVENTORY_GRID_COLUMNS}, ${INVENTORY_CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${INVENTORY_GRID_ROWS}, ${INVENTORY_CELL_SIZE}px)`
        }}
      >
        {/* Background Cells */}
        {gridCells.map((cell) => (
          <DroppableCell key={`${cell.x}:${cell.y}`} x={cell.x} y={cell.y} />
        ))}

        {/* Items Layer */}
        {items.map((item) => (
          <DraggableItem
            key={item.id}
            item={item}
            isSelected={item.id === selectedItemId}
            isQuestProtected={isQuestItemFn(item.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
