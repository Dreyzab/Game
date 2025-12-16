import type {
  EncumbranceState,
  EquipmentSlots,
  ItemMastery,
  ItemState,
  MasteryCard,
} from '@/entities/item/model/types'

type SingleSlotKey =
  | 'primary'
  | 'secondary'
  | 'melee'
  | 'helmet'
  | 'armor'
  | 'clothing_top'
  | 'clothing_bottom'
  | 'backpack'
  | 'rig'

export const itemWeight = (item: ItemState): number => {
  const base = item.stats.weight ?? 0
  return base * Math.max(1, item.quantity ?? 1)
}

const sumEquipmentWeight = (equipment: EquipmentSlots): number => {
  const singleSlots: SingleSlotKey[] = [
    'primary',
    'secondary',
    'melee',
    'helmet',
    'armor',
    'clothing_top',
    'clothing_bottom',
    'backpack',
    'rig',
  ]

  const singleWeights = singleSlots.reduce((sum, slot) => {
    const entry = equipment[slot]
    if (entry) {
      return sum + itemWeight(entry)
    }
    return sum
  }, 0)

  const artifactWeight = equipment.artifacts.reduce((sum, artifact) => sum + itemWeight(artifact), 0)
  const quickWeight = equipment.quick.reduce((sum, quickItem) => sum + (quickItem ? itemWeight(quickItem) : 0), 0)
  return singleWeights + artifactWeight + quickWeight
}

export const sumInventoryWeight = (items: Record<string, ItemState>): number => {
  return Object.values(items).reduce((sum, item) => sum + itemWeight(item), 0)
}

const deriveEncumbranceLevel = (ratio: number): EncumbranceState['level'] => {
  if (ratio < 0.5) return 'light'
  if (ratio < 0.85) return 'normal'
  if (ratio < 1) return 'strained'
  if (ratio < 1.25) return 'overloaded'
  return 'immobile'
}

const penaltiesMap: Record<EncumbranceState['level'], Pick<EncumbranceState, 'speedPenalty' | 'staminaPenalty' | 'noisePenalty' | 'healthPenalty'>> = {
  light: { speedPenalty: 0, staminaPenalty: 0, noisePenalty: 0 },
  normal: { speedPenalty: 0.05, staminaPenalty: 0.05, noisePenalty: 0.05 },
  strained: { speedPenalty: 0.15, staminaPenalty: 0.2, noisePenalty: 0.15 },
  overloaded: { speedPenalty: 0.3, staminaPenalty: 0.35, noisePenalty: 0.4, healthPenalty: 0.05 },
  immobile: { speedPenalty: 1, staminaPenalty: 1, noisePenalty: 1, healthPenalty: 0.2 },
}

export const calculateEncumbrance = (
  items: Record<string, ItemState>,
  equipment: EquipmentSlots,
  maxWeight = 45
): EncumbranceState => {
  const inventoryWeight = sumInventoryWeight(items)
  const totalWeight = inventoryWeight + sumEquipmentWeight(equipment)
  const ratio = totalWeight / maxWeight
  const level = deriveEncumbranceLevel(ratio)
  const penalties = penaltiesMap[level]

  return {
    currentWeight: Number(totalWeight.toFixed(2)),
    maxWeight,
    level,
    speedPenalty: penalties.speedPenalty,
    staminaPenalty: penalties.staminaPenalty,
    noisePenalty: penalties.noisePenalty,
    healthPenalty: penalties.healthPenalty,
  }
}

export const ensureGridPosition = (
  items: Record<string, ItemState>,
  width: number,
  height: number
): { x: number; y: number } | null => {
  const taken = new Set(
    Object.values(items)
      .filter((item) => item.gridPosition)
      .map((item) => `${item.gridPosition!.x}:${item.gridPosition!.y}`)
  )

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = `${x}:${y}`
      if (!taken.has(key)) {
        return { x, y }
      }
    }
  }

  return null
}

export type PlayerStatsSummary = {
  totalDamage: number
  totalDefense: number
  totalWeight: number
}

export type ActiveMastery = {
  itemId: string
  itemName: string
  cards: MasteryCard[]
}

export const calculateEquipmentStats = (equipment: EquipmentSlots): PlayerStatsSummary => {
  const singleSlots: SingleSlotKey[] = [
    'primary',
    'secondary',
    'melee',
    'helmet',
    'armor',
    'clothing_top',
    'clothing_bottom',
    'backpack',
    'rig',
  ]

  let damage = 0
  let defense = 0
  let weight = 0

  singleSlots.forEach((slot) => {
    const item = equipment[slot]
    if (!item) return
    damage += item.stats.damage ?? 0
    defense += item.stats.defense ?? 0
    weight += itemWeight(item)
  })

  equipment.artifacts.forEach((artifact) => {
    damage += artifact.stats.damage ?? 0
    defense += artifact.stats.defense ?? 0
    weight += itemWeight(artifact)
  })

  equipment.quick.forEach((entry) => {
    if (!entry) return
    damage += entry.stats.damage ?? 0
    defense += entry.stats.defense ?? 0
    weight += itemWeight(entry)
  })

  return {
    totalDamage: Number(damage.toFixed(2)),
    totalDefense: Number(defense.toFixed(2)),
    totalWeight: Number(weight.toFixed(2)),
  }
}

export const collectActiveMasteryCards = (
  equipment: EquipmentSlots,
  masteries: Record<string, ItemMastery>
): ActiveMastery[] => {
  const slots: ItemState[] = [
    equipment.primary,
    equipment.secondary,
    equipment.melee,
    equipment.helmet,
    equipment.armor,
    equipment.clothing_top,
    equipment.clothing_bottom,
    equipment.backpack,
    equipment.rig,
    ...equipment.artifacts,
    ...equipment.quick.filter((entry): entry is ItemState => Boolean(entry)),
  ].filter(Boolean) as ItemState[]

  return slots
    .map((item) => {
      const mastery = masteries[item.id]
      if (!mastery || mastery.unlockedCards.length === 0) return null
      return {
        itemId: item.id,
        itemName: item.name,
        cards: mastery.unlockedCards,
      }
    })
    .filter(Boolean) as ActiveMastery[]
}
