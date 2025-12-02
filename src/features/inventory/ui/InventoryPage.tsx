import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { useInventoryStore } from '@/shared/stores/inventoryStore'
import { Heading } from '@/shared/ui/components/Heading/Heading'
import { AnimatedCard } from '@/shared/ui/components/AnimatedCard/AnimatedCard'
import EquipmentSlots from "./EquipmentSlots/EquipmentSlots";
import { EnhancedInventoryGrid }
  from './EnhancedInventoryGrid'
import { InventoryDetailPanel } from './InventoryDetailPanel'
import { QuickAccessBar } from './QuickAccessBar/QuickAccessBar'
import { QuickStatsPanel } from './QuickStatsPanel'
import { filterItems } from '../model/utils'
import { useQuestItemProtection } from '../model/useQuestItemProtection'
import { ItemComparison } from './ItemComparison/ItemComparison'
import { ContainerPanel } from './ContainerPanel'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import type { ItemState } from '@/entities/item/model/types'

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
    getContainers
  } = useInventoryStore()

  const [comparingItem, setComparingItem] = useState<ItemState | null>(null)

  useEffect(() => {
    if (inventoryData) {
      // If no equipment and no items, assume new player and seed
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
        syncWithBackend(inventoryData)
      }
    }
  }, [inventoryData, syncWithBackend, seedInventory, deviceId])

  useQuestItemProtection()

  const handleCompare = (item: ItemState) => {
    setComparingItem(item)
  }

  const handleUnequip = (arg: string | ItemState) => {
    if (typeof arg === 'string') {
      // arg is slotId
      equipItem(null, arg as any)
    } else {
      // arg is item, find slot
      // This is less efficient, but robust
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

    // Simple mapping for now. In a real app, this might be more complex or data-driven.
    let targetSlot: string | null = null

    switch (template.kind) {
      case 'weapon':
        targetSlot = !equipment.primary ? 'primary' : 'secondary' // Fill primary first, then secondary
        if (equipment.primary && equipment.secondary) targetSlot = 'primary' // Overwrite primary if both full
        break
      case 'helmet': targetSlot = 'helmet'; break
      case 'armor': targetSlot = 'armor'; break
      case 'clothing_top': targetSlot = 'clothing_top'; break
      case 'clothing_bottom': targetSlot = 'clothing_bottom'; break
      case 'backpack': targetSlot = 'backpack'; break
      case 'rig': targetSlot = 'rig'; break
      // Add other mappings as needed
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="container mx-auto h-[calc(100vh-80px)] max-w-[1920px] p-4">
        <div className="grid h-full grid-cols-12 gap-6">
          {/* Left Column: Character & Equipment (4 cols) */}
          <div className="col-span-4 flex flex-col gap-4">
            {/* Character Panel */}
            <AnimatedCard className="glass-panel p-4">
              <div className="mb-4 flex items-center justify-between">
                <Heading level={2} className="text-lg">Character</Heading>
                <div className="text-xs text-slate-400">Level 1</div>
              </div>

              {/* Character Silhouette / Equipment Slots */}
              <EquipmentSlots
                equipment={equipment}
                onCompare={handleCompare}
                onUnequip={handleUnequip}
              />

              {/* Quick Access */}
              <div className="mt-4">
                <div className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Quick Access</div>
                <QuickAccessBar slots={equipment.quick} />
              </div>
            </AnimatedCard>

            {/* Quick Stats */}
            <QuickStatsPanel stats={playerStats} encumbrance={encumbrance} />

            {/* Containers from Equipment */}
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

          {/* Right Column: Inventory Grid & Details (8 cols) */}
          <div className="col-span-8 flex flex-col gap-4">
            {/* Main Inventory Grid */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Search Bar */}
              <AnimatedCard className="glass-panel flex items-center gap-4 p-3 shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search items..."
                  className="flex-1 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-[color:var(--color-text-primary)] focus:border-amber-500 focus:outline-none"
                />
              </AnimatedCard>

              {/* Grid */}
              <div className="flex-1 overflow-hidden">
                <EnhancedInventoryGrid
                  items={filteredItems}
                  selectedItemId={selectedItemId}
                  onSelect={selectItem}
                  isQuestItem={isQuestItem}
                  onCompare={handleCompare}
                />
              </div>
            </div>

            {/* Item Details Panel (Bottom) */}
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

      {/* Comparison Modal */}
      {comparingItem && (
        <ItemComparison
          item={comparingItem}
          equippedItem={getEquippedItemForComparison(comparingItem)}
          onClose={() => setComparingItem(null)}
        />
      )}
    </div>
  )
}
