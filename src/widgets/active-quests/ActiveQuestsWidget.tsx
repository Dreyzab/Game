import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyQuests } from '@/features/quests'
import { Text } from '@/shared/ui/components/Text'
import { MotionContainer } from '@/shared/ui/components/MotionContainer'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { Routes } from '@/shared/lib/utils/navigation'
import { cn } from '@/shared/lib/utils/cn'
import type { Quest } from '@/shared/types/quest'
import { QuestSummaryCard } from '@/entities/quest/ui/QuestSummaryCard'
import { Scroll } from 'lucide-react'

export interface ActiveQuestsWidgetProps {
  className?: string
}

export const ActiveQuestsWidget: React.FC<ActiveQuestsWidgetProps> = ({ className }) => {
  const { active = [], isLoading, updateQuest } = useMyQuests()
  const navigate = useNavigate()
  const [removedQuestIds, setRemovedQuestIds] = useState<Set<string>>(() => new Set())

  const activeQuests = active as Quest[]
  const visibleQuests = activeQuests.filter((quest) => !removedQuestIds.has(quest.id))

  const handleCancelQuest = (questId: string) => {
    const ok = window.confirm('Отменить квест? Прогресс по нему будет остановлен локально.')
    if (!ok) return
    updateQuest.mutate({ questId, status: 'abandoned' })
    setRemovedQuestIds((prev) => {
      const next = new Set(prev)
      next.add(questId)
      return next
    })
  }

  const handleViewAllQuests = () => {
    navigate(Routes.QUESTS)
  }

  return (
    <MotionContainer
      className={cn('glass-panel p-6', className)}
      direction="fade"
      delay={0.4}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scroll className="w-4 h-4 text-[color:var(--color-cyan)]" />
          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
            Активные квесты
          </h3>
        </div>
        <span className="text-sm text-[color:var(--color-text-secondary)]">
          {visibleQuests.length}/{activeQuests.length}
        </span>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Загрузка квестов" />
      ) : visibleQuests.length === 0 ? (
        <div className="text-center py-8">
          <Text variant="muted" size="sm">
            Нет активных квестов
          </Text>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleQuests.map((quest, index) => (
            <MotionContainer
              key={quest.id}
              direction="left"
              delay={0.1 * index}
              className="contents"
            >
              <QuestSummaryCard
                quest={quest}
                onCancel={handleCancelQuest}
                cancelLabel="Отменить"
              />
            </MotionContainer>
          ))}
        </div>
      )}

      <button
        onClick={handleViewAllQuests}
        className={cn(
          'mt-6 w-full text-center',
          'text-sm text-[color:var(--color-cyan)]',
          'hover:underline transition-colors',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[color:var(--color-cyan)] focus-visible:ring-offset-2',
          'rounded'
        )}
      >
        Посмотреть все квесты
      </button>
    </MotionContainer>
  )
}

export default ActiveQuestsWidget
