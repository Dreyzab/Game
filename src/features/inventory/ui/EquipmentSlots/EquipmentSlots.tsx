import type { EquipmentSlots as EquipmentSlotsType, SlotKey, ItemState } from '@/entities/item/model/types'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import { clsx } from 'clsx'
import { useDroppable, useDraggable } from '@dnd-kit/core'

type EquipmentSlotsProps = {
  equipment: EquipmentSlotsType
  activeDragItem?: ItemState | null
  onCompare?: (item: ItemState) => void
  onUnequip?: (slotId: string) => void
  onSelect?: (itemId: string) => void
}

// Positions are percentages relative to the container (which matches the image aspect ratio)
const SLOT_CONFIG: Record<string, { label: string; icon: string; className: string }> = {
  helmet: { label: 'Head', icon: 'Helmet', className: 'top-[5%] left-1/2 -translate-x-1/2' },
  armor: { label: 'Body', icon: 'Armor', className: 'top-[25%] left-1/2 -translate-x-1/2' },
  primary: { label: 'Primary', icon: 'Weapon', className: 'top-[25%] left-[10%]' },
  secondary: { label: 'Secondary', icon: 'Shield', className: 'top-[25%] right-[10%]' },
  clothing_bottom: { label: 'Legs', icon: 'Pants', className: 'top-[55%] left-1/2 -translate-x-1/2' },
  backpack: { label: 'Backpack', icon: 'Backpack', className: 'bottom-[5%] right-[10%]' },
  rig: { label: 'Rig', icon: 'Rig', className: 'bottom-[5%] left-[10%]' },
  artifacts: { label: 'Artifact', icon: 'Artifact', className: 'hidden' },
  quick: { label: 'Quick', icon: 'Quick', className: 'hidden' },
}

const DraggableEquippedItem = ({ item, onSelect }: { item: ItemState; onSelect?: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  })

  const template = ITEM_TEMPLATES[item.templateId]

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={clsx(
        "relative h-full w-full p-1 cursor-pointer touch-none",
        isDragging && "opacity-30"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(item.id)
      }}
    >
      <div className={clsx(
        "h-full w-full flex items-center justify-center text-xs overflow-hidden rounded-sm",
        template?.rarity === 'legendary' && "bg-amber-500/20 border border-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.3)]",
        template?.rarity === 'epic' && "bg-purple-500/20 border border-purple-500 shadow-[inset_0_0_10px_rgba(168,85,247,0.3)]",
        template?.rarity === 'rare' && "bg-blue-500/20 border border-blue-500 shadow-[inset_0_0_10px_rgba(59,130,246,0.3)]",
        !template?.rarity && "bg-slate-700/50"
      )}>
        {template?.icon ?? item.templateId.slice(0, 2)}
      </div>
    </div>
  )
}

const DroppableSlot = ({
  slotId,
  config,
  item,
  onSelect,
}: {
  slotId: string
  config: { label: string; icon: string; className: string }
  item: ItemState | null
  onUnequip?: (slotId: string) => void
  onSelect?: (itemId: string) => void
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slotId}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'absolute flex h-20 w-20 items-center justify-center transition-all duration-200',
        'bg-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] backdrop-blur-sm',
        'border border-slate-700/50',
        'rounded-sm',
        config.className,
        isOver && 'border-amber-500 bg-amber-500/20 scale-105'
      )}
    >
      {item ? (
        <DraggableEquippedItem item={item} onSelect={onSelect} />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-600/50 pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider font-bold">{config.label}</span>
        </div>
      )}
    </div>
  )
}

export default function EquipmentSlots({ equipment, onUnequip, onSelect }: EquipmentSlotsProps) {

  return (
    <div className="relative mx-auto w-full rounded-lg border border-slate-800 bg-slate-950/50 p-4 aspect-[2/3] min-h-[400px] max-h-[600px]">
      {/* Silhouette Background */}
      <div className="absolute inset-0 flex items-center justify-center p-4 opacity-50 pointer-events-none">
        <img
          src="/images/ui/stalker_silhouette.png"
          alt="Character Silhouette"
          className="h-full w-full object-fill opacity-60 mix-blend-overlay"
        />
      </div>

      {Object.entries(SLOT_CONFIG).map(([key, config]) => {
        if (config.className === 'hidden') return null
        const item = equipment[key as SlotKey]
        const singleItem = (item && !Array.isArray(item)) ? item : null

        return (
          <DroppableSlot
            key={key}
            slotId={key}
            config={config}
            item={singleItem}
            onUnequip={onUnequip}
            onSelect={onSelect}
          />
        )
      })}
    </div>
  )
}
