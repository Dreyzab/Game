import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { authenticatedClient } from '@/shared/api/client'
import { Button } from '@/shared/ui/components/Button'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'

const PvPPage: React.FC = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [matchId, setMatchId] = useState<string | null>(null)

  const matchQuery = useQuery({
    queryKey: ['pvp-match', matchId],
    enabled: isLoaded && isSignedIn && Boolean(matchId),
    refetchInterval: 3000,
    queryFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.pvp.match({ id: matchId! }).get()
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      if (!(data as any).match) throw new Error('Match not found')
      return (data as any).match
    },
  })

  const queueMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.pvp.queue.post()
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      if (!(data as any).match) throw new Error('Match not created')
      return (data as any).match
    },
    onSuccess: (match) => setMatchId(match.id),
  })

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!matchId) throw new Error('No match id')
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.pvp.match({ id: matchId }).join.post()
      if (error) throw error
      if (!data) throw new Error('Empty response')
      if (typeof (data as any).error === 'string') throw new Error((data as any).error)
      if (!(data as any).match) throw new Error('Match not found')
      return (data as any).match
    },
    onSuccess: (match) => setMatchId(match.id),
  })

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-3">
          <Heading level={2}>Нужен вход</Heading>
          <Text variant="muted" size="sm">Авторизуйтесь, чтобы участвовать в PvP матчмейкинге.</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6 gap-6">
      <div className="max-w-3xl w-full text-center space-y-2">
        <Heading level={2}>PvP матчмейкинг</Heading>
        <Text variant="muted" size="sm">
          Лёгкая очередь на Bun API. Создайте матч и поделитесь ID для друга или присоединяйтесь к существующему.
        </Text>
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={() => queueMutation.mutate()} disabled={queueMutation.isPending}>
          {queueMutation.isPending ? 'Создаём...' : 'Создать матч'}
        </Button>
        {matchId && (
          <Button variant="secondary" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
            {joinMutation.isPending ? 'Подключаемся...' : 'Присоединиться ещё раз'}
          </Button>
        )}
      </div>

      {matchId && (
        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Heading level={4}>Матч {matchId}</Heading>
              <Text variant="muted" size="sm">{matchQuery.data?.status ?? 'matching'}</Text>
            </div>
            <Button variant="ghost" onClick={() => navigator.clipboard.writeText(matchId)}>
              Скопировать ID
            </Button>
          </div>
          <div className="space-y-2">
            {matchQuery.data?.players?.map((p: string) => (
              <div key={p} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2">
                <span className="text-sm font-semibold">{p}</span>
                <span className="text-xs text-white/60">Игрок</span>
              </div>
            ))}
            {!matchQuery.data && <Text variant="muted" size="sm">Обновляем информацию о матче...</Text>}
          </div>
        </div>
      )}
    </div>
  )
}

export default PvPPage
