import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { useInventoryStore } from '@/shared/stores/inventoryStore'
import { Heading } from '@/shared/ui/components/Heading/Heading'
import { AnimatedCard } from '@/shared/ui/components/AnimatedCard/AnimatedCard'
import EquipmentSlots from "./EquipmentSlots/EquipmentSlots";
import { InventoryGrid } from './InventoryGrid/InventoryGrid' // Changed to direct import for DnD support
import { InventoryDetailPanel } from './InventoryDetailPanel'
import { QuickAccessBar } from './QuickAccessBar/QuickAccessBar'
import { QuickStatsPanel } from './QuickStatsPanel'
import { filterItems, isValidSlotDrop } from '../model/utils'
import { useQuestItemProtection } from '../model/useQuestItemProtection'
import { ItemComparison } from './ItemComparison/ItemComparison'
import { ContainerPanel } from './ContainerPanel'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import { INVENTORY_CELL_SIZE } from '@/entities/item/model/constants'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { ItemCard } from '@/entities/item/ui/ItemCard'
import type { ItemState } from '@/entities/item/model/types'

const DebugControls: React.FC = () => {
  const { deviceId } = useDeviceId()
  const spawnRoleItems = useMutation(api.inventory.debugSpawnRoleItems)
  const clearInventory = useMutation(api.inventory.debugClearInventory)

  if (!deviceId) return null

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 p-4 bg-slate-900/90 border border-slate-700 rounded-lg shadow-xl z-50">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Debug Tools</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => spawnRoleItems({ deviceId, role: 'doctor' })}
          className="px-3 py-1 text-xs bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-200 border border-emerald-700/50 rounded transition-colors"
        >
          Spawn Medic
        </button>
        <button
          onClick={() => spawnRoleItems({ deviceId, role: 'police' })}
          className="px-3 py-1 text-xs bg-blue-900/50 hover:bg-blue-800/50 text-blue-200 border border-blue-700/50 rounded transition-colors"
        >
          Spawn Stormtrooper
        </button>
        <button
          onClick={() => spawnRoleItems({ deviceId, role: 'engineer' })}
          className="px-3 py-1 text-xs bg-amber-900/50 hover:bg-amber-800/50 text-amber-200 border border-amber-700/50 rounded transition-colors"
        >
          Spawn Technician
        </button>
        <button
          onClick={() => spawnRoleItems({ deviceId, role: 'smuggler' })}
          className="px-3 py-1 text-xs bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 border border-purple-700/50 rounded transition-colors"
        >
          Spawn Scout
        </button>
      </div>
      <div className="h-px bg-slate-700 my-1" />
      <button
        onClick={() => clearInventory({ deviceId })}
        className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-200 border border-red-700/50 rounded transition-colors w-full"
      >
        Clear Inventory
      </button>
    </div>
  )
}

export const ModernInventoryPage: React.FC = () => {
  const { deviceId } = useDeviceId()
  const inventoryData = useQuery(api.inventory.get, deviceId ? { deviceId } : 'skip')
  const seedInventory = useMutation(api.inventory.seedInventory)

  const {
    items,
    equipment,
    encumbrance,
    playerStats,
    selectedItemId,
    selectItem,
    searchQuery,
    activeFilter,
    setSearchQuery,
    isQuestItem,
    syncWithBackend,
    equipItem,
    getContainers,
    moveItemWithinGrid,
    setQuickSlot
  } = useInventoryStore()

  const [comparingItem, setComparingItem] = useState<ItemState | null>(null)

  // DnD State
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  // Mutations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moveMutation = useMutation((api as any).inventory.move)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const equipMutation = useMutation((api as any).inventory.equip)

  useEffect(() => {
    if (inventoryData) {
      const hasItems = inventoryData.items && inventoryData.items.length > 0
      const hasContainers = inventoryData.containers && inventoryData.containers.length > 0
      const hasEquipment = inventoryData.equipment && (
        inventoryData.equipment.primary ||
        inventoryData.equipment.secondary ||
        inventoryData.equipment.melee ||
        inventoryData.equipment.helmet ||
        inventoryData.equipment.armor ||
        inventoryData.equipment.clothing_top ||
        inventoryData.equipment.clothing_bottom ||
        inventoryData.equipment.backpack ||
        inventoryData.equipment.rig ||
        (inventoryData.equipment.artifacts && inventoryData.equipment.artifacts.length > 0)
      )

      if (!hasEquipment && !hasItems && !hasContainers) {
        if (deviceId) {
          seedInventory({ deviceId })
        }
      } else {
        syncWithBackend(inventoryData as any)
      }
    }
  }, [inventoryData, syncWithBackend, seedInventory, deviceId])

  useQuestItemProtection()

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

    // Handle Grid Drop
    if (overId.startsWith('cell-')) {
      const parts = overId.split('-') // cell-x-y
      const x = parseInt(parts[1])
      const y = parseInt(parts[2])

      if (!isNaN(x) && !isNaN(y)) {
        moveItemWithinGrid(itemId, { x, y })
        moveMutation({ itemId, toGridPosition: { x, y } }).catch(console.error)
      }
    }
    // Handle Equipment Drop
    else if (overId.startsWith('slot-')) {
      const slotId = overId.replace('slot-', '')
      const item = items[itemId]

      if (item && isValidSlotDrop(slotId, item)) {
        equipItem(itemId, slotId as any)
        equipMutation({ itemId, slot: slotId }).catch(console.error)
      }
    }
    // Handle Quick Slot Drop
    else if (overId.startsWith('quick-')) {
      const index = parseInt(overId.split('-')[1])
      const item = items[itemId]

      if (!isNaN(index) && item && isValidSlotDrop(`quick_${index}`, item)) {
        setQuickSlot(index, itemId)
        equipMutation({ itemId, slot: `quick_${index}` }).catch(console.error)
      }
    }
  }

  const handleCompare = (item: ItemState) => {
    setComparingItem(item)
  }

  const handleUnequip = (arg: string | ItemState) => {
    if (typeof arg === 'string') {
      equipItem(null, arg as any)
    } else {
      for (const [slot, equipped] of Object.entries(equipment)) {
        if (equipped && !Array.isArray(equipped) && equipped.id === arg.id) {
          equipItem(null, slot as any)
          return
        }
      }
    }
  }

  const handleEquip = (item: ItemState) => {
    const template = ITEM_TEMPLATES[item.templateId]
    if (!template) return
    let targetSlot: string | null = null

    switch (template.kind) {
      case 'weapon':
        targetSlot = !equipment.primary ? 'primary' : 'secondary'
        if (equipment.primary && equipment.secondary) targetSlot = 'primary'
        break
      case 'clothing':
        if (template.name.toLowerCase().includes('pants') || template.name.toLowerCase().includes('trousers')) {
          targetSlot = 'clothing_bottom'
        } else {
          targetSlot = 'clothing_top'
        }
        break
      case 'armor': targetSlot = 'armor'; break
      case 'backpack': targetSlot = 'backpack'; break
      case 'rig': targetSlot = 'rig'; break
    }

    if (targetSlot) {
      equipItem(item.id, targetSlot as any)
    }
  }

  const getEquippedItemForComparison = (item: ItemState): ItemState | null => {
    const template = ITEM_TEMPLATES[item.templateId]
    if (!template) return null
    if (item.isEquipped) return null
    for (const slotKey in equipment) {
      const equippedItem = equipment[slotKey as keyof typeof equipment]
      if (equippedItem && !Array.isArray(equippedItem)) {
        const equippedTemplate = ITEM_TEMPLATES[equippedItem.templateId]
        if (equippedTemplate && equippedTemplate.kind === template.kind) {
          return equippedItem
        }
      }
    }
    return null
  }

  const itemsArray = useMemo(() => Object.values(items), [items])
  const filteredItems = useMemo(
    () => filterItems(itemsArray, searchQuery, activeFilter),
    [itemsArray, searchQuery, activeFilter]
  )
  const containers = useMemo(() => getContainers(), [getContainers])
  const selectedItem = useMemo(
    () => items[selectedItemId || ''] || null,
    [items, selectedItemId]
  )

  const activeItem = activeId ? items[activeId] : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <DebugControls />
        <div className="container mx-auto h-[calc(100vh-80px)] max-w-[1920px] p-4">
          <div className="grid h-full grid-cols-12 gap-6">
            <div className="col-span-4 flex flex-col gap-4">
              <AnimatedCard className="glass-panel p-4">
                <div className="mb-4 flex items-center justify-between">
                  <Heading level={2} className="text-lg">Character</Heading>
                  <div className="text-xs text-slate-400">Level 1</div>
                </div>
                <EquipmentSlots
                  equipment={equipment}
                  activeDragItem={activeItem}
                  onCompare={handleCompare}
                  onUnequip={handleUnequip}
                  onSelect={selectItem}
                />
                <div className="mt-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Quick Access</div>
                  <QuickAccessBar slots={equipment.quick} />
                </div>
              </AnimatedCard>

              <QuickStatsPanel stats={playerStats} encumbrance={encumbrance} />

              {containers.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Хранилища
                  </div>
                  {containers.map((container) => (
                    <ContainerPanel
                      key={container.id}
                      container={container}
                      onItemClick={selectItem}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-8 flex flex-col gap-4">
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <AnimatedCard className="glass-panel flex items-center gap-4 p-3 shrink-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search items..."
                    className="flex-1 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-[color:var(--color-text-primary)] focus:border-amber-500 focus:outline-none"
                  />
                </AnimatedCard>

                <div className="flex-1 overflow-hidden">
                  <InventoryGrid
                    items={filteredItems}
                    selectedItemId={selectedItemId}
                    onSelect={selectItem}
                    isQuestItem={isQuestItem}
                    onCompare={handleCompare}
                  />
                </div>
              </div>

              <div className="h-48 shrink-0">
                <InventoryDetailPanel
                  item={selectedItem}
                  isQuestItem={selectedItemId ? isQuestItem(selectedItemId) : false}
                  onEquip={handleEquip}
                  onUnequip={handleUnequip}
                />
              </div>
            </div>
          </div>
        </div>

        {comparingItem && (
          <ItemComparison
            item={comparingItem}
            equippedItem={getEquippedItemForComparison(comparingItem)}
            onClose={() => setComparingItem(null)}
          />
        )}
        {/* Drag Overlay */}
        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem ? (
            (() => {
              const template = ITEM_TEMPLATES[activeItem.templateId]
              const w = (template?.baseStats.width ?? 1) * INVENTORY_CELL_SIZE
              const h = (template?.baseStats.height ?? 1) * INVENTORY_CELL_SIZE
              return (
                <div
                  className="opacity-90 pointer-events-none shadow-2xl"
                  style={{ width: w, height: h }}
                >
                  <ItemCard item={activeItem} isDragging={true} />
                </div>
              )
            })()
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
