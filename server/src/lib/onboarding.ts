import { STARTING_SKILLS, normalizeSkills } from "./gameProgress";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const hasFlag = (flags: Record<string, unknown> | null | undefined, flag: string) => flags?.[flag] === true;

export const ONBOARDING_SKILLS_APPLIED_FLAG = "onboarding_skills_applied";

export function deriveOnboardingSkills(
    flags: Record<string, unknown> | null | undefined,
    baseSkills: Record<string, unknown> | null | undefined
): Record<string, number> {
    const base = normalizeSkills(baseSkills ?? STARTING_SKILLS);

    const deltas: Record<string, number> = {};
    const add = (key: string, delta: number) => {
        if (!key || delta === 0) return;
        deltas[key] = (deltas[key] ?? 0) + delta;
    };

    if (hasFlag(flags, "build_body")) {
        add("force", 12);
        add("resilience", 12);
        add("endurance", 10);
    } else if (hasFlag(flags, "build_mind")) {
        add("logic", 12);
        add("knowledge", 10);
        add("rhetoric", 8);
    } else if (hasFlag(flags, "build_social")) {
        add("suggestion", 12);
        add("authority", 10);
        add("empathy", 8);
        add("solidarity", 6);
    }

    if (hasFlag(flags, "build_observer")) {
        add("perception", 12);
        add("reaction", 8);
        add("coordination", 6);
    } else if (hasFlag(flags, "build_rusher")) {
        add("force", 8);
        add("resilience", 8);
        add("coordination", 6);
    } else if (hasFlag(flags, "build_negotiator")) {
        add("suggestion", 10);
        add("rhetoric", 8);
        add("empathy", 8);
    }

    const next: Record<string, number> = { ...base };

    Object.keys(STARTING_SKILLS).forEach((key) => {
        const current = typeof base[key] === "number" ? base[key] : STARTING_SKILLS[key] ?? 0;
        const delta = deltas[key] ?? 0;
        next[key] = clamp(current + delta, 0, 100);
    });

    return next;
}
