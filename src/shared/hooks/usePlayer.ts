import { useState, useEffect } from 'react'
import { convexQueries, convexMutations } from '../api/convex'
import { getDeviceId } from '../lib/utils/deviceId'

/**
 * Player data types
 */
export interface Player {
  id: string
  deviceId: string
  createdAt: number
  status?: string
  reputation?: number
  level?: number
  xp?: number
  completedQuests?: number
  fame?: number
  points?: number
  daysInGame?: number
  developmentPhase?: string
}

export interface PlayerProgress {
  level: number
  xp: number
  maxXp: number
  skillPoints: number
  reputation: number
  completedQuests: number
  fame: number
  points: number
  daysInGame: number
}

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

  useEffect(() => {
    const deviceId = getDeviceId()

    const fetchProgress = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Use Convex query when available
        const progressData = await convexQueries.player.getProgress({ deviceId }) as any

        // Transform to PlayerProgress format with defaults
        setProgress({
          level: progressData?.level ?? 0,
          xp: progressData?.xp ?? 0,
          maxXp: progressData?.maxXp ?? 100,
          skillPoints: progressData?.skillPoints ?? 0,
          reputation: progressData?.reputation ?? 0,
          completedQuests: progressData?.completedQuests ?? 0,
          fame: progressData?.fame ?? 0,
          points: progressData?.points ?? 0,
          daysInGame: progressData?.daysInGame ?? 1
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch progress'))
        console.error('Error fetching progress:', err)
        
        // Set default progress on error
        setProgress({
          level: 0,
          xp: 0,
          maxXp: 100,
          skillPoints: 0,
          reputation: 0,
          completedQuests: 0,
          fame: 0,
          points: 0,
          daysInGame: 1
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (deviceId) {
      fetchProgress()
    } else {
      // Set default progress if no deviceId
      setProgress({
        level: 0,
        xp: 0,
        maxXp: 100,
        skillPoints: 0,
        reputation: 0,
        completedQuests: 0,
        fame: 0,
        points: 0,
        daysInGame: 1
      })
      setIsLoading(false)
    }
  }, [])

  return { progress, isLoading, error }
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

