import type { VisualNovelAdvice } from '@/shared/types/visualNovel'
import type { VoiceId } from '@/shared/types/parliament'

/**
 * Фильтрует советы по доступности на основе навыков и флагов игрока
 */
export function filterAvailableAdvices(
  advices: VisualNovelAdvice[] | undefined,
  skills: Partial<Record<VoiceId, number>>,
  flags: Set<string>
): VisualNovelAdvice[] {
  if (!advices || advices.length === 0) {
    return []
  }

  return advices.filter((advice) => {
    const skillLevel = skills[advice.characterId] ?? 0

    // Проверка минимального уровня навыка
    if (advice.minSkillLevel !== undefined && skillLevel < advice.minSkillLevel) {
      return false
    }

    // Проверка максимального уровня навыка (для "глупых" советов при низком навыке)
    if (advice.maxSkillLevel !== undefined && skillLevel > advice.maxSkillLevel) {
      return false
    }

    // Проверка обязательных флагов
    if (advice.requiredFlags && advice.requiredFlags.length > 0) {
      const hasAllRequired = advice.requiredFlags.every((flag) => flags.has(flag))
      if (!hasAllRequired) {
        return false
      }
    }

    // Проверка исключающих флагов
    if (advice.excludedFlags && advice.excludedFlags.length > 0) {
      const hasAnyExcluded = advice.excludedFlags.some((flag) => flags.has(flag))
      if (hasAnyExcluded) {
        return false
      }
    }

    return true
  })
}

/**
 * Получает уровень навыка игрока
 */
export function getSkillLevel(skills: Partial<Record<VoiceId, number>>, skillId: VoiceId): number {
  return skills[skillId] ?? 0
}

/**
 * Проверяет, доступен ли конкретный совет
 */
export function isAdviceAvailable(
  advice: VisualNovelAdvice,
  skills: Partial<Record<VoiceId, number>>,
  flags: Set<string>
): boolean {
  return filterAvailableAdvices([advice], skills, flags).length > 0
}

/**
 * Группирует советы по категориям голосов
 */
export function groupAdvicesByCategory(
  advices: VisualNovelAdvice[]
): Record<string, VisualNovelAdvice[]> {
  const grouped: Record<string, VisualNovelAdvice[]> = {}

  advices.forEach((advice) => {
    const category = advice.characterId
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(advice)
  })

  return grouped
}

/**
 * Получает ID голосов, которые имеют доступные советы
 */
export function getAvailableVoiceIds(
  advices: VisualNovelAdvice[] | undefined,
  skills: Partial<Record<VoiceId, number>>,
  flags: Set<string>
): VoiceId[] {
  const available = filterAvailableAdvices(advices, skills, flags)
  return Array.from(new Set(available.map((advice) => advice.characterId)))
}

