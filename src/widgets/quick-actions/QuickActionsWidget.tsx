import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Database,
  FileText,
  Map,
  Package,
  QrCode,
  RefreshCw,
  Settings,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Sword,
  User,
  UserPlus,
} from 'lucide-react'
import { MotionContainer } from '@/shared/ui/components/MotionContainer'
import { Routes } from '@/shared/lib/utils/navigation'
import { cn } from '@/shared/lib/utils/cn'
import { convexClient, convexMutations } from '@/shared/api/convex'
import { generateDeviceId, getDeviceId, setDeviceId } from '@/shared/lib/utils/deviceId'

export interface QuickActionsWidgetProps {
  className?: string
}

type StoredAccount = {
  deviceId: string
  role: 'admin' | 'player'
  label: string
  createdAt: number
  lastUsedAt?: number
}

type QuickAction = {
  id: string
  icon: React.ReactNode
  label: string
  description?: string
  route?: string
  onClick?: () => void
  busyId?: string
}

const ACCOUNT_STORE_KEY = 'grezwanderer_accounts'
const shortDeviceId = (deviceId: string) =>
  deviceId.length <= 9 ? deviceId : `${deviceId.slice(0, 4)}...${deviceId.slice(-4)}`

const readStoredAccounts = (): StoredAccount[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(ACCOUNT_STORE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (entry) =>
          entry &&
          typeof entry.deviceId === 'string' &&
          (entry.role === 'admin' || entry.role === 'player')
      )
      .map(
        (entry) =>
          ({
            deviceId: entry.deviceId,
            role: entry.role,
            label: typeof entry.label === 'string' ? entry.label : entry.role === 'admin' ? 'Админ' : 'Игрок',
            createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now(),
            lastUsedAt: typeof entry.lastUsedAt === 'number' ? entry.lastUsedAt : undefined,
          }) satisfies StoredAccount
      )
  } catch (error) {
    console.warn('[QuickActions] Failed to read stored accounts', error)
    return []
  }
}

const persistAccounts = (accounts: StoredAccount[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(accounts))
  } catch (error) {
    console.warn('[QuickActions] Failed to persist accounts list', error)
  }
}

const upsertAccount = (accounts: StoredAccount[], profile: StoredAccount): StoredAccount[] => {
  const filtered = accounts.filter((acc) => acc.deviceId !== profile.deviceId)
  return [profile, ...filtered].slice(0, 6)
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ className }) => {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => readStoredAccounts())
  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => getDeviceId())
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  const currentTime = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  useEffect(() => {
    const currentId = getDeviceId()
    setActiveDeviceId(currentId)

    setAccounts((prev) => {
      const base = prev.length ? prev : readStoredAccounts()
      const hasCurrent = base.some((acc) => acc.deviceId === currentId)
      const next = hasCurrent
        ? base
        : [
            {
              deviceId: currentId,
              role: 'player',
              label: 'Текущий игрок',
              createdAt: Date.now(),
              lastUsedAt: Date.now(),
            },
            ...base,
          ]

      persistAccounts(next)
      return next
    })
  }, [])

  const handleCreateAccount = async (role: StoredAccount['role']) => {
    const newDeviceId = generateDeviceId()
    const busyId = role === 'admin' ? 'create-admin' : 'create-player'
    setBusyAction(busyId)
    setMessage('')

    try {
      await convexMutations.player.ensureByDevice({ deviceId: newDeviceId })
      if (role === 'admin') {
        await convexMutations.admin.register({ name: 'Admin QA' })
      }

      const profile: StoredAccount = {
        deviceId: newDeviceId,
        role,
        label: role === 'admin' ? 'Админ' : 'Игрок',
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      }

      setAccounts((prev) => {
        const next = upsertAccount(prev, profile)
        persistAccounts(next)
        return next
      })

      setActiveDeviceId(newDeviceId)
      setDeviceId(newDeviceId)
      setMessage(role === 'admin' ? 'Админ-аккаунт создан и активен' : 'Создан новый игровой аккаунт')

      setTimeout(() => window.location.reload(), 350)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setMessage(`Не удалось создать аккаунт: ${errorMessage}`)
    } finally {
      setBusyAction(null)
    }
  }

  const handleSwitchAccount = (deviceId: string) => {
    setBusyAction('switch')
    setMessage('')

    setDeviceId(deviceId)
    setActiveDeviceId(deviceId)

    setAccounts((prev) => {
      const next = prev.map((acc) =>
        acc.deviceId === deviceId ? { ...acc, lastUsedAt: Date.now() } : acc
      )
      persistAccounts(next)
      return next
    })

    setMessage(`Переключено на ${shortDeviceId(deviceId)}`)
    setTimeout(() => {
      setBusyAction(null)
      window.location.reload()
    }, 200)
  }

  const handleResetProgress = async () => {
    if (!activeDeviceId) return

    setBusyAction('reset')
    setMessage('')

    try {
      await convexMutations.player.resetProgress({ deviceId: activeDeviceId })
      setMessage('Прогресс текущего аккаунта сброшен')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setMessage(`Не удалось сбросить прогресс: ${errorMessage}`)
    } finally {
      setBusyAction(null)
    }
  }

  const handleSeedAll = async () => {
    if (!convexClient) {
      setMessage('Convex не подключен: сиды доступны только при настроенном VITE_CONVEX_URL')
      return
    }

    setBusyAction('seed')
    setMessage('Сидим все данные DevTools...')

    try {
      // @ts-expect-error Allow calling by string route without generated types
      const points = await convexClient.mutation('mapPointsSeed:reseedMapPoints', {})
      // @ts-expect-error Allow calling by string route without generated types
      const zones = await convexClient.mutation('zonesSeed:seedSafeZones', {})
      // @ts-expect-error Allow calling by string route without generated types
      const quests = await convexClient.mutation('questsSeed:seedQuests', {})

      setMessage(
        `Сид готов: точки ${points?.pointsCreated ?? points?.message ?? 'ok'}, зоны ${
          zones?.success ? 'ok' : 'skip'
        }, квесты ${quests?.count ?? 0}`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setMessage(`Ошибка при сидировании: ${errorMessage}`)
    } finally {
      setBusyAction(null)
    }
  }

  const navigationActions: QuickAction[] = [
    {
      id: 'prologue',
      icon: <FileText className="h-5 w-5" />,
      label: 'Начать историю',
      description: 'Перейти в пролог',
      route: Routes.PROLOGUE,
    },
    {
      id: 'qr',
      icon: <QrCode className="h-5 w-5" />,
      label: 'Сканировать код локации',
      description: 'Открыть сканер QR',
      route: Routes.QR_SCANNER,
    },
    {
      id: 'map',
      icon: <Map className="h-5 w-5" />,
      label: 'Открыть игровую карту',
      route: Routes.MAP,
    },
    {
      id: 'quests',
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Управление заданиями',
      route: Routes.QUESTS,
    },
    {
      id: 'combat',
      icon: <Sword className="h-5 w-5" />,
      label: 'Карточная боевая система',
      route: Routes.COMBAT,
    },
    {
      id: 'inventory',
      icon: <Package className="h-5 w-5" />,
      label: 'Управление предметами',
      route: Routes.INVENTORY,
    },
    {
      id: 'character',
      icon: <User className="h-5 w-5" />,
      label: 'Параметры персонажа',
      route: Routes.CHARACTER,
    },
    {
      id: 'settings',
      icon: <Settings className="h-5 w-5" />,
      label: 'Параметры игры',
      route: Routes.SETTINGS,
    },
    {
      id: 'devtools',
      icon: <Sparkles className="h-5 w-5" />,
      label: 'DevTools',
      description: 'Панель QA и сиды данных',
      route: Routes.DEVTOOLS,
    },
  ]

  const accountActions: QuickAction[] = [
    {
      id: 'create-admin',
      icon: <ShieldCheck className="h-5 w-5" />,
      label: 'Создать админ-аккаунт',
      description: 'Admin QA + авто-свитч',
      onClick: () => void handleCreateAccount('admin'),
      busyId: 'create-admin',
    },
    {
      id: 'create-player',
      icon: <UserPlus className="h-5 w-5" />,
      label: 'Создать обычный аккаунт',
      description: 'Гостевой игрок + свитч',
      onClick: () => void handleCreateAccount('player'),
      busyId: 'create-player',
    },
    {
      id: 'reset',
      icon: <RefreshCw className="h-5 w-5" />,
      label: 'Сбросить прогресс',
      description: 'Очистить текущий аккаунт',
      onClick: () => void handleResetProgress(),
      busyId: 'reset',
    },
    {
      id: 'seed',
      icon: <Database className="h-5 w-5" />,
      label: 'Сид всех данных DevTools',
      description: 'Точки, safe zones, квесты',
      onClick: () => void handleSeedAll(),
      busyId: 'seed',
    },
  ]

  const renderActionButton = (action: QuickAction, index: number) => {
    const isBusy = !!action.busyId && busyAction !== null && busyAction !== action.busyId
    return (
      <MotionContainer key={action.id} direction="right" delay={0.05 * index} className="contents">
        <button
          onClick={() => {
            if (action.onClick) return action.onClick()
            if (action.route) return navigate(action.route)
          }}
          disabled={isBusy}
          className={cn(
            'flex items-center gap-3 rounded-lg border border-[color:var(--color-border-strong)]/60',
            'bg-[color:var(--color-surface-elevated)] p-4 text-left transition-all duration-200',
            'hover:border-[color:var(--color-cyan)]/70 hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-cyan)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cyan)] focus-visible:ring-offset-2',
            (busyAction && action.busyId === busyAction) || isBusy ? 'opacity-70' : ''
          )}
        >
          <div className="shrink-0 text-[color:var(--color-cyan)]">{action.icon}</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-[color:var(--color-text)]">
              {action.label}
            </div>
            {action.description && (
              <div className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                {action.description}
              </div>
            )}
          </div>
        </button>
      </MotionContainer>
    )
  }

  return (
    <MotionContainer className={cn('glass-panel p-6', className)} direction="fade" delay={0.2}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">БЫСТРЫЕ ДЕЙСТВИЯ</h3>
          <p className="text-xs text-[color:var(--color-text-secondary)]">
            Активный аккаунт: {shortDeviceId(activeDeviceId)} ({accounts.find((a) => a.deviceId === activeDeviceId)?.role ?? 'player'})
          </p>
        </div>
        <span className="font-mono text-xs text-[color:var(--color-text-secondary)]">{currentTime}</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {accountActions.map((action, index) => renderActionButton(action, index))}
      </div>

      <div className="mt-4 rounded-lg border border-[color:var(--color-border)]/60 bg-[color:var(--color-surface)]/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[color:var(--color-text)]">Отслеживание и переключение</span>
          <span className="text-xs font-mono text-[color:var(--color-text-secondary)]">
            {accounts.length} аккаунт(ов)
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {accounts.length === 0 ? (
            <span className="text-xs text-[color:var(--color-text-secondary)]">
              Нет сохраненных аккаунтов
            </span>
          ) : (
            accounts.map((acc) => (
              <button
                key={acc.deviceId}
                onClick={() => handleSwitchAccount(acc.deviceId)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-all',
                  acc.deviceId === activeDeviceId
                    ? 'border-[color:var(--color-cyan)]/80 bg-[color:var(--color-cyan)]/10 text-[color:var(--color-cyan)]'
                    : 'border-[color:var(--color-border)]/70 text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]'
                )}
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>{acc.role === 'admin' ? 'Админ' : 'Игрок'}</span>
                <span className="font-mono">{shortDeviceId(acc.deviceId)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {navigationActions.map((action, index) => renderActionButton(action, index + accountActions.length))}
      </div>

      {message && (
        <div className="mt-4 rounded border border-[color:var(--color-border)]/60 bg-[color:var(--color-surface)]/60 p-3 text-xs font-mono text-[color:var(--color-text-secondary)]">
          {message}
        </div>
      )}
    </MotionContainer>
  )
}
