import React from 'react'
import type { InventoryContainer } from '@/entities/item/model/types'

type ContainersPanelProps = {
  containers: Record<string, InventoryContainer>
}

const titleMap: Record<InventoryContainer['kind'], string> = {
  backpack: 'Backpack',
  rig: 'Rig',
  pocket: 'Pocket',
  stash: 'Stash',
  equipment_storage: 'Equipment Storage',
}

export const ContainersPanel: React.FC<ContainersPanelProps> = ({ containers }) => {
  const list = Object.values(containers)

  if (list.length === 0) {
    return (
      <div className="glass-panel p-4 text-sm text-slate-500">
        No containers discovered yet. Find backpacks or rigs to increase capacity.
      </div>
    )
  }

  return (
    <div className="glass-panel space-y-4 p-4">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Containers</div>

      <div className="space-y-3">
        {list.map((container) => (
          <div
            key={container.id}
            className="rounded-lg border border-slate-700/80 px-3 py-3 text-sm transition hover:border-amber-500/60"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[color:var(--color-text-primary)] font-semibold">
                  {titleMap[container.kind]}
                </div>
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  {container.width}×{container.height}
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {container.items.length} items
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ContainersPanel
