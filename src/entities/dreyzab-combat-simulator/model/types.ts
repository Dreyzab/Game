import type { DamageType, CombatEffect } from '@/shared/types/combat'

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

export type CardPlayTarget =
    | { type: 'enemy'; enemyId: string }
    | { type: 'player-rank'; rank: number }
    | { type: 'unit'; unitId: string }

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

    // V2 Mechanics
    voices: CombatantVoices
    weaponInstances?: WeaponInstance[]
}

export interface CombatantVoices {
    coordination: number // Accuracy, Crit, Gun Dmg
    force: number        // Melee Dmg, Recoil Control
    reaction: number     // Initiative, Evasion
    perception: number   // Armor Penetration
    endurance: number    // Max HP, Stamina
    resilience: number   // Resistances, Mitigation
    knowledge: number    // Tech/Artifact Dmg, Reliability
    azart: number        // Crit Multiplier
}

export type AmmoType = 'standard' | 'hollow' | 'ap'

export interface WeaponInstance {
    templateId: string
    currentAmmo: number
    ammoType: AmmoType
    attachments: string[]
    condition: number // 0-100, impacts JamChance
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
    RELOAD: 'reload',
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
    targetAllies?: boolean
    targetSelf?: boolean
    effects?: CombatEffect[]
    sourceWeapon?: string
    imageUrl?: string
}

// TODO: Unlock 'tactical_genius' achievement when stats.attacksInOneTurn >= 3

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
    deck: CombatCard[]
    discard: CombatCard[]
    stats: BattleStats
    activeUnitId: string | null
    turnQueue: string[]
    teamSP: number
    maxTeamSP: number
}
