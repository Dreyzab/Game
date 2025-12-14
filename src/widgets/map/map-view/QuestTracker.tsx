import React from 'react'
import { cn } from '@/shared/lib/utils/cn'
import { Scroll } from 'lucide-react'
import { useMyQuests } from '@/shared/hooks/useMyQuests'
import type { Quest } from '@/shared/types/quest'

interface QuestTrackerProps {
    className?: string
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({ className }) => {
    const { active } = useMyQuests()
    const activeQuests = (active || []) as Quest[]

    if (activeQuests.length === 0) return null

    return (
        <div className={cn('bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-xl p-3 max-w-xs', className)}>
            <div className="flex items-center gap-2 mb-2 text-yellow-500">
                <Scroll className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Активные задания</h3>
            </div>

            <div className="space-y-3">
                {activeQuests.map((quest) => (
                    <div key={quest.id} className="border-l-2 border-yellow-500/30 pl-2">
                        <div className="text-sm font-medium text-white">{quest.title}</div>
                        {quest.description && (
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{quest.description}</div>
                        )}
                        {quest.progress !== undefined && quest.maxProgress !== undefined && (
                            <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-500 transition-all duration-500"
                                    style={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
