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

export interface ItemStats {
  damage?: number
  defense?: number
  weight: number
  width: number
  height: number
  maxDurability?: number
  capacity?: number
  specialEffects?: SpecialEffect[]
}

export interface Item {
  id: string
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
  containerId?: string
  isEquipped?: boolean
}

export interface InventoryContainer {
  id: string
  ownerId: string
  kind: 'backpack' | 'rig' | 'pocket' | 'stash'
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
