import React from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import type { EquipmentSlots as EquipmentSlotsState, ItemState } from '@/entities/item/model/types'
import { useInventoryDragStore } from '@/features/inventory/model/useInventoryDrag'

type SlotKey =
  | 'primary'
  | 'secondary'
  | 'melee'
  | 'helmet'
  | 'armor'
  | 'clothing_top'
  | 'clothing_bottom'
  | 'backpack'
  | 'rig'

type SlotConfig = {
  id: SlotKey
  label: string
  hint?: string
}

const slotSections: Array<{ title: string; columns: number; slots: SlotConfig[] }> = [
  {
    title: 'Weapons',
    columns: 3,
    slots: [
      { id: 'primary', label: 'Primary' },
      { id: 'secondary', label: 'Secondary' },
      { id: 'melee', label: 'Melee' },
    ],
  },
  {
    title: 'Protection',
    columns: 2,
    slots: [
      { id: 'helmet', label: 'Helmet' },
      { id: 'armor', label: 'Armor' },
    ],
  },
  {
    title: 'Clothing',
    columns: 2,
    slots: [
      { id: 'clothing_top', label: 'Top' },
      { id: 'clothing_bottom', label: 'Bottom' },
    ],
  },
  {
    title: 'Carry',
    columns: 2,
    slots: [
      { id: 'backpack', label: 'Backpack', hint: '+ grid capacity' },
      { id: 'rig', label: 'Rig', hint: 'extra pouches' },
    ],
  },
]

type EquipmentSlotsProps = {
  equipment: EquipmentSlotsState
}

const renderItemSummary = (item: ItemState) => (
  <>
    <div className="text-2xl leading-none">{item.icon}</div>
    <div className="text-sm font-semibold text-[color:var(--color-text-primary)]">{item.name}</div>
    <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400">{item.rarity}</div>
  </>
)

const renderEmptySummary = (label: string) => (
  <div className="text-xs text-slate-500">{label} slot empty</div>
)

const SlotCard: React.FC<{
  slot: SlotConfig
  item: ItemState | null
  isActive: boolean
  onPointerEnter: () => void
  onPointerLeave: () => void
}> = ({ slot, item, isActive, onPointerEnter, onPointerLeave }) => (
  <motion.div
    layout
    whileHover={{ scale: 1.02 }}
    onPointerEnter={onPointerEnter}
    onPointerLeave={onPointerLeave}
    className={clsx(
      'rounded-lg border p-3 text-center transition',
      item ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/60',
      isActive && 'ring-2 ring-emerald-400/70'
    )}
  >
    <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">{slot.label}</div>
    <div className="flex min-h-[96px] flex-col items-center justify-center gap-2">
      {item ? renderItemSummary(item) : renderEmptySummary(slot.label)}
    </div>
    {slot.hint ? <div className="mt-2 text-[11px] text-slate-500">{slot.hint}</div> : null}
  </motion.div>
)

export const EquipmentSlots: React.FC<EquipmentSlotsProps> = ({ equipment }) => {
  const isDragging = useInventoryDragStore((state) => state.isDragging)
  const dropTarget = useInventoryDragStore((state) => state.target)
  const setDropTarget = useInventoryDragStore((state) => state.setDropTarget)

  return (
    <div className="glass-panel space-y-6 p-4">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Equipment</div>

      {slotSections.map((section) => (
        <div key={section.title} className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{section.title}</div>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))` }}
          >
            {section.slots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                item={equipment[slot.id]}
                isActive={dropTarget?.kind === 'equipment' && dropTarget.slotId === slot.id}
                onPointerEnter={() => {
                  if (!isDragging) return
                  setDropTarget({ kind: 'equipment', slotId: slot.id })
                }}
                onPointerLeave={() => {
                  if (dropTarget?.kind === 'equipment' && dropTarget.slotId === slot.id) {
                    setDropTarget(null)
                  }
                }}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Artifacts</div>
        <div className="grid grid-cols-2 gap-3">
          {equipment.artifacts.length > 0 ? (
            equipment.artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="rounded-lg border border-purple-500/70 bg-purple-500/10 p-3 text-center"
              >
                <div className="text-2xl">{artifact.icon}</div>
                <div className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                  {artifact.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-purple-300">artifact</div>
              </div>
            ))
          ) : (
            <div className="col-span-2 rounded-lg border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
              No artifacts equipped
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EquipmentSlots
