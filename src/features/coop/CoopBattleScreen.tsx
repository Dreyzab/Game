import React, { useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authenticatedClient } from '@/shared/api/client'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { Button } from '@/shared/ui/components/Button'

type CoopBattleScreenProps = {
  roomCode: string
}

// Экран совместного квеста (LCSD): обёртка над серверной машиной состояний.
export const CoopBattleScreen: React.FC<CoopBattleScreenProps> = ({ roomCode }) => {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const questQuery = useQuery({
    queryKey: ['coop-quest', roomCode],
    enabled: Boolean(roomCode),
    refetchInterval: 3000,
    queryFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.coop.rooms({ code: roomCode }).quest.get()
      if (error) throw error
      return data
    },
  })

  const chooseMutation = useMutation({
    mutationFn: async (choiceId: string) => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.coop.rooms({ code: roomCode }).quest.post({ choiceId })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coop-quest', roomCode] })
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

  if (questQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-3">
          <Heading level={3}>Загрузка совместного квеста…</Heading>
          <Text variant="muted" size="sm">
            Синхронизация состояния комнаты {roomCode}.
          </Text>
        </div>
      </div>
    )
  }

  if (questQuery.isError || !questQuery.data?.quest || !questQuery.data?.node) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-3">
          <Heading level={3}>Ошибка совместного квеста</Heading>
          <Text variant="muted" size="sm">
            {(questQuery.error as Error)?.message ?? 'Не удалось загрузить состояние квеста.'}
          </Text>
        </div>
      </div>
    )
  }

  const { quest, node } = questQuery.data as { quest: any; node: any }
  const isFinished = Boolean(quest.finishedAt) || node.id === 'quest_complete'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <Heading level={2}>{node.title}</Heading>
          <Text variant="muted" size="sm">
            Комната: {roomCode}. Узел: {node.id}
          </Text>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <Text>{node.description}</Text>
        </div>

        {isFinished ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center space-y-2">
            <Heading level={4}>Сцена совместного квеста завершена</Heading>
            <Text variant="muted" size="sm">
              Големы остановлены, дворфы рядом, а два амулета продолжают мерцать. Дальнейшее продолжится в основной
              сюжетной линии.
            </Text>
          </div>
        ) : (
          <div className="space-y-3">
            <Heading level={4} className="text-center">
              Выбор действия
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
                  {choice.requiredRole && (
                    <span className="ml-2 text-xs text-white/60">({choice.requiredRole.toUpperCase()})</span>
                  )}
                </Button>
              ))}
              {(!node.choices || node.choices.length === 0) && (
                <Text variant="muted" size="sm" className="text-center">
                  Доступных действий больше нет. Дождитесь перехода в следующую сцену.
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
