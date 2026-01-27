import type { CombatCard } from '@/entities/dreyzab-combat-simulator/model/types'
import { CardType } from '@/entities/dreyzab-combat-simulator/model/types'

// Helper to keep card definitions clean
const DETECTIVE_SOURCE = 'detective_skill'

export const DETECTIVE_CARDS: Record<string, CombatCard> = {
    // --- OFFENSIVE (Mental Damage) ---
    logic_trap: {
        id: 'logic_trap_basic',
        name: 'Logic Trap',
        type: CardType.ATTACK, // Using ATTACK type for now
        apCost: 2,
        staminaCost: 15, // Secondary cost
        damage: 15, // Direct damage to HP/Morale (abstracted)
        impact: 10,
        optimalRange: [1, 2, 3, 4],
        jamChance: 0,
        description: '30% Chance to Confuse opponent with a inescapable logic loop.',
        sourceWeapon: DETECTIVE_SOURCE,
        imageUrl: '',
        effects: [
            { type: 'stagger', value: 20, duration: 1, description: '30% Chance to Confuse', chance: 30 }
        ]
    },

    intimidate: {
        id: 'intimidate_basic',
        name: 'Intimidate',
        type: CardType.VOICE,
        apCost: 2,
        staminaCost: 20,
        damage: 5,
        impact: 20, // High impact/stagger
        optimalRange: [1, 2],
        jamChance: 0,
        description: 'High impact verbal assault. Reduces enemy morale.',
        sourceWeapon: DETECTIVE_SOURCE,
        imageUrl: '',
        effects: [
            { type: 'debuff', value: 10, duration: 2, description: '-10 Evasion' } // Using debuff instead of evasive
        ]
    },

    present_evidence: {
        id: 'present_evidence',
        name: 'Present Evidence',
        type: CardType.ATTACK,
        apCost: 3,
        staminaCost: 30,
        damage: 40, // High damage
        impact: 50,
        optimalRange: [1, 2],
        jamChance: 0,
        description: 'Stuns opponent with undeniable truth.',
        sourceWeapon: DETECTIVE_SOURCE,
        imageUrl: '',
        effects: [
            { type: 'stagger', value: 100, duration: 1, description: 'Stun' }
        ]
    },

    // --- DEFENSIVE / UTILITY ---

    de_escalate: {
        id: 'de_escalate',
        name: 'De-escalate',
        type: CardType.DEFENSE,
        apCost: 1,
        staminaCost: 0,
        damage: 0,
        impact: 0,
        optimalRange: [0],
        jamChance: 0,
        description: 'Restore 25 Stamina and calm the situation.',
        targetSelf: true,
        sourceWeapon: DETECTIVE_SOURCE,
        imageUrl: '',
        effects: [
            { type: 'buff', value: 25, duration: 1, description: 'Restore Stamina' }
        ]
    },

    catch_lie: {
        id: 'catch_lie',
        name: 'Catch Lie',
        type: CardType.REACTION,
        apCost: 2,
        staminaCost: 15,
        damage: 10,
        impact: 10,
        optimalRange: [1, 2, 3, 4],
        jamChance: 0,
        description: 'Interrupts enemy argument and deals counter damage.',
        sourceWeapon: DETECTIVE_SOURCE,
        imageUrl: '',
        effects: []
    }
}
