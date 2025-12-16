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
import { demoMasteries } from './demoData'
import {
  calculateEncumbrance,
  calculateEquipmentStats,
  collectActiveMasteryCards,
  ensureGridPosition,
  type ActiveMastery,
  type PlayerStatsSummary,
} from './helpers'
import type { InventoryFilter } from './selectors'

// Client-side types matching /inventory API response
type InventoryGetResponse = {
  items: ItemState[]
  containers: InventoryContainer[]
  equipment: EquipmentSlots
}

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
  equipItem: (itemId: string | null, slotId: EquipmentSlotKey) => void
  setQuickSlot: (index: number, itemId: string | null) => void
  moveItemWithinGrid: (itemId: string, position: { x: number; y: number }) => void
  setQuestProtectedItems: (ids: string[]) => void
  isQuestItem: (itemId: string) => boolean
  setSearchQuery: (query: string) => void
  setActiveFilter: (filter: InventoryFilter) => void
  selectItem: (itemId: string | null) => void
  addItemToContainer: (containerId: string, itemId: string) => void
  removeItemFromContainer: (containerId: string, itemId: string) => void
  syncWithBackend: (data: InventoryGetResponse | undefined | null) => void
  getContainers: () => InventoryContainer[]
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

const initialItems: Record<string, ItemState> = {}

const initialContainers: Record<string, InventoryContainer> = {}

const initialMasteries: Record<string, ItemMastery> = demoMasteries.reduce((acc: Record<string, ItemMastery>, mastery: ItemMastery) => {
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
  selectedItemId: null,
  searchQuery: '',
  activeFilter: 'all',

  syncWithBackend: (data: InventoryGetResponse | undefined | null) =>
    set((state) => {
      if (!data) return state

      // Index items by ID
      const items: Record<string, ItemState> = {}

      // Add loose items
      data.items.forEach((item) => {
        items[item.id] = item
      })

      // Add container items
      data.containers.forEach((container) => {
        container.items.forEach((item) => {
          items[item.id] = item
        })
      })

      // Add equipped items
      const processEquipped = (item: ItemState | null) => {
        if (item) items[item.id] = item
      }

      processEquipped(data.equipment.primary)
      processEquipped(data.equipment.secondary)
      processEquipped(data.equipment.melee)
      processEquipped(data.equipment.helmet)
      processEquipped(data.equipment.armor)
      processEquipped(data.equipment.clothing_top)
      processEquipped(data.equipment.clothing_bottom)
      processEquipped(data.equipment.backpack)
      processEquipped(data.equipment.rig)
      data.equipment.artifacts.forEach(processEquipped)
      data.equipment.quick.forEach(processEquipped)

      // Index containers
      const containers: Record<string, InventoryContainer> = {}
      data.containers.forEach((c) => {
        containers[c.id] = c
      })

      // Автоматически создаём контейнеры для экипированных предметов с containerConfig
      const processEquippedContainer = (item: ItemState | null, slotId: string) => {
        if (item && item.stats.containerConfig) {
          // Находим предметы внутри этого контейнера
          const containerItems = Object.values(items).filter(
            (i) => i.containerId === item.instanceId
          )
          
          containers[item.instanceId] = {
            id: item.instanceId,
            ownerId: item.ownerId || 'player',
            kind: slotId === 'backpack' ? 'backpack' : 
                  slotId === 'rig' ? 'rig' : 
                  slotId === 'helmet' ? 'pocket' : 'equipment_storage',
            name: item.stats.containerConfig.name,
            width: item.stats.containerConfig.width,
            height: item.stats.containerConfig.height,
            items: containerItems,
          }
        }
      }

      processEquippedContainer(data.equipment.helmet, 'helmet')
      processEquippedContainer(data.equipment.rig, 'rig')
      processEquippedContainer(data.equipment.backpack, 'backpack')
      processEquippedContainer(data.equipment.armor, 'armor')
      processEquippedContainer(data.equipment.clothing_bottom, 'clothing_bottom')

      const questProtectedItemIds: Record<string, true> = { ...state.questProtectedItemIds }
      Object.values(items).forEach((item) => {
        if (shouldProtectItem(item)) questProtectedItemIds[item.id] = true as const
      })

      return {
        items,
        containers,
        equipment: data.equipment,
        questProtectedItemIds,
        ...deriveState(items, data.equipment, state.masteries)
      }
    }),

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
        ? { ...state.questProtectedItemIds, [nextItem.id]: true as const }
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
      let item = itemId ? state.items[itemId] ?? null : null
      
      // Автоматически создаём containerConfig для предметов, которые должны иметь карманчики
      if (item && !item.stats.containerConfig) {
        let containerConfig: { width: number; height: number; name: string } | undefined
        
        switch (slotId) {
          case 'helmet':
            containerConfig = { width: 1, height: 1, name: 'Карман шлема' }
            break
          case 'rig':
            containerConfig = { width: 4, height: 2, name: 'Карманы разгрузки' }
            break
          case 'backpack':
            containerConfig = { width: 4, height: 4, name: 'Рюкзак' }
            break
          case 'clothing_bottom':
            // Ремень может быть частью одежды снизу
            if (item.kind === 'clothing' || item.templateId?.includes('belt')) {
              containerConfig = { width: 4, height: 1, name: 'Карманы ремня' }
            }
            break
        }
        
        if (containerConfig) {
          item = {
            ...item,
            stats: {
              ...item.stats,
              containerConfig,
            },
          }
          // Обновляем item в state
          const updatedItems = { ...state.items, [item.id]: item }
          state = { ...state, items: updatedItems }
        }
      }
      
      const equipment: EquipmentSlots = {
        ...state.equipment,
        [slotId]: item,
      }

      // Обновляем контейнеры при экипировке
      const containers = { ...state.containers }
      if (item && item.stats.containerConfig) {
        containers[item.instanceId] = {
          id: item.instanceId,
          ownerId: item.ownerId || 'player',
          kind: slotId === 'backpack' ? 'backpack' : 
                slotId === 'rig' ? 'rig' : 
                slotId === 'helmet' ? 'pocket' : 'equipment_storage',
          name: item.stats.containerConfig.name,
          width: item.stats.containerConfig.width,
          height: item.stats.containerConfig.height,
          items: [],
        }
      } else if (!item) {
        // Удаляем контейнер при снятии предмета
        const previousItem = state.equipment[slotId as keyof EquipmentSlots]
        if (previousItem && !Array.isArray(previousItem) && previousItem.stats.containerConfig) {
          delete containers[previousItem.instanceId]
        }
      }

      return {
        items: state.items,
        equipment,
        containers,
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
        if (id) next[id] = true as const
      })
      Object.values(state.items).forEach((item) => {
        if (shouldProtectItem(item)) next[item.id] = true as const
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
      if (container.items.some((entry) => entry.id === itemId)) {
        return state
      }
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
  getContainers: () => {
    const state = get()
    const containers: InventoryContainer[] = []
    
    // Добавляем контейнеры из экипированных предметов
    Object.values(state.equipment).forEach((equipped) => {
      if (equipped && !Array.isArray(equipped) && equipped.stats.containerConfig) {
        // Находим предметы внутри этого контейнера
        const containerItems = Object.values(state.items).filter(
          (item) => item.containerId === equipped.instanceId
        )
        
        const container: InventoryContainer = {
          id: equipped.instanceId,
          ownerId: equipped.ownerId || 'player',
          kind: equipped.equippedSlot === 'backpack' ? 'backpack' : 
                equipped.equippedSlot === 'rig' ? 'rig' : 
                equipped.equippedSlot === 'helmet' ? 'pocket' : 'equipment_storage',
          name: equipped.stats.containerConfig.name,
          width: equipped.stats.containerConfig.width,
          height: equipped.stats.containerConfig.height,
          items: containerItems,
        }
        
        containers.push(container)
      }
    })
    
    // Добавляем остальные контейнеры (например, карманы)
    Object.values(state.containers).forEach((container) => {
      if (!containers.find(c => c.id === container.id)) {
        // Заполняем предметами
        const containerItems = Object.values(state.items).filter(
          (item) => item.containerId === container.id
        )
        containers.push({
          ...container,
          items: containerItems,
        })
      }
    })
    
    return containers
  },
}))
