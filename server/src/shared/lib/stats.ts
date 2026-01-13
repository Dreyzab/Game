import { type VoiceId } from '../types/parliament'

export interface MaxResources {
    hp: number
    ap: number
    mp: number
    wp: number
    pp: number
    sp: number // Personal contribution to Team SP
}

/**
 * Calculates Maximum Resource pools based on character skills
 * Uses strict formulas with Math.floor for all scaling
 * 
 * Target starting stats for STARTING_SKILLS:
 * HP: 110
 * AP: 3
 * MP: 57
 * WP: 56
 */
export function calculateMaxResources(skills: Partial<Record<VoiceId, number>>): MaxResources {
    const get = (id: VoiceId) => skills[id] || 0

    // HP (Body): 50 + Force*0.5 + Resilience*1.0 + Endurance*0.5
    // Default skills (30, 30, 30) -> 50 + 15 + 30 + 15 = 110
    const hp = 50 + Math.floor(
        get('force') * 0.5 +
        get('resilience') * 1.0 +
        get('endurance') * 0.5
    )

    // AP (Motorics): 2 + (Reaction + Coordination) / 40. Clamped [2, 10]
    // Default skills (30, 30) -> 2 + 60/40 = 2 + 1 = 3
    const rawAp = 2 + Math.floor((get('reaction') + get('coordination')) / 40)
    const ap = Math.min(10, Math.max(2, rawAp))

    // MP (Mind): 20 + Logic*0.5 + Knowledge*0.5
    // Default skills (45, 30) -> 20 + 22.5 + 15 = 57.5 -> 57
    const mp = 20 + Math.floor(
        get('logic') * 0.5 +
        get('knowledge') * 0.5
    )

    // WP (Consciousness): 20 + Authority*0.5 + Courage*0.5 + Suggestion*0.2
    // Default skills (30, 30, 30) -> 20 + 15 + 15 + 6 = 56
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
 * Initial values of voices for a new character
 */
export const STARTING_SKILLS: Record<string, number> = {
    // BODY
    force: 30,
    resilience: 30,
    endurance: 30,
    // MOTORICS
    perception: 35,
    reaction: 30,
    coordination: 30,
    // MIND
    logic: 45,
    rhetoric: 30,
    knowledge: 30,
    // CONSCIOUSNESS
    authority: 30,
    suggestion: 30,
    courage: 30,
    // PSYCHE
    gambling: 20,
    drama: 20,
    creativity: 20,
    // SOCIALITY
    solidarity: 20,
    honor: 20,

    // PROLOGUE META
    parl_union: 25,
    parl_academy: 25,
    parl_free_corps: 25,
    parl_seekers: 25,
    psi_exposure: 0,
}
