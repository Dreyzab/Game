import React from 'react'
import type { InventoryContainer } from '@/entities/item/model/types'
import { ItemCard } from '@/entities/item/ui/ItemCard'
import { clsx } from 'clsx'

type ContainerPanelProps = {
  container: InventoryContainer
  onItemClick?: (itemId: string) => void
}

export const ContainerPanel: React.FC<ContainerPanelProps> = ({ container, onItemClick }) => {
  const totalSlots = container.width * container.height
  const emptySlots = totalSlots - container.items.length

  return (
    <div className="glass-panel p-4 rounded-lg border border-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
          {container.name || 'Контейнер'}
        </h3>
        <span className="text-xs text-[color:var(--color-text-muted)]">
          {container.items.length}/{totalSlots}
        </span>
      </div>
      
      <div
        className={clsx(
          "grid gap-2 transition-colors",
          "border border-slate-800/50 rounded-md p-2 bg-slate-950/30"
        )}
        style={{ gridTemplateColumns: `repeat(${container.width}, minmax(0, 1fr))` }}
      >
        {container.items.map((item) => (
          <div
            key={item.id}
            className="aspect-square cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onItemClick?.(item.id)}
          >
            <ItemCard item={item} />
          </div>
        ))}
        
        {/* Пустые слоты */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-square border border-slate-800/30 rounded-sm bg-slate-950/20"
          />
        ))}
      </div>
    </div>
  )
}






