import type { CombatCard } from '@/entities/dreyzab-combat-simulator/model/types'
import { DETECTIVE_CARDS } from './cards'

/**
 * Generates the "Verbal Combat" deck for Detective Mode.
 * Ignores physical equipment.
 */
export function generateDetectiveDeck(ownerId = 'p1'): CombatCard[] {
    const templates: CombatCard[] = [
        // Core "Attacks"
        DETECTIVE_CARDS.logic_trap,
        DETECTIVE_CARDS.logic_trap,
        DETECTIVE_CARDS.logic_trap,

        // Heavy Hitter
        DETECTIVE_CARDS.present_evidence,

        // Crowd Control
        DETECTIVE_CARDS.intimidate,
        DETECTIVE_CARDS.de_escalate,
        DETECTIVE_CARDS.de_escalate,

        // Reaction
        DETECTIVE_CARDS.catch_lie,
    ]

    // NOTE: The combat UI uses `card.id` as an instance identifier (drag/drop, React keys).
    // We must return unique ids even for repeated templates.
    return templates.map((card, index) => ({
        ...card,
        id: `${card.id}__det_${index + 1}`,
        ownerId,
        effects: card.effects?.map((effect) => ({ ...effect })),
    }))
}
