import { useState, useEffect } from 'react'
import { convexQueries } from '../api/convex'
import { getDeviceId } from '../lib/utils/deviceId'

/**
 * Quest data types
 */
export interface Quest {
  id: string
  title: string
  description?: string
  status: 'active' | 'completed' | 'locked'
  progress?: number
  maxProgress?: number
  createdAt: number
}

/**
 * Hook to fetch active quests
 */
export function useActiveQuests() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const deviceId = getDeviceId()

    const fetchQuests = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Use Convex query when available
        const activeQuests = await convexQueries.quests.getActive({ deviceId })
        setQuests(activeQuests ?? [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch quests'))
        console.error('Error fetching quests:', err)
        setQuests([])
      } finally {
        setIsLoading(false)
      }
    }

    if (deviceId) {
      fetchQuests()
    } else {
      setIsLoading(false)
      setQuests([])
    }
  }, [])

  return { quests, isLoading, error }
}

