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

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    if (params.sceneId !== sceneId) {
      setSceneId(params.sceneId)
    }
  }, [params.sceneId, sceneId])

  useEffect(() => {
    const resolvedId = sceneId ?? DEFAULT_VN_SCENE_ID
    const resolved = getVisualNovelScene(resolvedId)
    setScene(resolved)
    setLineId(resolved.entryLineId)
    setSceneCompleted(false)
  }, [sceneId])

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
    [scene.id]
  )

  const applyEffects = useCallback((choice?: VisualNovelChoice) => {
    if (!choice?.effects) return
    setFlags((prev) => {
      const next = new Set(prev)
      choice.effects?.addFlags?.forEach((flag) => next.add(flag))
      choice.effects?.removeFlags?.forEach((flag) => next.delete(flag))
      return next
    })
  }, [])

  const getNextSequentialLine = useCallback(
    (line: VisualNovelLine | null) => {
      if (!line) return null
      const index = scene.lines.findIndex((entry) => entry.id === line.id)
      if (index >= 0 && index < scene.lines.length - 1) {
        return scene.lines[index + 1]
      }
      return null
    },
    [scene.lines]
  )

  const goToScene = useCallback((nextSceneId?: string) => {
    const targetSceneId = nextSceneId && VISUAL_NOVEL_SCENES[nextSceneId] ? nextSceneId : DEFAULT_VN_SCENE_ID
    startTransition(() => {
      setSceneId(targetSceneId)
    })
  }, [])

  const advanceToLine = useCallback(
    (targetLineId?: string | null, choiceId?: string) => {
      if (targetLineId) {
        const targetLine = getLineById(scene, targetLineId)
        if (targetLine) {
          setLineId(targetLine.id)
          recordHistory(targetLine, choiceId)
        } else {
          setSceneCompleted(true)
        }
        return
      }

      if (currentLine?.transition?.nextSceneId) {
        goToScene(currentLine.transition.nextSceneId)
        return
      }

      const sequential = getNextSequentialLine(currentLine)
      if (sequential) {
        setLineId(sequential.id)
        recordHistory(sequential, choiceId)
      } else {
        setSceneCompleted(true)
      }
    },
    [currentLine, getNextSequentialLine, goToScene, recordHistory, scene]
  )

  const hasActiveChoices = useMemo(() => choiceViews.some((choice) => !choice.disabled), [choiceViews])

  const goNext = useCallback(() => {
    if (hasActiveChoices) {
      return
    }
    advanceToLine(currentLine?.nextLineId)
  }, [advanceToLine, currentLine?.nextLineId, hasActiveChoices])

  const choose = useCallback(
    (choiceId: string) => {
      const choice = choiceViews.find((item) => item.id === choiceId)
      if (!choice || choice.disabled) {
        return
      }
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
    [advanceToLine, applyEffects, choiceViews, currentLine, goToScene, recordHistory, scene.id]
  )

  const jumpToScene = useCallback(
    (nextSceneId: string) => {
      goToScene(nextSceneId)
    },
    [goToScene]
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
