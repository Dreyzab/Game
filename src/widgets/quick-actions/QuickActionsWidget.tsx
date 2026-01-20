import React, { useEffect, useState } from 'react'
import { SignInButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Database, FileText, Map, Package, QrCode, RefreshCw, Settings, User, UserPlus, Users } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { MotionContainer } from '@/shared/ui/components/MotionContainer'
import { Routes } from '@/shared/lib/utils/navigation'
import { cn } from '@/shared/lib/utils/cn'
import { generateDeviceId, getDeviceId, setDeviceId } from '@/shared/lib/utils/deviceId'
import { isClerkEnabled, useAppAuth } from '@/shared/auth'
import { API_BASE_URL, authenticatedClient } from '@/shared/api/client'

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
  onClick?: () => void | Promise<void>
  busyId?: string
}

// Явно захардкоженный админ-токен (по просьбе: без "безопасности")
const ADMIN_TOKEN_STORAGE_KEY = 'grezwanderer_admin_token'

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
      .filter((entry) => entry && typeof entry.deviceId === 'string' && (entry.role === 'admin' || entry.role === 'player'))
      .map((entry) => ({
        deviceId: entry.deviceId,
        role: entry.role,
        label: typeof entry.label === 'string' ? entry.label : entry.role === 'admin' ? 'Админ' : 'Игрок',
        createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now(),
        lastUsedAt: typeof entry.lastUsedAt === 'number' ? entry.lastUsedAt : undefined,
      })) as StoredAccount[]
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
  const { signOut, isSignedIn, isLoaded: isAuthLoaded, user, getToken } = useAppAuth()
  const queryClient = useQueryClient()
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => readStoredAccounts())
  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => getDeviceId())
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  const getOrAskAdminToken = (): string | undefined => {
    if (typeof window === 'undefined') return undefined

    try {
      const existing = (localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? '').trim()
      if (existing) return existing
    } catch {
      // ignore
    }

    if (!import.meta.env.DEV) return undefined

    // Prompt removed for compatibility. Admin token must be set manually in localStorage if needed.
    return undefined
  }

  const callAdminReset = async (kind: 'all' | 'multiplayer' | 'seed') => {
    const apiBaseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

    const token = isClerkEnabled ? await getToken() : undefined
    const adminToken = getOrAskAdminToken()

    const endpoints = {
      all: '/admin/db/reset-all',
      multiplayer: '/admin/db/reset-multiplayer',
      seed: '/admin/db/seed',
    }
    const endpoint = endpoints[kind] || endpoints.multiplayer
    const url = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, '')}${endpoint}` : endpoint
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
    }
    if (adminToken) headers['x-admin-token'] = adminToken
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: '{}',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || (data as any)?.ok !== true) {
      const err = (data as any)?.error ? String((data as any).error) : `HTTP ${res.status}`
      throw new Error(err)
    }
    return data
  }

  const currentTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })

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
            role: 'player' as const,
            label: 'Игрок',
            createdAt: Date.now(),
          },
          ...base,
        ]
      persistAccounts(next)
      return next
    })
  }, [])

  const setActive = (deviceId: string, role: 'admin' | 'player', label?: string) => {
    const profile: StoredAccount = {
      deviceId,
      role,
      label: label ?? (role === 'admin' ? 'Админ' : 'Игрок'),
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    }
    setDeviceId(deviceId)
    setActiveDeviceId(deviceId)
    setAccounts((prev) => {
      const next = upsertAccount(prev, profile)
      persistAccounts(next)
      return next
    })
  }

  const resetSelfProgress = async () => {
    const ok = window.confirm('Сбросить ВАШ прогресс и инвентарь? Это действие необратимо.')
    if (!ok) return
    // Prompt removed for compatibility

    try {
      const token = isClerkEnabled ? await getToken() : undefined
      const client = authenticatedClient(token ?? undefined, getDeviceId()) as any
      const { data, error } = await client.player['reset-self'].post()
      if (error) throw error
      const payload = (data ?? {}) as any
      if (payload.ok !== true) throw new Error(payload.error ?? 'Reset failed')
      setMessage('Ваш прогресс сброшен. Перезагружаю страницу...')
      setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      console.error(e)
      setMessage('Не удалось сбросить прогресс. Проверьте соединение с сервером.')
    }
  }

  const pingDatabase = async () => {
    if (isClerkEnabled && !isAuthLoaded) {
      setMessage('Auth loading... try again in a moment.')
      return
    }

    try {
      const token = isClerkEnabled ? await getToken() : undefined
      const client = authenticatedClient(token ?? undefined, getDeviceId()) as any
      const { data, error } = await client.player.get()
      if (error) throw error
      const payload = (data ?? {}) as any
      if (payload?.error) throw new Error(payload.error)

      const playerName = payload?.player?.name ?? payload?.player?.nickname ?? 'Player'
      const questsCount = typeof payload?.totalQuests === 'number' ? payload.totalQuests : null
      const details = questsCount !== null ? ` | quests: ${questsCount}` : ''
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myPlayer'] }),
        queryClient.invalidateQueries({ queryKey: ['myQuests'] }),
      ])
      setMessage(`DB ok: ${playerName}${details}`)
    } catch (error) {
      console.error('[QuickActions] DB check failed', error)
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const actions: QuickAction[] = [
    { id: 'home', icon: <User className="w-4 h-4" />, label: 'Домой', route: Routes.HOME },
    { id: 'map', icon: <Map className="w-4 h-4" />, label: 'Карта', route: Routes.MAP },
    { id: 'inv', icon: <Package className="w-4 h-4" />, label: 'Инвентарь', route: Routes.INVENTORY },
    { id: 'quests', icon: <FileText className="w-4 h-4" />, label: 'Квесты', route: Routes.QUESTS },
    { id: 'db-ping', icon: <Database className="w-4 h-4" />, label: 'DB Sync', onClick: pingDatabase, busyId: 'db-ping' },
    { id: 'vn', icon: <BookOpen className="w-4 h-4" />, label: 'VN', route: Routes.VISUAL_NOVEL },
    { id: 'coop', icon: <Users className="w-4 h-4" />, label: 'CO-OP', route: Routes.COOP },
    { id: 'qr', icon: <QrCode className="w-4 h-4" />, label: 'QR Scan', route: Routes.QR_SCANNER },
    { id: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Настройки', route: Routes.SETTINGS },
  ]

  const adminActions: QuickAction[] = [
    {
      id: 'regen-device',
      icon: <RefreshCw className="w-4 h-4" />,
      label: 'Новый deviceId',
      description: 'Сгенерировать новый deviceId и сохранить',
      onClick: () => {
        const newId = generateDeviceId()
        setActive(newId, 'player', 'Игрок')
        setMessage(`Новый deviceId: ${newId}`)
      },
    },
    {
      id: 'admin-label',
      icon: <UserPlus className="w-4 h-4" />,
      label: 'Сделать админом',
      onClick: () => {
        const id = getDeviceId()
        setActive(id, 'admin', 'Админ')
        setMessage(`Текущий deviceId отмечен как админ: ${shortDeviceId(id)}`)
      },
    },
    {
      id: 'db-reset-mp',
      icon: <RefreshCw className="w-4 h-4" />,
      label: 'Сбросить мультиплеер',
      description: 'Очистить coop/resonance + runtime (presence/pvp)',
      busyId: 'db-reset-mp',
      onClick: async () => {
        const ok = window.confirm('Сбросить только мультиплеерные данные? Это удалит coop/resonance сессии и очистит runtime.')
        if (!ok) return

        const result = await callAdminReset('multiplayer')
        setMessage(`Мультиплеер сброшен. ${JSON.stringify((result as any)?.result ?? {})}`)
      },
    },
    {
      id: 'db-reset-all',
      icon: <RefreshCw className="w-4 h-4" />,
      label: 'Сбросить БД (ВСЁ)',
      description: 'Полный TRUNCATE всех таблиц (кроме __drizzle_migrations)',
      busyId: 'db-reset-all',
      onClick: async () => {
        const ok = window.confirm('ПОЛНЫЙ СБРОС БД. Это удалит ВСЕ данные. Продолжить?')
        if (!ok) return

        const result = await callAdminReset('all')
        setMessage(`БД очищена. ${JSON.stringify((result as any)?.result ?? {})}. Обновляю страницу...`)
        setTimeout(() => window.location.reload(), 800)
      },
    },
    {
      id: 'db-seed',
      icon: <Package className="w-4 h-4" />,
      label: 'Запустить RESEED',
      description: 'Заполнить БД базовыми данными (точки, предметы)',
      busyId: 'db-seed',
      onClick: async () => {
        const result = await callAdminReset('seed')
        setMessage(`Ресид выполнен успешно! Статистика: ${JSON.stringify((result as any)?.stats ?? {})}`)
      },
    },
  ]

  const handleNavigate = (route?: string, onClick?: () => void | Promise<void>, busyId?: string) => async () => {
    if (busyId) setBusyAction(busyId)
    try {
      if (onClick) await onClick()
      if (route) navigate(route)
    } catch (error) {
      console.error('[QuickActions] Action failed', error)
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      if (busyId) setBusyAction(null)
    }
  }

  return (
    <MotionContainer
      className={cn('glass-panel p-4 shadow-xl border border-white/5', className)}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Quick Actions</div>
          <div className="text-sm text-slate-300">Время: {currentTime}</div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>Active: {shortDeviceId(activeDeviceId)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={handleNavigate(action.route, action.onClick, action.busyId)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors',
              busyAction === action.busyId && 'opacity-60 pointer-events-none'
            )}
          >
            <span className="text-sm text-white">{action.icon}</span>
            <span className="text-[11px] text-slate-200 font-semibold text-center leading-tight">{action.label}</span>
            {action.description && <span className="text-[10px] text-slate-400 text-center">{action.description}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Авторизация</div>
          <div className="text-xs text-slate-400">
            {isAuthLoaded
              ? isSignedIn
                ? `В сети: ${user?.fullName ?? user?.email ?? user?.username ?? (isClerkEnabled ? 'Clerk' : 'Гость')}`
                : isClerkEnabled
                  ? 'Не в сети'
                  : 'Гость'
              : 'Проверка...'}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {isClerkEnabled ? (
            isSignedIn ? (
              <button className="btn btn--secondary btn--full-width" disabled>
                Войти через Clerk
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="btn btn--secondary btn--full-width" disabled={!isAuthLoaded}>
                  Войти через Clerk
                </button>
              </SignInButton>
            )
          ) : (
            <button className="btn btn--secondary btn--full-width" disabled title="Clerk отключён (режим гостя)">
              Гостевой режим
            </button>
          )}
          <button
            className="btn btn--secondary btn--full-width"
            onClick={() => {
              if (!isClerkEnabled) return
              signOut({ redirectUrl: '/' })
              setMessage('Вы вышли из Clerk')
            }}
            disabled={!isClerkEnabled || !isAuthLoaded || !isSignedIn}
          >
            Выйти
          </button>
        </div>
        {!isAuthLoaded && isClerkEnabled && (
          <div className="mt-2 text-[11px] text-slate-500">
            Если это «Проверка...» не проходит — проверь `VITE_CLERK_PUBLISHABLE_KEY` и доступ к доменам Clerk (adblock/файрвол).
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-2">Управление аккаунтами (deviceId)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleNavigate(undefined, () => {
              const newId = generateDeviceId()
              setActive(newId, 'player', 'Игрок')
              setMessage(`Создан новый deviceId: ${newId}`)
            })}
            className="btn btn--secondary btn--full-width"
          >
            Новый deviceId
          </button>
          <button
            onClick={handleNavigate(undefined, () => {
              const id = getDeviceId()
              setActive(id, 'admin', 'Админ')
              setMessage(`Текущий deviceId отмечен как админ: ${shortDeviceId(id)}`)
            })}
            className="btn btn--secondary btn--full-width"
          >
            Сделать текущий админом
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-2">Личные действия</div>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={handleNavigate(undefined, resetSelfProgress, 'reset-self')}
            className="btn btn--secondary btn--full-width"
          >
            Сбросить мой прогресс
          </button>
          <div className="text-[11px] text-slate-500">
            Удалит ваш прогресс/инвентарь/логи/VN, выйдет из кооп-комнат и вернёт стартовый сценарий.
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-3 text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-500/40 rounded-lg px-3 py-2">
          {message}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-2">Сохранённые аккаунты</div>
        <div className="space-y-2">
          {accounts.length === 0 && <div className="text-sm text-slate-500">Нет сохранённых профилей.</div>}
          {accounts.map((acc) => (
            <div
              key={acc.deviceId}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm"
            >
              <div className="flex flex-col">
                <span className="text-white">{acc.label} · {acc.role}</span>
                <span className="text-slate-400 text-xs">{shortDeviceId(acc.deviceId)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-xs text-sky-300 hover:text-sky-200 underline"
                  onClick={handleNavigate(undefined, () => {
                    setActive(acc.deviceId, acc.role, acc.label)
                    setMessage(`Активирован ${acc.label}: ${shortDeviceId(acc.deviceId)}`)
                  })}
                >
                  Активировать
                </button>
                <button
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                  onClick={() => {
                    setAccounts((prev) => {
                      const next = prev.filter((p) => p.deviceId !== acc.deviceId)
                      persistAccounts(next)
                      return next
                    })
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-2">Админ действия</div>
        <div className="grid grid-cols-2 gap-2">
          {import.meta.env.DEV && adminActions.map((action) => (
            <button
              key={action.id}
              onClick={handleNavigate(undefined, action.onClick, action.busyId)}
              className="btn btn--secondary btn--full-width"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

    </MotionContainer>
  )
}
