import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  QrCode,
  Map,
  BookOpen,
  Sword,
  Package,
  User,
  Settings
} from 'lucide-react'
import { MotionContainer } from '@/shared/ui/components/MotionContainer'
import { Routes } from '@/shared/lib/utils/navigation'
import { cn } from '@/shared/lib/utils/cn'

export interface QuickActionsWidgetProps {
  className?: string
}

interface QuickAction {
  id: string
  icon: React.ReactNode
  label: string
  route: string
  description?: string
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ className }) => {
  const navigate = useNavigate()

  const currentTime = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const actions: QuickAction[] = [
    {
      id: 'prologue',
      icon: <FileText className="h-5 w-5" />,
      label: 'Начать историю',
      route: Routes.PROLOGUE
    },
    {
      id: 'qr',
      icon: <QrCode className="h-5 w-5" />,
      label: 'Сканировать код локации',
      route: Routes.QR_SCANNER
    },
    {
      id: 'map',
      icon: <Map className="h-5 w-5" />,
      label: 'Открыть игровую карту',
      route: Routes.MAP
    },
    {
      id: 'quests',
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Управление заданиями',
      route: Routes.QUESTS
    },
    {
      id: 'combat',
      icon: <Sword className="h-5 w-5" />,
      label: 'Карточная боевая система',
      route: Routes.COMBAT
    },
    {
      id: 'inventory',
      icon: <Package className="h-5 w-5" />,
      label: 'Управление предметами',
      route: Routes.INVENTORY
    },
    {
      id: 'character',
      icon: <User className="h-5 w-5" />,
      label: 'Параметры персонажа',
      route: Routes.CHARACTER
    },
    {
      id: 'settings',
      icon: <Settings className="h-5 w-5" />,
      label: 'Параметры игры',
      route: Routes.SETTINGS
    }
  ]

  const handleActionClick = (route: string) => {
    navigate(route)
  }

  return (
    <MotionContainer
      className={cn('glass-panel p-6', className)}
      direction="fade"
      delay={0.3}
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
          БЫСТРЫЕ ДЕЙСТВИЯ
        </h3>
        <span className="text-xs text-[color:var(--color-text-secondary)] font-mono">
          {currentTime}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => (
          <MotionContainer
            key={action.id}
            direction="right"
            delay={0.1 * index}
            className="contents"
          >
            <button
              onClick={() => handleActionClick(action.route)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg',
                'border border-[color:var(--color-border-strong)]/60',
                'bg-[color:var(--color-surface-elevated)]',
                'text-left transition-all duration-200',
                'hover:border-[color:var(--color-cyan)]/70',
                'hover:bg-[color:var(--color-surface)]',
                'hover:text-[color:var(--color-cyan)]',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[color:var(--color-cyan)] focus-visible:ring-offset-2'
              )}
            >
              <div className="flex-shrink-0 text-[color:var(--color-cyan)]">
                {action.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[color:var(--color-text)] group-hover:text-[color:var(--color-cyan)]">
                  {action.label}
                </div>
                {action.description && (
                  <div className="text-xs text-[color:var(--color-text-secondary)] mt-1">
                    {action.description}
                  </div>
                )}
              </div>
            </button>
          </MotionContainer>
        ))}
      </div>
    </MotionContainer>
  )
}

