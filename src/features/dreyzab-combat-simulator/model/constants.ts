import type { CombatCard } from './types'
import { CardType } from './types'

export const INITIAL_PLAYER_HAND: CombatCard[] = [
    {
        id: 'c1',
        name: 'Rusty Pipe',
        type: CardType.ATTACK,
        apCost: 1,
        staminaCost: 15,
        damage: 12,
        optimalRange: [1, 2],
        description: 'A heavy swing. Effective at close range.',
        jamChance: 0,
    },
    {
        id: 'c2',
        name: 'Operator Sidearm',
        type: CardType.ATTACK,
        apCost: 1,
        staminaCost: 20,
        damage: 18,
        optimalRange: [2, 3],
        description: 'Standard issue pistol. Watch the heat.',
        jamChance: 0.05,
    },
    {
        id: 'c3',
        name: 'Tactical Advance',
        type: CardType.MOVEMENT,
        apCost: 1,
        staminaCost: 10,
        damage: 0,
        optimalRange: [],
        description: 'Move forward one rank.',
        jamChance: 0,
    },
    {
        id: 'c4',
        name: 'Evasive Maneuver',
        type: CardType.DEFENSE,
        apCost: 1,
        staminaCost: 15,
        damage: 0,
        optimalRange: [],
        description: '+50% Evasion for 1 turn.',
        jamChance: 0,
    },
    {
        id: 'c5',
        name: 'Deep Breath',
        type: CardType.VOICE,
        apCost: 1,
        staminaCost: 0,
        damage: 0,
        optimalRange: [],
        description: 'Recover 30 Stamina.',
        jamChance: 0,
    },
]

export const ENEMY_TEMPLATES = [
    {
        name: 'Mutant Marauder',
        hp: 45,
        armor: 2,
        rank: 1,
        initBase: 10,
        description: 'A scavenger driven by hunger. Favors close combat.',
    },
    {
        name: 'Rail Scorpion',
        hp: 30,
        armor: 1,
        rank: 3,
        initBase: 15,
        description: 'Skittish but dangerous from a distance.',
    },
]

