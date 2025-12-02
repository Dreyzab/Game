// Shared starting skills for new players
// Keep minimal but explicit to satisfy imports in mutations
export const STARTING_SKILLS: Record<string, number> = {
  // BODY
  strength: 30,
  endurance: 30,
  stamina: 30,
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
}

export const MAX_LEVEL = 100

const xpRequiredForLevel = (level: number) => 50 * level + 50

export function awardXPAndLevelUp(
  currentLevel: number | undefined,
  currentXP: number | undefined,
  currentSkillPoints: number | undefined,
  xpGain: number
) {
  let level = currentLevel ?? 1
  let xp = (currentXP ?? 0) + xpGain
  let skillPoints = currentSkillPoints ?? 0
  let iterations = 0

  while (xp >= xpRequiredForLevel(level) && level < MAX_LEVEL && iterations < 100) {
    xp -= xpRequiredForLevel(level)
    level += 1
    skillPoints += 1
    iterations += 1
  }

  if (iterations >= 100 || level >= MAX_LEVEL) {
    console.warn('[gameProgress] Level-up loop capped', { level, xp, iterations })
  }

  return { level, xp, skillPoints }
}