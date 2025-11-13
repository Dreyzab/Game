import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { convexClient } from '@/shared/api/convex'
import { getDeviceId } from '@/shared/lib/utils/deviceId'

export type QuestEventType = 'start' | 'update' | 'complete' | 'abandon'

export type QuestEvent = {
  seq: number
  type: QuestEventType
  questId: string
  payload?: Record<string, unknown>
}

type Echo = {
  questId: string
  status: 'active' | 'completed'
  currentStep?: string
  progress?: number
  completedAt?: number
}

type QuestOutboxState = {
  deviceSeq: number
  lastSyncedSeq: number
  outbox: QuestEvent[]
  enqueue: (e: Omit<QuestEvent, 'seq'>) => QuestEvent
  ack: (seq: number) => void
  clear: () => void
  syncNow: () => Promise<{ ack: number; echos: Echo[]; nextExpectedSeq: number } | null>
}

export const useQuestOutbox = create<QuestOutboxState>()(
  persist(
    (set, get) => ({
      deviceSeq: 0,
      lastSyncedSeq: -1,
      outbox: [],
      enqueue: (e) => {
        const seq = get().deviceSeq + 1
        const event = { ...e, seq }
        set((s) => {
          const nextOutbox = [...s.outbox, event]
          if (nextOutbox.length > 300) {
            console.warn('[questOutbox] outbox length > 300; consider syncing sooner')
          }
          return { deviceSeq: seq, outbox: nextOutbox }
        })
        return event
      },
      ack: (seq) => {
        set((s) => ({
          lastSyncedSeq: Math.max(s.lastSyncedSeq, seq),
          outbox: s.outbox.filter((ev) => ev.seq > seq),
        }))
      },
      clear: () => set({ deviceSeq: 0, lastSyncedSeq: -1, outbox: [] }),
      syncNow: async () => {
        const client = convexClient
        if (!client) return null
        const deviceId = getDeviceId()
        const state = get()
        const events = [...state.outbox].sort((a, b) => a.seq - b.seq)
        try {
          // @ts-expect-error Allow calling without codegen
          const res = await client.mutation('quests:sync', {
            deviceId,
            lastKnownSeq: state.lastSyncedSeq,
            events,
          })
          
          // Runtime validation вместо небезопасного type assertion
          if (!res || typeof res !== 'object') {
            console.warn('[questOutbox] Invalid response: not an object', res)
            return null
          }
          
          if (typeof res.ack !== 'number') {
            console.warn('[questOutbox] Invalid response: ack is not a number', res)
            return null
          }
          
          if (typeof res.nextExpectedSeq !== 'number') {
            console.warn('[questOutbox] Invalid response: nextExpectedSeq is not a number', res)
            return null
          }
          
          if (!Array.isArray(res.echos)) {
            console.warn('[questOutbox] Invalid response: echos is not an array', res)
            return null
          }
          
          // Валидация каждого элемента echos
          const validatedEchos: Echo[] = []
          for (const echo of res.echos) {
            if (
              typeof echo === 'object' &&
              echo !== null &&
              typeof echo.questId === 'string' &&
              (echo.status === 'active' || echo.status === 'completed') &&
              (echo.currentStep === undefined || typeof echo.currentStep === 'string') &&
              (echo.progress === undefined || typeof echo.progress === 'number') &&
              (echo.completedAt === undefined || typeof echo.completedAt === 'number')
            ) {
              validatedEchos.push(echo as Echo)
            } else {
              console.warn('[questOutbox] Invalid echo item:', echo)
            }
          }
          
          const validatedRes = {
            ack: res.ack,
            echos: validatedEchos,
            nextExpectedSeq: res.nextExpectedSeq,
          }
          
          if (validatedRes.ack >= 0) {
            get().ack(validatedRes.ack)
          }
          
          return validatedRes
        } catch (e) {
          console.warn('[questOutbox] sync failed', e)
          return null
        }
      },
    }),
    { name: 'quest-outbox-v1' }
  )
)

export const enqueueStart = (questId: string) =>
  useQuestOutbox.getState().enqueue({ type: 'start', questId })

export const enqueueUpdate = (
  questId: string,
  payload: { expectedStep?: string; nextStepId?: string; deltaProgress?: number; setProgress?: number }
) => useQuestOutbox.getState().enqueue({ type: 'update', questId, payload })

export const enqueueComplete = (
  questId: string,
  payload?: { expectedStep?: string; resultDetails?: { templateVersion?: number; sceneLog?: Array<{ stepId: string; choiceId?: string; success?: boolean; reward?: unknown }> } }
) => useQuestOutbox.getState().enqueue({ type: 'complete', questId, payload })

export const syncOutboxNow = () => useQuestOutbox.getState().syncNow()
