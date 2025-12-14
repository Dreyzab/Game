import { useMemo } from 'react'
import { useMyPlayer } from './useMyPlayer'
import type { Player, PlayerProgress } from '@/shared/types/player'

const coerceNumberRecord = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([, entryValue]) => typeof entryValue === 'number')
  ) as Record<string, number>
}

const createDefaultProgress = (): PlayerProgress => ({
  level: 0,
  xp: 0,
  maxXp: 100,
  skillPoints: 0,
  reputation: {},
  completedQuests: 0,
  fame: 0,
  points: 0,
  daysInGame: 1,
  skills: {},
  flags: {},
  visitedScenes: [],
  completedQuestIds: [],
  currentScene: undefined,
  phase: 1,
  reputationByFaction: {},
  lastUpdatedAt: Date.now(),
})

export type { Player, PlayerProgress }

export function usePlayer() {
  const { data, isLoading, error } = useMyPlayer()
  const player = (data as any)?.player ?? null
  return { player, isLoading, error }
}

export function usePlayerProgress() {
  const { data, isLoading, error, refetch } = useMyPlayer()
  const progress = useMemo<PlayerProgress | null>(() => {
    const pg = (data as any)?.progress
    if (!pg) return createDefaultProgress()
    const reputationByFaction = coerceNumberRecord(pg.reputationByFaction ?? pg.reputation)
    return {
      ...createDefaultProgress(),
      ...pg,
      reputation: reputationByFaction,
      reputationByFaction,
      skills: pg.skills ?? {},
    }
  }, [data])
  const refresh = () => { void refetch() }
  return { progress, isLoading, error, refresh }
}

export function useCreatePlayer() {
  // Player auto-создаётся на первом запросе /player/init в backend; фронт использует useMyPlayer для чтения.
  return { createPlayer: async () => null, isCreating: false, error: null, playerId: null }
}
