import type {
  InventoryContainer,
  ItemMastery,
  ItemState,
  MasteryCard,
} from '@/entities/item/model/types'

const rustySword: ItemState = {
  id: 'rusty-sword',
  templateId: 'rusty_sword',
  instanceId: 'inst-1',
  kind: 'weapon',
  name: 'Rusty Sword',
  description: 'An old iron sword, chipped and dull.',
  icon: '⚔️',
  rarity: 'common',
  stats: { damage: 12, weight: 2.5, width: 1, height: 3, maxDurability: 50 },
  quantity: 1,
  condition: 42,
  gridPosition: { x: 0, y: 0 },
  tags: ['melee', 'slashing'],
}

const fieldMedkit: ItemState = {
  id: 'field-medkit',
  templateId: 'field_medkit',
  instanceId: 'inst-2',
  kind: 'consumable',
  name: 'Field Medkit',
  description: 'Restores 40 HP and stops bleeding.',
  icon: '⛑',
  rarity: 'uncommon',
  stats: { weight: 1.2, width: 2, height: 2 },
  quantity: 2,
  gridPosition: { x: 1, y: 0 },
  tags: ['healing'],
}

const scoutJacket: ItemState = {
  id: 'scout-jacket',
  templateId: 'scout_jacket',
  instanceId: 'inst-3',
  kind: 'clothing',
  name: 'Scout Jacket',
  description: 'Lightweight jacket with hidden pockets.',
  icon: '🧥',
  rarity: 'rare',
  stats: { defense: 2, weight: 4.5, width: 2, height: 3 },
  quantity: 1,
  gridPosition: { x: 2, y: 0 },
  tags: ['clothing', 'stealth'],
}

const rationPack: ItemState = {
  id: 'ration-pack',
  templateId: 'ration_pack',
  instanceId: 'inst-4',
  kind: 'consumable',
  name: 'Ration Pack',
  description: 'Keeps you fed for a day on the frontier.',
  icon: '🍞',
  rarity: 'common',
  stats: { weight: 0.6, width: 1, height: 1 },
  quantity: 3,
  gridPosition: { x: 3, y: 0 },
  tags: ['sustenance'],
}

const micaShard: ItemState = {
  id: 'mica-shard',
  templateId: 'mica_shard',
  instanceId: 'inst-5',
  kind: 'artifact',
  name: 'Mica Shard',
  description: 'Glows faintly when anomalies are near.',
  icon: '🜁',
  rarity: 'epic',
  stats: { weight: 0.2, width: 1, height: 1 },
  quantity: 1,
  gridPosition: { x: 4, y: 0 },
  tags: ['artifact', 'detection'],
}

const leadPipe: ItemState = {
  id: 'lead-pipe',
  templateId: 'lead_pipe',
  instanceId: 'inst-6',
  kind: 'weapon',
  name: 'Lead Pipe',
  description: 'A heavy, corroded iron pipe. Crude but effective.',
  icon: 'pipe',
  rarity: 'common',
  stats: { damage: 8, weight: 3.0, width: 1, height: 3, maxDurability: 50 },
  quantity: 1,
  condition: 45,
  gridPosition: { x: 5, y: 0 },
  tags: ['melee', 'crushing'],
}

const kitchenKnife: ItemState = {
  id: 'kitchen-knife',
  templateId: 'kitchen_knife',
  instanceId: 'inst-7',
  kind: 'weapon',
  name: 'Kitchen Knife',
  description: 'Standard kitchen knife. Sharp but fragile.',
  icon: '🔪',
  rarity: 'common',
  stats: { damage: 5, weight: 0.5, width: 1, height: 2, maxDurability: 30 },
  quantity: 1,
  condition: 28,
  gridPosition: { x: 6, y: 0 },
  tags: ['melee', 'piercing'],
}

const sledgehammer: ItemState = {
  id: 'sledgehammer',
  templateId: 'sledgehammer',
  instanceId: 'inst-8',
  kind: 'weapon',
  name: 'Sledgehammer',
  description: 'Heavy industrial tool. Devastating impact.',
  icon: '🔨',
  rarity: 'uncommon',
  stats: { damage: 14, weight: 8.0, width: 2, height: 4, maxDurability: 80 },
  quantity: 1,
  condition: 75,
  gridPosition: { x: 0, y: 4 },
  tags: ['melee', 'crushing', 'two_handed'],
}

const brokenBottle: ItemState = {
  id: 'broken-bottle',
  templateId: 'broken_bottle',
  instanceId: 'inst-9',
  kind: 'weapon',
  name: 'Broken Bottle',
  description: 'Jagged glass. Causes bleeding.',
  icon: '🍾',
  rarity: 'common',
  stats: { damage: 4, weight: 0.2, width: 1, height: 1, maxDurability: 5 },
  quantity: 1,
  condition: 3,
  gridPosition: { x: 7, y: 0 },
  tags: ['melee', 'slashing'],
}

const glock19: ItemState = {
  id: 'glock-19',
  templateId: 'glock_19',
  instanceId: 'inst-10',
  kind: 'weapon',
  name: 'Glock 19',
  description: 'Reliable 9mm pistol. Standard issue.',
  icon: '🔫',
  rarity: 'rare',
  stats: { damage: 10, weight: 1.5, width: 2, height: 2, maxDurability: 100 },
  quantity: 1,
  condition: 95,
  gridPosition: { x: 2, y: 4 },
  tags: ['ranged', 'ballistic', 'pistol'],
}

const sawedOffShotgun: ItemState = {
  id: 'sawed-off-shotgun',
  templateId: 'sawed_off_shotgun',
  instanceId: 'inst-11',
  kind: 'weapon',
  name: 'Sawed-off Shotgun',
  description: 'Modified for close quarters. High spread.',
  icon: '💥',
  rarity: 'rare',
  stats: { damage: 18, weight: 2.5, width: 3, height: 2, maxDurability: 80 },
  quantity: 1,
  condition: 60,
  gridPosition: { x: 4, y: 4 },
  tags: ['ranged', 'ballistic', 'shotgun'],
}

export const demoItems: ItemState[] = [
  rustySword,
  fieldMedkit,
  scoutJacket,
  rationPack,
  micaShard,
  leadPipe,
  kitchenKnife,
  sledgehammer,
  brokenBottle,
  glock19,
  sawedOffShotgun,
]

const slashCard: MasteryCard = {
  id: 'card-slash',
  name: 'Vertical Slash',
  description: 'A basic downward strike dealing 120% damage.',
  type: 'combat_technique',
  requiredMasteryLevel: 1,
  damage: 1.2,
  cooldown: 2,
}

export const demoMasteries: ItemMastery[] = [
  {
    itemId: 'rusty-sword',
    level: 2,
    xp: 150,
    nextLevelXp: 300,
    unlockedCards: [slashCard],
  },
]

export const demoContainers: InventoryContainer[] = [
  {
    id: 'backpack-1',
    ownerId: 'player-1',
    kind: 'backpack',
    width: 5,
    height: 6,
    items: [fieldMedkit, rationPack],
  },
  {
    id: 'pockets',
    ownerId: 'player-1',
    kind: 'pocket',
    width: 4,
    height: 2,
    items: [micaShard],
  },
]
