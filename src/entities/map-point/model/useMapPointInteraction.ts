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
      return 'Trade'
    case 'repair':
      return 'Repair'
    case 'crafting':
      return 'Crafting'
    case 'upgrade':
      return 'Upgrade'
    case 'quests':
      return 'Quests'
    case 'dialog':
      return 'Dialog'
    case 'information':
      return 'Information'
    case 'intel':
      return 'Intel'
    case 'heal':
      return 'Heal'
    case 'bless':
      return 'Bless'
    case 'storage':
      return 'Storage'
    case 'training':
      return 'Training'
    case 'deliver':
      return 'Deliver'
  }
}

export function useMapPointInteraction(point: MapPoint | null) {
  return useMemo(() => {
    const isQRRequired = Boolean(point?.metadata?.qrRequired)
    const isResearched = point?.status === 'researched'
    const gatedByQR = isQRRequired && !isResearched

    const baseServices = normalizeServices(point?.metadata?.services)

    const hasSceneBindings =
      Array.isArray(point?.metadata?.sceneBindings) &&
      (point?.metadata?.sceneBindings?.length ?? 0) > 0
    const isNPC = point?.type === 'npc'
    const isBoard = point?.type === 'board'

    const services: InteractionKey[] = [
      ...baseServices,
      ...(hasSceneBindings && isNPC && !baseServices.includes('dialog') ? (['dialog'] as const) : []),
      ...(isBoard && !baseServices.includes('quests') ? (['quests'] as const) : []),
    ]

    const uniqueServices = services.filter((key, idx) => services.indexOf(key) === idx)

    const actions: InteractionAction[] = uniqueServices.map((key) => ({
      key,
      label: labelFor(key),
      disabled: gatedByQR,
      reason: gatedByQR ? 'Requires QR scan' : undefined,
    }))

    return {
      gatedByQR,
      isQRRequired,
      isResearched,
      actions,
    }
  }, [point])
}
