export type ItemType = 'weapon' | 'armor' | 'helmet' | 'backpack' | 'rig' | 'medical' | 'ammo' | 'material'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface ItemTemplate {
  id: string
  name: string
  description: string
  type: ItemType
  width: number
  height: number
  rarity: Rarity
  image: string
  weight: number
  stackable: boolean
  maxStack: number
  stats?: {
    damage?: number
    defense?: number
    ergonomics?: number
  }
  questItem?: boolean
}

export interface InventoryItem {
  instanceId: string
  templateId: string
  x: number
  y: number
  rotation: 0 | 90 | 180 | 270
  quantity: number
  containerId: string
}

export interface EquipmentSlotConfig {
  id: string
  label: string
  accepts: ItemType[]
  x: number
  y: number
}

export type LoadoutState = Record<string, string | null>

export interface InventoryState {
  initialized: boolean
  items: Record<string, InventoryItem>
  templates: Record<string, ItemTemplate>
  equipment: LoadoutState
  containers: Record<string, { width: number; height: number }>
  selectedItemId: string | null
  moveItemToGrid: (instanceId: string, containerId: string, x: number, y: number) => void
  equipItem: (instanceId: string, slotId: string) => void
  unequipItem: (instanceId: string, containerId: string) => void
  selectItem: (instanceId: string | null) => void
  autoTransferItem: (instanceId: string) => void
  unequipAll: () => void
  getContainerItems: (containerId: string) => InventoryItem[]
}

