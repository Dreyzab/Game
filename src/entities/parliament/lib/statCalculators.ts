import { PARLIAMENT_VOICES, type VoiceId } from '@/shared/types/parliament'
import { type MaxResources, calculateMaxResources } from '@/shared/lib/stats'

export { type MaxResources, calculateMaxResources };

export interface DerivedStats {
    meleeDamageBonus: number
    rangedDamageBonus: number
    critChance: number
    initiative: number
    damageReduction: number
    stagger: number
    maxStaminaBonus: number // Deprecated, kept for compat
    accuracyBonus: number
}

/**
 * System of Accumulators (Stat Aggregation)
 * Converts voice levels into direct combat modifiers
 */
export function calculateDerivedStats(skills: Partial<Record<VoiceId, number>>): DerivedStats {
    const stats: DerivedStats = {
        meleeDamageBonus: 0,
        rangedDamageBonus: 0,
        critChance: 0,
        initiative: 0,
        damageReduction: 0,
        stagger: 0,
        maxStaminaBonus: 0,
        accuracyBonus: 0
    }

        ; (Object.keys(PARLIAMENT_VOICES) as VoiceId[]).forEach(voiceId => {
            const level = skills[voiceId] || 0
            const voiceDef = PARLIAMENT_VOICES[voiceId]

            voiceDef.combatEffects.forEach(effect => {
                if (effect.type === 'scaling' || effect.type === 'passive') {
                    const modifier = effect.modifier || 0
                    const value = effect.type === 'scaling' ? level * modifier : modifier

                    switch (effect.stat) {
                        case 'melee_damage':
                            stats.meleeDamageBonus += value
                            break
                        case 'ranged_damage':
                            stats.rangedDamageBonus += value
                            break
                        case 'melee_penalty':
                            stats.meleeDamageBonus += value // Usually negative
                            break
                        case 'critical_chance':
                            stats.critChance += value
                            break
                        case 'initiative':
                            stats.initiative += value
                            break
                        case 'damage_reduction':
                            stats.damageReduction += value
                            break
                        case 'stagger':
                            stats.stagger += value
                            break
                        case 'max_stamina':
                            stats.maxStaminaBonus += value
                            break
                        case 'accuracy':
                            stats.accuracyBonus += value
                            break
                    }
                }
            })
        })

    return stats
}

/**
 * Calculates Team Social Points (Max)
 * Sum of (Sociality Level / 10) for all provided skill sets (squad members)
 * Returns min 1 (even if skills are 0)
 */
export function calculateMaxTeamSP(squadSkills: Partial<Record<VoiceId, number>>[]): number {
    let total = 0
    squadSkills.forEach(skills => {
        const empathy = skills['empathy'] || 0
        const solidarity = skills['solidarity'] || 0
        const honor = skills['honor'] || 0

        // Sum of group voices / 10 as per design
        const socialitySum = empathy + solidarity + honor
        total += Math.floor(socialitySum / 10)
    })

    return Math.max(1, total)
}
