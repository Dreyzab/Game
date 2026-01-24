import type { BattleSession, CombatCard, Combatant } from './types'
import { Side, EffectType } from './types'

export const canPlayCard = ({ session, card }: { session: BattleSession; card: CombatCard }) => {
    if (session.phase !== 'PLAYER_TURN') return false
    const activePlayer = session.players.find((p) => p.id === session.activeUnitId)
    if (!activePlayer) return false
    return activePlayer.resources.ap >= card.apCost && activePlayer.resources.stamina >= card.staminaCost
}

export const calculateInitiative = (unit: Combatant) => unit.resources.stamina / 10 + (unit.side === Side.PLAYER ? 5 : 0)

export const sortTurnQueue = (players: Combatant[], enemies: Combatant[]) => {
    const all = [...players, ...enemies].filter((u) => !u.isDead)
    return all.sort((a, b) => calculateInitiative(b) - calculateInitiative(a)).map((u) => u.id)
}

// ============ DODGE & HIT SYSTEM ============

/**
 * Calculate dodge chance for a combatant
 * Base formula: 10% per unused AP + evasive effect bonus
 * @param defender The combatant being attacked
 * @returns Dodge chance as percentage (0-100)
 */
export const calculateDodgeChance = (defender: Combatant): number => {
    // Base dodge from unused AP: each unused AP gives 10% dodge
    const apDodgeBonus = defender.resources.ap * 10

    // Check for evasive effects (from defense cards)
    const evasiveEffect = defender.effects.find(e => e.type === EffectType.EVASIVE)
    const evasiveBonus = evasiveEffect ? evasiveEffect.value : 0

    // Total dodge chance, capped at 80%
    const totalDodge = Math.min(80, apDodgeBonus + evasiveBonus)

    return totalDodge
}

/**
 * Perform an attack roll and determine hit/miss
 * @param attacker The attacking combatant
 * @param defender The defending combatant
 * @param weaponAccuracy Base accuracy of the weapon (default 75)
 * @returns Object with hit result and details
 */
export const rollAttack = (
    _attacker: Combatant, // Reserved for future accuracy modifiers from attacker stats
    defender: Combatant,
    weaponAccuracy: number = 75,
    rng: () => number = Math.random
): { hit: boolean; dodgeChance: number; roll: number; needed: number } => {
    // Calculate base hit chance from weapon accuracy
    // Stagger effect reduces dodge
    const isStaggered = defender.effects.some(e => e.type === EffectType.STAGGER)

    // Defender's dodge chance
    let dodgeChance = calculateDodgeChance(defender)
    if (isStaggered) {
        dodgeChance = Math.floor(dodgeChance / 2) // Staggered targets dodge 50% less
    }

    // Final hit chance: weapon accuracy minus dodge
    const hitChance = Math.max(5, weaponAccuracy - dodgeChance) // Minimum 5% hit chance

    // Roll d100
    const roll = Math.floor(rng() * 100) + 1
    const hit = roll <= hitChance

    return {
        hit,
        dodgeChance,
        roll,
        needed: hitChance
    }
}

/**
 * Format attack result for combat log
 */
export const formatAttackResult = (
    attackerName: string,
    defenderName: string,
    result: ReturnType<typeof rollAttack>,
    damage?: number
): string => {
    if (result.hit) {
        return `${attackerName} hits ${defenderName} for ${damage} DMG! (${result.roll}/${result.needed})`
    } else {
        return `${defenderName} dodges ${attackerName}'s attack! (${result.roll}/${result.needed}, ${result.dodgeChance}% dodge)`
    }
}








