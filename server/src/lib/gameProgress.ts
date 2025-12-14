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
    analysis: 30,
    // CONSCIOUSNESS
    authority: 30,
    suggestion: 30,
    courage: 30,
    // PSYCHE
    drama: 20,
    creativity: 20,
    gambling: 20,
    // SOCIALITY
    solidarity: 20,
    honor: 20,
    empathy: 20,
};

/**
 * Legacy skill ids used in older VN/progress content.
 * We keep a mapping to migrate existing saves to canonical 18-voice IDs.
 *
 * Decision: 18 voices, canonical = `parliament.ts` (force/resilience/endurance/...)
 */
export const LEGACY_SKILL_ID_MAP: Record<string, string> = {
    strength: 'force',
    stamina: 'resilience',
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

export function needsSkillsNormalization(skills: unknown): boolean {
    if (!skills || typeof skills !== 'object') return true;

    const source = skills as Record<string, unknown>;

    // Legacy keys present
    for (const legacyId of Object.keys(LEGACY_SKILL_ID_MAP)) {
        if (legacyId in source) return true;
    }

    // Missing or invalid canonical keys
    for (const canonicalId of Object.keys(STARTING_SKILLS)) {
        if (!(canonicalId in source)) return true;
        if (!isFiniteNumber(source[canonicalId])) return true;
    }

    return false;
}

/**
 * Normalize a skills map to canonical IDs.
 *
 * - Maps legacy keys (`strength`, `stamina`) to canonical (`force`, `resilience`)
 * - Ensures all canonical voice keys exist (fills with STARTING_SKILLS defaults)
 * - Preserves any extra numeric skills (e.g. future non-voice skills)
 */
export function normalizeSkills(
    skills: Record<string, unknown> | null | undefined
): Record<string, number> {
    const source: Record<string, unknown> =
        skills && typeof skills === 'object' ? skills : {};

    const normalized: Record<string, number> = {};

    // Preserve extra numeric skills, excluding legacy keys (we'll map them)
    Object.entries(source).forEach(([key, value]) => {
        if (key in LEGACY_SKILL_ID_MAP) return;
        if (isFiniteNumber(value)) normalized[key] = value;
    });

    // Ensure canonical voice keys
    Object.entries(STARTING_SKILLS).forEach(([canonicalId, defaultValue]) => {
        const direct = source[canonicalId];
        if (isFiniteNumber(direct)) {
            normalized[canonicalId] = direct;
            return;
        }

        const legacyId = Object.entries(LEGACY_SKILL_ID_MAP).find(
            ([, mapped]) => mapped === canonicalId
        )?.[0];
        const legacyValue = legacyId ? source[legacyId] : undefined;
        if (isFiniteNumber(legacyValue)) {
            normalized[canonicalId] = legacyValue;
            return;
        }

        normalized[canonicalId] = defaultValue;
    });

    return normalized;
}

export const MAX_LEVEL = 100;

const xpRequiredForLevel = (level: number) => 50 * level + 50;

export function awardXPAndLevelUp(
    currentLevel: number | null | undefined,
    currentXP: number | null | undefined,
    currentSkillPoints: number | null | undefined,
    xpGain: number
) {
    let level = currentLevel ?? 1;
    let xp = (currentXP ?? 0) + xpGain;
    let skillPoints = currentSkillPoints ?? 0;
    let iterations = 0;

    while (xp >= xpRequiredForLevel(level) && level < MAX_LEVEL && iterations < 100) {
        xp -= xpRequiredForLevel(level);
        level += 1;
        skillPoints += 1;
        iterations += 1;
    }

    if (iterations >= 100 || level >= MAX_LEVEL) {
        console.warn('[gameProgress] Level-up loop capped', { level, xp, iterations });
    }

    return { level, xp, skillPoints };
}

export function mergeFlags(
    flags: Record<string, unknown> | null | undefined,
    addFlags?: string[],
    removeFlags?: string[]
) {
    const next: Record<string, unknown> = { ...(flags ?? {}) };

    addFlags?.forEach((flag) => {
        if (!flag) return;
        next[flag] = true;
    });

    removeFlags?.forEach((flag) => {
        if (!flag) return;
        delete next[flag];
    });

    return next;
}

export function mergeReputation(
    reputation: Record<string, number> | null | undefined,
    incoming?: Record<string, number>
) {
    if (!incoming) return reputation ?? {};
    const next = { ...(reputation ?? {}) };
    Object.entries(incoming).forEach(([faction, delta]) => {
        const safeDelta = typeof delta === 'number' ? delta : 0;
        next[faction] = (next[faction] ?? 0) + safeDelta;
    });
    return next;
}
