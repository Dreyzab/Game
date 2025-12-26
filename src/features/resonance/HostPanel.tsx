import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authenticatedClient } from '@/shared/api/client'
import { useAppAuth } from '@/shared/auth'
import type { SceneNode } from '@/shared/types/resonance'
import { Button } from '@/shared/ui/components/Button'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'

type HostPanelProps = {
  initialName?: string
}

export const HostPanel: React.FC<HostPanelProps> = ({ initialName }) => {
  const { getToken } = useAppAuth()
  const queryClient = useQueryClient()
  const [hostName, setHostName] = useState(initialName ?? 'Хост')
  const [sessionCode, setSessionCode] = useState<string>('')

  const sessionQuery = useQuery({
    queryKey: ['resonance-session', sessionCode],
    enabled: Boolean(sessionCode),
    refetchInterval: 3000,
    queryFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.resonance.sessions({ code: sessionCode }).state.get()
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
  })

  const createSession = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.resonance.sessions.post({ hostName })
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return (data as any).session
    },
    onSuccess: (session) => {
      setSessionCode(session.code)
      queryClient.invalidateQueries({ queryKey: ['resonance-session', session.code] })
    },
  })

  const advanceScene = useMutation({
    mutationFn: async (nextSceneId?: string) => {
      if (!sessionCode) return null
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.resonance.sessions({ code: sessionCode }).advance.post({ nextSceneId })
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resonance-session', sessionCode] })
    },
  })

  const toggleBrake = useMutation({
    mutationFn: async (active: boolean) => {
      if (!sessionCode) return null
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.resonance.sessions({ code: sessionCode }).brake.post({ active })
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resonance-session', sessionCode] })
    },
  })

  const scene = useMemo<SceneNode | undefined>(() => sessionQuery.data?.scene?.scene, [sessionQuery.data])
  const session = sessionQuery.data?.session

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Heading level={3}>Хост: управление сессией</Heading>
        <div className="text-sm text-white/70">Статус: {session?.status ?? '—'}</div>
      </div>

      {!sessionCode && (
        <div className="space-y-3">
          <label className="text-sm text-white/80 block">
            Имя хоста
            <input
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
            />
          </label>
          <Button onClick={() => createSession.mutate()} disabled={createSession.isPending}>
            Создать сессию
          </Button>
        </div>
      )}

      {sessionCode && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-lg font-semibold">Код сессии: {sessionCode}</div>
            <Button
              variant="secondary"
              onClick={() => toggleBrake.mutate(session?.status !== 'paused')}
              disabled={toggleBrake.isPending}
            >
              {session?.status === 'paused' ? 'Снять Brake' : 'Поставить Brake'}
            </Button>
          </div>

          {session && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                <Heading level={4}>Игроки</Heading>
                <div className="space-y-1">
                  {session.players.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span>{p.name}</span>
                      <span className="text-white/70">
                        {p.archetype} · ранг {p.rank} · конвикт {p.conviction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                <Heading level={4}>Состояние</Heading>
                <Text size="sm">Strain: {session.strain} · Trust: {session.trust} · Alert: {session.alert ?? 0}</Text>
                <Text size="sm">Сцена: {scene?.title ?? '—'}</Text>
              </div>
            </div>
          )}

          {scene && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
              <Heading level={4}>{scene.title}</Heading>
              <Text>{scene.shared}</Text>
              {scene.options && scene.options.length > 0 && (
                <div className="space-y-2">
                  <Text variant="muted" size="sm">
                    Выборы (для контроля хоста)
                  </Text>
                  <div className="grid gap-2">
                    {scene.options.map((opt) => (
                      <div key={opt.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-2">
                        <div className="text-sm">{opt.text}</div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => advanceScene.mutate(opt.nextScene ?? scene.next)}
                          disabled={advanceScene.isPending}
                        >
                          Форсировать
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {scene.kind !== 'vote' && scene.next && (
                <Button
                  variant="secondary"
                  onClick={() => advanceScene.mutate(scene.next)}
                  disabled={advanceScene.isPending}
                >
                  Дальше
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
