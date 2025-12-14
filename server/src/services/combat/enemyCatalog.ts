import type { BTNode } from '../ai/BehaviorTreeRunner'

export type EnemyKey =
  | 'rail_scorpion'
  | 'rust_marksman'
  | 'fjr_riot_guard'
  | 'anarchist_berserker'
  | 'echo_stalker_drone'

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

export const ENEMY_CATALOG: Record<EnemyKey, EnemyCatalogEntry> = {
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
}

export function isEnemyKey(value: unknown): value is EnemyKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ENEMY_CATALOG, value)
}

export function pickRandomEnemyKey(): EnemyKey {
  const keys = Object.keys(ENEMY_CATALOG) as EnemyKey[]
  const index = Math.floor(Math.random() * keys.length)
  return keys[index] ?? DEFAULT_ENEMY_KEY
}

