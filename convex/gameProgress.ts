// Shared starting skills for new players
// Keep minimal but explicit to satisfy imports in mutations
export const STARTING_SKILLS: Record<string, number> = {
  // COGITO
  logic: 45,
  encyclopedia: 30,
  technophile: 30,
  intuition: 35,
  // SPIRIT
  authority: 30,
  cynicism: 25,
  // PSYCHE
  empathy: 40,
  perception: 35,
  // CORPUS
  reflexes: 30,
  strength: 30,
  combat: 25,
  technique: 30,
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