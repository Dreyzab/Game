import React from 'react'
import type { InventoryContainer as InventoryContainerType } from '@/entities/item/model/types'

type InventoryContainerProps = {
  containers: Record<string, InventoryContainerType>
  activeId: string | null
  onChange: (id: string | null) => void
}

export const InventoryContainer: React.FC<InventoryContainerProps> = ({ containers, activeId, onChange }) => {
  const list = Object.values(containers)
  if (list.length === 0) return null

  return (
    <div className="glass-panel space-y-2 p-3">
      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Containers</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
            activeId === null ? 'bg-amber-500 text-black' : 'border border-slate-700 text-slate-400'
          }`}
        >
          Main
        </button>
        {list.map((container) => (
          <button
            key={container.id}
            type="button"
            onClick={() => onChange(container.id)}
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
              activeId === container.id ? 'bg-amber-500 text-black' : 'border border-slate-700 text-slate-400'
            }`}
          >
            {container.kind}
          </button>
        ))}
      </div>
    </div>
  )
}

export default InventoryContainer

