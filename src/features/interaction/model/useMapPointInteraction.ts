import { useMemo } from 'react'
import type { MapPoint } from '@/shared/types/map'

export type InteractionKey =
  | 'trade'
  | 'repair'
  | 'crafting'
  | 'upgrade'
  | 'quests'
  | 'dialog'
  | 'information'
  | 'intel'
  | 'heal'
  | 'bless'
  | 'storage'
  | 'training'
  | 'deliver'

export interface InteractionAction {
  key: InteractionKey
  label: string
  disabled?: boolean
  reason?: string
}

function normalizeServices(services: unknown): InteractionKey[] {
  if (!Array.isArray(services)) return []
  return services
    .map((s) => String(s).toLowerCase())
    .filter(Boolean)
    .map((s) => s.trim())
    .map((s) => {
      // map aliases
      if (s === 'quest') return 'quests'
      if (s === 'talk' || s === 'dialogue' || s === 'dialogues') return 'dialog'
      return s as InteractionKey
    })
    .filter((s): s is InteractionKey =>
      [
        'trade',
        'repair',
        'crafting',
        'upgrade',
        'quests',
        'dialog',
        'information',
        'intel',
        'heal',
        'bless',
        'storage',
        'training',
        'deliver',
      ].includes(s)
    )
}

function labelFor(key: InteractionKey): string {
  switch (key) {
    case 'trade':
      return 'Торговля'
    case 'repair':
      return 'Ремонт'
    case 'crafting':
      return 'Ремесло'
    case 'upgrade':
      return 'Улучшение'
    case 'quests':
      return 'Задания'
    case 'dialog':
      return 'Разговор'
    case 'information':
      return 'Информация'
    case 'intel':
      return 'Сведения'
    case 'heal':
      return 'Лечение'
    case 'bless':
      return 'Благословение'
    case 'storage':
      return 'Склад'
    case 'training':
      return 'Тренировка'
    case 'deliver':
      return 'Доставить'
  }
}

/**
 * Returns available interaction actions for a map point.
 * Applies QR gating and simple availability checks.
 */
export function useMapPointInteraction(point: MapPoint | null) {
  return useMemo(() => {
    const isQRRequired = Boolean(point?.metadata?.qrRequired)
    const isResearched = point?.status === 'researched'
    const gatedByQR = isQRRequired && !isResearched

    const baseServices = normalizeServices(point?.metadata?.services)

    // If no services, but there is a scene binding and NPC/board – expose a generic dialog/quest action
    const hasSceneBindings = Array.isArray(point?.metadata?.sceneBindings) && (point?.metadata?.sceneBindings?.length ?? 0) > 0
    const isNPC = point?.type === 'npc'
    const isBoard = point?.type === 'board'
    const isQuestTarget = Boolean(point?.metadata?.isActiveQuestTarget)

    const services: InteractionKey[] = [
      ...baseServices,
      ...(hasSceneBindings && isNPC && !baseServices.includes('dialog') ? (['dialog'] as const) : []),
      ...(isBoard && !baseServices.includes('quests') ? (['quests'] as const) : []),
      ...(isQuestTarget ? (['deliver'] as const) : []),
    ]

    // De-duplicate while preserving order
    const uniqueServices = services.filter((key, idx) => services.indexOf(key) === idx)

    const actions: InteractionAction[] = uniqueServices.map((key) => ({
      key,
      label: labelFor(key),
      disabled: gatedByQR,
      reason: gatedByQR ? 'Нужно отсканировать QR' : undefined,
    }))

    return {
      gatedByQR,
      isQRRequired,
      isResearched,
      actions,
    }
  }, [point])
}
