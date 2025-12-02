import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface QuestState {
    trackedQuestId: string | null
    setTrackedQuestId: (id: string | null) => void
}

export const useQuestStore = create<QuestState>()(
    persist(
        (set) => ({
            trackedQuestId: null,
            setTrackedQuestId: (id) => set({ trackedQuestId: id }),
        }),
        {
            name: 'quest-storage',
        }
    )
)
