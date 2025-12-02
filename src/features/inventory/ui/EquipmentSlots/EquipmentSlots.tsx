import React from 'react'
import { useInventoryDragStore } from '@/features/inventory/model/useInventoryDrag'
import type { EquipmentSlots as EquipmentSlotsType, SlotKey, ItemState } from '@/entities/item/model/types'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import { clsx } from 'clsx'

type EquipmentSlotsProps = {
  equipment: EquipmentSlotsType
  onCompare?: (item: ItemState) => void
  onUnequip?: (slotId: string) => void
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

export default function EquipmentSlots({ equipment, onCompare, onUnequip }: EquipmentSlotsProps) {
  const { isDragging, setDropTarget } = useInventoryDragStore()
  const [hoveredSlot, setHoveredSlot] = React.useState<string | null>(null)

  // Interaction State
  const lastTapRef = React.useRef<{ time: number; slot: string } | null>(null)
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSlotInteraction = (event: React.PointerEvent, slotId: string, item?: ItemState | null) => {
    event.preventDefault()
    if (!item) return

    const now = Date.now()
    const isDoubleTap = lastTapRef.current &&
      lastTapRef.current.slot === slotId &&
      (now - lastTapRef.current.time) < 300

    if (isDoubleTap) {
      console.log('Double tap on slot', slotId)
      if (onUnequip) onUnequip(slotId)
    } else {
      lastTapRef.current = { time: now, slot: slotId }

      longPressTimerRef.current = setTimeout(() => {
        console.log('Long press on slot', slotId)
        if (onCompare) onCompare(item)
      }, 500)
    }
  }

  const handlePointerUpSlot = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleMouseEnter = (slotId: string) => {
    if (isDragging) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDropTarget({ kind: 'equipment', slotId: slotId as any })
    }
    setHoveredSlot(slotId)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setDropTarget(null)
    }
    setHoveredSlot(null)
  }

  return (
    <div className="relative mx-auto w-full rounded-lg border border-slate-800 bg-slate-950/50 p-4" style={{ aspectRatio: '2/3', minHeight: '400px', maxHeight: '600px' }}>
      {/* Silhouette Background */}
      <div className="absolute inset-0 flex items-center justify-center p-4 opacity-50 pointer-events-none">
        <img
          src="/images/ui/stalker_silhouette.png"
          alt="Character Silhouette"
          className="h-full w-auto object-contain opacity-60 mix-blend-overlay"
        />
      </div>

      {Object.entries(SLOT_CONFIG).map(([key, config]) => {
        if (config.className === 'hidden') return null

        const item = equipment[key as SlotKey]
        const singleItem = (item && !Array.isArray(item)) ? item : null
        const template = singleItem ? ITEM_TEMPLATES[singleItem.templateId] : undefined

        return (
          <div
            key={key}
            className={clsx(
              'absolute flex h-20 w-20 items-center justify-center transition-all duration-200',
              // Cutout styling
              'bg-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] backdrop-blur-sm',
              'border border-slate-700/50',
              'rounded-sm', // Slightly rounded corners for a utilitarian look
              config.className,
              isDragging && 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
              hoveredSlot === key && 'border-amber-500 bg-amber-500/20 scale-105',
              !isDragging && !hoveredSlot && 'hover:border-slate-500 hover:bg-slate-900/60'
            )}
            onMouseEnter={() => handleMouseEnter(key)}
            onMouseLeave={handleMouseLeave}
            onPointerDown={(e) => handleSlotInteraction(e, key, singleItem)}
            onPointerUp={handlePointerUpSlot}
            onPointerCancel={handlePointerUpSlot}
          >
            {singleItem && template ? (
              <div className="relative h-full w-full p-1">
                <div className={clsx(
                  "h-full w-full flex items-center justify-center text-xs overflow-hidden rounded-sm",
                  template.rarity === 'legendary' && "bg-amber-500/20 border border-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.3)]",
                  template.rarity === 'epic' && "bg-purple-500/20 border border-purple-500 shadow-[inset_0_0_10px_rgba(168,85,247,0.3)]",
                  template.rarity === 'rare' && "bg-blue-500/20 border border-blue-500 shadow-[inset_0_0_10px_rgba(59,130,246,0.3)]",
                  !template.rarity && "bg-slate-700/50"
                )}>
                  {template.icon ?? singleItem.templateId.slice(0, 2)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600/50">
                <span className="text-[10px] uppercase tracking-wider font-bold">{config.label}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
