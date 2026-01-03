export interface Card {
    id: string;
    name: string;
    description?: string;
    type: string;
    damage: number;
    damageType: string;
    range?: number[];
    optimalRange?: number[];
    apCost: number;
    staminaCost: number;
    effects: any[];
    jamChance: number;
    tags: string[];
}
export interface Weapon {
    name: string;
    type: string;
    baseDamage: number;
    damageType: 'PHYSICAL' | 'TECHNO' | 'BIO' | 'RITUAL';
    validRanks: number[];
    baseAp: number;
    baseStamina: number;
    defaultEffects: any[];
    condition: number;
    heat: number;
    isSabotaged?: boolean;
}
export interface VoiceStats {
    voiceMight: number;
    voiceTech: number;
    [key: string]: number;
}
export interface Artifact {
    prefix: string;
    compatibility: string[];
    bonusDamage: number;
    effect?: any;
}
export declare function synthesizeCard(weapon: Weapon, artifact: Artifact | null, voices: VoiceStats): Card;
export declare function createMoveCard(direction: 'ADVANCE' | 'RETREAT'): any;
export declare function generateCardsForWeapon(weaponId: string, baseStats?: any): Card[];
