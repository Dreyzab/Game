import React from 'react'
import { Zap, Heart } from 'lucide-react'
import { MotionContainer } from '@/shared/ui/components/MotionContainer'
import { Text } from '@/shared/ui/components/Text'
import { cn } from '@/shared/lib/utils/cn'

export interface SystemStatusWidgetProps {
  className?: string
}

export const SystemStatusWidget: React.FC<SystemStatusWidgetProps> = ({ className }) => {
  return (
    <MotionContainer
      className={cn('glass-panel p-6', className)}
      direction="fade"
      delay={0.5}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-(--color-text)">
          НОВОСТИ И СТАТУС
        </h3>
      </div>

      <div className="space-y-4">
        {/* Статус системы */}
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-(--color-cyan) flex-shr  ink-0" />
          <div>
            <Text variant="body" size="sm" className="font-medium">
              Система активна
            </Text>
          </div>
        </div>

        {/* Информация о синхронизации */}
        <div className="pt-2 border-t border-[color:var(--color-border-strong)]/60">
          <Text variant="muted" size="xs" className="leading-relaxed">
            TanStack Query + Elysia API синхронно поддерживают данные игрока.
          </Text>
        </div>

        {/* Иконка сердца */}
        <div className="flex justify-center pt-2">
          <Heart className="h-5 w-5 text-[color:var(--color-cyan)] fill-[color:var(--color-cyan)]/20" />
        </div>
      </div>
    </MotionContainer>
  )
}

