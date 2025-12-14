import React, { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { authenticatedClient } from '@/shared/api/client'
import { Button } from '@/shared/ui/components/Button'
import { Text } from '@/shared/ui/components/Text'
import { Heading } from '@/shared/ui/components/Heading'
import { CoopBattleScreen } from '@/features/coop'
import { COOP_ROLES, type CoopRoleId } from '@/shared/types/coop'
import { PARLIAMENT_VOICES } from '@/shared/types/parliament'

type Role = CoopRoleId

const CoopPage: React.FC = () => {
  const { roomCode: paramCode } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getToken, isLoaded, isSignedIn, userId } = useAuth()

  const [roomCode, setRoomCode] = useState(() => paramCode?.toUpperCase() ?? '')
  const [activeRoom, setActiveRoom] = useState(() => paramCode?.toUpperCase() ?? '')
  const [role, setRole] = useState<Role>('body')

  const roleIds: Role[] = ['body', 'mind', 'social']
  const activeRoleDef = COOP_ROLES[role]

  const roomQuery = useQuery({
    queryKey: ['coop-room', activeRoom],
    enabled: isLoaded && isSignedIn && Boolean(activeRoom),
    refetchInterval: 3000,
    queryFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.coop.rooms({ code: activeRoom }).get()
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      if (!(data as any).room) throw new Error('Room not found')
      return (data as any).room
    },
  })

  const createRoom = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.coop.rooms.post({ role })
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      if (!(data as any).room) throw new Error('Room not created')
      return (data as any).room
    },
    onSuccess: (room) => {
      setActiveRoom(room.code)
      navigate(`/coop/${room.code}`)
      queryClient.invalidateQueries({ queryKey: ['coop-room', room.code] })
    },
  })

  const joinRoom = useMutation({
    mutationFn: async (code: string) => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.coop.rooms({ code: code.toUpperCase() }).join.post({ role })
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      if (!(data as any).room) throw new Error('Room not found')
      return (data as any).room
    },
    onSuccess: (room) => {
      setActiveRoom(room.code)
      navigate(`/coop/${room.code}`)
      queryClient.invalidateQueries({ queryKey: ['coop-room', room.code] })
    },
  })

  const leaveRoom = useMutation({
    mutationFn: async () => {
      if (!activeRoom) return null
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.coop.rooms({ code: activeRoom }).leave.post()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setActiveRoom('')
      navigate('/coop')
      queryClient.invalidateQueries()
    },
  })

  const readyToggle = useMutation({
    mutationFn: async (ready: boolean) => {
      if (!activeRoom) return null
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.coop.rooms({ code: activeRoom }).ready.post({ ready })
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      if (!(data as any).room) throw new Error('Room not found')
      return (data as any).room
    },
    onSuccess: (room) => {
      queryClient.setQueryData(['coop-room', activeRoom], room)
    },
  })

  const startRoom = useMutation({
    mutationFn: async () => {
      if (!activeRoom) return null
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.coop.rooms({ code: activeRoom }).start.post()
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      if (!(data as any).room) throw new Error('Room not found')
      return (data as any).room
    },
    onSuccess: (room) => {
      queryClient.setQueryData(['coop-room', activeRoom], room)
    },
  })

  const meReady = useMemo(() => {
    if (!roomQuery.data || !userId) return false
    return roomQuery.data.players.some((p: any) => p.id === userId && p.ready)
  }, [roomQuery.data, userId])

  const everyoneReady = useMemo(() => {
    if (!roomQuery.data) return false
    return roomQuery.data.players.length > 0 && roomQuery.data.players.every((p: any) => p.ready)
  }, [roomQuery.data])

  const handleJoin = useCallback(
    (code?: string) => {
      if (!code) return
      joinRoom.mutate(code)
    },
    [joinRoom]
  )

  // If room exists and coop already started, show the shared quest instead of lobby.
  if (activeRoom && roomQuery.data?.status === 'in_progress') {
    return <CoopBattleScreen roomCode={activeRoom} />
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-3">
          <Heading level={2}>Co-op requires sign-in</Heading>
          <Text variant="muted" size="sm">
            Please sign in to create or join a local co-op room.
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6 gap-6">
      <div className="max-w-3xl w-full space-y-3 text-center">
        <Heading level={2}>Local Co-op (LCSD)</Heading>
        <Text variant="muted" size="sm">
          Создайте комнату, распределите роли BODY / MIND / SOCIAL и проходите совместный сюжет, принимая решения из
          разных позиций одного отряда.
        </Text>
      </div>

      <div className="w-full max-w-3xl grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <Heading level={4}>Создать комнату</Heading>
          <div className="flex gap-2 items-center">
            <label className="text-sm text-white/70">Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-gray-900 border border-white/10 rounded px-3 py-2 text-sm"
            >
              {roleIds.map((id) => (
                <option key={id} value={id}>
                  {COOP_ROLES[id].label} · {COOP_ROLES[id].nameRu}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 text-left">
            <Text variant="muted" size="sm">
              {activeRoleDef.description}
            </Text>
            <Text variant="muted" size="xs">
              Стиль: {activeRoleDef.playstyleHint}
            </Text>
            <Text variant="muted" size="xs">
              Ключевые голоса:{' '}
              {activeRoleDef.focusVoices
                .map((id) => PARLIAMENT_VOICES[id]?.nameRu ?? id)
                .join(', ')}
            </Text>
          </div>
          <Button variant="primary" onClick={() => createRoom.mutate()} disabled={createRoom.isPending}>
            {createRoom.isPending ? 'Создание…' : 'Создать комнату'}
          </Button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <Heading level={4}>Присоединиться к комнате</Heading>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Код комнаты"
            className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Button variant="secondary" onClick={() => handleJoin(roomCode)} disabled={joinRoom.isPending}>
            {joinRoom.isPending ? 'Подключение…' : 'Войти по коду'}
          </Button>
        </div>
      </div>

      {activeRoom && (
        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading level={4}>Комната {activeRoom}</Heading>
              <Text variant="muted" size="sm">
                {roomQuery.data?.status === 'in_progress' ? 'Сцена квеста запущена' : 'Лобби'}
              </Text>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => readyToggle.mutate(!meReady)}>
                {meReady ? 'Готов' : 'Отметить «готов»'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => startRoom.mutate()}
                disabled={!everyoneReady || startRoom.isPending}
              >
                Начать совместный квест
              </Button>
              <Button variant="secondary" onClick={() => leaveRoom.mutate()}>
                Выйти
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            {roomQuery.isLoading && <Text variant="muted">Обновление информации о комнате…</Text>}
            {roomQuery.data?.players?.map((p: any) => {
              const playerRole = p.role as Role | undefined
              const def = playerRole ? COOP_ROLES[playerRole] : undefined
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{p.id}</span>
                    <span className="text-xs text-white/60">
                      {def ? `${def.label} · ${def.nameRu}` : 'Роль не выбрана'}
                    </span>
                  </div>
                  <span className={`text-xs ${p.ready ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {p.ready ? 'Готов' : 'Ждём'}
                  </span>
                </div>
              )
            })}
            {!roomQuery.data && !roomQuery.isLoading && (
              <Text variant="muted" size="sm">
                Информация о комнате недоступна.
              </Text>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CoopPage
