import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  DEFAULT_VN_SCENE_ID,
  VISUAL_NOVEL_SCENES,
  buildChoiceViews,
  getLineById,
  getVisualNovelScene,
} from '@/entities/visual-novel/model/scenes'
import type {
  VisualNovelChoice,
  VisualNovelChoiceView,
  VisualNovelHistoryEntry,
  VisualNovelLine,
  VisualNovelSceneDefinition,
} from '@/shared/types/visualNovel'

interface UseVisualNovelViewModelParams {
  sceneId?: string
  initialFlags?: Iterable<string>
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

const EMPTY_SCENE: VisualNovelSceneDefinition = {
  id: '__missing_scene__',
  title: 'Missing scene',
  location: 'Unknown',
  background: '',
  entryLineId: '',
  characters: [],
  lines: [],
}

export function useVisualNovelViewModel(
  params: UseVisualNovelViewModelParams,
  options: UseVisualNovelViewModelOptions = {}
): VisualNovelViewModel {
  const initialSceneId = params.sceneId ?? DEFAULT_VN_SCENE_ID
  const initialScene =
    getVisualNovelScene(initialSceneId) ??
    getVisualNovelScene(DEFAULT_VN_SCENE_ID) ??
    EMPTY_SCENE

  const [sceneId, setSceneId] = useState<string | undefined>(initialSceneId)
  const [scene, setScene] = useState<VisualNovelSceneDefinition>(initialScene)
  const [lineId, setLineId] = useState<string>(initialScene.entryLineId ?? '')
  const [flags, setFlags] = useState<Set<string>>(() => new Set(params.initialFlags ?? []))
  const [history, setHistory] = useState<VisualNovelHistoryEntry[]>([])
  const [isSceneCompleted, setSceneCompleted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const optionsRef = useRef(options)
  const previousExternalSceneIdRef = useRef<string | undefined>(params.sceneId)
  const log = useCallback((...args: unknown[]) => {
    console.log('[VN ViewModel]', ...args)
  }, [])

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    const incoming = new Set(params.initialFlags ?? [])
    setFlags((prev) => {
      if (prev.size === incoming.size && Array.from(prev).every((flag) => incoming.has(flag))) {
        return prev
      }
      return incoming
    })
  }, [params.initialFlags])

  useEffect(() => {
    if (previousExternalSceneIdRef.current === params.sceneId) {
      return
    }

    previousExternalSceneIdRef.current = params.sceneId
    const targetSceneId = params.sceneId ?? DEFAULT_VN_SCENE_ID

    if (targetSceneId === sceneId) {
      return
    }

    log('[VN] External sceneId changed', { from: sceneId, to: targetSceneId })
    setSceneId(targetSceneId)
  }, [log, params.sceneId, sceneId])

  useEffect(() => {
    const resolvedId = sceneId ?? DEFAULT_VN_SCENE_ID
    log('[VN] Resolving scene', resolvedId)
    const resolved =
      getVisualNovelScene(resolvedId) ?? getVisualNovelScene(DEFAULT_VN_SCENE_ID) ?? EMPTY_SCENE

    if (resolved === EMPTY_SCENE) {
      console.error('[VN] Unknown scene id, fallback failed:', resolvedId)
    }

    setScene(resolved)
    setLineId(resolved.entryLineId ?? '')
    setSceneCompleted(false)
    log('[VN] Reset to entry line', resolved.entryLineId)
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
      log('[VN] Record history', { sceneId: scene.id, lineId: line.id, choiceId })
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
      if (!choice?.effects?.length) return
      log('[VN] Applying choice effects', {
        choiceId: choice.id,
        effectTypes: choice.effects.map((effect) => effect.type),
      })
      setFlags((prev) => {
        const next = new Set(prev)
        choice.effects?.forEach((effect) => {
          if (effect.type === 'flag') {
            if (effect.value) {
              next.add(effect.flag)
            } else {
              next.delete(effect.flag)
            }
          }
          if (effect.type === 'stat_modifier' && effect.stat.startsWith('flag:')) {
            const flagName = effect.stat.slice(5)
            if (flagName) {
              if (effect.delta > 0) {
                next.add(flagName)
              } else if (effect.delta < 0) {
                next.delete(flagName)
              }
            }
          }
        })
        return next
      })
    },
    [log]
  )

  const isLineValid = useCallback(
    (line: VisualNovelLine) => {
      if (!line.condition) return true
      if (line.condition.flag && !flags.has(line.condition.flag)) return false
      if (line.condition.notFlag && flags.has(line.condition.notFlag)) return false
      return true
    },
    [flags]
  )

  const getNextSequentialLine = useCallback(
    (line: VisualNovelLine | null): VisualNovelLine | null => {
      if (!line) return null
      const index = scene.lines.findIndex((entry) => entry.id === line.id)
      if (index < 0) return null

      for (let i = index + 1; i < scene.lines.length; i++) {
        const candidate = scene.lines[i]
        if (isLineValid(candidate)) {
          log('[VN] Next sequential line', {
            fromLineId: line.id,
            toLineId: candidate.id,
            skipped: i - index - 1,
          })
          return candidate
        }
      }
      return null
    },
    [log, scene.lines, isLineValid]
  )

  const goToScene = useCallback(
    (nextSceneId?: string) => {
      const targetSceneId =
        nextSceneId && VISUAL_NOVEL_SCENES[nextSceneId] ? nextSceneId : DEFAULT_VN_SCENE_ID
      log('[VN] goToScene', { requested: nextSceneId, resolved: targetSceneId })
      startTransition(() => {
        setSceneId(targetSceneId)
      })
    },
    [log]
  )

  const advanceToLine = useCallback(
    (targetLineId?: string | null, choiceId?: string) => {
      if (targetLineId) {
        let targetLine = getLineById(scene, targetLineId)

        // If explicit line is invalid, try to find next valid
        if (targetLine && !isLineValid(targetLine)) {
          targetLine = getNextSequentialLine(targetLine)
        }

        if (targetLine) {
          log('[VN] advanceToLine explicit', { targetLineId: targetLine.id, fromChoice: choiceId })
          setLineId(targetLine.id)
          recordHistory(targetLine, choiceId)
        } else {
          log('[VN] advanceToLine: target line not found or filtered', { targetLineId })
          setSceneCompleted(true)
        }
        return
      }

      if (currentLine?.transition?.nextSceneId) {
        log('[VN] advanceToLine: line transition to scene', {
          currentLineId: currentLine.id,
          nextSceneId: currentLine.transition.nextSceneId,
          fromChoice: choiceId,
        })
        goToScene(currentLine.transition.nextSceneId)
        return
      }

      const sequential = getNextSequentialLine(currentLine)
      if (sequential) {
        log('[VN] advanceToLine: sequential', {
          fromLineId: currentLine?.id,
          toLineId: sequential.id,
          fromChoice: choiceId,
        })
        setLineId(sequential.id)
        recordHistory(sequential, choiceId)
      } else {
        log('[VN] advanceToLine: no next line, scene complete', { currentLineId: currentLine?.id })
        setSceneCompleted(true)
      }
    },
    [currentLine, getNextSequentialLine, goToScene, isLineValid, log, recordHistory, scene]
  )

  const hasActiveChoices = useMemo(
    () => choiceViews.some((choice) => !choice.disabled),
    [choiceViews]
  )

  const goNext = useCallback(() => {
    if (hasActiveChoices) {
      log('[VN] goNext: choices still active, ignoring', {
        lineId: currentLine?.id,
      })
      return
    }
    log('[VN] goNext: advancing', {
      currentLineId: currentLine?.id,
    })
    advanceToLine(currentLine?.nextLineId)
  }, [advanceToLine, currentLine?.id, currentLine?.nextLineId, hasActiveChoices, log])

  const choose = useCallback(
    (choiceId: string) => {
      const choice = choiceViews.find((item) => item.id === choiceId)
      if (!choice || choice.disabled) {
        log('[VN] choose: invalid or disabled choice', { choiceId, reason: choice?.lockReason })
        return
      }
      log('[VN] choose', {
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
      log('[VN] jumpToScene', nextSceneId)
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
