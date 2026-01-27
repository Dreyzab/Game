import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppAuth } from '@/shared/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { Button } from '@/shared/ui/components/Button'
import { authenticatedClient } from '@/shared/api/client'
import { calculateMaxResources } from '@/shared/lib/stats'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { VNScreen } from '@/widgets/visual-novel'
import { DEFAULT_VN_SCENE_ID } from '@/entities/visual-novel/model/scenes'
import { useVisualNovelSessionStore, useVisualNovelViewModel } from '@/features/visual-novel/model'
import { Routes } from '@/shared/lib/utils/navigation'
import type { VisualNovelChoice, VisualNovelChoiceEffect } from '@/shared/types/visualNovel'
import type { FloatingTextEvent } from '@/features/dreyzab-combat-simulator'
import { useInventoryStore } from '@/entities/inventory/model/store'
import { createFallbackEvidence, getDetectiveEvidenceById, useDossierStore } from '@/features/detective'

export type VisualNovelExperienceProps = {
  lockedSceneId?: string
  headerLabel?: string
}

export const VisualNovelExperience: React.FC<VisualNovelExperienceProps> = ({
  lockedSceneId,
  headerLabel,
}) => {
  const { getToken, isLoaded } = useAppAuth()
  const { deviceId } = useDeviceId()
  const queryClient = useQueryClient()
  const { sceneId: routeSceneId } = useParams<{ sceneId?: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const gameMode = useInventoryStore((state) => state.gameMode)
  type CommitPayload = NonNullable<ReturnType<typeof consumePayload>>
  type ImmediateEffect = Extract<VisualNovelChoiceEffect, { type: 'immediate' }>

  const rootSceneId = useVisualNovelSessionStore((state) => state.rootSceneId)
  const startSession = useVisualNovelSessionStore((state) => state.startSession)
  const trackScene = useVisualNovelSessionStore((state) => state.trackScene)
  const recordChoice = useVisualNovelSessionStore((state) => state.recordChoice)
  const consumePayload = useVisualNovelSessionStore((state) => state.consumePayload)
  const applySystemHpChange = useVisualNovelSessionStore((state) => state.applySystemHpChange)
  const pendingHpDelta = useVisualNovelSessionStore((state) => state.pendingHpDelta)

  const [floatingEvents, setFloatingEvents] = useState<FloatingTextEvent[]>([])
  const appliedHpDeltaKeyRef = useRef<string | null>(null)
  const exitSourceRef = useRef<'unknown' | 'ui' | 'unmount'>('unknown')

  const [isNicknamePromptOpen, setNicknamePromptOpen] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [isNicknameSaving, setNicknameSaving] = useState(false)
  const fadeOverlayRef = useRef<HTMLDivElement | null>(null)
  const fadeOverlayLoggedRef = useRef(false)
  const [vnSession, setVnSession] = useState<{
    sceneId: string
    sessionId: string
    sessionToken: string
    stateVersion: number
    expiresAt: number
  } | null>(null)
  const commitNonceRef = useRef<string | null>(null)

  const saveNickname = useCallback(async () => {
    const trimmed = nicknameDraft.trim()

    if (!trimmed) {
      setNicknameError('Введите имя')
      return
    }

    if (trimmed.length > 32) {
      setNicknameError('Имя слишком длинное (макс. 32 символа)')
      return
    }

    setNicknameSaving(true)
    setNicknameError(null)

    try {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { error } = await client.player.init.post({ name: trimmed })
      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['vn-state'] })
      await queryClient.invalidateQueries({ queryKey: ['myPlayer'] })

      setNicknamePromptOpen(false)
    } catch (err) {
      console.error('[VN] Failed to save nickname', err)
      setNicknameError('Не удалось сохранить имя. Попробуйте ещё раз.')
    } finally {
      setNicknameSaving(false)
    }
  }, [deviceId, getToken, nicknameDraft, queryClient])

  const generateCommitNonce = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const startServerSession = useCallback(
    async (sceneId: string) => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { data, error } = await client.vn.session.start.post({ sceneId })
      if (error) throw error
      if (!data.sessionId || !data.sessionToken) throw new Error('Invalid session response')

      commitNonceRef.current = null
      setVnSession({
        sceneId,
        sessionId: data.sessionId,
        sessionToken: data.sessionToken,
        stateVersion: data.stateVersion ?? 0,
        expiresAt: data.expiresAt ?? Date.now() + 3600000,
      })
      return data
    },
    [deviceId, getToken]
  )

  const syncImmediateQuest = useCallback(
    async (payload: Record<string, unknown> | undefined) => {
      if (!payload) return
      const questIdRaw = payload.questId ?? payload.id
      const actionRaw = payload.action ?? payload.type
      const questId = typeof questIdRaw === 'string' ? questIdRaw.trim() : ''
      const action = typeof actionRaw === 'string' ? actionRaw.trim() : ''
      if (!questId || !action) return

      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)

      if (action === 'start') {
        const { error } = await client.quests.start.post({ questId })
        if (error) throw error
      } else if (action === 'complete') {
        const { error } = await client.quests.update.post({ questId, status: 'completed' })
        if (error) throw error
      } else if (action === 'fail') {
        const { error } = await client.quests.update.post({ questId, status: 'failed' })
        if (error) throw error
      } else if (action === 'abandon') {
        const { error } = await client.quests.update.post({ questId, status: 'abandoned' })
        if (error) throw error
      } else if (action === 'progress' || action === 'updateStep') {
        const stepRaw = payload.stepId ?? payload.step
        const progressRaw = payload.progress
        const currentStep = typeof stepRaw === 'string' ? stepRaw.trim() : undefined
        const progress = typeof progressRaw === 'number' ? progressRaw : undefined
        const { error } = await client.quests.update.post({
          questId,
          currentStep,
          progress,
        })
        if (error) throw error
      }

      queryClient.invalidateQueries({ queryKey: ['myQuests'] })
    },
    [deviceId, getToken, queryClient]
  )

  const vnStateQuery = useQuery({
    queryKey: ['vn-state'],
    enabled: isLoaded,
    retry: false,
    queryFn: async () => {
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const { data, error } = await client.vn.state.get()
      if (error) throw error
      return data
    },
  })

  const initialSceneId =
    lockedSceneId ?? routeSceneId ?? vnStateQuery.data?.progress?.currentScene ?? DEFAULT_VN_SCENE_ID

  useEffect(() => {
    // #region agent log (H1)
    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H1',
        location: 'VisualNovelPage.tsx:mount',
        message: 'VisualNovelExperience mounted',
        data: {
          initialSceneId,
          routeSceneId,
          lockedSceneId: Boolean(lockedSceneId),
          search: typeof window !== 'undefined' ? window.location.search : '',
        },
        timestamp: Date.now(),
      }),
    }).catch(() => { })
    // #endregion

    return () => {
      // #region agent log (H1)
      fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
          location: 'VisualNovelPage.tsx:unmount',
          message: 'VisualNovelExperience unmounted',
          data: { initialSceneId },
          timestamp: Date.now(),
        }),
      }).catch(() => { })
      // #endregion
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = fadeOverlayRef.current
    if (!el || typeof window === 'undefined') return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    const cs = window.getComputedStyle(el)
    // #region agent log (H0)
    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H0',
        location: 'VisualNovelPage.tsx:fadeOverlay:mount',
        message: 'Fade overlay computed styles on mount',
        data: {
          className: el.className,
          reduceMotion,
          animationName: cs.animationName,
          animationDuration: cs.animationDuration,
          animationTimingFunction: cs.animationTimingFunction,
          animationFillMode: cs.animationFillMode,
          opacity: cs.opacity,
          backgroundColor: cs.backgroundColor,
          position: cs.position,
          zIndex: cs.zIndex,
          pointerEvents: cs.pointerEvents,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => { })
    // #endregion

    const onEnd = () => {
      const after = window.getComputedStyle(el)
      // #region agent log (H0)
      fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H0',
          location: 'VisualNovelPage.tsx:fadeOverlay:animationend',
          message: 'Fade overlay animationend fired',
          data: {
            animationName: after.animationName,
            opacity: after.opacity,
            display: after.display,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => { })
      // #endregion
    }

    el.addEventListener('animationend', onEnd)
    return () => {
      el.removeEventListener('animationend', onEnd)
    }
  }, [])

  const initialFlags = useMemo(() => {
    const flags = vnStateQuery.data?.progress?.flags as Record<string, unknown> | undefined
    if (!flags) return []
    return Object.entries(flags)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key)
  }, [vnStateQuery.data?.progress?.flags])

  const pendingAttributeDeltas = useVisualNovelSessionStore((state) => state.pendingAttributeDeltas)
  const attributes = useMemo(() => {
    const progress = (vnStateQuery.data as any)?.progress
    const base = (progress?.attributes ?? progress?.skills ?? {}) as Record<string, number>
    const merged = { ...base }
    Object.entries(pendingAttributeDeltas).forEach(([key, delta]) => {
      if (typeof delta !== 'number' || !Number.isFinite(delta) || delta === 0) return
      merged[key] = (merged[key] ?? 0) + delta
    })
    return merged
  }, [pendingAttributeDeltas, vnStateQuery.data])

  const resources = useMemo(() => {
    const maxResources = calculateMaxResources(attributes)

    const baseHpRaw = (vnStateQuery.data as any)?.progress?.hp
    const baseHp =
      typeof baseHpRaw === 'number' && Number.isFinite(baseHpRaw)
        ? Math.max(0, Math.min(maxResources.hp, Math.trunc(baseHpRaw)))
        : maxResources.hp
    const nextHp = Math.max(0, Math.min(maxResources.hp, baseHp + pendingHpDelta))

    return {
      hp: nextHp,
      maxHp: maxResources.hp,
      ap: maxResources.ap,
      maxAp: maxResources.ap,
      mp: maxResources.mp,
      maxMp: maxResources.mp,
      wp: maxResources.wp,
      maxWp: maxResources.wp,
    }
  }, [attributes, pendingHpDelta, vnStateQuery.data])

  const handleImmediateEffects = useCallback(
    (sceneId: string, choice: VisualNovelChoice) => {
      const effects = choice.effects ?? []
      const immediateEffects = effects.filter((effect): effect is ImmediateEffect => effect.type === 'immediate')
      if (immediateEffects.length === 0) return

      // Detective Mode: local-only side effects (Dossier) via immediate actions.
      if (gameMode === 'detective') {
        immediateEffects.forEach((effect) => {
          const data = (effect.data ?? {}) as Record<string, unknown>

          switch (effect.action) {
            case 'detective_grant_evidence': {
              const evidenceId = typeof data.evidenceId === 'string' ? data.evidenceId.trim() : ''
              if (!evidenceId) return
              const evidence = getDetectiveEvidenceById(evidenceId) ?? createFallbackEvidence(evidenceId)
              useDossierStore.getState().addEvidence(evidence)
              return
            }
            // Deprecated: unlockEntry doesn't exist in DossierStore
            // case 'detective_unlock_entry': {
            //   const entryId = typeof data.entryId === 'string' ? data.entryId.trim() : ''
            //   if (!entryId) return
            //   useDossierStore.getState().unlockEntry(entryId)
            //   return
            // }
            case 'detective_unlock_point': {
              const pointId = typeof data.pointId === 'string' ? data.pointId.trim() : ''
              if (!pointId) return
              useDossierStore.getState().unlockPoint(pointId)
              return
            }
            case 'detective_add_flags': {
              const flags = typeof data.flags === 'object' && data.flags ? (data.flags as Record<string, unknown>) : null
              if (!flags) return
              useDossierStore.getState().addFlags(flags as Record<string, boolean | number>)
              return
            }
            case 'detective_open_dossier': {
              useDossierStore.getState().toggleOpen()
              return
            }
            default:
              return
          }
        })
      }

      const questEffects = immediateEffects.filter((effect) => effect.action === 'quest')
      if (questEffects.length > 0) {
        questEffects.forEach((effect) => {
          void syncImmediateQuest(effect.data as Record<string, unknown> | undefined).catch((error) => {
            console.error('[VN] Failed to sync quest effect', error)
          })
        })
      }

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

      const promptNickname = immediateEffects.find((effect) => effect.action === 'prompt_nickname')
      if (promptNickname) {
        setNicknameError(null)
        setNicknamePromptOpen(true)
        return
      }

      const openMap = immediateEffects.find((effect) => effect.action === 'open_map')
      if (openMap) {
        navigate(Routes.MAP)
        return
      }

      const openRegistration = immediateEffects.find((effect) => effect.action === 'open_registration')
      if (openRegistration) {
        const data = openRegistration.data ?? {}
        const method = typeof data.method === 'string' ? data.method : undefined
        const returnScene = pickSceneId(data.returnScene)
        navigate(
          buildUrl(Routes.REGISTRATION, {
            method,
            returnScene,
          })
        )
        return
      }

      const startCombat = immediateEffects.find((effect) => effect.action === 'start_combat')
      if (startCombat) {
        const data = startCombat.data ?? {}
        navigate(
          buildUrl(Routes.BATTLE, {
            returnScene: pickSceneId(data.returnScene) ?? sceneId,
            defeatScene: pickSceneId(data.defeatScene) ?? sceneId,
            scenarioId: pickSceneId(data.enemyKey),
            enemyKey: pickSceneId(data.enemyKey),
            hp: String(resources.hp),
            maxHp: String(resources.maxHp),
            ap: String(resources.ap),
            maxAp: String(resources.maxAp),
            mp: String(resources.mp),
            maxMp: String(resources.maxMp),
            wp: String(resources.wp),
            maxWp: String(resources.maxWp),
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
            scenarioId: pickSceneId(data.enemyKey),
            hp: String(resources.hp),
            maxHp: String(resources.maxHp),
            ap: String(resources.ap),
            maxAp: String(resources.maxAp),
            mp: String(resources.mp),
            maxMp: String(resources.maxMp),
            wp: String(resources.wp),
            maxWp: String(resources.maxWp),
          })
        )
      }
    },
    [gameMode, navigate, resources.ap, resources.hp, resources.maxAp, resources.maxHp, resources.maxMp, resources.maxWp, resources.mp, resources.wp, setNicknameError, setNicknamePromptOpen, syncImmediateQuest]
  )

  const viewModel = useVisualNovelViewModel(
    { sceneId: initialSceneId, initialFlags },
    {
      onChoiceApplied: ({ sceneId, lineId, choice }) => {
        recordChoice({ sceneId, lineId, choice })

        // Floating HP numbers (styles borrowed from battle FloatingText)
        const hpDelta = (choice.effects ?? []).reduce((acc, effect) => {
          if (effect.type !== 'immediate') return acc
          if (effect.action !== 'hp_delta') return acc
          const amount = typeof (effect.data as any)?.amount === 'number' ? (effect.data as any).amount : 0
          return Number.isFinite(amount) ? acc + amount : acc
        }, 0)

        if (hpDelta !== 0) {
          const id = `vn_hp_${Date.now()}_${Math.random().toString(16).slice(2)}`
          const text = `${hpDelta > 0 ? '+' : ''}${Math.trunc(hpDelta)} HP`
          const color = hpDelta < 0 ? '#ef4444' : '#22c55e'
          const event: FloatingTextEvent = { id, text, color }

          setFloatingEvents((prev) => [...prev, event])
          window.setTimeout(() => {
            setFloatingEvents((prev) => prev.filter((e) => e.id !== id))
          }, 1600)
        }

        handleImmediateEffects(sceneId, choice)
      },
    }
  )

  useEffect(() => {
    if (!isLoaded) return
    if (vnStateQuery.isLoading || vnStateQuery.isError) return
    if (rootSceneId !== initialSceneId) {
      // #region agent log (H1)
      fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
          location: 'VisualNovelPage.tsx:startSession',
          message: 'startSession(initialSceneId) because rootSceneId mismatch',
          data: { rootSceneId, initialSceneId },
          timestamp: Date.now(),
        }),
      }).catch(() => { })
      // #endregion
      startSession(initialSceneId)
    }
    if (vnSession?.sceneId === initialSceneId) return
    startServerSession(initialSceneId).catch((error) => {
      console.error('[VN] Failed to start server session', error)
      setVnSession(null)
    })
  }, [
    initialSceneId,
    isLoaded,
    rootSceneId,
    startSession,
    startServerSession,
    vnStateQuery.isError,
    vnStateQuery.isLoading,
    vnSession?.sceneId,
  ])

  useEffect(() => {
    const hpDeltaParam = searchParams.get('hpDelta')
    if (!hpDeltaParam) return
    if (rootSceneId !== initialSceneId) return

    const key = `${initialSceneId}:${hpDeltaParam}`
    if (appliedHpDeltaKeyRef.current === key) return

    appliedHpDeltaKeyRef.current = key

    const parsedDelta = Number(hpDeltaParam)
    if (Number.isFinite(parsedDelta) && parsedDelta !== 0) {
      applySystemHpChange(Math.trunc(parsedDelta), initialSceneId)
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('hpDelta')
    setSearchParams(nextParams, { replace: true })
  }, [applySystemHpChange, initialSceneId, rootSceneId, searchParams, setSearchParams])

  useEffect(() => {
    trackScene(viewModel.scene.id)
  }, [trackScene, viewModel.scene.id])

  const commitMutation = useMutation({
    mutationFn: async (payload: { sceneId: string; payload: CommitPayload }) => {
      if (!vnSession) {
        throw new Error('VN session is not ready')
      }
      const token = await getToken()
      const client = authenticatedClient(token || undefined, deviceId)
      const commitNonce = commitNonceRef.current ?? generateCommitNonce()
      commitNonceRef.current = commitNonce
      const { data, error } = await client.vn.commit.post({
        ...payload,
        sessionId: vnSession.sessionId,
        sessionToken: vnSession.sessionToken,
        commitNonce,
      })
      if (error) throw error
      commitNonceRef.current = null
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vn-state'] })
      queryClient.invalidateQueries({ queryKey: ['mapPoints'] })
      queryClient.invalidateQueries({ queryKey: ['myPlayer'] })
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
      const client = authenticatedClient(token || undefined, deviceId)
      const { error } = await client.vn.advice.post(payload)
      if (error) throw error
      return true
    },
  })

  const handleExit = useCallback(async () => {
    // #region agent log (H2)
    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H2',
        location: 'VisualNovelPage.tsx:handleExit:enter',
        message: 'handleExit invoked',
        data: {
          source: exitSourceRef.current,
          hasVnSession: Boolean(vnSession),
          initialSceneId,
          currentVmSceneId: viewModel.scene.id,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => { })
    // #endregion

    if (!vnSession) {
      console.warn('[VN] Missing session, skipping commit')
      return
    }
    const payload = consumePayload(Date.now())
    // #region agent log (H2)
    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H2',
        location: 'VisualNovelPage.tsx:handleExit:consumePayload',
        message: 'consumePayload called',
        data: {
          hadPayload: Boolean(payload),
          visitedScenes: payload?.visitedScenes?.length ?? 0,
          choices: payload?.choices?.length ?? 0,
          addFlags: payload?.addFlags?.length ?? 0,
          removeFlags: payload?.removeFlags?.length ?? 0,
          xpDelta: payload?.xpDelta ?? 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => { })
    // #endregion
    if (!payload) return
    await commitMutation.mutateAsync({
      sceneId: viewModel.scene.id,
      payload,
    })

    const returnPathRaw = searchParams.get('returnPath') || (window.history.state?.usr?.returnPath as string | undefined)
    if (returnPathRaw && returnPathRaw.startsWith('/')) {
      navigate(returnPathRaw)
    }
  }, [commitMutation, consumePayload, navigate, searchParams, viewModel.scene.id, vnSession])

  const handleExitRef = useRef(handleExit)
  useEffect(() => {
    handleExitRef.current = handleExit
  }, [handleExit])

  useEffect(() => {
    return () => {
      exitSourceRef.current = 'unmount'
      // #region agent log (H1)
      fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
          location: 'VisualNovelPage.tsx:cleanup',
          message: 'unmount cleanup: calling handleExitRef.current()',
          data: { initialSceneId },
          timestamp: Date.now(),
        }),
      }).catch(() => { })
      // #endregion

      if (import.meta.env.DEV) {
        // #region agent log (H1)
        fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'post-fix',
            hypothesisId: 'H1',
            location: 'VisualNovelPage.tsx:cleanup',
            message: 'DEV mode: skipping auto-commit on unmount (avoid StrictMode destructive cleanup)',
            data: { initialSceneId },
            timestamp: Date.now(),
          }),
        }).catch(() => { })
        // #endregion
        return
      }

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

  // Note: Previous auth check block removed as auth is handled above via isLoaded and handled by API
  // The block was unreachable (if (false) {...}) and caused ESLint no-constant-condition error

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
    <>
      <VNScreen
        scene={viewModel.scene}
        currentLine={viewModel.currentLine}
        choices={viewModel.choices}
        isSceneCompleted={viewModel.isSceneCompleted}
        isPending={viewModel.isPending}
        flags={viewModel.flags}
        skills={attributes}
        hp={resources.hp}
        maxHp={resources.maxHp}
        floatingEvents={floatingEvents}
        onAdvance={viewModel.goNext}
        onChoice={viewModel.choose}
        onExit={() => {
          exitSourceRef.current = 'ui'
          void handleExit()
        }}
        onAdviceViewed={handleAdviceViewed}
        isCommitting={commitMutation.isPending}
      />

      {isNicknamePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-4 space-y-3">
            <Heading level={3}>Ваше имя</Heading>
            <Text variant="muted" size="sm">
              Это будет ваш никнейм. Его можно поменять позже, но до регистрации городские QR не работают.
            </Text>

            <input
              value={nicknameDraft}
              onChange={(e) => {
                setNicknameDraft(e.target.value)
                setNicknameError(null)
              }}
              placeholder="Введите имя"
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/20"
              disabled={isNicknameSaving}
              autoFocus
            />

            {nicknameError && (
              <div className="text-sm text-red-300 bg-red-950/30 border border-red-500/30 rounded-lg px-3 py-2">
                {nicknameError}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => setNicknamePromptOpen(false)}
                disabled={isNicknameSaving}
              >
                Отмена
              </Button>
              <Button onClick={saveNickname} loading={isNicknameSaving}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fade In Overlay */}
      <div
        ref={(node) => {
          fadeOverlayRef.current = node
          if (!node || fadeOverlayLoggedRef.current || typeof window === 'undefined') return
          fadeOverlayLoggedRef.current = true
          const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
          const cs = window.getComputedStyle(node)
          const rect = node.getBoundingClientRect()
          // #region agent log (H0)
          fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'H0',
              location: 'VisualNovelPage.tsx:fadeOverlay:ref',
              message: 'Fade overlay ref assigned + computed styles',
              data: {
                className: node.className,
                reduceMotion,
                animationName: cs.animationName,
                animationDuration: cs.animationDuration,
                opacity: cs.opacity,
                backgroundColor: cs.backgroundColor,
                zIndex: cs.zIndex,
                rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
              },
              timestamp: Date.now(),
            }),
          }).catch(() => { })
          // #endregion
        }}
        className="fixed inset-0 bg-black pointer-events-none z-[100] animate-fade-out"
        style={{ animationDuration: '1s', animationFillMode: 'forwards' }}
      />
    </>
  )
}

const VisualNovelPage: React.FC = () => <VisualNovelExperience />

export default VisualNovelPage
