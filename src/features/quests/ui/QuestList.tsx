import React from 'react'
import type { Quest } from '@/shared/types/quest'
import { QuestListComponent } from '@/entities/quest/ui/QuestList'
import { useMyQuests } from '../api/useMyQuests'

export const QuestList: React.FC = () => {
    const { active, completed, isLoading, error } = useMyQuests()

    const errorMessage =
        error instanceof Error ? error.message : error ? 'Failed to load quests' : null

    return (
        <QuestListComponent
            activeQuests={(active as Quest[]) ?? []}
            completedQuests={(completed as Quest[]) ?? []}
            isLoading={isLoading}
            error={errorMessage}
        />
    )
}

