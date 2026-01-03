import React from 'react'
import { Zap, Target, TrendingUp, Box, Calendar, Bookmark } from 'lucide-react'
import { usePlayer, usePlayerProgress } from '@/shared/hooks/usePlayer'
import { Text } from '@/shared/ui/components/Text'
import { MotionContainer } from '@/shared/ui/components/MotionContainer'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { cn } from '@/shared/lib/utils/cn'

export interface PlayerStatusWidgetProps {
  className?: string
}

export const PlayerStatusWidget: React.FC<PlayerStatusWidgetProps> = ({ className }) => {
  const { player, isLoading: playerLoading } = usePlayer()
  const { progress, isLoading: progressLoading } = usePlayerProgress()

  const isLoading = playerLoading || progressLoading

  if (isLoading) {
    return (
      <div className={cn('glass-panel p-6', className)}>
        <LoadingSpinner text="Загрузка данных игрока" />
      </div>
    )
  }

  const status = player?.status || 'Новичок'
  const reputationTotal = Object.values(progress?.reputation ?? {}).reduce((acc, value) => acc + value, 0)
  const level = progress?.level ?? 0
  const xp = progress?.xp ?? 0
  const maxXp = progress?.maxXp ?? 100
  const completedQuests = progress?.completedQuests ?? 0
  const totalQuests = progress?.totalQuests ?? 0
  const fame = progress?.fame ?? 0
  const points = progress?.points ?? 0
  const daysInGame = progress?.daysInGame ?? 1
  const developmentPhase = player?.developmentPhase || '-'

  return (
    <MotionContainer
      className={cn('glass-panel p-6', className)}
      direction="fade"
      delay={0.2}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-[color:var(--color-text)]">
          АКТИВНЫЙ ПРОФИЛЬ
        </h3>
      </div>

      <div className="space-y-4">
        {/* Статус игрока */}
        <div className="flex items-center justify-between">
          <Text variant="muted" size="sm">Статус игрока:</Text>
          <Text variant="body" size="sm" className="font-medium">{status}</Text>
        </div>

        {/* Репутация */}
        <div className="flex items-center justify-between">
          <Text variant="muted" size="sm">Репутация:</Text>
          <Text variant="body" size="sm" className="font-medium">{reputationTotal}</Text>
        </div>

        {/* Уровень и XP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[color:var(--color-cyan)]" />
              <Text variant="muted" size="sm">Уровень:</Text>
            </div>
            <Text variant="body" size="sm" className="font-medium">
              {level}/{maxXp} XP
            </Text>
          </div>
          <div className="w-full bg-[color:var(--color-surface)] rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-[color:var(--color-cyan)] transition-all duration-300"
              style={{ width: `${Math.min((xp / maxXp) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-center">
            <Target className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
          </div>
        </div>

        {/* Квестов завершено */}
        <div className="flex items-center justify-between">
          <Text variant="muted" size="sm">Квестов завершено:</Text>
          <Text variant="body" size="sm" className="font-medium">
            {completedQuests}/{totalQuests}
          </Text>
        </div>

        {/* Текущая известность */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[color:var(--color-cyan)]" />
            <Text variant="muted" size="sm">Текущая известность:</Text>
          </div>
          <Text variant="body" size="sm" className="font-medium">{fame}</Text>
        </div>

        {/* Очки */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-[color:var(--color-cyan)]" />
            <Text variant="muted" size="sm">Очки:</Text>
          </div>
          <Text variant="body" size="sm" className="font-medium">{points}</Text>
        </div>

        {/* Дней в игре */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[color:var(--color-cyan)]" />
            <Text variant="muted" size="sm">Дней в игре:</Text>
          </div>
          <Text variant="body" size="sm" className="font-medium">{daysInGame}</Text>
        </div>

        {/* Фаза развития */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-[color:var(--color-cyan)]" />
            <Text variant="muted" size="sm">Фаза развития:</Text>
          </div>
          <Text variant="body" size="sm" className="font-medium">{developmentPhase}</Text>
        </div>
      </div>
    </MotionContainer>
  )
}
