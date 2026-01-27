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

// Module imports
import { moveItemWithinGrid } from './modules/inventoryGrid'
import { equipItem } from './modules/inventoryEquipment'
import {
  addItemToContainer,
  removeItemFromContainer,
  getAllContainers
} from './modules/inventoryContainers'
import { setQuickSlot } from './modules/inventoryQuickSlots'

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

  // Detective Mode State
  gameMode: 'survival' | 'detective'
  detectiveState: {
    items: Record<string, ItemState>
    equipment: EquipmentSlots
    containers: Record<string, InventoryContainer>
  }
  survivalState: {
    items: Record<string, ItemState>
    equipment: EquipmentSlots
    containers: Record<string, InventoryContainer>
  } | null

  setGameMode: (mode: 'survival' | 'detective') => void
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

  // Mode Support
  gameMode: 'survival',
  detectiveState: {
    items: {},
    equipment: initialEquipment,
    containers: {}
  },
  survivalState: null,

  playerStats: initialPlayerStats,
  activeMasteryCards: initialActiveMasteries,
  masteries: initialMasteries,
  questProtectedItemIds: {},
  selectedItemId: null,
  searchQuery: '',
  activeFilter: 'all',

  setGameMode: (mode) => set((state) => {
    if (state.gameMode === mode) return {}

    // Save current state to the buffer of the PREVIOUS mode
    const currentBuffer = {
      items: state.items,
      equipment: state.equipment,
      containers: state.containers
    }

    let nextState: typeof currentBuffer

    if (mode === 'detective') {
      // Switching TO detective
      // Save survival
      const survivalState = currentBuffer
      // Load detective (or init)
      nextState = state.detectiveState

      return {
        gameMode: mode,
        survivalState, // Save survival state
        ...nextState, // Restore detective state
        ...deriveState(nextState.items, nextState.equipment, state.masteries) // Recalc stats
      }
    } else {
      // Switching TO survival
      // Save detective
      const detectiveState = currentBuffer
      // Load survival (or fallback to empty if null, but shouldn't happen if came from survival)
      nextState = state.survivalState || {
        items: initialItems,
        equipment: initialEquipment,
        containers: initialContainers
      }

      return {
        gameMode: mode,
        detectiveState, // Save detective state
        ...nextState, // Restore survival state
        ...deriveState(nextState.items, nextState.equipment, state.masteries)
      }
    }
  }),

  syncWithBackend: (data: InventoryGetResponse | undefined | null) =>
    set((state) => {
      if (!data) return state
      // Detective Mode inventory is local-only (prototype). Do not overwrite it with Survival backend sync.
      if (state.gameMode === 'detective') return state

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
      const result = equipItem(state, itemId, slotId)
      return {
        ...result,
        ...deriveState(result.items, result.equipment, state.masteries)
      }
    }),

  setQuickSlot: (index, itemId) =>
    set((state) => {
      const equipment = setQuickSlot(state.items, state.equipment, index, itemId)
      return {
        equipment,
        ...deriveState(state.items, equipment, state.masteries),
      }
    }),

  moveItemWithinGrid: (itemId, position) =>
    set((state) => {
      const items = moveItemWithinGrid(state.items, itemId, position)
      return { items }
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
      const containers = addItemToContainer(state.containers, state.items, containerId, itemId)
      return { containers }
    }),

  removeItemFromContainer: (containerId, itemId) =>
    set((state) => {
      const containers = removeItemFromContainer(state.containers, containerId, itemId)
      return { containers }
    }),

  getContainers: () => {
    const state = get()
    return getAllContainers(state.items, state.equipment, state.containers)
  },
}))
