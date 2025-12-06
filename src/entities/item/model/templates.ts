import type { ItemKind, ItemStats, Rarity } from './types'

export interface ItemTemplate {
    id: string
    name: string
    description: string
    kind: ItemKind
    rarity: Rarity
    icon: string
    baseStats: ItemStats
    tags?: string[]
}

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
    // Weapons
    rusty_sword: {
        id: 'rusty_sword',
        name: 'Rusty Sword',
        description: 'An old iron sword, chipped and dull. Better than bare hands.',
        kind: 'weapon',
        rarity: 'common',
        icon: '⚔️',
        baseStats: {
            damage: 12,
            weight: 2.5,
            width: 1,
            height: 3,
            maxDurability: 50,
        },
        tags: ['melee', 'slashing'],
    },
    rusty_pipe: {
        id: 'rusty_pipe',
        name: 'Rusty Pipe',
        description: 'A heavy, corroded iron pipe. Crude but effective.',
        kind: 'weapon',
        rarity: 'common',
        icon: 'pipe', // Placeholder icon name
        baseStats: {
            damage: 8,
            weight: 2.0,
            width: 1,
            height: 3,
            maxDurability: 40,
        },
        tags: ['melee', 'blunt'],
    },

    // Clothing / Armor
    scout_jacket: {
        id: 'scout_jacket',
        name: 'Scout Jacket',
        description: 'Lightweight jacket with hidden pockets. Favored by runners.',
        kind: 'clothing',
        rarity: 'rare',
        icon: '🧥',
        baseStats: {
            defense: 2,
            weight: 1.5,
            width: 2,
            height: 2,
        },
        tags: ['clothing', 'stealth'],
    },

    // Consumables
    field_medkit: {
        id: 'field_medkit',
        name: 'Field Medkit',
        description: 'Standard issue medical kit. Restores HP and stops bleeding.',
        kind: 'consumable',
        rarity: 'uncommon',
        icon: '⛑',
        baseStats: {
            weight: 1.2,
            width: 2,
            height: 2,
        },
        tags: ['healing'],
    },
    bandage: {
        id: 'bandage',
        name: 'Dirty Bandage',
        description: 'Better than nothing, but risks infection.',
        kind: 'consumable',
        rarity: 'common',
        icon: 'bandage',
        baseStats: {
            weight: 0.1,
            width: 1,
            height: 1,
        },
        tags: ['healing'],
    },
    ration_pack: {
        id: 'ration_pack',
        name: 'Ration Pack',
        description: 'Keeps you fed for a day on the frontier. Tastes like cardboard.',
        kind: 'consumable',
        rarity: 'common',
        icon: '🍞',
        baseStats: {
            weight: 0.6,
            width: 1,
            height: 1,
        },
        tags: ['sustenance'],
    },
    canned_food: {
        id: 'canned_food',
        name: 'Canned Beans',
        description: 'Expired in 2012. Edible, probably.',
        kind: 'consumable',
        rarity: 'common',
        icon: 'can',
        baseStats: {
            weight: 0.5,
            width: 1,
            height: 1,
        },
        tags: ['sustenance'],
    },

    // Artifacts
    mica_shard: {
        id: 'mica_shard',
        name: 'Mica Shard',
        description: 'Glows faintly when anomalies are near. Warm to the touch.',
        kind: 'artifact',
        rarity: 'epic',
        icon: '🜁',
        baseStats: {
            weight: 0.2,
            width: 1,
            height: 1,
        },
        tags: ['artifact', 'detection'],
    },

    // New Weapons from inveAndCombs.md
    lead_pipe: {
        id: 'lead_pipe',
        name: 'Lead Pipe',
        description: 'A heavy, corroded iron pipe. Crude but effective.',
        kind: 'weapon',
        rarity: 'common',
        icon: 'pipe',
        baseStats: {
            damage: 8, // 1d6+2 approx
            weight: 3.0,
            width: 1,
            height: 3,
            maxDurability: 50,
        },
        tags: ['melee', 'crushing'],
    },
    kitchen_knife: {
        id: 'kitchen_knife',
        name: 'Kitchen Knife',
        description: 'Standard kitchen knife. Sharp but fragile.',
        kind: 'weapon',
        rarity: 'common',
        icon: '🔪',
        baseStats: {
            damage: 5, // 1d4+1 approx
            weight: 0.5,
            width: 1,
            height: 2,
            maxDurability: 30,
        },
        tags: ['melee', 'piercing'],
    },
    sledgehammer: {
        id: 'sledgehammer',
        name: 'Sledgehammer',
        description: 'Heavy industrial tool. Devastating impact.',
        kind: 'weapon',
        rarity: 'uncommon',
        icon: '🔨',
        baseStats: {
            damage: 14, // 2d6 approx
            weight: 8.0,
            width: 2,
            height: 4,
            maxDurability: 80,
        },
        tags: ['melee', 'crushing', 'two_handed'],
    },
    broken_bottle: {
        id: 'broken_bottle',
        name: 'Broken Bottle',
        description: 'Jagged glass. Causes bleeding.',
        kind: 'weapon',
        rarity: 'common',
        icon: '🍾',
        baseStats: {
            damage: 4, // 1d4 approx
            weight: 0.2,
            width: 1,
            height: 1,
            maxDurability: 5,
        },
        tags: ['melee', 'slashing'],
    },
    glock_19: {
        id: 'glock_19',
        name: 'Glock 19',
        description: 'Reliable 9mm pistol. Standard issue.',
        kind: 'weapon',
        rarity: 'rare',
        icon: '🔫',
        baseStats: {
            damage: 10, // 2d6 approx
            weight: 1.5,
            width: 2,
            height: 2,
            maxDurability: 100,
        },
        tags: ['ranged', 'ballistic', 'pistol'],
    },
    sawed_off_shotgun: {
        id: 'sawed_off_shotgun',
        name: 'Sawed-off Shotgun',
        description: 'Modified for close quarters. High spread.',
        kind: 'weapon',
        rarity: 'rare',
        icon: '💥',
        baseStats: {
            damage: 18, // 3d6 approx
            weight: 2.5,
            width: 3,
            height: 2,
            maxDurability: 80,
        },
        tags: ['ranged', 'ballistic', 'shotgun'],
    },

    // --- Starting Items (Synced with convex/inventory.ts) ---

    // Common Clothing
    clothing_basic: {
        id: 'clothing_basic',
        name: 'Worn Clothes',
        description: 'Simple, comfortable clothing. Seen better days.',
        kind: 'clothing',
        rarity: 'common',
        icon: '👕',
        baseStats: { weight: 1, width: 2, height: 2, defense: 1 },
        tags: ['clothing'],
    },
    trousers_basic: {
        id: 'trousers_basic',
        name: 'Cargo Pants',
        description: 'Durable pants with plenty of pockets.',
        kind: 'clothing',
        rarity: 'common',
        icon: '👖',
        baseStats: { weight: 1, width: 2, height: 2, defense: 1 },
        tags: ['clothing'],
    },

    // Role: Police
    pistol_pm: {
        id: 'pistol_pm',
        name: 'PM Pistol',
        description: 'Makarov pistol. Reliable sidearm.',
        kind: 'weapon',
        rarity: 'common',
        icon: '🔫',
        baseStats: { damage: 8, weight: 1.5, width: 2, height: 1, maxDurability: 100 },
        tags: ['ranged', 'pistol'],
    },
    vest_police: {
        id: 'vest_police',
        name: 'Police Vest',
        description: 'Standard issue kevlar vest. Offers decent protection.',
        kind: 'armor',
        rarity: 'uncommon',
        icon: '🦺',
        baseStats: { defense: 15, weight: 4, width: 3, height: 3, maxDurability: 80 },
        tags: ['armor'],
    },
    helmet_police: {
        id: 'helmet_police',
        name: 'Riot Helmet',
        description: 'Heavy helmet with visor.',
        kind: 'armor',
        rarity: 'uncommon',
        icon: '⛑',
        baseStats: { defense: 10, weight: 2, width: 2, height: 2, maxDurability: 60 },
        tags: ['armor', 'head'],
    },
    badge: {
        id: 'badge',
        name: 'Police Badge',
        description: 'A tarnished badge. Authority is a memory.',
        kind: 'misc',
        rarity: 'common',
        icon: '👮',
        baseStats: { weight: 0.1, width: 1, height: 1 },
        tags: ['misc'],
    },
    rifle_ak74: {
        id: 'rifle_ak74',
        name: 'AK-74',
        description: 'Reliable assault rifle. 5.45mm.',
        kind: 'weapon',
        rarity: 'rare',
        icon: '🔫',
        baseStats: { damage: 25, weight: 3.5, width: 3, height: 2, maxDurability: 90 },
        tags: ['ranged', 'rifle', 'two_handed'],
    },

    // Role: Doctor
    medkit: {
        id: 'medkit',
        name: 'First Aid Kit',
        description: 'Essential for treating wounds.',
        kind: 'consumable',
        rarity: 'uncommon',
        icon: '⛑',
        baseStats: { weight: 1, width: 1, height: 1 },
        tags: ['healing'],
    },
    backpack_medic: {
        id: 'backpack_medic',
        name: 'Medic Bag',
        description: 'Specialized backpack with compartments for medical supplies.',
        kind: 'backpack',
        rarity: 'uncommon',
        icon: '🎒',
        baseStats: { weight: 1.5, width: 2, height: 2, capacity: 16 },
        tags: ['backpack'],
    },
    pills: {
        id: 'pills',
        name: 'Painkillers',
        description: 'Temporary relief from pain.',
        kind: 'consumable',
        rarity: 'common',
        icon: '💊',
        baseStats: { weight: 0.1, width: 1, height: 1 },
        tags: ['healing'],
    },

    // Role: Engineer
    wrench: {
        id: 'wrench',
        name: 'Heavy Wrench',
        description: 'Good for fixing things, or breaking them.',
        kind: 'weapon',
        rarity: 'common',
        icon: '🔧',
        baseStats: { damage: 10, weight: 2, width: 1, height: 2, maxDurability: 60 },
        tags: ['melee', 'tool'],
    },
    belt_tool: {
        id: 'belt_tool',
        name: 'Tool Belt',
        description: 'Keeps your tools within reach.',
        kind: 'rig',
        rarity: 'common',
        icon: '🛠',
        baseStats: { weight: 1, width: 2, height: 1, capacity: 4 },
        tags: ['rig'],
    },
    scrap: {
        id: 'scrap',
        name: 'Scrap Metal',
        description: 'Useful for crafting and repairs.',
        kind: 'misc',
        rarity: 'common',
        icon: '⚙️',
        baseStats: { weight: 0.5, width: 1, height: 1 },
        tags: ['material'],
    },

    // Role: Smuggler
    knife: {
        id: 'knife',
        name: 'Switchblade',
        description: 'Concealable and sharp.',
        kind: 'weapon',
        rarity: 'common',
        icon: '🗡',
        baseStats: { damage: 6, weight: 0.5, width: 1, height: 1, maxDurability: 40 },
        tags: ['melee', 'stealth'],
    },
    jacket_hidden: {
        id: 'jacket_hidden',
        name: 'Smuggler Jacket',
        description: 'Jacket with a hidden lining.',
        kind: 'armor',
        rarity: 'uncommon',
        icon: '🧥',
        baseStats: { defense: 3, weight: 2, width: 2, height: 2 },
        tags: ['clothing', 'stealth'],
    },
    cash: {
        id: 'cash',
        name: 'Credits',
        description: 'Old world currency. Still has value to some.',
        kind: 'misc',
        rarity: 'common',
        icon: '💵',
        baseStats: { weight: 0, width: 1, height: 1 },
        tags: ['currency'],
    },
}
