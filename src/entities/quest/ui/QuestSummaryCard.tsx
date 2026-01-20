import React from 'react'
import type { Quest } from '@/shared/types/quest'
import { Text } from '@/shared/ui/components/Text'
import { cn } from '@/shared/lib/utils/cn'

type QuestSummaryCardProps = {
  quest: Quest
  onCancel?: (questId: string) => void
  cancelLabel?: string
  compact?: boolean
  className?: string
}

export const QuestSummaryCard: React.FC<QuestSummaryCardProps> = ({
  quest,
  onCancel,
  cancelLabel = 'Cancel',
  compact = false,
  className,
}) => {
  const showProgress =
    typeof quest.progress === 'number' &&
    typeof quest.maxProgress === 'number' &&
    quest.maxProgress > 0

  return (
    <div
      className={cn(
        'rounded-lg border border-[color:var(--color-border-strong)]/60',
        'bg-[color:var(--color-surface-elevated)]',
        'hover:border-[color:var(--color-cyan)]/70 transition-colors',
        compact ? 'p-3' : 'p-4',
        className
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
      {showProgress && (
        <div className="mt-2">
          <div className="w-full bg-[color:var(--color-surface)] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-[color:var(--color-cyan)] transition-all duration-300"
              style={{
                width: `${Math.min((quest.progress / quest.maxProgress) * 100, 100)}%`,
              }}
            />
          </div>
          <Text variant="muted" size="xs" className="mt-1">
            {quest.progress}/{quest.maxProgress}
          </Text>
        </div>
      )}
      {onCancel && (
        <div className="mt-3 flex items-center justify-end gap-3">
          <button
            onClick={() => onCancel(quest.id)}
            className={cn(
              'px-3 py-1 rounded text-xs',
              'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)]',
              'border border-[color:var(--color-border-strong)]/50 hover:border-[color:var(--color-border-strong)]'
            )}
          >
            {cancelLabel}
          </button>
        </div>
      )}
    </div>
  )
}
