import { create } from 'zustand'
import { EQUIPMENT_SLOTS, IS_MOBILE, ITEM_TEMPLATES } from './constants'
import type { InventoryItem, InventoryState, ItemTemplate, LoadoutState } from './types'
import { authenticatedClient } from '@/shared/api/client'



type Store = InventoryState & {
  initialize: (token?: string, deviceId?: string) => Promise<void>
  getTotalWeight: () => number
}

const INITIAL_STASH_WIDTH = IS_MOBILE ? 7 : 10
const INITIAL_STASH_HEIGHT = 15

const findFirstFitPosition = ({
  instanceId,
  containerId,
  items,
  templates,
  containers,
}: {
  instanceId: string
  containerId: string
  items: Record<string, InventoryItem>
  templates: Record<string, ItemTemplate>
  containers: Record<string, { width: number; height: number }>
}) => {
  const item = items[instanceId]
  if (!item) return null

  const template = templates[item.templateId]
  const container = containers[containerId]
  if (!template || !container) return null

  const containerItems = Object.values(items).filter(
    (i) => i.containerId === containerId && i.instanceId !== instanceId
  )

  for (let y = 0; y <= container.height - template.height; y++) {
    for (let x = 0; x <= container.width - template.width; x++) {
      let collision = false
      for (const existing of containerItems) {
        const existingTemplate = templates[existing.templateId]
        const overlap =
          x < existing.x + existingTemplate.width &&
          x + template.width > existing.x &&
          y < existing.y + existingTemplate.height &&
          y + template.height > existing.y
        if (overlap) {
          collision = true
          break
        }
      }

      if (!collision) return { x, y }
    }
  }

  return null
}

export const useTrinityInventoryStore = create<Store>((set, get) => ({
  initialized: false,
  items: {},
  templates: ITEM_TEMPLATES,
  equipment: {
    helmet: null,
    armor: null,
    primary: null,
    secondary: null,
    backpack: null,
    rig: null,
    pocket1: null,
    pocket2: null,
    pocket3: null,
    pocket4: null,
  },
  containers: {
    stash: { width: INITIAL_STASH_WIDTH, height: INITIAL_STASH_HEIGHT },
  },
  selectedItemId: null,

  initialize: async (token, deviceId) => {
    if (get().initialized) return

    try {
      const client = authenticatedClient(token, deviceId)
      const { data, error } = await client.inventory.get()
      const { data: stashData, error: stashError } = await (client.inventory as any).stash.get()

      if (error || stashError) {
        console.warn('Inventory sync failed, using default state', error || stashError)
      }

      const items: Record<string, InventoryItem> = {}
      const equipment: LoadoutState = {
        helmet: null,
        armor: null,
        primary: null,
        secondary: null,
        backpack: null,
        rig: null,
        pocket1: null,
        pocket2: null,
        pocket3: null,
        pocket4: null,
      }
      const containers: Record<string, { width: number; height: number }> = {
        stash: { width: INITIAL_STASH_WIDTH, height: INITIAL_STASH_HEIGHT },
      }

      // Map stash items
      if (stashData && (stashData as any).items) {
        (stashData as any).items.forEach((item: any) => {
          items[item.id] = {
            instanceId: item.id,
            templateId: item.templateId,
            x: item.gridPosition?.x ?? 0,
            y: item.gridPosition?.y ?? 0,
            rotation: item.gridPosition?.rotation ?? 0,
            quantity: item.quantity ?? 1,
            containerId: 'stash'
          }
        })
      }

      // Map main inventory items
      if (data) {
        // Items
        if (Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            if (item.slot === 'stash') return // Already handled if using separate stash API
            items[item.id] = {
              instanceId: item.id,
              templateId: item.templateId,
              x: item.gridPosition?.x ?? 0,
              y: item.gridPosition?.y ?? 0,
              rotation: item.gridPosition?.rotation ?? 0,
              quantity: item.quantity ?? 1,
              containerId: item.containerId || 'equipped'
            }
          })
        }

        // Equipment
        const inventoryData = data as any
        if (inventoryData.equipment) {
          Object.entries(inventoryData.equipment).forEach(([slot, item]: [string, any]) => {
            if (item && typeof item === 'object' && item.id) {
              equipment[slot] = item.id
              items[item.id] = {
                instanceId: item.id,
                templateId: item.templateId,
                x: -1,
                y: -1,
                rotation: 0,
                quantity: item.quantity ?? 1,
                containerId: 'equipped'
              }
              // If it's a container (backpack), add to containers record
              if (item.stats?.containerConfig) {
                containers[item.id] = {
                  width: item.stats.containerConfig.width,
                  height: item.stats.containerConfig.height
                }
              }
            }
          })
        }

        // Recursive items in containers
        if (Array.isArray((data as any).containers)) {
          (data as any).containers.forEach((c: any) => {
            containers[c.id] = { width: c.width, height: c.height };
            if (Array.isArray(c.items)) {
              c.items.forEach((item: any) => {
                items[item.id] = {
                  instanceId: item.id,
                  templateId: item.templateId,
                  x: item.gridPosition?.x ?? 0,
                  y: item.gridPosition?.y ?? 0,
                  rotation: item.gridPosition?.rotation ?? 0,
                  quantity: item.quantity ?? 1,
                  containerId: c.id
                }
              })
            }
          })
        }
      }

      set({ items, equipment, containers, initialized: true })
    } catch (e) {
      console.error('Failed to initialize trinity inventory store', e)
    }
  },

  selectItem: (instanceId) => set({ selectedItemId: instanceId }),

  getContainerItems: (containerId) => {
    const { items } = get()
    return Object.values(items).filter((item) => item.containerId === containerId)
  },

  moveItemToGrid: async (instanceId, containerId, targetX, targetY) => {
    const { items, templates, containers, equipment } = get()
    const item = items[instanceId]
    if (!item) return

    const template = templates[item.templateId]
    const container = containers[containerId]
    if (!template || !container) return

    if (targetX < 0 || targetY < 0 || targetX + template.width > container.width || targetY + template.height > container.height) {
      return
    }

    const containerItems = Object.values(items).filter(
      (i) => i.containerId === containerId && i.instanceId !== instanceId
    )

    let hasCollision = false
    for (const other of containerItems) {
      const otherTemplate = templates[other.templateId]
      const overlap =
        targetX < other.x + otherTemplate.width &&
        targetX + template.width > other.x &&
        targetY < other.y + otherTemplate.height &&
        targetY + template.height > other.y
      if (overlap) {
        hasCollision = true
        break
      }
    }

    if (hasCollision) return

    // Persistence logic
    if (containerId === 'stash' || item.containerId === 'stash') {
      try {
        const client = authenticatedClient()
        await (client.inventory as any).stash.move.post({
          itemId: instanceId,
          toStash: containerId === 'stash',
          gridPosition: { x: targetX, y: targetY }
        })
      } catch (e) {
        console.error('Failed to sync stash move', e)
      }
    }

    const equippedSlot = Object.entries(equipment).find(([, id]) => id === instanceId)
    const nextEquipment = equippedSlot ? { ...equipment, [equippedSlot[0]]: null } : equipment
    const nextContainers = { ...containers }

    if (equippedSlot && template.type === 'backpack') {
      delete nextContainers[instanceId]
    }

    set({
      items: {
        ...items,
        [instanceId]: { ...item, containerId, x: targetX, y: targetY },
      },
      equipment: nextEquipment,
      containers: nextContainers,
    })
  },

  equipItem: (instanceId, slotId) => {
    const { items, templates, equipment, containers } = get()
    const item = items[instanceId]
    if (!item) return
    const template = templates[item.templateId]

    if (equipment[slotId]) return

    const nextEquipment = { ...equipment, [slotId]: instanceId }
    const nextContainers = { ...containers }

    if (template.type === 'backpack') {
      nextContainers[instanceId] = { width: 5, height: 5 }
    }

    set({
      items: {
        ...items,
        [instanceId]: { ...item, containerId: 'equipped', x: -1, y: -1 },
      },
      equipment: nextEquipment,
      containers: nextContainers,
    })
  },

  unequipItem: (instanceId, containerId) => {
    const { containers, items, templates } = get()
    const resolvedContainer = containers[containerId] ? containerId : 'stash'
    const position = findFirstFitPosition({ instanceId, containerId: resolvedContainer, items, templates, containers })
    if (!position) return
    get().moveItemToGrid(instanceId, resolvedContainer, position.x, position.y)
  },

  autoTransferItem: (instanceId) => {
    const { items, templates, equipment } = get()
    const item = items[instanceId]
    if (!item) return
    const template = templates[item.templateId]

    if (item.containerId === 'equipped') {
      get().unequipItem(instanceId, 'stash')
      return
    }

    const compatibleSlot = EQUIPMENT_SLOTS.find((slot) => slot.accepts.includes(template.type) && equipment[slot.id] === null)
    if (!compatibleSlot) return

    get().equipItem(instanceId, compatibleSlot.id)
  },

  unequipAll: () => {
    const { equipment } = get()
    Object.values(equipment).forEach((itemId) => {
      if (itemId) get().autoTransferItem(itemId)
    })
  },

  getTotalWeight: () => {
    const { items, templates } = get()
    return Object.values(items).reduce((total, item) => total + templates[item.templateId].weight * (item.quantity || 1), 0)
  },
}))
