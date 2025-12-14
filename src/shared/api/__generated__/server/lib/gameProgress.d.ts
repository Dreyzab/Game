export declare const STARTING_SKILLS: Record<string, number>;
/**
 * Legacy skill ids used in older VN/progress content.
 * We keep a mapping to migrate existing saves to canonical 18-voice IDs.
 *
 * Decision: 18 voices, canonical = `parliament.ts` (force/resilience/endurance/...)
 */
export declare const LEGACY_SKILL_ID_MAP: Record<string, string>;
export declare function needsSkillsNormalization(skills: unknown): boolean;
/**
 * Normalize a skills map to canonical IDs.
 *
 * - Maps legacy keys (`strength`, `stamina`) to canonical (`force`, `resilience`)
 * - Ensures all canonical voice keys exist (fills with STARTING_SKILLS defaults)
 * - Preserves any extra numeric skills (e.g. future non-voice skills)
 */
export declare function normalizeSkills(skills: Record<string, unknown> | null | undefined): Record<string, number>;
export declare const MAX_LEVEL = 100;
export declare function awardXPAndLevelUp(currentLevel: number | null | undefined, currentXP: number | null | undefined, currentSkillPoints: number | null | undefined, xpGain: number): {
    level: number;
    xp: number;
    skillPoints: number;
};
export declare function mergeFlags(flags: Record<string, unknown> | null | undefined, addFlags?: string[], removeFlags?: string[]): Record<string, unknown>;
export declare function mergeReputation(reputation: Record<string, number> | null | undefined, incoming?: Record<string, number>): Record<string, number>;
