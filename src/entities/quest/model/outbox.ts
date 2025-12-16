import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type QuestEventType = 'start' | 'update' | 'complete' | 'abandon'

export type QuestUpdatePayload = {
  status?: 'active' | 'completed' | 'abandoned'
  progress?: unknown
  currentStep?: string
}

export type QuestEvent = {
  seq: number
  type: QuestEventType
  questId: string
  payload?: QuestUpdatePayload
}

type QuestOutboxState = {
  deviceSeq: number
  lastSyncedSeq: number
  outbox: QuestEvent[]
  enqueue: (e: Omit<QuestEvent, 'seq'>) => QuestEvent
  ack: (seq: number) => void
  clear: () => void
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
        set((state) => {
          const nextOutbox = [...state.outbox, event]
          if (nextOutbox.length > 300) {
            console.warn('[questOutbox] outbox length > 300; consider syncing sooner')
          }
          return { deviceSeq: seq, outbox: nextOutbox }
        })
        return event
      },
      ack: (seq) => {
        set((state) => ({
          lastSyncedSeq: Math.max(state.lastSyncedSeq, seq),
          outbox: state.outbox.filter((ev) => ev.seq > seq),
        }))
      },
      clear: () => set({ deviceSeq: 0, lastSyncedSeq: -1, outbox: [] }),
    }),
    { name: 'quest-outbox-v1' }
  )
)

export const enqueueStart = (questId: string) =>
  useQuestOutbox.getState().enqueue({ type: 'start', questId })

export const enqueueUpdate = (questId: string, payload: QuestUpdatePayload) =>
  useQuestOutbox.getState().enqueue({ type: 'update', questId, payload })

export const enqueueComplete = (questId: string, payload?: Omit<QuestUpdatePayload, 'status'>) =>
  useQuestOutbox.getState().enqueue({ type: 'complete', questId, payload })

export const enqueueAbandon = (questId: string, payload?: Omit<QuestUpdatePayload, 'status'>) =>
  useQuestOutbox.getState().enqueue({ type: 'abandon', questId, payload })

