import React, { useEffect, useMemo, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { Heading } from '@/shared/ui/components/Heading/Heading'
import { InventoryGrid } from './InventoryGrid/InventoryGrid'
import EquipmentSlots from './EquipmentSlots/EquipmentSlots'
import { QuickAccessBar } from './QuickAccessBar/QuickAccessBar'
import { QuickStatsPanel } from './QuickStatsPanel'
import { ContainerPanel } from './ContainerPanel'
import { useInventoryStore } from '@/entities/inventory'
import { useMyInventory } from '@/entities/inventory/api/useMyInventory'
import { useWorkshop } from '@/shared/hooks/useWorkshop'
import { isValidSlotDrop } from '../model/utils'
import type { InventoryFilter } from '@/entities/inventory/model/selectors'

export const ModernInventoryPage: React.FC = () => {
  const { data, isLoading } = useMyInventory()
  const { repair, upgrade } = useWorkshop()

  const {
    items,
    equipment,
    encumbrance,
    playerStats,
    selectedItemId,
    selectItem,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    isQuestItem,
    syncWithBackend,
    equipItem,
    getContainers,
    moveItemWithinGrid,
    setQuickSlot,
  } = useInventoryStore()

  type BackendInventory = Parameters<typeof syncWithBackend>[0]
  const EQUIPMENT_SLOT_KEYS = [
    'primary',
    'secondary',
    'melee',
    'helmet',
    'armor',
    'clothing_top',
    'clothing_bottom',
    'backpack',
    'rig',
  ] as const
  type EquipmentSlotKey = (typeof EQUIPMENT_SLOT_KEYS)[number]
  const isEquipmentSlot = (slot: string): slot is EquipmentSlotKey =>
    (EQUIPMENT_SLOT_KEYS as readonly string[]).includes(slot)

  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // sync on load
  useEffect(() => {
    const backendData = data as BackendInventory
    if (backendData && backendData.items) {
      syncWithBackend(backendData)
    }
  }, [data, syncWithBackend])

  const itemList = useMemo(() => Object.values(items), [items])
  const containerList = useMemo(() => getContainers(), [getContainers])
  const selectedItem = selectedItemId ? items[selectedItemId] : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    selectItem(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const itemId = active.id as string
    const overId = over.id as string
    const item = items[itemId]
    if (!item) return

    if (overId.startsWith('cell-')) {
      const parts = overId.split('-')
      const x = parseInt(parts[1])
      const y = parseInt(parts[2])
      if (!isNaN(x) && !isNaN(y)) {
        moveItemWithinGrid(itemId, { x, y })
      }
    } else if (overId.startsWith('slot-')) {
      const slotId = overId.replace('slot-', '')
      if (isEquipmentSlot(slotId) && isValidSlotDrop(slotId, item)) {
        equipItem(itemId, slotId)
      }
    } else if (overId.startsWith('quick-')) {
      const index = parseInt(overId.split('-')[1])
      if (!isNaN(index) && isValidSlotDrop(`quick_${index}`, item)) {
        setQuickSlot(index, itemId)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <Heading level={2} className="text-2xl">Инвентарь</Heading>
        {isLoading && <span className="text-xs text-slate-400">Загрузка...</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <QuickStatsPanel stats={playerStats} encumbrance={encumbrance} />

          <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск"
                className="px-3 py-2 rounded bg-slate-900 border border-slate-800 text-sm w-full sm:w-64"
              />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as InventoryFilter)}
                className="px-3 py-2 rounded bg-slate-900 border border-slate-800 text-sm"
              >
                <option value="all">Все</option>
                <option value="weapons">Оружие</option>
                <option value="armor">Броня</option>
                <option value="consumables">Расходники</option>
                <option value="quest">Квест</option>
              </select>
            </div>

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid lg:grid-cols-[1.2fr_1fr] gap-3">
                <div className="relative border border-slate-800/60 rounded-lg bg-slate-900/40 p-2">
                  <InventoryGrid
                    items={itemList}
                    selectedItemId={selectedItemId}
                    onSelect={selectItem}
                    onCompare={() => {}}
                    isQuestItem={isQuestItem}
                  />
                </div>
                <div className="space-y-3">
                  <EquipmentSlots
                    equipment={equipment}
                    activeDragItem={activeId ? items[activeId] : null}
                    onSelect={selectItem}
                    onUnequip={(slotId) => {
                      if (isEquipmentSlot(slotId)) {
                        equipItem(null, slotId)
                      }
                    }}
                  />
                  <QuickAccessBar slots={equipment.quick} />
                  {selectedItem && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2">
                      <div className="text-sm font-semibold">{selectedItem.name}</div>
                      <div className="text-xs text-slate-400">ID: {selectedItem.templateId}</div>
                      <div className="text-xs text-slate-400">Состояние: {selectedItem.condition ?? '—'}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => repair.mutate(selectedItem.id)}
                          disabled={repair.isPending}
                          className="px-3 py-2 text-xs rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                        >
                          {repair.isPending ? 'Чиним...' : 'Починить'}
                        </button>
                        <button
                          onClick={() => upgrade.mutate(selectedItem.id)}
                          disabled={upgrade.isPending}
                          className="px-3 py-2 text-xs rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-60"
                        >
                          {upgrade.isPending ? 'Улучшаем...' : 'Улучшить'}
                        </button>
                      </div>
                      {(repair.error || upgrade.error) && (
                        <div className="text-xs text-red-400">
                          {(repair.error as any)?.message || (upgrade.error as any)?.message}
                        </div>
                      )}
                      {(repair.data as any)?.message && (
                        <div className="text-xs text-emerald-400">{(repair.data as any).message}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DndContext>
          </div>

          {containerList.length > 0 && (
            <div className="grid md:grid-cols-2 gap-3">
              {containerList.map((c) => (
                <ContainerPanel key={c.id} container={c} onItemClick={selectItem} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModernInventoryPage
