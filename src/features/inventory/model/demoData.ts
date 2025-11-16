import type {
  InventoryContainer,
  ItemState,
  ItemMastery,
  MasteryCard,
} from '@/entities/item/model/types'

const rustySword: ItemState = {
  id: 'rusty-sword',
  kind: 'weapon',
  name: 'Rusty Sword',
  description: 'Seen better days but still sharp enough to survive the Borderlands.',
  icon: '⚔',
  rarity: 'common',
  stats: { damage: 8, defense: 0, weight: 3.2, width: 1, height: 3 },
  quantity: 1,
  condition: 42,
  gridPosition: { x: 0, y: 0 },
  tags: ['melee', 'starter'],
}

const fieldMedkit: ItemState = {
  id: 'field-medkit',
  kind: 'consumable',
  name: 'Field Medkit',
  description: 'Restores 40 HP and stops bleeding.',
  icon: '⛑',
  rarity: 'uncommon',
  stats: { weight: 1.2, width: 2, height: 2 },
  quantity: 2,
  gridPosition: { x: 2, y: 1 },
  tags: ['healing'],
}

const scoutJacket: ItemState = {
  id: 'scout-jacket',
  kind: 'clothing',
  name: 'Scout Jacket',
  description: 'Lightweight jacket with hidden pockets.',
  icon: '🧥',
  rarity: 'rare',
  stats: { defense: 2, weight: 4.5, width: 2, height: 3 },
  quantity: 1,
  gridPosition: { x: 4, y: 0 },
  tags: ['clothing', 'stealth'],
}

const rationPack: ItemState = {
  id: 'ration-pack',
  kind: 'consumable',
  name: 'Ration Pack',
  description: 'Keeps you fed for a day on the frontier.',
  icon: '🍞',
  rarity: 'common',
  stats: { weight: 0.6, width: 1, height: 1 },
  quantity: 3,
  gridPosition: { x: 1, y: 4 },
  tags: ['sustenance'],
}

const micaShard: ItemState = {
  id: 'mica-shard',
  kind: 'artifact',
  name: 'Mica Shard',
  description: 'Glows faintly when anomalies are near.',
  icon: '🜁',
  rarity: 'epic',
  stats: { weight: 0.2, width: 1, height: 1 },
  quantity: 1,
  gridPosition: { x: 5, y: 5 },
  tags: ['artifact', 'detection'],
}

export const demoItems: ItemState[] = [
  rustySword,
  fieldMedkit,
  scoutJacket,
  rationPack,
  micaShard,
]

const slashCard: MasteryCard = {
  id: 'slash-technique',
  name: 'Reckless Slash',
  description: 'Deal +20% damage but lose 5 stamina.',
  type: 'combat_technique',
  requiredMasteryLevel: 1,
  damage: 5,
  cooldown: 0,
}

const parryCard: MasteryCard = {
  id: 'parry-technique',
  name: 'Defensive Parry',
  description: 'Block 30% of incoming damage once.',
  type: 'skill',
  requiredMasteryLevel: 2,
  cooldown: 2,
}

export const demoMasteries: ItemMastery[] = [
  {
    itemId: 'rusty-sword',
    level: 1,
    xp: 25,
    nextLevelXp: 100,
    unlockedCards: [slashCard],
  },
  {
    itemId: 'mica-shard',
    level: 2,
    xp: 10,
    nextLevelXp: 120,
    unlockedCards: [parryCard],
  },
]

export const demoContainers: InventoryContainer[] = [
  {
    id: 'backpack-alpha',
    ownerId: 'player',
    kind: 'backpack',
    width: 6,
    height: 8,
    items: [fieldMedkit, rationPack],
  },
  {
    id: 'rig-bravo',
    ownerId: 'player',
    kind: 'rig',
    width: 4,
    height: 4,
    items: [micaShard],
  },
]
