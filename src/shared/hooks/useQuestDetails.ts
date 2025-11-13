import { useEffect, useMemo, useState } from 'react'
import { convexQueries } from '@/shared/api/convex'

type QuestDetails = {
  id: string
  title: string
  description: string
  phase: number
  isActive: boolean
  stepsCount: number
  repeatable: boolean
  templateVersion: number
}

const cache = new Map<string, { data: QuestDetails; ts: number }>()
const TTL = 60_000

export function useQuestDetails(questId: string | undefined) {
  const [data, setData] = useState<QuestDetails | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const canFetch = useMemo(() => typeof questId === 'string' && questId.length > 0, [questId])

  useEffect(() => {
    if (!canFetch) return
    const id = questId as string
    const cached = cache.get(id)
    const now = Date.now()
    if (cached && now - cached.ts < TTL) {
      setData(cached.data)
      setIsLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)
    convexQueries.quests.getById({ questId: id })
      .then((res) => {
        if (cancelled) return
        if (res) {
          cache.set(id, { data: res, ts: Date.now() })
          setData(res)
        } else {
          setData(null)
        }
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e : new Error('Failed to load quest details'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [canFetch, questId])

  return { data, isLoading, error }
}

