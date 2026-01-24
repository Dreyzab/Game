import type { CardType, CombatRank, DamageType, CombatEffect } from '../types/combat'

/**
 * Base template for a weapon card.
 * Shared between client and server.
 */
export interface WeaponCardTemplate {
  name: string
  type: CardType
  apCost: number
  staminaCost: number
  ammoCost?: number
  damageMult: number // Multiplier of weapon base damage
  impact?: number // Flat impact
  bonusDamage?: number // Flat bonus
  optimalRange: CombatRank[]
  damageType?: DamageType // Override weapon type
  imageUrl?: string // Optional card illustration
  description: string
  jamChanceMod?: number // Flat addition to jam chance
  effects?: CombatEffect[]
}

export interface GeneratedWeaponCard {
  id: string
  weaponId: string
  name: string
  type: CardType
  apCost: number
  staminaCost: number
  ammoCost?: number
  damage: number
  impact?: number
  damageType: DamageType
  optimalRange: CombatRank[]
  imageUrl?: string
  description: string
  jamChance: number
  effects: CombatEffect[]
}

export interface GenerateWeaponCardsOptions {
  baseDamage?: number
  baseDamageType?: DamageType
  baseJamChance?: number
  idPrefix?: string
  now?: number
}

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const toFiniteNumber = (value: unknown, fallback: number) => {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

export function generateWeaponCardsForWeaponId(
  weaponId: string,
  options: GenerateWeaponCardsOptions = {}
): GeneratedWeaponCard[] {
  const templates = WEAPON_CARDS[weaponId] ?? []
  if (templates.length === 0) return []

  const now = Math.trunc(toFiniteNumber(options.now, Date.now()))
  const baseDamage = toFiniteNumber(options.baseDamage, 10)
  const baseJamChance = toFiniteNumber(options.baseJamChance, 0)
  const idPrefix = (options.idPrefix ?? weaponId).trim() || weaponId

  return templates.map((template, idx) => {
    const bonusDamage = toFiniteNumber(template.bonusDamage, 0)
    const damage = Math.floor(baseDamage * template.damageMult + bonusDamage)
    const damageType = template.damageType ?? options.baseDamageType ?? 'physical'
    const jamChanceMod = toFiniteNumber(template.jamChanceMod, 0)
    const jamChance = clampNumber(baseJamChance + jamChanceMod, 0, 100)

    return {
      id: `${idPrefix}_${idx}_${now}_${Math.random().toString(16).slice(2, 6)}`,
      weaponId,
      name: template.name,
      type: template.type,
      apCost: template.apCost,
      staminaCost: template.staminaCost,
      ammoCost: template.ammoCost,
      damage,
      impact: template.impact,
      damageType,
      optimalRange: template.optimalRange,
      imageUrl: template.imageUrl,
      description: template.description,
      jamChance,
      effects: Array.isArray(template.effects) ? template.effects : [],
    }
  })
}

export const WEAPON_CARDS: Record<string, WeaponCardTemplate[]> = {
  // ============ PISTOLS ============
  glock_19: [
    {
      name: 'Double Tap',
      type: 'attack',
      apCost: 1,
      staminaCost: 15,
      damageMult: 1.0,
      optimalRange: [1, 2],
      description: 'Two quick shots.',
    },
    {
      name: 'Suppressive Fire',
      type: 'attack',
      apCost: 2,
      staminaCost: 25,
      damageMult: 0.8,
      optimalRange: [1, 2, 3],
      imageUrl: '/images/weapons/suppressive_fire_card.png',
      description: 'Forces enemy heads down. Reduces enemy accuracy.',
      effects: [{ type: 'debuff', value: 10, duration: 1, description: 'Suppressed' }],
    },
  ],
  pistol_pm: [
    {
      name: 'Aimed Shot',
      type: 'attack',
      apCost: 1,
      staminaCost: 10,
      damageMult: 1.0,
      optimalRange: [1, 2],
      imageUrl: '/images/weapons/aimed_shot_card.png',
      description: 'Standard shots.',
    },
    {
      name: 'Point Blank',
      type: 'attack',
      apCost: 1,
      staminaCost: 20,
      damageMult: 1.5,
      optimalRange: [1],
      imageUrl: '/images/weapons/point_blank_card.png',
      description: 'Risky close range shot.',
      jamChanceMod: 5,
    },
  ],
  pistol_tactical: [
    {
      name: 'Precision Shot',
      type: 'attack',
      apCost: 1,
      staminaCost: 10,
      damageMult: 1.1,
      optimalRange: [1, 2, 3],
      description: 'Accurate fire.',
    },
    {
      name: 'Flash & Clear',
      type: 'attack',
      apCost: 2,
      staminaCost: 20,
      damageMult: 0.5,
      optimalRange: [1, 2],
      description: 'Blinds target then shoots.',
      effects: [{ type: 'confusion', duration: 1, description: 'Blinded' }],
    },
  ],
  revolver_38: [
    {
      name: 'Fan the Hammer',
      type: 'attack',
      apCost: 3,
      staminaCost: 40,
      damageMult: 2.0,
      optimalRange: [1, 2],
      imageUrl: '/images/weapons/fan_the_hammer_card.png',
      description: 'Unload all rounds.',
      jamChanceMod: 0,
    },
    {
      name: 'Dead Eye',
      type: 'attack',
      apCost: 2,
      staminaCost: 15,
      damageMult: 1.5,
      optimalRange: [1, 2, 3],
      imageUrl: '/images/weapons/dead_eye_card.png',
      description: 'High damage aimed shot.',
    },
  ],
  beretta_m9: [
    {
      name: 'Aimed Shot',
      type: 'attack',
      apCost: 1,
      staminaCost: 10,
      damageMult: 1.0,
      optimalRange: [1, 2, 3],
      description: 'Accurate single shot.',
    },
    {
      name: 'Double Tap',
      type: 'attack',
      apCost: 1,
      staminaCost: 15,
      damageMult: 1.0,
      optimalRange: [1, 2],
      description: 'Two quick shots.',
    },
  ],

  // ============ SMGS ============
  smg_mp_class1: [
    {
      name: 'Burst Fire',
      type: 'attack',
      apCost: 1,
      staminaCost: 15,
      damageMult: 1.0,
      optimalRange: [1, 2],
      description: 'Controlled burst.',
    },
    {
      name: 'Spray and Pray',
      type: 'attack',
      apCost: 2,
      staminaCost: 30,
      damageMult: 0.6,
      optimalRange: [1, 2],
      description: 'Hits random targets in rank.',
      effects: [{ type: 'aoe_rank', description: 'Hits Rank' }],
    },
  ],
  // Inheritance: Class 2/3 share logic but we can define specifics or reuse
  smg_mp_class2: [
    {
      name: 'Controlled Burst',
      type: 'attack',
      apCost: 1,
      staminaCost: 12,
      damageMult: 1.1,
      optimalRange: [1, 2, 3],
      description: 'Precise burst.',
    },
    {
      name: 'Full Auto',
      type: 'attack',
      apCost: 2,
      staminaCost: 30,
      damageMult: 1.5,
      optimalRange: [1, 2],
      description: 'High damage output.',
    },
  ],
  smg_mp_class3: [
    {
      name: 'Elite Burst',
      type: 'attack',
      apCost: 1,
      staminaCost: 10,
      damageMult: 1.2,
      optimalRange: [1, 2, 3],
      description: 'Deadly accuracy.',
    },
    {
      name: 'Room Sweeper',
      type: 'attack',
      apCost: 3,
      staminaCost: 40,
      damageMult: 0.8,
      optimalRange: [1, 2],
      description: 'Hits all enemies in Rank 1 and 2.',
      effects: [{ type: 'aoe_all', description: 'Hits Frontlines' }],
    },
  ],

  // ============ RIFLES ============
  rifle_ak74: [
    {
      name: 'Short Burst',
      type: 'attack',
      apCost: 2,
      staminaCost: 20,
      damageMult: 1.0,
      optimalRange: [2, 3],
      description: 'Standard engagement.',
    },
    {
      name: 'Bayonet Charge',
      type: 'attack',
      apCost: 2,
      staminaCost: 25,
      damageMult: 1.2,
      optimalRange: [1],
      damageType: 'piercing',
      description: 'Melee charge.',
    },
  ],
  rifle_ak74_scoped: [
    {
      name: 'Single Shot',
      type: 'attack',
      apCost: 1,
      staminaCost: 10,
      damageMult: 1.0,
      optimalRange: [3, 4],
      description: 'Picking targets.',
    },
    {
      name: 'Headshot',
      type: 'attack',
      apCost: 3,
      staminaCost: 20,
      damageMult: 2.5,
      optimalRange: [3, 4],
      description: 'Critical damage.',
    },
  ],
  rifle_hk: [
    {
      name: 'Precision Fire',
      type: 'attack',
      apCost: 1,
      staminaCost: 15,
      damageMult: 1.1,
      optimalRange: [2, 3, 4],
      description: 'German engineering.',
    },
    {
      name: 'Double Double',
      type: 'attack',
      apCost: 2,
      staminaCost: 25,
      damageMult: 1.3,
      optimalRange: [2, 3],
      description: 'Rapid follow-up shots.',
    },
  ],
  rifle_m4: [
    {
      name: 'Semi-Auto',
      type: 'attack',
      apCost: 1,
      staminaCost: 10,
      damageMult: 1.0,
      optimalRange: [2, 3],
      description: 'Conservation of ammo.',
    },
    {
      name: 'Suppressing Barrage',
      type: 'attack',
      apCost: 2,
      staminaCost: 30,
      damageMult: 0.7,
      optimalRange: [2, 3],
      description: 'Keeps heads down.',
      effects: [{ type: 'debuff', value: 15, duration: 1, description: 'Suppressed' }],
    },
  ],

  // ============ SHOTGUNS / SPECIAL ============
  sawed_off_shotgun: [
    {
      name: 'Both Barrels',
      type: 'attack',
      apCost: 2,
      staminaCost: 30,
      damageMult: 2.0,
      optimalRange: [1],
      description: 'Devastating at point blank.',
    },
    {
      name: 'Buckshot',
      type: 'attack',
      apCost: 1,
      staminaCost: 15,
      damageMult: 1.0,
      optimalRange: [1, 2],
      description: 'Standard shot.',
    },
  ],
  hand_cannon: [
    {
      name: 'Explosive Punch',
      type: 'attack',
      apCost: 2,
      staminaCost: 25,
      damageMult: 1.5,
      optimalRange: [1],
      description: 'Punch trigger, boom.',
      damageType: 'crushing', // Hybrid ballistic/crush
    },
    {
      name: 'Brass Knuckles',
      type: 'attack',
      apCost: 1,
      staminaCost: 10,
      damageMult: 0.5,
      optimalRange: [1],
      description: 'Just a punch. Saves ammo.',
      damageType: 'crushing',
    },
  ],

  // ============ MELEE ============
  rusty_pipe: [
    {
      name: 'Heavy Swing',
      type: 'attack',
      apCost: 2,
      staminaCost: 15,
      damageMult: 1.0,
      optimalRange: [1],
      description: 'Clumsy but heavy.',
    },
  ],
  knife: [
    {
      name: 'Slash',
      type: 'attack',
      apCost: 1,
      staminaCost: 5,
      damageMult: 0.8,
      optimalRange: [1],
      imageUrl: '/images/weapons/slash_card.png',
      description: 'Fast cut.',
      damageType: 'slashing',
    },
    {
      name: 'Stab',
      type: 'attack',
      apCost: 2,
      staminaCost: 10,
      damageMult: 1.5,
      optimalRange: [1],
      imageUrl: '/images/weapons/stab_card.png',
      description: 'Piercing strike.',
      damageType: 'piercing',
    },
  ],
  scalpel: [
    {
      name: 'Slash',
      type: 'attack',
      apCost: 1,
      staminaCost: 5,
      damageMult: 0.8,
      optimalRange: [1],
      imageUrl: '/images/weapons/slash_card.png',
      description: 'Quick precise cut.',
      damageType: 'slashing',
    },
    {
      name: 'Stab',
      type: 'attack',
      apCost: 2,
      staminaCost: 10,
      damageMult: 1.5,
      optimalRange: [1],
      imageUrl: '/images/weapons/stab_card.png',
      description: 'Finds the weak spot.',
      damageType: 'piercing',
    },
    {
      name: 'Scalpel Throw',
      type: 'attack',
      apCost: 1,
      staminaCost: 15,
      damageMult: 1.2,
      optimalRange: [1, 2, 3],
      imageUrl: '/images/weapons/scalpel_throw_card.png',
      description: 'Tosses a scalpel with surgical precision.',
      damageType: 'piercing',
    },
  ],
  // ============ CONSUMABLES / TOOLS ============
  grenade: [
    {
      name: 'Frag Grenade',
      type: 'attack',
      apCost: 2,
      staminaCost: 20,
      damageMult: 1.0, // Base stats damage (50) might be too high if mult is 1, but let's stick to simple logic
      optimalRange: [2, 3, 4],
      imageUrl: '/images/weapons/bomb_card.png',
      description: 'Explosive area damage.',
      damageType: 'explosive',
      effects: [{ type: 'aoe_rank', description: 'Explosion' }]
    }
  ],
  field_medkit: [
    {
      name: 'First Aid',
      type: 'voice', // Voice/Support type
      apCost: 2,
      staminaCost: 20,
      damageMult: 0,
      optimalRange: [],
      imageUrl: '/images/weapons/first_aid_card.png',
      description: 'Heal target for 20 HP.',
      effects: [{ type: 'heal', value: 20, description: 'Heal 20' }]
    }
  ]
}

