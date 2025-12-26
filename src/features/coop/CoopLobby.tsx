import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Scanner } from '@yudiel/react-qr-scanner'
import QRCode from 'react-qr-code'
import { Button } from '@/shared/ui/components/Button'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { Badge } from '@/shared/ui/components/Badge'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { cn } from '@/shared/lib/utils/cn'
import { useMyPlayer } from '@/shared/hooks/useMyPlayer'
import { Routes } from '@/shared/lib/utils/navigation'
import type { CoopRoleId } from '@/shared/types/coop'
import { COOP_CHARACTERS, formatLoadoutItem } from './model/characters'
import { useCoopStore } from './model/store'

function normalizeCoopCode(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const directMatch = trimmed.match(/^[a-z0-9]{4}$/i)
  if (directMatch) return trimmed.toUpperCase()

  const schemeMatch = trimmed.match(/^(?:gw3:)?coop:([a-z0-9]{4})$/i)
  if (schemeMatch?.[1]) return schemeMatch[1].toUpperCase()

  try {
    const url = new URL(trimmed)
    const code =
      url.searchParams.get('code') ??
      url.searchParams.get('room') ??
      url.searchParams.get('roomCode') ??
      url.searchParams.get('invite')
    if (code) {
      const normalized = normalizeCoopCode(code)
      if (normalized) return normalized
    }

    const pathMatch = url.pathname.match(/\/coop\/([a-z0-9]{4})(?:\/|$)/i)
    if (pathMatch?.[1]) return pathMatch[1].toUpperCase()
  } catch {
    // ignore
  }

  return null
}

function initialLetter(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed[0]?.toUpperCase() ?? '?'
}

export const CoopLobby: React.FC = () => {
  const navigate = useNavigate()
  const myPlayerQuery = useMyPlayer()
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    room,
    isLoading,
    isUpdating,
    error,
    clearError,
    createRoom,
    joinRoom,
    selectRole,
    leaveRoom,
    startGame,
  } = useCoopStore()

  const mode = searchParams.get('mode')
  const codeParam = searchParams.get('code')
  const [joinCodeDraft, setJoinCodeDraft] = useState<string>(codeParam ?? '')
  const [isScannerOpen, setScannerOpen] = useState(false)
  const lastAutoJoinCode = useRef<string | null>(null)

  const myId = (myPlayerQuery.data as any)?.player?.id as number | undefined
  const isProfileReady = Boolean(myId)

  useEffect(() => {
    if (!codeParam) return
    const normalized = normalizeCoopCode(codeParam)
    if (!normalized) return
    if (room?.code === normalized) return
    if (!isProfileReady) return
    if (isLoading) return

    if (lastAutoJoinCode.current === normalized) return
    lastAutoJoinCode.current = normalized

    setJoinCodeDraft(normalized)
    joinRoom(normalized).catch(() => {
      // errors are exposed via the store
    })
  }, [codeParam, isLoading, isProfileReady, joinRoom, room?.code])

  useEffect(() => {
    if (!room) return
    if (room.status !== 'active') return
    navigate(`${Routes.VISUAL_NOVEL}/coop_briefing_intro`, { replace: true })
  }, [navigate, room])

  const setMode = useCallback(
    (nextMode: 'create' | 'join' | null) => {
      const params = new URLSearchParams(searchParams)
      if (nextMode) {
        params.set('mode', nextMode)
      } else {
        params.delete('mode')
      }
      params.delete('code')
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const handleJoin = useCallback(async () => {
    if (!isProfileReady) return
    const normalized = normalizeCoopCode(joinCodeDraft)
    if (!normalized) return
    await joinRoom(normalized)
  }, [isProfileReady, joinCodeDraft, joinRoom])

  const handleScan = useCallback(
    async (raw: string) => {
      if (!raw) return
      const normalized = normalizeCoopCode(raw)
      if (!normalized) return
      if (!isProfileReady) return
      if (isLoading) return
      if (room?.code === normalized) return

      setJoinCodeDraft(normalized)
      await joinRoom(normalized)
    },
    [isLoading, isProfileReady, joinRoom, room?.code]
  )

  const myParticipant = useMemo(() => {
    if (!room || !myId) return undefined
    return room.participants.find((p) => p.id === myId)
  }, [myId, room])

  const myRole = (myParticipant?.role ?? null) as CoopRoleId | null
  const amHost = Boolean(room && myId && room.hostId === myId)

  const pickedRoles = useMemo(() => {
    if (!room) return []
    return room.participants.map((p) => p.role).filter(Boolean) as string[]
  }, [room])

  const allPicked = room ? room.participants.length > 0 && room.participants.every((p) => Boolean(p.role)) : false
  const allReady = room ? room.participants.length > 0 && room.participants.every((p) => Boolean(p.ready)) : false
  const uniqueRoles = room ? new Set(pickedRoles).size === pickedRoles.length : false
  const canStart = Boolean(room && amHost && room.participants.length >= 2 && allPicked && allReady && uniqueRoles)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center space-y-2">
            <Heading level={1} className="text-4xl text-cyan-400">
              Совместная игра
            </Heading>
            <Text variant="muted">Создай команду и поделись кодом — или присоединись по QR/коду.</Text>
          </div>

          {!mode && (
            <div className="grid gap-3">
              <Button size="lg" variant="primary" onClick={() => setMode('create')} disabled={!isProfileReady}>
                Создать команду
              </Button>
              <Button size="lg" variant="outline" onClick={() => setMode('join')} disabled={!isProfileReady}>
                Присоединиться
              </Button>
              {!isProfileReady && <div className="text-center text-xs text-slate-400">Создаём профиль игрока…</div>}
            </div>
          )}

          {mode === 'create' && (
            <div className="glass-panel p-6 border border-white/5 space-y-4">
              <Heading level={3}>Создать команду</Heading>
              <Text variant="muted" size="sm">
                После создания покажи QR-код/код друзьям. Потом вы выберете персонажей.
              </Text>
              <div className="grid gap-3">
                <Button size="lg" variant="primary" onClick={() => createRoom()} disabled={!isProfileReady}>
                  Создать
                </Button>
                <Button variant="ghost" onClick={() => setMode(null)}>
                  Назад
                </Button>
              </div>
            </div>
          )}

          {mode === 'join' && (
            <div className="glass-panel p-6 border border-white/5 space-y-4">
              <Heading level={3}>Присоединиться</Heading>

              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.24em] text-slate-500">Код команды</label>
                <input
                  type="text"
                  value={joinCodeDraft}
                  onChange={(e) => {
                    clearError()
                    setJoinCodeDraft(e.target.value.toUpperCase())
                  }}
                  placeholder="ABCD"
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-center text-3xl font-mono tracking-widest focus:border-cyan-500 outline-none transition-colors"
                  maxLength={64}
                  inputMode="text"
                  autoCapitalize="characters"
                />
                <Button size="lg" variant="primary" onClick={handleJoin} disabled={!isProfileReady || !normalizeCoopCode(joinCodeDraft)}>
                  Войти
                </Button>
              </div>

              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <Text size="sm" variant="muted">
                    Или сканируй QR-код
                  </Text>
                  <Button variant="outline" onClick={() => setScannerOpen((prev) => !prev)} disabled={!isProfileReady}>
                    {isScannerOpen ? 'Скрыть' : 'Сканировать'}
                  </Button>
                </div>

                {isScannerOpen && (
                  <div className="mt-4 w-full aspect-square border border-cyan-500/40 rounded-2xl overflow-hidden">
                    <Scanner
                      onScan={(detectedCodes) => detectedCodes[0] && handleScan(detectedCodes[0].rawValue)}
                      onError={() => {
                        // ignore
                      }}
                    />
                  </div>
                )}
              </div>

              <Button variant="ghost" onClick={() => setMode(null)}>
                Назад
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-4 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="space-y-1">
            <Heading level={2} className="text-cyan-400">
              Команда: {room.code}
            </Heading>
            <Text variant="muted" size="sm">
              Выберите персонажей. 2 игрока за одного персонажа играть не могут.
            </Text>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => leaveRoom()}>
              Выйти
            </Button>
            {amHost ? (
              <Button variant="primary" onClick={() => startGame()} disabled={!canStart}>
                Начать
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                Ожидаем хоста
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel p-5 border border-white/5 space-y-4">
              <Heading level={4}>Приглашение</Heading>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <Text size="xs" variant="muted">
                    Код
                  </Text>
                  <div className="font-mono text-3xl tracking-widest">{room.code}</div>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(room.code)
                    } catch {
                      // ignore
                    }
                  }}
                >
                  Копировать
                </Button>
              </div>

              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/50 p-4">
                <QRCode value={room.code} size={220} bgColor="transparent" fgColor="#67e8f9" />
              </div>

              <Text size="xs" variant="muted" className="text-center">
                Пусть игроки откроют «Присоединиться» и отсканируют QR или введут код.
              </Text>
            </div>

            <div className="glass-panel p-5 border border-white/5 space-y-3">
              <Heading level={4}>Игроки</Heading>
              <div className="space-y-2">
                {room.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold shrink-0">
                        {initialLetter(p.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.role ? p.role.toUpperCase() : 'без персонажа'}</div>
                      </div>
                    </div>
                    <Badge variant={p.ready ? 'glow' : 'outline'} className="shrink-0">
                      {p.ready ? 'ГОТОВ' : 'ВЫБИРАЕТ'}
                    </Badge>
                  </div>
                ))}
              </div>

              {!canStart && (
                <Text size="xs" variant="muted">
                  {room.participants.length < 2
                    ? 'Нужно минимум 2 игрока.'
                    : !allPicked
                      ? 'Не все выбрали персонажа.'
                      : !uniqueRoles
                        ? 'Есть конфликт выбора персонажа.'
                        : 'Ожидаем подтверждения игроков.'}
                </Text>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <Heading level={4}>Выбор персонажа</Heading>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COOP_CHARACTERS.map((character) => {
                const occupant = room.participants.find((p) => p.role === character.id) ?? null
                const isMine = myRole === character.id
                const isTaken = Boolean(occupant && !isMine)

                return (
                  <button
                    key={character.id}
                    onClick={() => selectRole(character.id)}
                    disabled={!myId || isUpdating || isTaken}
                    className={cn(
                      'relative text-left rounded-2xl border bg-white/5 transition',
                      'border-white/10 hover:border-cyan-500/50 hover:bg-white/10',
                      'active:scale-[0.99]',
                      isMine && 'border-cyan-500 bg-cyan-500/10',
                      isTaken && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {occupant && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div
                          className={cn(
                            'h-7 w-7 rounded-full border flex items-center justify-center text-xs font-bold',
                            isMine ? 'bg-cyan-500/90 border-cyan-300 text-black' : 'bg-gray-900 border-white/15 text-white'
                          )}
                          title={occupant.name}
                        >
                          {initialLetter(occupant.name)}
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        'h-20 rounded-t-2xl overflow-hidden border-b border-white/10 bg-gradient-to-br',
                        character.accentClass
                      )}
                    >
                      <img
                        src={character.portraitUrl}
                        alt={character.title}
                        className="h-full w-full object-cover object-top opacity-90"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{character.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{character.subtitle}</div>
                      </div>

                      <div className="space-y-1">
                        {character.loadout.slice(0, 4).map((entry) => (
                          <div key={`${character.id}:${entry.itemId}`} className="text-[11px] text-slate-300">
                            {formatLoadoutItem(entry.itemId, entry.qty)}
                          </div>
                        ))}
                      </div>

                      <div className="pt-1">
                        {isMine ? <Badge variant="glow">ТВОЙ</Badge> : isTaken ? <Badge variant="outline">ЗАНЯТО</Badge> : <Badge variant="outline">ВЫБРАТЬ</Badge>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

