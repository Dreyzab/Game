import { useState, useEffect, useCallback } from 'react'
import { convexQueries, convexMutations } from '../api/convex'
import { getDeviceId } from '../lib/utils/deviceId'
import type { Player, PlayerProgress } from '@/shared/types/player'

const createDefaultProgress = (): PlayerProgress => ({
  level: 0,
  xp: 0,
  maxXp: 100,
  skillPoints: 0,
  reputation: 0,
  completedQuests: 0,
  fame: 0,
  points: 0,
  daysInGame: 1,
  flags: {},
  visitedScenes: [],
  completedQuestIds: [],
  currentScene: undefined,
  phase: 1,
  reputationByFaction: {},
  lastUpdatedAt: Date.now(),
})

export type { Player, PlayerProgress }

/**
 * Hook to fetch player data
 */
export function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const deviceId = getDeviceId()

    const fetchPlayer = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Use Convex query when available
        const playerData = await convexQueries.player.get({ deviceId })
        setPlayer(playerData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch player'))
        console.error('Error fetching player:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (deviceId) {
      fetchPlayer()
    } else {
      setIsLoading(false)
    }
  }, [])

  return { player, isLoading, error }
}

/**
 * Hook to fetch player progress
 */
export function usePlayerProgress() {
  const [progress, setProgress] = useState<PlayerProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1)
  }, [])

  useEffect(() => {
    const deviceId = getDeviceId()

    const fetchProgress = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Use Convex query when available
        const progressData = await convexQueries.player.getProgress({ deviceId })

        const normalized: PlayerProgress = {
          ...createDefaultProgress(),
          ...progressData,
          reputationByFaction:
            progressData?.reputationByFaction ??
            (progressData as { reputation?: Record<string, number> })?.reputation ??
            {},
        }

        setProgress(normalized)
      } catch (err) {
        const fallbackProgress = createDefaultProgress()
        setError(err instanceof Error ? err : new Error('Failed to fetch progress'))
        console.error('Error fetching progress:', err)
        setProgress(fallbackProgress)
      } finally {
        setIsLoading(false)
      }
    }

    if (deviceId) {
      void fetchProgress()
    } else {
      setProgress(createDefaultProgress())
      setIsLoading(false)
    }
  }, [refreshToken])

  return { progress, isLoading, error, refresh }
}

/**
 * Hook to create a new player
 */
export function useCreatePlayer() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)

  const createPlayer = async () => {
    const deviceId = getDeviceId()
    
    try {
      setIsCreating(true)
      setError(null)
      
      const newPlayerId = await convexMutations.player.create({ deviceId })
      setPlayerId(newPlayerId)
      
      return newPlayerId
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create player')
      setError(error)
      console.error('Error creating player:', err)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  return { createPlayer, isCreating, error, playerId }
}

