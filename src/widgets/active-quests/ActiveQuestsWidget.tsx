import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyQuests } from '@/shared/hooks/useMyQuests'
import { Badge } from '@/shared/ui/components/Badge'
import { Text } from '@/shared/ui/components/Text'
import { MotionContainer } from '@/shared/ui/components/MotionContainer'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { Routes } from '@/shared/lib/utils/navigation'
import { cn } from '@/shared/lib/utils/cn'
import type { Quest } from '@/shared/types/quest'

export interface ActiveQuestsWidgetProps {
  className?: string
}

export const ActiveQuestsWidget: React.FC<ActiveQuestsWidgetProps> = ({ className }) => {
  const { active = [], isLoading } = useMyQuests()
  const navigate = useNavigate()
  const [removedQuestIds, setRemovedQuestIds] = useState<Set<string>>(() => new Set())

  const activeQuests = active as Quest[]
  const visibleQuests = activeQuests.filter((quest) => !removedQuestIds.has(quest.id))

  const handleCancelQuest = (questId: string) => {
    const ok = window.confirm('Отменить квест? Прогресс по нему будет остановлен локально.')
    if (!ok) return
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
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
            Активные квесты
          </h3>
          <span className="text-sm text-[color:var(--color-text-secondary)]">
            {visibleQuests.length}/{activeQuests.length}
          </span>
        </div>
        <Badge variant="glow">
          ЛОКАЛЬНО
        </Badge>
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
              <div
                className={cn(
                  'p-4 rounded-lg border border-[color:var(--color-border-strong)]/60',
                  'bg-[color:var(--color-surface-elevated)]',
                  'hover:border-[color:var(--color-cyan)]/70 transition-colors'
                )}
              >
                <Text variant="body" size="sm" className="font-medium">
                  {quest.title}
                </Text>
                {quest.description && (
                  <Text variant="muted" size="xs" className="mt-1">
                    {quest.description}
                  </Text>
                )}
                {quest.progress !== undefined && quest.maxProgress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-[color:var(--color-surface)] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[color:var(--color-cyan)] transition-all duration-300"
                        style={{
                          width: `${Math.min((quest.progress / quest.maxProgress) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <Text variant="muted" size="xs" className="mt-1">
                      {quest.progress}/{quest.maxProgress}
                    </Text>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleCancelQuest(quest.id)}
                    className={cn(
                      'px-3 py-1 rounded text-xs',
                      'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]',
                      'border border-[color:var(--color-border-strong)]/50 hover:border-[color:var(--color-border-strong)]'
                    )}
                    title="Отменить квест (локально)"
                  >
                    Отменить
                  </button>
                </div>
              </div>
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
