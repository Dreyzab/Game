import type { CombatantResources } from '@/shared/types/combat'
import type { PlayerProgress } from '@/shared/types/player'
import { calculateMaxResources } from './statCalculators'

/**
 * Validates and consumes a resource.
 * Returns new resource value if successful, or throws error if insufficient.
 * AP can go to 0. PP is usually accumulated, not consumed (except for LimitBreak).
 */
export function consumeResource(
    current: number,
    amount: number,
    min = 0
): number {
    const next = current - amount
    if (next < min) {
        throw new Error('Insufficient resource')
    }
    return next
}

/**
 * Restores a resource, clamping to max.
 */
export function restoreResource(
    current: number,
    amount: number,
    max: number
): number {
    return Math.min(max, current + amount)
}

/**
 * Handles Start of Turn logic for a single combatant.
 * Resets AP to Max.
 * @returns Updated resources
 */
export function handleTurnStart(resources: CombatantResources): CombatantResources {
    return {
        ...resources,
        ap: resources.maxAp
    }
}

/**
 * Checks if Limit Break is available (PP >= 100).
 * Note: Actual hard cap is 100, so it means PP is full.
 */
export function checkLimitBreak(resources: CombatantResources): boolean {
    return resources.pp >= 100
}

/**
 * Resets PP to 0 (e.g. after Limit Break or Combat End).
 */
export function resetPP(resources: CombatantResources): CombatantResources {
    return {
        ...resources,
        pp: 0
    }
}

/**
 * Restores MP based on Logic skill (Focus action).
 * Formula: 10 + floor(Logic * 0.2)
 */
export function calculateFocusRestore(logicLevel: number): number {
    return 10 + Math.floor(logicLevel * 0.2)
}

/**
 * Migrates PlayerProgress from older versions to the new resource system.
 * Version 0 (Legacy) -> Version 1 (Resources)
 */
export function migratePlayerResources(progress: PlayerProgress): PlayerProgress {
    // If version is already 1, return as is
    if (progress.version === 1) return progress

    const skills = progress.skills || {}
    const maxResources = calculateMaxResources(skills)

    // Legacy mapping
    // We access dynamic properties that might exist on old objects even if typed loosely
    const oldStamina = (progress as any).stamina ?? 0
    const maxStaminaLegacy = (progress as any).maxStamina ?? 100 // Default old max

    const oldMorale = (progress as any).morale ?? 0
    const maxMoraleLegacy = (progress as any).maxMorale ?? 100 // Default old max

    // Calculate percentages (safe division)
    const hpPercent = maxStaminaLegacy > 0 ? oldStamina / maxStaminaLegacy : 1
    const wpPercent = maxMoraleLegacy > 0 ? oldMorale / maxMoraleLegacy : 1

    // New values
    const newHp = Math.round(hpPercent * maxResources.hp)
    const newWp = Math.round(wpPercent * maxResources.wp)

    // Clamp to ensure validity
    const currentResources = {
        hp: Math.max(0, Math.min(maxResources.hp, newHp)),
        wp: Math.max(0, Math.min(maxResources.wp, newWp)),
        mp: maxResources.mp, // MP starts fresh/full on migration
        sp: 0 // SP starts at 0 or recalculated by squad logic later
    }

    return {
        ...progress,
        currentResources,
        version: 1
    }
}
