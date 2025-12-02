export type ItemKind =
  | 'weapon'
  | 'armor'
  | 'artifact'
  | 'consumable'
  | 'clothing'
  | 'backpack'
  | 'rig'
  | 'quest'
  | 'misc'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export const RARITY_COLORS: Record<Rarity, string> = {
  common: 'border-slate-500 bg-slate-900/50',
  uncommon: 'border-green-500 bg-green-900/20',
  rare: 'border-blue-500 bg-blue-900/20',
  epic: 'border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
  legendary: 'border-amber-500 bg-amber-900/20 shadow-[0_0_20px_rgba(245,158,11,0.5)]',
}

export type PlayerRole = 'police' | 'doctor' | 'engineer' | 'smuggler'

export type EquipmentSlotId =
  | 'primary'
  | 'secondary'
  | 'melee'
  | 'helmet'
  | 'armor'
  | 'clothing_top'
  | 'clothing_bottom'
  | 'backpack'
  | 'rig'
  | 'artifact'
  | 'quick_1'
  | 'quick_2'
  | 'quick_3'
  | 'quick_4'
  | 'quick_5'

export interface SpecialEffect {
  name: string
  type: 'buff' | 'debuff' | 'passive'
  value: number
  description: string
}

export interface ContainerConfig {
  width: number
  height: number
  name: string // e.g., "Vest Pockets", "Main Compartment"
}

export interface ItemStats {
  damage?: number
  defense?: number
  weight: number
  width: number
  height: number
  maxDurability?: number
  capacity?: number
  containerConfig?: ContainerConfig // If this item provides storage (e.g. backpack)
  specialEffects?: SpecialEffect[]
}

export interface Item {
  id: string
  templateId: string
  instanceId: string
  kind: ItemKind
  name: string
  description: string
  icon: string
  rarity: Rarity
  stats: ItemStats
  quantity: number
  condition?: number
  lore?: string
  tags?: string[]
}

export interface ItemState extends Item {
  gridPosition?: {
    x: number
    y: number
    rotation?: 0 | 90
  }
  containerId?: string // ID of the container this item is inside (could be another item's ID if we nest, or a root container ID)
  isEquipped?: boolean
  equippedSlot?: EquipmentSlotId
}

export interface InventoryContainer {
  id: string
  ownerId: string
  kind: 'backpack' | 'rig' | 'pocket' | 'stash' | 'equipment_storage'
  name?: string
  width: number
  height: number
  items: ItemState[]
}

export interface EncumbranceState {
  currentWeight: number
  maxWeight: number
  level: 'light' | 'normal' | 'strained' | 'overloaded' | 'immobile'
  speedPenalty: number
  staminaPenalty: number
  noisePenalty: number
  healthPenalty?: number
}

export interface EquipmentSlots {
  primary: ItemState | null
  secondary: ItemState | null
  melee: ItemState | null
  helmet: ItemState | null
  armor: ItemState | null
  clothing_top: ItemState | null
  clothing_bottom: ItemState | null
  backpack: ItemState | null
  rig: ItemState | null
  artifacts: ItemState[]
  quick: Array<ItemState | null>
}

export type SlotKey = keyof EquipmentSlots

export interface MasteryCard {
  id: string
  name: string
  description: string
  type: 'combat_technique' | 'spell' | 'skill'
  requiredMasteryLevel: number
  damage?: number
  cooldown?: number
}

export interface ItemMastery {
  itemId: string
  level: number
  xp: number
  nextLevelXp: number
  unlockedCards: MasteryCard[]
}
