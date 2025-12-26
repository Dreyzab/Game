import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authenticatedClient, type ApiClient } from '@/shared/api/client'
import { useAppAuth } from '@/shared/auth'
import { useQuestOutbox } from '@/entities/quest/model/outbox'

type QuestOutboxSyncOptions = {
  enabled?: boolean
  intervalMs?: number
}

type QuestSyncResult = {
  applied: number
}

const isErrorResponse = (value: unknown): value is { error: string } => {
  return Boolean(value && typeof value === 'object' && 'error' in value && typeof (value as any).error === 'string')
}

async function sendQuestStart(client: ApiClient, questId: string) {
  const { data, error } = await client.quests.start.post({ questId })
  if (error) throw error
  if (isErrorResponse(data)) {
    const message = data.error.toLowerCase()
    if (message.includes('already started') || message.includes('already')) return
    throw new Error(data.error)
  }
}

async function sendQuestUpdate(
  client: ApiClient,
  questId: string,
  payload: { status?: unknown; progress?: unknown; currentStep?: unknown }
) {
  const body: Record<string, unknown> = { questId }
  if (payload.status !== undefined) body.status = payload.status
  if (payload.progress !== undefined) body.progress = payload.progress
  if (payload.currentStep !== undefined) body.currentStep = payload.currentStep

  const { data, error } = await client.quests.update.post(body as any)
  if (error) throw error
  if (isErrorResponse(data)) {
    throw new Error(data.error)
  }
}

async function flushQuestOutbox(client: ApiClient): Promise<QuestSyncResult> {
  const { outbox, lastSyncedSeq, ack } = useQuestOutbox.getState()
  if (outbox.length === 0) return { applied: 0 }

  const ordered = [...outbox].sort((a, b) => a.seq - b.seq)
  let applied = 0
  let ackSeq = lastSyncedSeq

  const applyEvent = async (event: (typeof ordered)[number]) => {
    switch (event.type) {
      case 'start':
        await sendQuestStart(client, event.questId)
        return
      case 'update':
        await sendQuestUpdate(client, event.questId, event.payload ?? {})
        return
      case 'complete':
        await sendQuestUpdate(client, event.questId, { ...(event.payload ?? {}), status: 'completed' })
        return
      case 'abandon':
        await sendQuestUpdate(client, event.questId, { ...(event.payload ?? {}), status: 'abandoned' })
        return
      default:
        return
    }
  }

  for (const event of ordered) {
    if (event.seq <= ackSeq) continue

    try {
      await applyEvent(event)
    } catch (e) {
      const message = e instanceof Error ? e.message.toLowerCase() : ''
      if (event.type !== 'start' && message.includes('quest not active')) {
        try {
          await sendQuestStart(client, event.questId)
          await applyEvent(event)
        } catch {
          break
        }
      } else {
        break
      }
    }

    ackSeq = event.seq
    ack(ackSeq)
    applied += 1
  }

  return { applied }
}

export function useQuestOutboxSync(options: QuestOutboxSyncOptions = {}) {
  const { enabled = true, intervalMs = 30000 } = options
  const queryClient = useQueryClient()
  const { getToken, isLoaded, isSignedIn } = useAppAuth()
  const pendingCount = useQuestOutbox((state) => state.outbox.length)

  const syncInFlightRef = useRef<Promise<QuestSyncResult> | null>(null)

  const syncNow = useCallback(async () => {
    if (!enabled) return { applied: 0 }
    if (syncInFlightRef.current) return syncInFlightRef.current

    const promise = (async () => {
      const token = isLoaded && isSignedIn ? await getToken().catch(() => null) : null
      const client = authenticatedClient(token ?? undefined)
      const result = await flushQuestOutbox(client)
      if (result.applied > 0) {
        queryClient.invalidateQueries({ queryKey: ['myQuests'] })
      }
      return result
    })().finally(() => {
      syncInFlightRef.current = null
    })

    syncInFlightRef.current = promise
    return promise
  }, [enabled, getToken, isLoaded, isSignedIn, queryClient])

  useEffect(() => {
    if (!enabled) return
    if (pendingCount <= 0) return
    void syncNow()
  }, [enabled, pendingCount, syncNow])

  useEffect(() => {
    if (!enabled) return

    let stopped = false
    let timer: ReturnType<typeof window.setInterval> | null = null

    const requestSync = () => {
      if (!stopped) void syncNow()
    }

    const onOnline = () => requestSync()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') requestSync()
    }

    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)

    if (intervalMs > 0) {
      timer = window.setInterval(() => requestSync(), intervalMs)
    }

    requestSync()

    return () => {
      stopped = true
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
      if (timer) window.clearInterval(timer)
    }
  }, [enabled, intervalMs, syncNow])
}
