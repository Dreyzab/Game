import type { DamageType } from '@/shared/types/combat'

export const Side = {
    PLAYER: 'PLAYER',
    ENEMY: 'ENEMY',
} as const

export type Side = (typeof Side)[keyof typeof Side]

export const EffectType = {
    POISON: 'poison',
    STAGGER: 'stagger',
    BUFF: 'buff',
    EVASIVE: 'evasive',
    ANALYZE: 'analyze',
} as const

export type EffectType = (typeof EffectType)[keyof typeof EffectType]

export interface ActiveEffect {
    type: EffectType
    value: number
    remainingTurns: number
}

export interface CombatantResources {
    hp: number
    maxHp: number
    ap: number
    maxAp: number
    mp: number
    maxMp: number
    stamina: number
    maxStamina: number
    stagger: number
    maxStagger: number
    pp: number
    maxPp: number
}

export interface Combatant {
    id: string
    name: string
    side: Side
    rank: number // 1-4

    resources: CombatantResources

    /**
     * Item template ids (from `src/shared/data/itemTemplates.ts`) that should be used
     * to generate this combatant's cards.
     */
    equipment?: string[]

    bonusAp: number
    initiative: number
    armor: number
    isDead: boolean
    effects: ActiveEffect[]
    weaponHeat: number
    isJammed: boolean
    ammo: number
    threatLevel?: string // e.g. T1, T2

    // Analysis State
    scannedLevel?: number // 0=none, 1=basic, 2=detailed
}

export const CardType = {
    ATTACK: 'attack',
    DEFENSE: 'defense',
    MOVEMENT: 'movement',
    VOICE: 'voice',
    ANALYSIS: 'analysis',
    ITEM: 'item',
    REACTION: 'reaction',
    COLD_STEEL: 'cold_steel',
    POSTURE: 'posture',
    JAMMED: 'jammed',
    DEBT: 'debt',
} as const

export type CardType = (typeof CardType)[keyof typeof CardType]

export interface CombatCard {
    id: string
    name: string
    type: CardType
    apCost: number
    staminaCost: number
    ammoCost?: number
    damage: number
    impact: number
    damageType?: DamageType
    optimalRange: number[]
    description: string
    jamChance: number
    ownerId?: string
    effects?: any[]
}

export interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    unlocked: boolean
}

export interface BattleStats {
    damageTaken: number
    attacksInOneTurn: number
    turnCount: number
}

export interface BattleSession {
    turnCount: number
    phase: 'PLAYER_TURN' | 'ENEMY_TURN' | 'RESOLUTION' | 'VICTORY' | 'DEFEAT'
    logs: string[]
    players: Combatant[]
    enemies: Combatant[]
    playerHand: CombatCard[]
    stats: BattleStats
    activeUnitId: string | null
    turnQueue: string[]
    teamSP: number
    maxTeamSP: number
}
