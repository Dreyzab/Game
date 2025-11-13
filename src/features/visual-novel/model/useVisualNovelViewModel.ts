import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  DEFAULT_VN_SCENE_ID,
  VISUAL_NOVEL_SCENES,
  buildChoiceViews,
  getLineById,
  getVisualNovelScene,
} from '@/shared/data/visualNovel/scenes'
import type {
  VisualNovelChoice,
  VisualNovelChoiceView,
  VisualNovelHistoryEntry,
  VisualNovelLine,
  VisualNovelSceneDefinition,
} from '@/shared/types/visualNovel'

interface UseVisualNovelViewModelParams {
  sceneId?: string
}

interface UseVisualNovelViewModelOptions {
  onChoiceApplied?: (payload: { sceneId: string; lineId?: string; choice: VisualNovelChoice }) => void
}

export interface VisualNovelViewModel {
  scene: VisualNovelSceneDefinition
  currentLine: VisualNovelLine | null
  choices: VisualNovelChoiceView[]
  isPending: boolean
  isSceneCompleted: boolean
  history: VisualNovelHistoryEntry[]
  flags: Set<string>
  goNext: () => void
  choose: (choiceId: string) => void
  jumpToScene: (nextSceneId: string) => void
}

export function useVisualNovelViewModel(
  params: UseVisualNovelViewModelParams,
  options: UseVisualNovelViewModelOptions = {}
): VisualNovelViewModel {
  const [sceneId, setSceneId] = useState<string | undefined>(params.sceneId ?? DEFAULT_VN_SCENE_ID)
  const [scene, setScene] = useState<VisualNovelSceneDefinition>(() => getVisualNovelScene(sceneId))
  const [lineId, setLineId] = useState<string>(scene.entryLineId)
  const [flags, setFlags] = useState<Set<string>>(() => new Set())
  const [history, setHistory] = useState<VisualNovelHistoryEntry[]>([])
  const [isSceneCompleted, setSceneCompleted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const optionsRef = useRef(options)
  const previousExternalSceneIdRef = useRef<string | undefined>(params.sceneId)
  const log = useCallback((...args: unknown[]) => {
    console.log('🎭 [VN ViewModel]', ...args)
  }, [])

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    if (previousExternalSceneIdRef.current === params.sceneId) {
      return
    }

    previousExternalSceneIdRef.current = params.sceneId
    const targetSceneId = params.sceneId ?? DEFAULT_VN_SCENE_ID

    if (targetSceneId === sceneId) {
      return
    }

    log('🌐 Внешний запрос смены сцены', { from: sceneId, to: targetSceneId })
    setSceneId(targetSceneId)
  }, [log, params.sceneId, sceneId])

  useEffect(() => {
    const resolvedId = sceneId ?? DEFAULT_VN_SCENE_ID
    log('🎬 Загрузка сцены', resolvedId)
    const resolved = getVisualNovelScene(resolvedId)
    setScene(resolved)
    setLineId(resolved.entryLineId)
    setSceneCompleted(false)
    log('🆕 Стартовая реплика', resolved.entryLineId)
  }, [log, sceneId])

  const currentLine = useMemo(() => {
    const explicit = getLineById(scene, lineId)
    if (explicit) {
      return explicit
    }
    return scene.lines.length > 0 ? scene.lines[0] : null
  }, [scene, lineId])

  const choiceViews = useMemo(() => buildChoiceViews(currentLine, flags), [currentLine, flags])

  const recordHistory = useCallback(
    (line: VisualNovelLine | null, choiceId?: string) => {
      if (!line) return
      log('📝 Запись истории', { sceneId: scene.id, lineId: line.id, choiceId })
      setHistory((prev) => [
        ...prev,
        {
          sceneId: scene.id,
          lineId: line.id,
          choiceId,
          timestamp: Date.now(),
        },
      ])
    },
    [log, scene.id]
  )

  const applyEffects = useCallback(
    (choice?: VisualNovelChoice) => {
      if (!choice?.effects) return
      log('✨ Применение эффектов выбора', {
        choiceId: choice.id,
        addFlags: choice.effects.addFlags,
        removeFlags: choice.effects.removeFlags,
        xp: choice.effects.xp,
        reputation: choice.effects.reputation,
      })
      setFlags((prev) => {
        const next = new Set(prev)
        choice.effects?.addFlags?.forEach((flag) => next.add(flag))
        choice.effects?.removeFlags?.forEach((flag) => next.delete(flag))
        return next
      })
    },
    [log]
  )

  const getNextSequentialLine = useCallback(
    (line: VisualNovelLine | null) => {
      if (!line) return null
      const index = scene.lines.findIndex((entry) => entry.id === line.id)
      if (index >= 0 && index < scene.lines.length - 1) {
        log('➡️ Последовательная реплика', scene.lines[index + 1].id)
        return scene.lines[index + 1]
      }
      return null
    },
    [log, scene.lines]
  )

  const goToScene = useCallback((nextSceneId?: string) => {
    const targetSceneId = nextSceneId && VISUAL_NOVEL_SCENES[nextSceneId] ? nextSceneId : DEFAULT_VN_SCENE_ID
    log('🚪 Переход к сцене', { requested: nextSceneId, resolved: targetSceneId })
    startTransition(() => {
      setSceneId(targetSceneId)
    })
  }, [log])

  const advanceToLine = useCallback(
    (targetLineId?: string | null, choiceId?: string) => {
      if (targetLineId) {
        const targetLine = getLineById(scene, targetLineId)
        if (targetLine) {
          log('🎯 Переход к указанной реплике', { targetLineId, fromChoice: choiceId })
          setLineId(targetLine.id)
          recordHistory(targetLine, choiceId)
        } else {
          log('⚠️ Реплика не найдена. Завершение сцены', { targetLineId })
          setSceneCompleted(true)
        }
        return
      }

      if (currentLine?.transition?.nextSceneId) {
        log('🔀 Переход к следующей сцене из реплики', {
          currentLineId: currentLine.id,
          nextSceneId: currentLine.transition.nextSceneId,
          fromChoice: choiceId,
        })
        goToScene(currentLine.transition.nextSceneId)
        return
      }

      const sequential = getNextSequentialLine(currentLine)
      if (sequential) {
        log('⏭️ Переход к следующей реплике по порядку', {
          fromLineId: currentLine?.id,
          toLineId: sequential.id,
          fromChoice: choiceId,
        })
        setLineId(sequential.id)
        recordHistory(sequential, choiceId)
      } else {
        log('🏁 Реплика последняя. Сцена завершена', { currentLineId: currentLine?.id })
        setSceneCompleted(true)
      }
    },
    [currentLine, getNextSequentialLine, goToScene, log, recordHistory, scene]
  )

  const hasActiveChoices = useMemo(() => choiceViews.some((choice) => !choice.disabled), [choiceViews])

  const goNext = useCallback(() => {
    if (hasActiveChoices) {
      log('⏸️ Ожидание выбора. Автопереход не выполняется', { lineId: currentLine?.id })
      return
    }
    log('▶️ Пользователь инициировал переход дальше', { currentLineId: currentLine?.id })
    advanceToLine(currentLine?.nextLineId)
  }, [advanceToLine, currentLine?.id, currentLine?.nextLineId, hasActiveChoices, log])

  const choose = useCallback(
    (choiceId: string) => {
      const choice = choiceViews.find((item) => item.id === choiceId)
      if (!choice || choice.disabled) {
        log('🚫 Выбор недоступен', { choiceId, reason: choice?.lockReason })
        return
      }
      log('✅ Выбор принят', {
        choiceId: choice.id,
        label: choice.label,
        nextLineId: choice.nextLineId,
        nextSceneId: choice.nextSceneId,
      })
      applyEffects(choice)
      const lineIdentifier = currentLine?.id ?? choice.nextLineId
      optionsRef.current?.onChoiceApplied?.({
        sceneId: scene.id,
        lineId: lineIdentifier,
        choice,
      })
      if (choice.nextSceneId) {
        recordHistory(currentLine, choice.id)
        goToScene(choice.nextSceneId)
        return
      }
      if (choice.nextLineId) {
        advanceToLine(choice.nextLineId, choice.id)
        return
      }
      advanceToLine(undefined, choice.id)
    },
    [advanceToLine, applyEffects, choiceViews, currentLine, goToScene, log, recordHistory, scene.id]
  )

  const jumpToScene = useCallback(
    (nextSceneId: string) => {
      log('🪄 Принудительный переход к сцене', nextSceneId)
      goToScene(nextSceneId)
    },
    [goToScene, log]
  )

  return {
    scene,
    currentLine,
    choices: choiceViews,
    isPending,
    isSceneCompleted,
    history,
    flags,
    goNext,
    choose,
    jumpToScene,
  }
}
