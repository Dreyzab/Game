

export type CharacterRole = 'operative' | 'vanguard' | 'technician' | 'ghost' | 'npc_grunt' | 'npc_elite' | 'npc_boss';

export interface AttributeBlock {
    force: number;      // Body: Strength, Endurance
    flow: number;       // Motorics: Agility, Reflexes
    focus: number;      // Intellect: Knowledge, Logic
    psyche: number;     // Emotions: Willpower, Charisma
}

export interface CharacterTemplate {
    id: string;
    name: string;
    description: string;
    role: CharacterRole;

    // Core Attributes
    attributes: AttributeBlock;

    // Base Resources (Max Values)
    baseStats: {
        hp: number;
        ap: number;
        wp: number; // Willpower/Morale
        initiative: number;
    };

    // Equipment Loadout
    defaultLoadout: {
        weaponId: string;
        armorId?: string;
        items?: string[]; // IDs of consumable items
    };

    // Available Actions (Cards)
    // 'scan' and 'movement' are usually universal, but can be overridden
    specialAbilities: string[]; // Card IDs for special class abilities
}

export const CHARACTER_TEMPLATES: Record<string, CharacterTemplate> = {
    // ============ PLAYERS ============

    'operative_default': {
        id: 'operative_default',
        name: 'Field Operative',
        description: 'Balanced combatant trained for versatile engagements.',
        role: 'operative',
        attributes: { force: 4, flow: 5, focus: 5, psyche: 4 },
        baseStats: { hp: 100, ap: 3, wp: 50, initiative: 10 },
        defaultLoadout: {
            weaponId: 'pistol_basic',
            items: ['medkit_small']
        },
        specialAbilities: ['tactical_scan', 'focus_aim']
    },

    'vanguard_heavy': {
        id: 'vanguard_heavy',
        name: 'Vanguard',
        description: 'Heavy assault unit specializing in durability and suppression.',
        role: 'vanguard',
        attributes: { force: 7, flow: 3, focus: 3, psyche: 5 },
        baseStats: { hp: 140, ap: 3, wp: 60, initiative: 6 },
        defaultLoadout: {
            weaponId: 'pump_shotgun',
            items: []
        },
        specialAbilities: ['braced_stance', 'shout_provoke']
    },

    'tech_specialist': {
        id: 'tech_specialist',
        name: 'Technician',
        description: 'Support unit with high knowledge capabilities.',
        role: 'technician',
        attributes: { force: 2, flow: 4, focus: 8, psyche: 4 },
        baseStats: { hp: 80, ap: 3, wp: 40, initiative: 12 },
        defaultLoadout: {
            weaponId: 'smg_basic',
            items: ['emp_grenade']
        },
        specialAbilities: ['deep_scan', 'turret_deploy']
    },

    // ============ NPCs ============

    'scavenger_scout': {
        id: 'scavenger_scout',
        name: 'Scavenger Scout',
        description: 'Lightly armed wasteland scavenger.',
        role: 'npc_grunt',
        attributes: { force: 3, flow: 5, focus: 2, psyche: 2 },
        baseStats: { hp: 40, ap: 2, wp: 20, initiative: 8 },
        defaultLoadout: {
            weaponId: 'makeshift_pistol'
        },
        specialAbilities: []
    },

    'rail_scorpion': {
        id: 'rail_scorpion',
        name: 'Rail Scorpion',
        description: 'Bio-mechanical horror haunting the rails.',
        role: 'npc_elite',
        attributes: { force: 8, flow: 6, focus: 1, psyche: 10 },
        baseStats: { hp: 250, ap: 4, wp: 100, initiative: 15 },
        defaultLoadout: {
            weaponId: 'tail_sting' // hypothetical innate weapon
        },
        specialAbilities: ['acid_spit', 'burrow']
    }
};
