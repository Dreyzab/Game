import { ITEM_TEMPLATES } from '../../shared/data/itemTemplates'
import { generateWeaponCardsForWeaponId } from '../../shared/data/weaponCards'

export interface Card {
    id: string;
    name: string;
    description?: string;
    type: string;
    damage: number;
    damageType: string;
    range?: number[]; // Deprecated in favor of optimalRange
    optimalRange?: number[];
    apCost: number;
    staminaCost: number;
    effects: any[]; // Using any for now, refine later
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
    // ... add others as needed
    [key: string]: number;
}

export interface Artifact {
    prefix: string;
    compatibility: string[];
    bonusDamage: number;
    effect?: any;
}

export function synthesizeCard(weapon: Weapon, artifact: Artifact | null, voices: VoiceStats): Card {
    // 1. Initialize base chassis
    let card: Card = {
        id: crypto.randomUUID(),
        name: weapon.name,
        type: 'attack', // Default type, logic should refine this
        damage: weapon.baseDamage,
        damageType: weapon.damageType,
        range: weapon.validRanks, // Keeping for backward compat, though interface deprecated it
        optimalRange: weapon.validRanks,
        apCost: weapon.baseAp,
        staminaCost: weapon.baseStamina,
        effects: [...weapon.defaultEffects],
        jamChance: 0,
        tags: []
    };

    // 2. Artifact Injection
    if (artifact && artifact.compatibility.includes(weapon.type)) {
        card.name = `${artifact.prefix} ${card.name}`;
        card.damage += artifact.bonusDamage;
        if (artifact.effect) card.effects.push(artifact.effect);
    }

    // 3. Voice Scaling (Inner Parliament)
    // Example specific logic, ideally this comes from DB rules but hardcoding the example for now as per plan
    if (weapon.type === 'BLUNT') {
        const mightFactor = (voices.voiceMight || 0) * 0.05; // 5% per level
        card.damage = Math.floor(card.damage * (1 + mightFactor));

        // Threshold unlock
        if ((voices.voiceMight || 0) >= 5) {
            card.effects.push({ type: 'PUSH', value: 1 });
            card.tags.push('WALL_SLAM_CAPABLE');
        }
    }

    // 4. Entropy (The Jam Equation)
    const techSkill = voices.voiceTech || 0;
    let jamProb = (100 - weapon.condition) * 0.2 + (weapon.heat * 0.1) - (techSkill * 0.5);

    // Anarchist Sabotage
    if (weapon.isSabotaged) jamProb += 25;

    card.jamChance = Math.max(0, Math.min(95, jamProb));

    return card;
}

export function createMoveCard(direction: 'ADVANCE' | 'RETREAT'): any { // Using any for Card temporarily as Card definition locally is specific
    return {
        id: `move_${direction.toLowerCase()}_${Date.now()}_${Math.random()}`,
        name: direction === 'ADVANCE' ? 'Assault' : 'Tactical Retreat',
        type: 'move', // Needs to be added to Card type union if strict
        damage: 0,
        damageType: 'PHYSICAL',
        range: [1, 2, 3, 4],
        apCost: 1,
        staminaCost: 5,
        effects: [direction],
        description: direction === 'ADVANCE' ? 'Move forward 1 Rank.' : 'Move backward 1 Rank.',
        jamChance: 0,
        tags: ['MOVEMENT']
    };
}

export function generateCardsForWeapon(weaponId: string, baseStats?: any): Card[] {
    const template = (ITEM_TEMPLATES as any)?.[weaponId];
    const baseDamage = (() => {
        const raw = baseStats?.damage ?? template?.baseStats?.damage;
        const num = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(num) ? num : 10;
    })();

    const baseJamChance = (() => {
        const raw = baseStats?.jamChance ?? 0;
        const num = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(num) ? num : 0;
    })();

    const generated = generateWeaponCardsForWeaponId(weaponId, {
        baseDamage,
        baseJamChance,
        idPrefix: `srv_${weaponId}`,
    });

    return generated.map((card) => ({
        id: card.id,
        name: card.name,
        description: card.description,
        type: card.type,
        damage: card.damage,
        damageType: card.damageType,
        range: card.optimalRange,
        optimalRange: card.optimalRange,
        apCost: card.apCost,
        staminaCost: card.staminaCost,
        effects: card.effects,
        jamChance: card.jamChance,
        tags: ['weapon'],
    }));
}
