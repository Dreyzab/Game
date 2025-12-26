import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authenticatedClient } from '@/shared/api/client'
import { useAppAuth } from '@/shared/auth'
import type { SceneNode, ResonancePlayer } from '@/shared/types/resonance'
import { Button } from '@/shared/ui/components/Button'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { RESONANCE_ITEMS } from '@/shared/data/resonanceItems'

const archetypes = [
  { id: 'guardian', label: 'Защитник' },
  { id: 'skeptic', label: 'Скептик' },
  { id: 'empath', label: 'Эмпат' },
  { id: 'visionary', label: 'Визионер' },
] as const

type PlayerPanelProps = {
  defaultCode?: string
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({ defaultCode }) => {
  const { deviceId } = useDeviceId()
  const { getToken } = useAppAuth()
  const queryClient = useQueryClient()

  const [code, setCode] = useState(defaultCode ?? '')
  const [activeCode, setActiveCode] = useState(defaultCode ?? '')
  const [name, setName] = useState('Игрок')
  const [archetype, setArchetype] = useState<typeof archetypes[number]['id']>('guardian')

  const sessionQuery = useQuery({
    queryKey: ['resonance-session', activeCode, 'player'],
    enabled: Boolean(activeCode),
    refetchInterval: 2500,
    queryFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { data, error } = await client.resonance.sessions({ code: activeCode }).state.get()
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
  })

  const join = useMutation({
    mutationFn: async () => {
      if (!code) throw new Error('Нужен код сессии')
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { data, error } = await client.resonance.sessions({ code: code.toUpperCase() }).join.post({
        name,
        archetype,
        deviceId,
      })
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
    onSuccess: (data) => {
      setActiveCode(code.toUpperCase())
      queryClient.invalidateQueries({ queryKey: ['resonance-session', code.toUpperCase(), 'player'] })
      if (data?.scene?.scene?.id) {
        // no-op, query will refetch
      }
    },
  })

  const vote = useMutation({
    mutationFn: async (optionId: string) => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { data, error } = await client.resonance.sessions({ code: activeCode }).vote.post({ optionId })
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resonance-session', activeCode, 'player'] })
    },
  })

  const interrupt = useMutation({
    mutationFn: async (payload: { type: 'rebellion' | 'force_next'; targetOptionId?: string }) => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { data, error } = await client.resonance.sessions({ code: activeCode }).interrupt.post(payload)
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resonance-session', activeCode, 'player'] })
    },
  })

  const brake = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { data, error } = await client.resonance.sessions({ code: activeCode }).brake.post({ active: true })
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resonance-session', activeCode, 'player'] })
    },
  })

  const kudos = useMutation({
    mutationFn: async (payload: { toPlayerId: string; tag: string }) => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { data, error } = await client.resonance.sessions({ code: activeCode }).kudos.post(payload)
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resonance-session', activeCode, 'player'] })
    },
  })

  const useItemMut = useMutation({
    mutationFn: async (payload: { itemId: string }) => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { data, error } = await client.resonance.sessions({ code: activeCode })['item-use'].post(payload)
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resonance-session', activeCode, 'player'] })
    },
    onError: (e: any) => {
      // noop, UI will just stay the same
      console.warn('Item use failed', e)
    }
  })

  const scene = useMemo<SceneNode | undefined>(() => sessionQuery.data?.scene?.scene, [sessionQuery.data])
  const injection = sessionQuery.data?.scene?.injection
  const session = sessionQuery.data?.session
  const me: ResonancePlayer | undefined = useMemo(
    () => session?.players.find((p: any) => p.id === (sessionQuery.data as any)?.userId),
    [session, sessionQuery.data]
  )
  const useItemError = useMemo(() => (useItemMut.error as any)?.message ?? undefined, [useItemMut.error])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
      <Heading level={3}>Игрок: личный экран</Heading>

      {!activeCode && (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-white/80 block">
            Код сессии
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder="ABCDE"
            />
          </label>
          <label className="text-sm text-white/80 block">
            Имя
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
            />
          </label>
          <div className="md:col-span-2">
            <div className="text-sm text-white/80 mb-2">Архетип</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {archetypes.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setArchetype(a.id)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    archetype === a.id ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/10 bg-black/30'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => join.mutate()} disabled={join.isPending || !code}>
              Присоединиться
            </Button>
          </div>
        </div>
      )}

      {activeCode && session && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3 grid grid-cols-3 gap-3 text-center text-sm text-white/80">
            <div>
              <div className="text-white font-semibold">{session.strain}</div>
              <div className="text-white/60 text-xs">Strain</div>
            </div>
            <div>
              <div className="text-white font-semibold">{session.trust}</div>
              <div className="text-white/60 text-xs">Trust</div>
            </div>
            <div>
              <div className="text-white font-semibold">{session.alert ?? 0}</div>
              <div className="text-white/60 text-xs">Alert</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Text size="sm" variant="muted">
              Сессия {activeCode} · Статус: {session.status}
            </Text>
            <Button size="sm" variant="secondary" onClick={() => brake.mutate()} disabled={brake.isPending}>
              Brake
            </Button>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
            <Heading level={4}>{scene?.title ?? '—'}</Heading>
            <Text>{scene?.shared ?? 'Ожидание сцены…'}</Text>
            {injection && (
              <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-sm">
                Личная инъекция: {injection}
              </div>
            )}
            {me?.statuses && me.statuses.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs text-white/80">
                {me.statuses.map((s) => (
                  <span key={s} className="rounded-full border border-white/20 px-2 py-1 bg-white/10">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {useItemError && (
              <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-xs text-rose-100">
                Ошибка предмета: {String(useItemError)}
              </div>
            )}
          </div>

          {me?.items && me.items.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
              <Heading level={4}>Инвентарь</Heading>
              <div className="grid md:grid-cols-2 gap-2">
                {me.items.map((inst) => {
                  const item = RESONANCE_ITEMS[inst.id]
                  const cooldown = inst.data?.cooldown ?? 0
                  return (
                    <div key={inst.id} className="rounded-lg border border-white/10 bg-black/20 p-2 space-y-1">
                      <div className="text-sm font-semibold">{item?.name ?? inst.id}</div>
                      <div className="text-xs text-white/70">Слот: {item?.slot ?? '—'}</div>
                      {'charges' in inst && typeof inst.charges === 'number' && (
                        <div className="text-xs text-white/60">Заряды: {inst.charges}</div>
                      )}
                      {cooldown > 0 && (
                        <div className="text-xs text-amber-300/80">КД: {cooldown} сцен</div>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={useItemMut.isPending || !activeCode || cooldown > 0 || inst.charges === 0}
                        onClick={() => useItemMut.mutate({ itemId: inst.id })}
                        className="mt-1!"
                      >
                        {cooldown > 0 ? 'КД' : 'Использовать'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {scene?.options && (
            <div className="space-y-2">
              <Text variant="muted" size="sm">
                Выбор
              </Text>
              <div className="grid gap-2">
                {scene.options.map((opt) => (
                  <Button
                    key={opt.id}
                    variant="secondary"
                    className="justify-start text-left"
                    disabled={vote.isPending}
                    onClick={() => vote.mutate(opt.id)}
                  >
                    {opt.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {scene?.allowInterrupt && scene.options && (
            <div className="space-y-2">
              <Text variant="muted" size="sm">
                Прерывание (Rebellion)
              </Text>
              <div className="grid gap-2">
                {scene.options.map((opt) => (
                  <Button
                    key={opt.id}
                    variant="secondary"
                    className="justify-start text-left border border-rose-400/40 bg-rose-400/10"
                    disabled={interrupt.isPending}
                    onClick={() => interrupt.mutate({ type: 'rebellion', targetOptionId: opt.id })}
                  >
                    {opt.text} — форсировать
                  </Button>
                ))}
              </div>
            </div>
          )}

          {scene?.allowKudos && session.players.length > 1 && (
            <div className="space-y-2">
              <Text variant="muted" size="sm">
                Kudos
              </Text>
              <div className="grid md:grid-cols-2 gap-2">
                {session.players
                  .filter((p: any) => p.id !== (sessionQuery.data as any)?.userId)
                  .map((p: any) => (
                    <Button
                      key={p.id}
                      variant="secondary"
                      disabled={kudos.isPending}
                      onClick={() => kudos.mutate({ toPlayerId: p.id, tag: 'respect' })}
                    >
                      Отправить респект {p.name}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
