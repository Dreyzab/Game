import React from 'react'
import { cn } from '@/shared/lib/utils/cn'
import { Scroll } from 'lucide-react'
import { useMyQuests } from '@/features/quests'
import type { Quest } from '@/shared/types/quest'
import { QuestSummaryCard } from '@/entities/quest/ui/QuestSummaryCard'

interface QuestTrackerProps {
    className?: string
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({ className }) => {
    const { active } = useMyQuests()
    const activeQuests = (active || []) as Quest[]

    if (activeQuests.length === 0) return null

    return (
        <div className={cn('glass-panel p-4 max-w-xs', className)}>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Scroll className="w-4 h-4 text-[color:var(--color-cyan)]" />
                    <h3 className="text-sm font-semibold text-[color:var(--color-text)]">Активные квесты</h3>
                </div>
                <span className="text-xs text-[color:var(--color-text-secondary)]">
                    {activeQuests.length}
                </span>
            </div>

            <div className="space-y-3">
                {activeQuests.map((quest) => (
                    <QuestSummaryCard key={quest.id} quest={quest} compact />
                ))}
            </div>
        </div>
    )
}
