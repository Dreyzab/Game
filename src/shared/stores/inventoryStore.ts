import { create } from 'zustand'
import {
  INVENTORY_GRID_COLUMNS,
  INVENTORY_GRID_ROWS,
  INVENTORY_QUICK_SLOTS,
} from '@/entities/item/model/constants'
import type {
  EncumbranceState,
  EquipmentSlots,
  InventoryContainer,
  ItemMastery,
  ItemState,
} from '@/entities/item/model/types'
import { demoContainers, demoItems, demoMasteries } from '@/features/inventory/model/demoData'
import {
  calculateEncumbrance,
  calculateEquipmentStats,
  collectActiveMasteryCards,
  ensureGridPosition,
  type ActiveMastery,
  type PlayerStatsSummary,
} from '@/features/inventory/model/helpers'
import type { InventoryFilter } from '@/features/inventory/model/selectors'

type EquipmentSlotKey = Exclude<keyof EquipmentSlots, 'artifacts' | 'quick'>

type InventoryState = {
  items: Record<string, ItemState>
  equipment: EquipmentSlots
  containers: Record<string, InventoryContainer>
  encumbrance: EncumbranceState
  playerStats: PlayerStatsSummary
  activeMasteryCards: ActiveMastery[]
  masteries: Record<string, ItemMastery>
  questProtectedItemIds: Record<string, true>
  selectedItemId: string | null
  searchQuery: string
  activeFilter: InventoryFilter
  addItem: (item: ItemState) => void
  equipItem: (itemId: string, slotId: EquipmentSlotKey) => void
  setQuickSlot: (index: number, itemId: string | null) => void
  moveItemWithinGrid: (itemId: string, position: { x: number; y: number }) => void
  setQuestProtectedItems: (ids: string[]) => void
  isQuestItem: (itemId: string) => boolean
  setSearchQuery: (query: string) => void
  setActiveFilter: (filter: InventoryFilter) => void
  selectItem: (itemId: string | null) => void
  addItemToContainer: (containerId: string, itemId: string) => void
  removeItemFromContainer: (containerId: string, itemId: string) => void
}

const createQuickSlots = (): Array<ItemState | null> =>
  Array.from({ length: INVENTORY_QUICK_SLOTS }, () => null)

const initialEquipment: EquipmentSlots = {
  primary: null,
  secondary: null,
  melee: null,
  helmet: null,
  armor: null,
  clothing_top: null,
  clothing_bottom: null,
  backpack: null,
  rig: null,
  artifacts: [],
  quick: createQuickSlots(),
}

const initialItems: Record<string, ItemState> = demoItems.reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {} as Record<string, ItemState>)

const initialContainers: Record<string, InventoryContainer> = demoContainers.reduce((acc, container) => {
  acc[container.id] = container
  return acc
}, {} as Record<string, InventoryContainer>)

const initialMasteries: Record<string, ItemMastery> = demoMasteries.reduce((acc, mastery) => {
  acc[mastery.itemId] = mastery
  return acc
}, {} as Record<string, ItemMastery>)

const baseEncumbrance = calculateEncumbrance(initialItems, initialEquipment)
const initialPlayerStats = calculateEquipmentStats(initialEquipment)
const initialActiveMasteries = collectActiveMasteryCards(initialEquipment, initialMasteries)

const deriveState = (
  items: Record<string, ItemState>,
  equipment: EquipmentSlots,
  masteries: Record<string, ItemMastery>
) => ({
  encumbrance: calculateEncumbrance(items, equipment, baseEncumbrance.maxWeight),
  playerStats: calculateEquipmentStats(equipment),
  activeMasteryCards: collectActiveMasteryCards(equipment, masteries),
})

const shouldProtectItem = (item: ItemState) => item.kind === 'quest' || item.tags?.includes('quest')

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: initialItems,
  equipment: initialEquipment,
  containers: initialContainers,
  encumbrance: baseEncumbrance,
  playerStats: initialPlayerStats,
  activeMasteryCards: initialActiveMasteries,
  masteries: initialMasteries,
  questProtectedItemIds: {},
  selectedItemId: demoItems[0]?.id ?? null,
  searchQuery: '',
  activeFilter: 'all',
  addItem: (item) =>
    set((state) => {
      const nextItem: ItemState = { ...item }
      if (!nextItem.gridPosition) {
        const position = ensureGridPosition(state.items, INVENTORY_GRID_COLUMNS, INVENTORY_GRID_ROWS)
        if (position) {
          nextItem.gridPosition = position
        }
      }

      const items = { ...state.items, [nextItem.id]: nextItem }
      const questProtectedItemIds: Record<string, true> = shouldProtectItem(nextItem)
        ? { ...state.questProtectedItemIds, [nextItem.id]: true as true }
        : state.questProtectedItemIds

      return {
        items,
        questProtectedItemIds,
        ...deriveState(items, state.equipment, state.masteries),
        selectedItemId: nextItem.id,
      }
    }),
  equipItem: (itemId, slotId) =>
    set((state) => {
      if (!(slotId in state.equipment)) return state
      const item = state.items[itemId] ?? null
      const equipment: EquipmentSlots = {
        ...state.equipment,
        [slotId]: item,
      }

      return {
        equipment,
        ...deriveState(state.items, equipment, state.masteries),
      }
    }),
  setQuickSlot: (index, itemId) =>
    set((state) => {
      if (index < 0 || index >= state.equipment.quick.length) return state
      const nextQuick = [...state.equipment.quick]
      nextQuick[index] = itemId ? state.items[itemId] ?? null : null
      const equipment = { ...state.equipment, quick: nextQuick }
      return {
        equipment,
        ...deriveState(state.items, equipment, state.masteries),
      }
    }),
  moveItemWithinGrid: (itemId, position) =>
    set((state) => {
      const item = state.items[itemId]
      if (!item) return state
      const currentPosition = item.gridPosition
      const conflictingEntry = Object.values(state.items).find(
        (entry) =>
          entry.id !== itemId &&
          entry.gridPosition?.x === position.x &&
          entry.gridPosition?.y === position.y
      )
      const nextItems: Record<string, ItemState> = {
        ...state.items,
        [itemId]: { ...item, gridPosition: position },
      }
      if (conflictingEntry) {
        nextItems[conflictingEntry.id] = {
          ...conflictingEntry,
          gridPosition: currentPosition ?? undefined,
        }
      }
      return { items: nextItems }
    }),
  setQuestProtectedItems: (ids) =>
    set((state) => {
      const next: Record<string, true> = {}
      ids.forEach((id) => {
        if (id) next[id] = true as true
      })
      Object.values(state.items).forEach((item) => {
        if (shouldProtectItem(item)) next[item.id] = true as true
      })
      return { questProtectedItemIds: next }
    }),
  isQuestItem: (itemId) => Boolean(get().questProtectedItemIds[itemId]),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  selectItem: (itemId) => set({ selectedItemId: itemId }),
  addItemToContainer: (containerId, itemId) =>
    set((state) => {
      const container = state.containers[containerId]
      const item = state.items[itemId]
      if (!container || !item) return state
      const updatedContainer: InventoryContainer = {
        ...container,
        items: [...container.items, item],
      }
      return {
        containers: { ...state.containers, [containerId]: updatedContainer },
      }
    }),
  removeItemFromContainer: (containerId, itemId) =>
    set((state) => {
      const container = state.containers[containerId]
      if (!container) return state
      const updatedContainer: InventoryContainer = {
        ...container,
        items: container.items.filter((entry) => entry.id !== itemId),
      }
      return {
        containers: { ...state.containers, [containerId]: updatedContainer },
      }
    }),
}))
