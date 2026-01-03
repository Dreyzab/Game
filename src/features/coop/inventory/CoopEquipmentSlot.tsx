import { useDroppable } from '@dnd-kit/core'
import { clsx } from 'clsx'
import { CELL_SIZE } from './constants'
import type { CoopEquipmentSlotConfig, CoopInventoryItem } from './types'
import CoopInventoryItemView from './CoopInventoryItem'
import type { ItemTemplate } from '@/shared/data/itemTypes'

interface Props {
  config: CoopEquipmentSlotConfig
  equipped: { templateId: string; quantity: number } | null
  templates: Record<string, ItemTemplate>
}

export function CoopEquipmentSlot({ config, equipped, templates }: Props) {
  const equippedTemplate = equipped ? templates[equipped.templateId] : null

  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${config.id}`,
    data: { type: 'slot', slotId: config.id, accepts: config.accepts },
  })

  const widthPx = config.dimensions.w * CELL_SIZE
  const heightPx = config.dimensions.h * CELL_SIZE

  const item: CoopInventoryItem | null =
    equipped && equippedTemplate
      ? {
          instanceId: `equip-${config.id}`,
          templateId: equipped.templateId,
          quantity: equipped.quantity,
          x: 0,
          y: 0,
          containerId: config.id,
        }
      : null

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
          !item && 'hover:border-gray-500'
        )}
      >
        {!item && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <span className="text-2xl text-gray-500 font-thin">+</span>
          </div>
        )}

        {item && equippedTemplate && (
          <div className="w-full h-full p-[1px]">
            <CoopInventoryItemView item={item} template={equippedTemplate} isGridItem={false} />
          </div>
        )}
      </div>
    </div>
  )
}

