import type React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { clsx } from 'clsx'
import { CELL_SIZE } from './constants'
import type { CoopInventoryItem as CoopInventoryItemType } from './types'
import type { ItemTemplate } from '@/shared/data/itemTypes'

interface Props {
  item: CoopInventoryItemType
  template: ItemTemplate
  isGridItem?: boolean
  isOverlay?: boolean
}

export default function CoopInventoryItem({ item, template, isGridItem = true, isOverlay = false }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.instanceId,
    disabled: isOverlay,
    data: {
      item,
      template,
      origin: isGridItem ? 'grid' : 'slot',
    },
  })

  const widthCells = template.baseStats?.width ?? 1
  const heightCells = template.baseStats?.height ?? 1

  const widthPx = widthCells * CELL_SIZE
  const heightPx = heightCells * CELL_SIZE

  const usePixelSize = isGridItem || isOverlay

  const style: React.CSSProperties = {
    width: usePixelSize ? `${widthPx - 2}px` : '100%',
    height: usePixelSize ? `${heightPx - 2}px` : '100%',
    position: isGridItem && !isOverlay ? 'absolute' : 'relative',
    left: isGridItem && !isOverlay ? `${item.x * CELL_SIZE + 1}px` : undefined,
    top: isGridItem && !isOverlay ? `${item.y * CELL_SIZE + 1}px` : undefined,
    zIndex: isOverlay ? 999 : isDragging ? 50 : 10,
    opacity: isOverlay ? 1 : isDragging ? 0 : 1,
  }

  const rarityBorder = {
    common: 'border-trinity-border',
    uncommon: 'border-trinity-border',
    rare: 'border-rarity-rare',
    epic: 'border-rarity-epic',
    legendary: 'border-rarity-legendary',
  }[template.rarity]

  const bgGradient = {
    common: 'bg-slate-800',
    uncommon: 'bg-slate-800 from-slate-800 to-emerald-900/15 bg-gradient-to-br',
    rare: 'bg-slate-800 from-slate-800 to-blue-900/20 bg-gradient-to-br',
    epic: 'bg-slate-800 from-slate-800 to-purple-900/20 bg-gradient-to-br',
    legendary: 'bg-slate-800 from-slate-800 to-yellow-900/20 bg-gradient-to-br',
  }[template.rarity]

  const isQuestItem = template.kind === 'quest' || Boolean(template.tags?.includes('quest'))

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        'group cursor-grab active:cursor-grabbing border shadow-sm transition-shadow overflow-hidden flex flex-col',
        rarityBorder,
        bgGradient,
        isQuestItem ? 'ring-1 ring-trinity-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]' : '',
        isDragging && !isOverlay ? 'shadow-none ring-0' : '',
        isOverlay ? 'shadow-2xl ring-2 ring-white/50 z-50 cursor-grabbing' : '',
        !isDragging && !isOverlay ? 'hover:border-white/40' : ''
      )}
    >
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {template.imageUrl ? (
          <img
            src={template.imageUrl}
            alt={template.name}
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl opacity-80">{template.icon}</div>
        )}

        <div className="absolute top-0 right-0 p-1">
          {isQuestItem && <div className="w-2 h-2 bg-trinity-warning rounded-full animate-pulse shadow-[0_0_5px_#f59e0b]" />}
        </div>

        {item.quantity > 1 && (
          <div className="absolute bottom-0 right-0 bg-black/60 px-1 text-[10px] text-gray-300 font-mono backdrop-blur-sm">
            x{item.quantity}
          </div>
        )}
      </div>
    </div>
  )
}

