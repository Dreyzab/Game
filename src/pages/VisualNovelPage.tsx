import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { Button } from '@/shared/ui/components/Button'
import { authenticatedClient } from '@/shared/api/client'
import { VNScreen } from '@/widgets/visual-novel'
import { DEFAULT_VN_SCENE_ID } from '@/shared/data/visualNovel/scenes'
import { useVisualNovelSessionStore, useVisualNovelViewModel } from '@/features/visual-novel/model'
import { Routes } from '@/shared/lib/utils/navigation'
import type { VisualNovelChoice, VisualNovelChoiceEffect } from '@/shared/types/visualNovel'

export type VisualNovelExperienceProps = {
  lockedSceneId?: string
  headerLabel?: string
}

export const VisualNovelExperience: React.FC<VisualNovelExperienceProps> = ({
  lockedSceneId,
  headerLabel,
}) => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const { sceneId: routeSceneId } = useParams<{ sceneId?: string }>()
  const navigate = useNavigate()
  type CommitPayload = NonNullable<ReturnType<typeof consumePayload>>
  type ImmediateEffect = Extract<VisualNovelChoiceEffect, { type: 'immediate' }>

  const rootSceneId = useVisualNovelSessionStore((state) => state.rootSceneId)
  const startSession = useVisualNovelSessionStore((state) => state.startSession)
  const trackScene = useVisualNovelSessionStore((state) => state.trackScene)
  const recordChoice = useVisualNovelSessionStore((state) => state.recordChoice)
  const consumePayload = useVisualNovelSessionStore((state) => state.consumePayload)

  const vnStateQuery = useQuery({
    queryKey: ['vn-state'],
    enabled: isLoaded && isSignedIn,
    retry: false,
    queryFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.vn.state.get()
      if (error) throw error
      return data
    },
  })

  const initialSceneId =
    lockedSceneId ?? routeSceneId ?? vnStateQuery.data?.progress?.currentScene ?? DEFAULT_VN_SCENE_ID
  const initialFlags = useMemo(() => {
    const flags = vnStateQuery.data?.progress?.flags as Record<string, unknown> | undefined
    if (!flags) return []
    return Object.entries(flags)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key)
  }, [vnStateQuery.data?.progress?.flags])

  const skills = useMemo(
    () => (vnStateQuery.data?.progress?.skills as Record<string, number> | undefined) ?? {},
    [vnStateQuery.data?.progress?.skills]
  )

  const handleImmediateEffects = useCallback(
    (sceneId: string, choice: VisualNovelChoice) => {
      const effects = choice.effects ?? []
      const immediateEffects = effects.filter((effect): effect is ImmediateEffect => effect.type === 'immediate')
      if (immediateEffects.length === 0) return

      const buildUrl = (path: string, params: Record<string, string | undefined>) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (!value) return
          searchParams.set(key, value)
        })
        const suffix = searchParams.toString()
        return suffix ? `${path}?${suffix}` : path
      }

      const pickSceneId = (value: unknown): string | undefined =>
        typeof value === 'string' && value.trim().length > 0 ? value : undefined

      const startCombat = immediateEffects.find((effect) => effect.action === 'start_combat')
      if (startCombat) {
        const data = startCombat.data ?? {}
        navigate(
          buildUrl(Routes.BATTLE, {
            returnScene: pickSceneId(data.returnScene) ?? sceneId,
            defeatScene: pickSceneId(data.defeatScene) ?? sceneId,
            enemyKey: pickSceneId(data.enemyKey),
          })
        )
        return
      }

      const startTutorialBattle = immediateEffects.find((effect) => effect.action === 'start_tutorial_battle')
      if (startTutorialBattle) {
        const data = startTutorialBattle.data ?? {}
        navigate(
          buildUrl(Routes.TUTORIAL_BATTLE, {
            returnScene: pickSceneId(data.returnScene) ?? 'combat_tutorial_victory',
            defeatScene: pickSceneId(data.defeatScene) ?? 'combat_tutorial_defeat',
          })
        )
      }
    },
    [navigate]
  )

  const viewModel = useVisualNovelViewModel(
    { sceneId: initialSceneId, initialFlags },
    {
      onChoiceApplied: ({ sceneId, lineId, choice }) => {
        recordChoice({ sceneId, lineId, choice })
        handleImmediateEffects(sceneId, choice)
      },
    }
  )

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (vnStateQuery.isLoading || vnStateQuery.isError) return
    if (rootSceneId === initialSceneId) return
    startSession(initialSceneId)
  }, [
    initialSceneId,
    isLoaded,
    isSignedIn,
    rootSceneId,
    startSession,
    vnStateQuery.isError,
    vnStateQuery.isLoading,
  ])

  useEffect(() => {
    trackScene(viewModel.scene.id)
  }, [trackScene, viewModel.scene.id])

  const commitMutation = useMutation({
    mutationFn: async (payload: { sceneId: string; payload: CommitPayload }) => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { data, error } = await client.vn.commit.post(payload)
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vn-state'] })
      // Если были выданы предметы, обновляем инвентарь
      const responseData = data as { awardedItems?: Array<{ itemId: string; quantity: number }> } | null
      if (responseData?.awardedItems && responseData.awardedItems.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['myInventory'] })
      }
    },
  })

  const adviceMutation = useMutation({
    mutationFn: async (payload: {
      sceneId: string
      lineId: string
      characterId: string
      choiceContext: string[]
      skillLevel: number
      viewOrder: number
    }) => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined)
      const { error } = await client.vn.advice.post(payload)
      if (error) throw error
      return true
    },
  })

  const handleExit = useCallback(async () => {
    const payload = consumePayload(Date.now())
    if (!payload) return
    await commitMutation.mutateAsync({
      sceneId: viewModel.scene.id,
      payload,
    })
  }, [commitMutation, consumePayload, viewModel.scene.id])

  const handleExitRef = useRef(handleExit)
  useEffect(() => {
    handleExitRef.current = handleExit
  }, [handleExit])

  useEffect(() => {
    return () => {
      handleExitRef.current().catch((error) => {
        console.error('[VN] Failed to commit progress on unmount', error)
      })
    }
  }, [])

  const handleAdviceViewed = useCallback(
    (payload: {
      sceneId: string
      lineId: string
      characterId: string
      choiceContext: string[]
      skillLevel: number
      viewOrder: number
    }) => {
      adviceMutation.mutate(payload)
    },
    [adviceMutation]
  )

  if (!isLoaded) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
          <Heading level={3}>{headerLabel ?? 'Загрузка...'}</Heading>
          <Text variant="muted" size="sm">
            Подготавливаем визуальную новеллу.
          </Text>
        </div>
      </Layout>
    )
  }

  if (!isSignedIn) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
          <Heading level={2}>{headerLabel ?? 'Нужен вход'}</Heading>
          <Text variant="muted" size="sm">
            Авторизуйтесь, чтобы продолжить прогресс визуальной новеллы.
          </Text>
        </div>
      </Layout>
    )
  }

  if (vnStateQuery.isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
          <Heading level={3}>{headerLabel ?? 'Загрузка прогресса'}</Heading>
          <Text variant="muted" size="sm">Получаем состояние VN с сервера...</Text>
        </div>
      </Layout>
    )
  }

  if (vnStateQuery.isError) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
          <Heading level={3}>{headerLabel ?? 'Не удалось загрузить VN'}</Heading>
          <Text variant="muted" size="sm">
            {(vnStateQuery.error as Error)?.message ?? 'Попробуйте позже.'}
          </Text>
          <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['vn-state'] })}>
            Повторить
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <VNScreen
      scene={viewModel.scene}
      currentLine={viewModel.currentLine}
      choices={viewModel.choices}
      isSceneCompleted={viewModel.isSceneCompleted}
      isPending={viewModel.isPending}
      flags={viewModel.flags}
      skills={skills}
      onAdvance={viewModel.goNext}
      onChoice={viewModel.choose}
      onExit={handleExit}
      onAdviceViewed={handleAdviceViewed}
      isCommitting={commitMutation.isPending}
    />
  )
}

const VisualNovelPage: React.FC = () => <VisualNovelExperience />

export default VisualNovelPage
