import type { BTNode } from '../ai/BehaviorTreeRunner'

export type EnemyKey =
  // T1 - Low Threat
  | 'rail_scorpion'
  | 'mutated_rat_swarm'
  | 'cult_neophyte'
  | 'scout_drone'
  // T2 - Medium Threat
  | 'rust_marksman'
  | 'scavenger_bruiser'
  | 'mutated_boar'
  | 'cult_priest'
  // T3 - High Threat
  | 'fjr_riot_guard'
  | 'anarchist_berserker'
  | 'echo_stalker_drone'
  | 'heavy_combat_drone'
  | 'tree_creature'
  | 'techno_beast'
  // T4 - Boss
  | 'ice_golem'

export const DEFAULT_ENEMY_KEY: EnemyKey = 'rail_scorpion'

export interface EnemyCatalogEntry {
  key: EnemyKey
  name: string
  faction: 'FJR' | 'SCAVENGER' | 'ANARCHIST' | 'ECHO'
  archetype: 'GRUNT' | 'ELITE' | 'BOSS' | 'SPECIAL'
  maxHp: number
  maxStamina: number
  maxMorale: number
  preferredRank: number
  baseForce?: number
  baseEndurance?: number
  baseReflex?: number
  baseLogic?: number
  basePsyche?: number
  baseAuthority?: number
  behaviorTreeId: string
  behaviorTree: BTNode
  initialAmmo?: number
}

const SCORPION_RUSH: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 15 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

const RUST_MARKSMAN: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'HAS_AMMO' },
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 4 } },
        { type: 'ACTION', action: 'ATTACK_RANGED', params: { damage: 10, ammoCost: 1 } },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'HAS_AMMO' },
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 3 } },
        { type: 'ACTION', action: 'ATTACK_RANGED', params: { damage: 10, ammoCost: 1 } },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'HAS_AMMO' },
        { type: 'ACTION', action: 'MOVE_AWAY_FROM_PLAYER' },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 8 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

const FJR_RIOT_GUARD: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_LOW_HP', params: { threshold: 35 } },
        { type: 'ACTION', action: 'MOVE_AWAY_FROM_PLAYER' },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 14 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

const ANARCHIST_BERSERKER: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_LOW_HP', params: { threshold: 30 } },
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 22 } },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 16 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

const ECHO_STALKER_DRONE: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'HAS_AMMO_AT_LEAST', params: { amount: 2 } },
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 4 } },
        { type: 'ACTION', action: 'ATTACK_RANGED', params: { damage: 14, ammoCost: 2 } },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'HAS_AMMO_AT_LEAST', params: { amount: 2 } },
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 3 } },
        { type: 'ACTION', action: 'ATTACK_RANGED', params: { damage: 14, ammoCost: 2 } },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'HAS_AMMO' },
        { type: 'ACTION', action: 'MOVE_AWAY_FROM_PLAYER' },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 10 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

// ============ NEW BEHAVIOR TREES ============

// T1 - Rat Swarm: Fast, aggressive, weak
const RAT_SWARM: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 8 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

// T1 - Cult Neophyte: Weak, may flee or curse
const CULT_NEOPHYTE: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_LOW_HP', params: { threshold: 40 } },
        { type: 'ACTION', action: 'MOVE_AWAY_FROM_PLAYER' },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 2 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 6 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

// T1 - Scout Drone: Observes, calls reinforcements
const SCOUT_DRONE: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 4 } },
        { type: 'ACTION', action: 'ATTACK_RANGED', params: { damage: 4, ammoCost: 1 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_AWAY_FROM_PLAYER' },
  ],
}

// T2 - Bruiser: Aggressive, berserk when low HP
const BRUISER: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_LOW_HP', params: { threshold: 30 } },
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 25 } }, // Berserk damage
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 18 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

// T2 - Mutated Boar: Charges, high damage
const MUTATED_BOAR: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 20 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' }, // Always charges
  ],
}

// T2 - Cult Priest: Ranged curses, heals allies
const CULT_PRIEST: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 3 } },
        { type: 'ACTION', action: 'ATTACK_RANGED', params: { damage: 8, ammoCost: 0 } }, // Curse
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_LOW_HP', params: { threshold: 50 } },
        { type: 'ACTION', action: 'MOVE_AWAY_FROM_PLAYER' },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

// T3 - Heavy Combat Drone: Ranged, armored
const HEAVY_DRONE: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'HAS_AMMO_AT_LEAST', params: { amount: 3 } },
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 3 } },
        { type: 'ACTION', action: 'ATTACK_RANGED', params: { damage: 18, ammoCost: 3 } },
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'HAS_AMMO' },
        { type: 'ACTION', action: 'MOVE_AWAY_FROM_PLAYER' },
      ],
    },
    { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 12 } },
  ],
}

// T3 - Tree Creature: Slow, regenerates, area damage
const TREE_CREATURE: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 2 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 22 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

// T3 - Techno Beast: Fast, armored, electric attacks
const TECHNO_BEAST: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 20 } },
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

// T4 - Ice Golem: Boss, slow, devastating
const ICE_GOLEM: BTNode = {
  type: 'SELECTOR',
  children: [
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 2 } },
        { type: 'ACTION', action: 'ATTACK_MELEE', params: { damage: 35 } }, // Devastating slam
      ],
    },
    {
      type: 'SEQUENCE',
      children: [
        { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 3 } },
        { type: 'ACTION', action: 'ATTACK_RANGED', params: { damage: 20, ammoCost: 0 } }, // Ice shards
      ],
    },
    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' },
  ],
}

export const ENEMY_CATALOG: Record<EnemyKey, EnemyCatalogEntry> = {
  // ============ T1 - LOW THREAT ============
  rail_scorpion: {
    key: 'rail_scorpion',
    name: 'Rail Scorpion',
    faction: 'SCAVENGER',
    archetype: 'GRUNT',
    maxHp: 60,
    maxStamina: 20,
    maxMorale: 10,
    preferredRank: 2,
    baseForce: 6,
    baseReflex: 8,
    behaviorTreeId: 'scorpion_rush',
    behaviorTree: SCORPION_RUSH,
    initialAmmo: 0,
  },
  mutated_rat_swarm: {
    key: 'mutated_rat_swarm',
    name: 'Mutated Rat Swarm',
    faction: 'SCAVENGER',
    archetype: 'GRUNT',
    maxHp: 25,
    maxStamina: 15,
    maxMorale: 5,
    preferredRank: 1,
    baseReflex: 12,
    behaviorTreeId: 'rat_swarm',
    behaviorTree: RAT_SWARM,
    initialAmmo: 0,
  },
  cult_neophyte: {
    key: 'cult_neophyte',
    name: 'Cult Neophyte',
    faction: 'ANARCHIST',
    archetype: 'GRUNT',
    maxHp: 35,
    maxStamina: 20,
    maxMorale: 25, // Fanatical
    preferredRank: 2,
    baseForce: 4,
    basePsyche: 6,
    behaviorTreeId: 'cult_neophyte',
    behaviorTree: CULT_NEOPHYTE,
    initialAmmo: 0,
  },
  scout_drone: {
    key: 'scout_drone',
    name: 'Scout Drone',
    faction: 'ECHO',
    archetype: 'GRUNT',
    maxHp: 20,
    maxStamina: 10,
    maxMorale: 100, // No fear
    preferredRank: 4,
    baseLogic: 8,
    behaviorTreeId: 'scout_drone',
    behaviorTree: SCOUT_DRONE,
    initialAmmo: 5,
  },

  // ============ T2 - MEDIUM THREAT ============
  rust_marksman: {
    key: 'rust_marksman',
    name: 'Rust Marksman',
    faction: 'SCAVENGER',
    archetype: 'GRUNT',
    maxHp: 50,
    maxStamina: 18,
    maxMorale: 8,
    preferredRank: 4,
    baseForce: 4,
    baseReflex: 11,
    behaviorTreeId: 'rust_marksman',
    behaviorTree: RUST_MARKSMAN,
    initialAmmo: 8,
  },
  scavenger_bruiser: {
    key: 'scavenger_bruiser',
    name: 'Scavenger Bruiser',
    faction: 'SCAVENGER',
    archetype: 'ELITE',
    maxHp: 80,
    maxStamina: 35,
    maxMorale: 15,
    preferredRank: 1,
    baseForce: 10,
    baseEndurance: 8,
    behaviorTreeId: 'bruiser',
    behaviorTree: BRUISER,
    initialAmmo: 0,
  },
  mutated_boar: {
    key: 'mutated_boar',
    name: 'Mutated Boar',
    faction: 'SCAVENGER',
    archetype: 'ELITE',
    maxHp: 70,
    maxStamina: 40,
    maxMorale: 30, // Fearless beast
    preferredRank: 1,
    baseForce: 12,
    baseEndurance: 8,
    behaviorTreeId: 'mutated_boar',
    behaviorTree: MUTATED_BOAR,
    initialAmmo: 0,
  },
  cult_priest: {
    key: 'cult_priest',
    name: 'Cult Priest',
    faction: 'ANARCHIST',
    archetype: 'ELITE',
    maxHp: 55,
    maxStamina: 30,
    maxMorale: 40, // Very fanatical
    preferredRank: 3,
    basePsyche: 10,
    baseAuthority: 8,
    behaviorTreeId: 'cult_priest',
    behaviorTree: CULT_PRIEST,
    initialAmmo: 0,
  },

  // ============ T3 - HIGH THREAT ============
  fjr_riot_guard: {
    key: 'fjr_riot_guard',
    name: 'FJR Riot Guard',
    faction: 'FJR',
    archetype: 'ELITE',
    maxHp: 90,
    maxStamina: 25,
    maxMorale: 16,
    preferredRank: 2,
    baseForce: 7,
    baseEndurance: 10,
    baseReflex: 6,
    behaviorTreeId: 'fjr_riot_guard',
    behaviorTree: FJR_RIOT_GUARD,
    initialAmmo: 0,
  },
  anarchist_berserker: {
    key: 'anarchist_berserker',
    name: 'Anarchist Berserker',
    faction: 'ANARCHIST',
    archetype: 'SPECIAL',
    maxHp: 70,
    maxStamina: 30,
    maxMorale: 12,
    preferredRank: 2,
    baseForce: 9,
    baseReflex: 7,
    behaviorTreeId: 'anarchist_berserker',
    behaviorTree: ANARCHIST_BERSERKER,
    initialAmmo: 0,
  },
  echo_stalker_drone: {
    key: 'echo_stalker_drone',
    name: 'Echo Stalker Drone',
    faction: 'ECHO',
    archetype: 'SPECIAL',
    maxHp: 55,
    maxStamina: 22,
    maxMorale: 14,
    preferredRank: 3,
    baseForce: 5,
    baseLogic: 9,
    baseReflex: 9,
    behaviorTreeId: 'echo_stalker_drone',
    behaviorTree: ECHO_STALKER_DRONE,
    initialAmmo: 10,
  },
  heavy_combat_drone: {
    key: 'heavy_combat_drone',
    name: 'Heavy Combat Drone',
    faction: 'ECHO',
    archetype: 'ELITE',
    maxHp: 100,
    maxStamina: 30,
    maxMorale: 100, // Machine - no fear
    preferredRank: 3,
    baseLogic: 12,
    baseReflex: 6,
    behaviorTreeId: 'heavy_drone',
    behaviorTree: HEAVY_DRONE,
    initialAmmo: 20,
  },
  tree_creature: {
    key: 'tree_creature',
    name: 'Schwarzwald Tree Creature',
    faction: 'ECHO',
    archetype: 'SPECIAL',
    maxHp: 120,
    maxStamina: 50,
    maxMorale: 80,
    preferredRank: 2,
    baseForce: 14,
    baseEndurance: 15,
    behaviorTreeId: 'tree_creature',
    behaviorTree: TREE_CREATURE,
    initialAmmo: 0,
  },
  techno_beast: {
    key: 'techno_beast',
    name: 'Techno-Beast',
    faction: 'ECHO',
    archetype: 'ELITE',
    maxHp: 90,
    maxStamina: 35,
    maxMorale: 100, // Machine hybrid
    preferredRank: 1,
    baseForce: 11,
    baseReflex: 10,
    baseLogic: 7,
    behaviorTreeId: 'techno_beast',
    behaviorTree: TECHNO_BEAST,
    initialAmmo: 0,
  },

  // ============ T4 - BOSS ============
  ice_golem: {
    key: 'ice_golem',
    name: 'Ice Golem',
    faction: 'ECHO',
    archetype: 'BOSS',
    maxHp: 400,
    maxStamina: 100,
    maxMorale: 200, // Immune to morale damage
    preferredRank: 2,
    baseForce: 18,
    baseEndurance: 20,
    behaviorTreeId: 'ice_golem',
    behaviorTree: ICE_GOLEM,
    initialAmmo: 0,
  },
}

export function isEnemyKey(value: unknown): value is EnemyKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ENEMY_CATALOG, value)
}

export function pickRandomEnemyKey(): EnemyKey {
  const keys = Object.keys(ENEMY_CATALOG) as EnemyKey[]
  const index = Math.floor(Math.random() * keys.length)
  return keys[index] ?? DEFAULT_ENEMY_KEY
}

