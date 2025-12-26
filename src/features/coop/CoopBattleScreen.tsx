import React, { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authenticatedClient } from '@/shared/api/client'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { Button } from '@/shared/ui/components/Button'
import { useAppAuth } from '@/shared/auth'

type CoopBattleScreenProps = {
  roomCode: string
}

export const CoopBattleScreen: React.FC<CoopBattleScreenProps> = ({ roomCode }) => {
  const { getToken } = useAppAuth()
  const queryClient = useQueryClient()

  const roomQuery = useQuery({
    queryKey: ['coop-room', roomCode],
    enabled: Boolean(roomCode),
    refetchInterval: 2000,
    queryFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token ?? undefined)

      // @ts-expect-error - dynamic route typing in Eden
      const { data, error } = await client.coop.rooms[roomCode].get()
      if (error) throw error

      const payload = data as any
      if (typeof payload?.error === 'string' && payload.error) throw new Error(payload.error)

      return payload.room as any
    },
  })

  const chooseMutation = useMutation({
    mutationFn: async (choiceId: string) => {
      const token = await getToken()
      const client = authenticatedClient(token ?? undefined)

      // @ts-expect-error - dynamic route typing in Eden
      const { data, error } = await client.coop.rooms[roomCode].quest.post({ choiceId })
      if (error) throw error

      const payload = data as any
      if (typeof payload?.error === 'string' && payload.error) throw new Error(payload.error)

      return payload.room as any
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coop-room', roomCode] })
    },
  })

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (chooseMutation.isPending) return
      chooseMutation.mutate(choiceId)
    },
    [chooseMutation]
  )

  if (roomQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-3">
          <Heading level={3}>Loading...</Heading>
          <Text variant="muted" size="sm">
            Room: {roomCode}
          </Text>
        </div>
      </div>
    )
  }

  const room = roomQuery.data as any | undefined
  const node = room?.questNode as any | undefined

  if (roomQuery.isError || !room || !node) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-3">
          <Heading level={3}>Failed to load</Heading>
          <Text variant="muted" size="sm">
            {(roomQuery.error as Error)?.message ?? 'Unknown error'}
          </Text>
        </div>
      </div>
    )
  }

  const isFinished = room.status === 'finished'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <Heading level={2}>{node.title}</Heading>
          <Text variant="muted" size="sm">
            Room: {roomCode}. Scene: {room.sceneId ?? node.id}
          </Text>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <Text>{node.description}</Text>
        </div>

        {isFinished ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center space-y-2">
            <Heading level={4}>Quest finished</Heading>
          </div>
        ) : (
          <div className="space-y-3">
            <Heading level={4} className="text-center">
              Choose:
            </Heading>
            <div className="grid gap-3">
              {node.choices?.map((choice: any) => (
                <Button
                  key={choice.id}
                  variant="secondary"
                  className="justify-start text-left"
                  disabled={chooseMutation.isPending}
                  onClick={() => handleChoice(choice.id)}
                >
                  {choice.text}
                </Button>
              ))}
              {(!node.choices || node.choices.length === 0) && (
                <Text variant="muted" size="sm" className="text-center">
                  No choices.
                </Text>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoopBattleScreen
