import React, { useState } from 'react'
import { Loader2, Inbox, Archive } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'
import type { Quest } from '@/shared/types/quest'
import { QuestDetailsModal } from './QuestDetailsModal'
import { QuestItem } from './QuestItem'
import { useQuestStore } from '../model/store'

export type QuestListProps = {
  activeQuests: Quest[]
  completedQuests: Quest[]
  isLoading: boolean
  error?: string | null
}

export const QuestListComponent: React.FC<QuestListProps> = ({
  activeQuests,
  completedQuests,
  isLoading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const { trackedQuestId, setTrackedQuestId } = useQuestStore()

  const handleTrackQuest = (questId: string) => {
    setTrackedQuestId(trackedQuestId === questId ? null : questId)
  }

  if (error) {
    return (
      <div className="p-4 text-red-400 bg-red-900/20 rounded-lg border border-red-500/20">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex p-1 bg-gray-900/50 rounded-lg backdrop-blur-sm border border-white/5">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all',
            activeTab === 'active'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          )}
        >
          <Inbox className="w-4 h-4" />
          Active
          {activeQuests.length > 0 && (
            <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem]">
              {activeQuests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all',
            activeTab === 'completed'
              ? 'bg-gray-700 text-white shadow-lg'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          )}
        >
          <Archive className="w-4 h-4" />
          Completed
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Loading quests...</p>
        </div>
      ) : (
        <div className="space-y-3 min-h-[200px]">
          {activeTab === 'active' ? (
            activeQuests.length > 0 ? (
              activeQuests.map((quest) => (
                <QuestItem key={quest.id} quest={quest} onClick={() => setSelectedQuest(quest)} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                <Inbox className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-lg font-medium text-gray-400">No active quests</p>
                <p className="text-sm text-gray-600">Explore the world to discover new quests.</p>
              </div>
            )
          ) : completedQuests.length > 0 ? (
            completedQuests.map((quest) => (
              <QuestItem key={quest.id} quest={quest} onClick={() => setSelectedQuest(quest)} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
              <Archive className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-lg font-medium text-gray-400">No completed quests</p>
              <p className="text-sm text-gray-600">Finish quests to see them here.</p>
            </div>
          )}
        </div>
      )}

      <QuestDetailsModal
        quest={selectedQuest}
        onClose={() => setSelectedQuest(null)}
        onTrack={activeTab === 'active' ? handleTrackQuest : undefined}
        isTracked={selectedQuest ? trackedQuestId === selectedQuest.id : false}
      />
    </div>
  )
}

