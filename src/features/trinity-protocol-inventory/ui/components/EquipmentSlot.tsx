import { useDroppable } from '@dnd-kit/core'
import { clsx } from 'clsx'
import { CELL_SIZE } from '../../model/constants'
import { useTrinityInventoryStore } from '../../model/store'
import type { EquipmentSlotConfig } from '../../model/types'
import InventoryItem from './InventoryItem'

interface Props {
  config: EquipmentSlotConfig
}

const getSlotDimensions = (id: string) => {
  switch (id) {
    case 'primary':
    case 'secondary':
      return { w: 4, h: 2 }
    case 'backpack':
    case 'rig':
    case 'helmet':
    case 'armor':
      return { w: 2, h: 2 }
    case 'pocket1':
    case 'pocket2':
    case 'pocket3':
    case 'pocket4':
      return { w: 1, h: 1 }
    default:
      return { w: 2, h: 2 }
  }
}

export function EquipmentSlot({ config }: Props) {
  const { items, templates, equipment } = useTrinityInventoryStore()
  const equippedInstanceId = equipment[config.id]
  const equippedItem = equippedInstanceId ? items[equippedInstanceId] : null

  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${config.id}`,
    data: { type: 'slot', slotId: config.id, accepts: config.accepts },
  })

  const dim = getSlotDimensions(config.id)
  const widthPx = dim.w * CELL_SIZE
  const heightPx = dim.h * CELL_SIZE

  return (
    <div className="flex flex-col gap-1 items-center md:items-start">
      {config.label && <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase">{config.label}</span>}

      <div
        ref={setNodeRef}
        style={{ width: widthPx, height: heightPx }}
        className={clsx(
          'border bg-trinity-panel/50 flex items-center justify-center relative transition-all',
          isOver
            ? 'border-trinity-accent bg-trinity-accent/10 shadow-[inset_0_0_20px_rgba(14,165,233,0.2)]'
            : 'border-trinity-border',
          !equippedItem && 'hover:border-gray-500'
        )}
      >
        {!equippedItem && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <span className="text-2xl text-gray-500 font-thin">+</span>
          </div>
        )}

        {equippedItem && (
          <div className="w-full h-full p-[1px]">
            <InventoryItem item={equippedItem} template={templates[equippedItem.templateId]} isGridItem={false} />
          </div>
        )}
      </div>
    </div>
  )
}

