import type { MapPoint, SceneBinding, SceneBindingCondition } from '@/shared/types/map'
import type { PlayerProgress } from '@/shared/types/player'

export interface SceneResolutionResult {
  sceneId: string | null
  reason?: string
  binding?: SceneBinding
}

const sortBindings = (bindings: SceneBinding[]) =>
  [...bindings].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

const hasAllFlags = (required: string[] | undefined, flags: PlayerProgress['flags']) => {
  if (!required?.length) return true
  return required.every((flag) => Boolean(flags[flag]))
}

const hasNoForbiddenFlags = (forbidden: string[] | undefined, flags: PlayerProgress['flags']) => {
  if (!forbidden?.length) return true
  return forbidden.every((flag) => !flags[flag])
}

const hasCompletedQuests = (questIds: string[] | undefined, completed: string[]) => {
  if (!questIds?.length) return true
  if (!completed.length) return false
  return questIds.every((questId) => completed.includes(questId))
}

const meetsReputation = (
  requirements: SceneBindingCondition['reputation'],
  reputationByFaction: Record<string, number> | undefined
) => {
  if (!requirements?.length) return true
  return requirements.every((req) => {
    const current = reputationByFaction?.[req.faction] ?? 0
    if (req.min !== undefined && current < req.min) return false
    if (req.max !== undefined && current > req.max) return false
    return true
  })
}

const bindingReason = (binding: SceneBinding, progress?: PlayerProgress | null) => {
  if (!progress) {
    return 'Требуется информация о прогрессе игрока'
  }

  const { conditions } = binding
  if (!conditions) return null

  if (!hasAllFlags(conditions.flags, progress.flags)) {
    return 'Требуются дополнительные флаги прогресса'
  }

  if (!hasNoForbiddenFlags(conditions.notFlags, progress.flags)) {
    return 'Текущее состояние блокирует сцену'
  }

  if (
    conditions.phase !== undefined &&
    (progress.phase === undefined || progress.phase < conditions.phase)
  ) {
    return 'Требуется более поздняя фаза сюжета'
  }

  if (!hasCompletedQuests(conditions.questCompleted, progress.completedQuestIds)) {
    return 'Квестовые условия не выполнены'
  }

  if (
    conditions.minLevel !== undefined &&
    (progress.level ?? 0) < conditions.minLevel
  ) {
    return 'Недостаточный уровень персонажа'
  }

  if (!meetsReputation(conditions.reputation, progress.reputationByFaction)) {
    return 'Недостаточная репутация у фракции'
  }

  return null
}

export function resolveSceneFromPoint(
  point: MapPoint,
  progress?: PlayerProgress | null
): SceneResolutionResult {
  const bindings = point.metadata?.sceneBindings
  if (!bindings || !Array.isArray(bindings) || bindings.length === 0) {
    return { sceneId: null, reason: 'Для точки не настроены сцены' }
  }

  if (!progress) {
    return { sceneId: null, reason: 'Прогресс игрока не загружен' }
  }

  const sorted = sortBindings(bindings)

  for (const binding of sorted) {
    const reason = bindingReason(binding, progress)
    if (reason === null) {
      return { sceneId: binding.sceneId, binding }
    }
  }

  return {
    sceneId: null,
    reason: 'Условия для запуска сцены не выполнены',
  }
}
