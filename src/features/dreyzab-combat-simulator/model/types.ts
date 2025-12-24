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
    wp: number
    maxWp: number
    pp: number
    maxPp: number
}

export interface Combatant {
    id: string
    name: string
    side: Side
    rank: number // 1-4

    resources: CombatantResources

    bonusAp: number
    initiative: number
    armor: number
    isDead: boolean
    effects: ActiveEffect[]
    weaponHeat: number
    isJammed: boolean
    ammo: number
}

export const CardType = {
    ATTACK: 'attack',
    DEFENSE: 'defense',
    MOVEMENT: 'movement',
    VOICE: 'voice',
} as const

export type CardType = (typeof CardType)[keyof typeof CardType]

export interface CombatCard {
    id: string
    name: string
    type: CardType
    apCost: number
    staminaCost: number
    damage: number
    optimalRange: number[]
    description: string
    jamChance: number
    ownerId?: string
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
