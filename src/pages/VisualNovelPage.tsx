import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/components/Button'
import { Routes } from '@/shared/lib/utils/navigation'
import { VNScreen } from '@/widgets/visual-novel'
import { useVisualNovelViewModel } from '@/features/visual-novel/model/useVisualNovelViewModel'
import { DEFAULT_VN_SCENE_ID } from '@/shared/data/visualNovel/scenes'
import { convexMutations } from '@/shared/api/convex'
import { usePlayerProgress } from '@/shared/hooks/usePlayer'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { useVisualNovelSessionStore } from '@/features/visual-novel/model/useVisualNovelSessionStore'

interface VisualNovelExperienceProps {
  lockedSceneId?: string
  headerLabel?: string
}

export const VisualNovelExperience: React.FC<VisualNovelExperienceProps> = ({
  lockedSceneId,
  headerLabel,
}) => {
  const params = useParams<{ sceneId?: string }>()
  const navigate = useNavigate()
  const { deviceId } = useDeviceId()
  const { progress, refresh: refreshProgress } = usePlayerProgress()
  const startSession = useVisualNovelSessionStore((state) => state.startSession)
  const trackScene = useVisualNovelSessionStore((state) => state.trackScene)
  const recordChoice = useVisualNovelSessionStore((state) => state.recordChoice)
  const consumePayload = useVisualNovelSessionStore((state) => state.consumePayload)
  const [isCommitting, setIsCommitting] = useState(false)
  const log = useCallback((...args: unknown[]) => {
    console.log('🎮 [VN Experience]', ...args)
  }, [])

  const baseSceneId = useMemo(
    () => lockedSceneId ?? params.sceneId ?? DEFAULT_VN_SCENE_ID,
    [lockedSceneId, params.sceneId]
  )

  const { scene, currentLine, choices, goNext, choose, isPending, isSceneCompleted, jumpToScene, flags } =
    useVisualNovelViewModel(
      { sceneId: baseSceneId },
      {
        onChoiceApplied: ({ sceneId: appliedSceneId, lineId, choice }) => {
          recordChoice({ sceneId: appliedSceneId, lineId, choice })
          log('🗳️ Выбор передан в стор сессии', {
            sceneId: appliedSceneId,
            lineId,
            choiceId: choice.id,
          })
        },
      }
    )

  // Получаем skills из game_progress через Convex
  const skills = useMemo(() => {
    if (!progress) return {}
    // В game_progress есть поле skills как Record<string, number>
    return (progress as any).skills ?? {}
  }, [progress])

  useEffect(() => {
    log('🚀 Старт визуальной новеллы', { baseSceneId })
    startSession(baseSceneId)
  }, [baseSceneId, log, startSession])

  useEffect(() => {
    log('📍 Активная сцена обновлена', { sceneId: scene.id })
    trackScene(scene.id)
  }, [log, scene.id, trackScene])

  const flushSession = useCallback(async () => {
    const payload = consumePayload(Date.now())
    if (!payload) {
      log('ℹ️ Нечего отправлять на сервер')
      return
    }
    setIsCommitting(true)
    try {
      log('📡 Отправка данных сцены на сервер', { sceneId: payload.sceneId, choices: payload.choices.length })
      await convexMutations.vn.commitScene({
        deviceId,
        sceneId: payload.sceneId,
        payload: {
          startedAt: payload.startedAt,
          finishedAt: payload.finishedAt,
          visitedScenes: payload.visitedScenes,
          choices: payload.choices.map((entry) => ({
            sceneId: entry.sceneId,
            lineId: entry.lineId,
            choiceId: entry.choiceId,
            effects: entry.effects,
          })),
          addFlags: payload.addFlags,
          removeFlags: payload.removeFlags,
          xpDelta: payload.xpDelta,
          reputation: payload.reputation,
          advancePhaseTo:
            headerLabel === 'Пролог' || baseSceneId.startsWith('prologue') ? 1 : undefined,
        },
      })
      refreshProgress()
      log('✅ Сервер подтвердил сохранение сцены', { sceneId: payload.sceneId })
    } catch (error) {
      console.error('[VisualNovelExperience] Ошибка при сохранении сцены', error)
    } finally {
      setIsCommitting(false)
    }
  }, [baseSceneId, consumePayload, deviceId, headerLabel, log, refreshProgress])

  const handleExit = useCallback(async () => {
    log('🚪 Выход из визуальной новеллы')
    await flushSession()
    navigate(Routes.MAP)
  }, [flushSession, log, navigate])

  const handleRestart = useCallback(() => {
    log('🔄 Перезапуск сцены', { baseSceneId })
    startSession(baseSceneId)
    jumpToScene(baseSceneId)
  }, [baseSceneId, jumpToScene, log, startSession])

  return (
    <div className="relative min-h-svh bg-black text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4 md:px-10">
        <div className="pointer-events-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => void handleExit()}
          >
            На карту
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={handleRestart}
          >
            Перезапуск
          </Button>
        </div>
        {headerLabel && (
          <div className="pointer-events-auto rounded-full border border-white/20 bg-black/50 px-4 py-1 text-xs uppercase tracking-[0.4em]">
            {headerLabel}
          </div>
        )}
      </div>

      <VNScreen
        scene={scene}
        currentLine={currentLine}
        choices={choices}
        skills={skills}
        flags={flags}
        isPending={isPending}
        isSceneCompleted={isSceneCompleted}
        onAdvance={goNext}
        onChoice={choose}
        onExit={() => void handleExit()}
        onAdviceViewed={async (payload) => {
          log('📊 Просмотр совета голоса', payload)
          try {
            await convexMutations.vn.logCharacterAdviceViewed({
              deviceId,
              ...payload,
            })
          } catch (error) {
            console.error('[VisualNovelExperience] Ошибка при логировании совета', error)
          }
        }}
        isCommitting={isCommitting}
      />
    </div>
  )
}

export const VisualNovelPage: React.FC = () => {
  return <VisualNovelExperience />
}

export default VisualNovelPage
