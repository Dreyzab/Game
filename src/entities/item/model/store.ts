import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ItemState, EquipmentSlotId, InventoryContainer, EquipmentSlots } from './types'
import { inventoryOutbox } from './outbox'

interface InventoryState {
    items: Record<string, ItemState> // All items by instanceId
    maxWeight: number

    // Getters
    getCurrentWeight: () => number
    getEquippedItems: () => EquipmentSlots
    getContainers: () => InventoryContainer[]

    // Actions
    addItem: (item: ItemState) => void
    removeItem: (itemId: string) => void
    equipItem: (itemId: string, slot: EquipmentSlotId) => void
    unequipItem: (itemId: string) => void
    moveItem: (itemId: string, targetContainerId: string, x: number, y: number) => void
}

// Helper to create a container from an item
const createContainerFromItem = (item: ItemState): InventoryContainer | null => {
    if (!item.stats.containerConfig) return null
    return {
        id: item.instanceId, // The container ID is the item's ID
        ownerId: 'player', // Local player
        kind: 'equipment_storage',
        name: item.stats.containerConfig.name,
        width: item.stats.containerConfig.width,
        height: item.stats.containerConfig.height,
        items: [] // Populated dynamically
    }
}

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set, get) => ({
            items: {},
            maxWeight: 30.0,

            getCurrentWeight: () => {
                return Object.values(get().items).reduce((acc, item) => acc + (item.stats.weight * item.quantity), 0)
            },

            getEquippedItems: () => {
                const items = get().items
                const slots: EquipmentSlots = {
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
                    quick: [null, null, null, null, null]
                }

                Object.values(items).forEach(item => {
                    if (item.isEquipped && item.equippedSlot) {
                        if (item.equippedSlot.startsWith('quick_')) {
                            const index = parseInt(item.equippedSlot.split('_')[1]) - 1
                            if (index >= 0 && index < 5) slots.quick[index] = item
                        } else if (item.equippedSlot === 'artifact') {
                            slots.artifacts.push(item)
                        } else {
                            // @ts-ignore - we know the key matches
                            slots[item.equippedSlot] = item
                        }
                    }
                })
                return slots
            },

            getContainers: () => {
                const state = get()
                const equipped = state.getEquippedItems()
                const containers: InventoryContainer[] = []

                // 1. Base Pockets (Always available)
                containers.push({
                    id: 'pockets',
                    ownerId: 'player',
                    kind: 'pocket',
                    name: 'Pockets',
                    width: 4,
                    height: 2,
                    items: []
                })

                // 2. Dynamic containers from equipment
                if (equipped.backpack) {
                    const c = createContainerFromItem(equipped.backpack)
                    if (c) containers.push(c)
                }
                if (equipped.rig) {
                    const c = createContainerFromItem(equipped.rig)
                    if (c) containers.push(c)
                }
                if (equipped.armor && equipped.armor.stats.containerConfig) {
                    const c = createContainerFromItem(equipped.armor)
                    if (c) containers.push(c)
                }
                // ... add other slots if they provide storage (e.g. belt)

                // 3. Populate containers with items
                const allItems = Object.values(state.items)
                containers.forEach(container => {
                    container.items = allItems.filter(i => i.containerId === container.id)
                })

                return containers
            },

            addItem: (item) => {
                set((state) => {
                    const newItems = { ...state.items, [item.instanceId]: item }
                    inventoryOutbox.getState().enqueue({ type: 'ADD_ITEM', payload: item })
                    return { items: newItems }
                })
            },

            equipItem: (itemId, slot) => {
                set((state) => {
                    const item = state.items[itemId]
                    if (!item) return state

                    const updatedItems = { ...state.items }

                    // 1. Unequip current item in that slot
                    const currentEquipped = Object.values(state.items).find(i => i.isEquipped && i.equippedSlot === slot)
                    if (currentEquipped) {
                        updatedItems[currentEquipped.instanceId] = {
                            ...currentEquipped,
                            isEquipped: false,
                            equippedSlot: undefined
                        }
                    }

                    // 2. Equip new item
                    updatedItems[itemId] = {
                        ...item,
                        isEquipped: true,
                        equippedSlot: slot,
                        containerId: undefined // Removed from container when equipped
                    }

                    inventoryOutbox.getState().enqueue({ type: 'EQUIP_ITEM', itemId, slot })
                    return { items: updatedItems }
                })
            },

            unequipItem: (itemId) => {
                set((state) => {
                    const item = state.items[itemId]
                    if (!item) return state

                    // Move to pockets by default or first available container? 
                    // For now, just unflag it, user must place it manually or it goes to "stash"
                    const updatedItems = { ...state.items }
                    updatedItems[itemId] = { ...item, isEquipped: false, equippedSlot: undefined }

                    inventoryOutbox.getState().enqueue({ type: 'UNEQUIP_ITEM', itemId })
                    return { items: updatedItems }
                })
            },

            moveItem: (itemId, targetContainerId, x, y) => {
                set((state) => {
                    const item = state.items[itemId]
                    if (!item) return state

                    const updatedItems = { ...state.items }
                    updatedItems[itemId] = {
                        ...item,
                        containerId: targetContainerId,
                        gridPosition: { x, y },
                        isEquipped: false,
                        equippedSlot: undefined
                    }

                    inventoryOutbox.getState().enqueue({ type: 'MOVE_ITEM', itemId, containerId: targetContainerId, x, y })
                    return { items: updatedItems }
                })
            },

            removeItem: (itemId) => {
                set((state) => {
                    const { [itemId]: deleted, ...rest } = state.items
                    inventoryOutbox.getState().enqueue({ type: 'REMOVE_ITEM', itemId })
                    return { items: rest }
                })
            }
        }),
        { name: 'inventory-storage' }
    )
)
