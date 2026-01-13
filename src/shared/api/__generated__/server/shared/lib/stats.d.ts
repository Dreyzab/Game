import { type VoiceId } from '../types/parliament';
export interface MaxResources {
    hp: number;
    ap: number;
    mp: number;
    wp: number;
    pp: number;
    sp: number;
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
export declare function calculateMaxResources(skills: Partial<Record<VoiceId, number>>): MaxResources;
/**
 * Initial values of voices for a new character
 */
export declare const STARTING_SKILLS: Record<string, number>;
