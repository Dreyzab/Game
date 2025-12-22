import { PARLIAMENT_VOICES, type VoiceId } from '@/shared/types/parliament'

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

export interface MaxResources {
    hp: number
    ap: number
    mp: number
    wp: number
    pp: number
    sp: number // Personal contribution to Team SP
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
 * Calculates Maximum Resource pools based on character skills
 * Uses strict formulas with Math.floor for all scaling
 */
export function calculateMaxResources(skills: Partial<Record<VoiceId, number>>): MaxResources {
    const get = (id: VoiceId) => skills[id] || 0

    // HP (Body): 50 + Force*0.5 + Resilience*1.0 + Endurance*0.5
    const hp = 50 + Math.floor(
        get('force') * 0.5 +
        get('resilience') * 1.0 +
        get('endurance') * 0.5
    )

    // AP (Motorics): 2 + (Reaction + Coordination) / 40. Clamped [2, 10]
    const rawAp = 2 + Math.floor((get('reaction') + get('coordination')) / 40)
    const ap = Math.min(10, Math.max(2, rawAp))

    // MP (Mind): 20 + Logic*0.5 + Analysis*0.5
    const mp = 20 + Math.floor(
        get('logic') * 0.5 +
        get('analysis') * 0.5
    )

    // WP (Consciousness): 20 + Authority*0.5 + Courage*0.5 + Suggestion*0.2
    const wp = 20 + Math.floor(
        get('authority') * 0.5 +
        get('courage') * 0.5 +
        get('suggestion') * 0.2
    )

    // PP (Psyche): Fixed 100
    const pp = 100

    // SP (Sociality): Personal contribution = floor((Empathy + Solidarity + Honor) / 10)
    const sp = Math.floor(
        (get('empathy') + get('solidarity') + get('honor')) / 10
    )

    return { hp, ap, mp, wp, pp, sp }
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
