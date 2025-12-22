import { create } from 'zustand'
import { EQUIPMENT_SLOTS, IS_MOBILE, ITEM_TEMPLATES } from './constants'
import type { InventoryItem, InventoryState, ItemTemplate } from './types'

const generateId = () => Math.random().toString(36).slice(2, 11)

type Store = InventoryState & {
  initialize: () => void
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

  initialize: () => {
    if (get().initialized) return

    const primaryWeaponId = generateId()
    const secondaryWeaponId = generateId()
    const pocketMedkitId = generateId()
    const pocketAmmo1Id = generateId()
    const pocketAmmo2Id = generateId()
    const pocketLootId = generateId()
    const armorId = generateId()
    const backpackId = generateId()

    const starterItems: InventoryItem[] = [
      { instanceId: primaryWeaponId, templateId: 'ar-15', x: -1, y: -1, rotation: 0, quantity: 1, containerId: 'equipped' },
      { instanceId: secondaryWeaponId, templateId: 'pistol', x: -1, y: -1, rotation: 0, quantity: 1, containerId: 'equipped' },
      { instanceId: pocketMedkitId, templateId: 'medkit', x: -1, y: -1, rotation: 0, quantity: 1, containerId: 'equipped' },
      { instanceId: pocketAmmo1Id, templateId: 'ammo_box', x: -1, y: -1, rotation: 0, quantity: 60, containerId: 'equipped' },
      { instanceId: pocketAmmo2Id, templateId: 'ammo_box', x: -1, y: -1, rotation: 0, quantity: 60, containerId: 'equipped' },
      { instanceId: pocketLootId, templateId: 'gold_watch', x: -1, y: -1, rotation: 0, quantity: 1, containerId: 'equipped' },
      { instanceId: armorId, templateId: 'armor_light', x: -1, y: -1, rotation: 0, quantity: 1, containerId: 'equipped' },
      { instanceId: backpackId, templateId: 'backpack_large', x: -1, y: -1, rotation: 0, quantity: 1, containerId: 'equipped' },
    ]

    const items = starterItems.reduce(
      (acc, item) => {
        acc[item.instanceId] = item
        return acc
      },
      {} as Record<string, InventoryItem>
    )

    set({
      items,
      equipment: {
        helmet: null,
        armor: armorId,
        primary: primaryWeaponId,
        secondary: secondaryWeaponId,
        backpack: backpackId,
        rig: null,
        pocket1: pocketMedkitId,
        pocket2: pocketAmmo1Id,
        pocket3: pocketAmmo2Id,
        pocket4: pocketLootId,
      },
      containers: {
        stash: { width: INITIAL_STASH_WIDTH, height: INITIAL_STASH_HEIGHT },
        [backpackId]: { width: 5, height: 5 },
      },
      initialized: true,
    })
  },

  selectItem: (instanceId) => set({ selectedItemId: instanceId }),

  getContainerItems: (containerId) => {
    const { items } = get()
    return Object.values(items).filter((item) => item.containerId === containerId)
  },

  moveItemToGrid: (instanceId, containerId, targetX, targetY) => {
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

