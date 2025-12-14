import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        // Backend-sync для квестов пока не реализован на Bun; возвращаем null.
        return null
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
