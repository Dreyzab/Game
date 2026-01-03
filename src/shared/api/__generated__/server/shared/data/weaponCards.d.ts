import type { CardType, CombatRank, DamageType } from '../types/combat';
/**
 * Base template for a weapon card.
 * Shared between client and server.
 */
export interface WeaponCardTemplate {
    name: string;
    type: CardType;
    apCost: number;
    staminaCost: number;
    damageMult: number;
    bonusDamage?: number;
    optimalRange: CombatRank[];
    damageType?: DamageType;
    description: string;
    jamChanceMod?: number;
    effects?: any[];
}
export interface GeneratedWeaponCard {
    id: string;
    weaponId: string;
    name: string;
    type: CardType;
    apCost: number;
    staminaCost: number;
    damage: number;
    damageType: DamageType;
    optimalRange: CombatRank[];
    description: string;
    jamChance: number;
    effects: any[];
}
export interface GenerateWeaponCardsOptions {
    baseDamage?: number;
    baseDamageType?: DamageType;
    baseJamChance?: number;
    idPrefix?: string;
    now?: number;
}
export declare function generateWeaponCardsForWeaponId(weaponId: string, options?: GenerateWeaponCardsOptions): GeneratedWeaponCard[];
export declare const WEAPON_CARDS: Record<string, WeaponCardTemplate[]>;
