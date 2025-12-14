/**
 * Shared Item Types
 * Single source of truth for item definitions used by both client and server.
 */

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

export interface ContainerConfig {
    width: number
    height: number
    name: string
}

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
    containerConfig?: ContainerConfig
    specialEffects?: SpecialEffect[]
}

export interface ItemTemplate {
    id: string
    name: string
    description: string
    kind: ItemKind
    rarity: Rarity
    icon: string
    baseStats: ItemStats
    tags?: string[]
    /** Optional link to combat weapon template ID for combat system integration */
    combatWeaponId?: string
}
