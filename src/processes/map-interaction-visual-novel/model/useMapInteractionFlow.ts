import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { MapPoint } from '@/shared/types/map'
import { Routes } from '@/shared/lib/utils/navigation'
import { authenticatedClient } from '@/shared/api/client'
import { usePlayerProgress } from '@/shared/hooks/usePlayer'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import type { InteractionKey } from '@/entities/map-point/model/useMapPointInteraction'
import { resolveSceneFromPoint } from '@/features/map'
import { buildInteractionsForPoint, findInteractionByKey, type MapPointInteraction } from '@/features/interaction'

type ActiveInteraction = {
  point: MapPoint
  interaction: MapPointInteraction
} | null

type MapInteractionFlowOptions = {
  enabled?: boolean
  noticeTimeoutMs?: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

type Action = Record<string, unknown> & { type: string }
const isAction = (value: unknown): value is Action => isRecord(value) && typeof value.type === 'string'

export function useMapInteractionFlow(options: MapInteractionFlowOptions = {}) {
  const { enabled = true, noticeTimeoutMs = 4000 } = options

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getToken } = useAuth()
  const { deviceId } = useDeviceId()
  const { progress } = usePlayerProgress()

  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null)
  const [interactionNotice, setInteractionNotice] = useState<string | null>(null)
  const [activeInteraction, setActiveInteraction] = useState<ActiveInteraction>(null)
  const [isQRScanning, setIsQRScanning] = useState(false)
  const [qrTargetPoint, setQrTargetPoint] = useState<MapPoint | null>(null)

  const selectPoint = useCallback((point: MapPoint | null) => {
    if (!enabled) return
    setSelectedPoint(point)
  }, [enabled])

  const interactPoint = useCallback(
    (point: MapPoint) => {
      if (!enabled) return

      if (!progress) {
        setInteractionNotice('Прогресс игрока загружается...')
        setSelectedPoint(point)
        return
      }

      const resolution = resolveSceneFromPoint(point, progress)
      if (resolution.sceneId) {
        navigate(`${Routes.VISUAL_NOVEL}/${resolution.sceneId}`)
        return
      }

      setInteractionNotice(resolution.reason ?? 'Эта локация пока недоступна')
      setSelectedPoint(point)
    },
    [enabled, navigate, progress]
  )

  const selectAction = useCallback(
    (point: MapPoint, action: InteractionKey) => {
      if (!enabled) return

      setSelectedPoint(point)

      if ((action === 'dialog' || action === 'quests') && !progress) {
        setInteractionNotice('Нужна авторизация для взаимодействия...')
        return
      }

      const interactions = buildInteractionsForPoint(point)
      const interaction = findInteractionByKey(interactions, action)

      if (!interaction) {
        setInteractionNotice(`Скоро: интерфейс для действия — ${action}`)
        return
      }

      let resolvedInteraction: MapPointInteraction = interaction

      if (interaction.type === 'dialogue' && progress) {
        const resolution = resolveSceneFromPoint(point, progress)
        if (!resolution.sceneId) {
          setInteractionNotice(resolution.reason ?? 'Сцена недоступна по условиям')
          return
        }
        resolvedInteraction = { ...interaction, sceneId: resolution.sceneId }
      }

      setActiveInteraction({ point, interaction: resolvedInteraction })
    },
    [enabled, progress]
  )

  const scanQRPoint = useCallback(
    (point: MapPoint) => {
      if (!enabled) return
      setQrTargetPoint(point)
      setIsQRScanning(true)
    },
    [enabled]
  )

  const closeQRScanner = useCallback(() => {
    setIsQRScanning(false)
    setQrTargetPoint(null)
  }, [])

  const handleQRScan = useCallback(
    async (qrData: string) => {
      if (!enabled) return
      if (!qrTargetPoint) return

      try {
        const token = await getToken()
        const client = authenticatedClient(token ?? undefined, deviceId)
        const { data, error } = await client.map['activate-qr'].post({
          pointId: qrTargetPoint.id,
          qrData,
        })

        const payload: Record<string, unknown> = isRecord(data) ? data : {}
        const success = payload.success === true

        if (error || !success) {
          const message =
            typeof payload.error === 'string' && payload.error.trim().length > 0
              ? payload.error
              : 'Не удалось активировать точку'
          setInteractionNotice(message)
          return
        }

        setInteractionNotice(`Точка активирована: ${qrTargetPoint.title}`)

        await queryClient.invalidateQueries({ queryKey: ['mapPoints'] })

        const actionsRaw = payload.actions
        const actions: Action[] = Array.isArray(actionsRaw) ? actionsRaw.filter(isAction) : []

        if (actions.length > 0) {
          const noticeAction = actions.find((a) => a.type === 'notice')
          const notice = noticeAction?.message
          if (typeof notice === 'string' && notice.trim().length > 0) {
            setInteractionNotice(notice)
          }

          const needsPlayerRefresh = actions.some((a) =>
            ['grant_xp', 'grant_gold', 'add_flags', 'remove_flags', 'grant_reputation'].includes(a.type)
          )
          const needsInventoryRefresh = actions.some((a) => a.type === 'grant_items')

          if (needsPlayerRefresh) await queryClient.invalidateQueries({ queryKey: ['myPlayer'] })
          if (needsInventoryRefresh) await queryClient.invalidateQueries({ queryKey: ['myInventory'] })

          const startVn = actions.find((a) => a.type === 'start_vn')
          const startVnSceneId = startVn?.sceneId
          if (typeof startVnSceneId === 'string' && startVnSceneId.length > 0) {
            navigate(`${Routes.VISUAL_NOVEL}/${startVnSceneId}`)
            return
          }

          const startBattle = actions.find((a) => a.type === 'start_tutorial_battle')
          if (startBattle) {
            const qs = new URLSearchParams()
            if (typeof startBattle.returnScene === 'string' && startBattle.returnScene.length > 0) {
              qs.set('returnScene', startBattle.returnScene)
            }
            if (typeof startBattle.defeatScene === 'string' && startBattle.defeatScene.length > 0) {
              qs.set('defeatScene', startBattle.defeatScene)
            }
            const suffix = qs.toString() ? `?${qs.toString()}` : ''
            navigate(`${Routes.TUTORIAL_BATTLE}${suffix}`)
          }
        }
      } catch (err) {
        console.error('[useMapInteractionFlow] QR activation failed', err)
        setInteractionNotice('Ошибка активации QR. Проверьте соединение и попробуйте снова.')
      } finally {
        closeQRScanner()
      }
    },
    [closeQRScanner, deviceId, enabled, getToken, navigate, qrTargetPoint, queryClient]
  )

  const closeInteraction = useCallback(() => {
    setActiveInteraction(null)
  }, [])

  const startDialogue = useCallback(
    (sceneId: string) => {
      setActiveInteraction(null)
      navigate(`${Routes.VISUAL_NOVEL}/${sceneId}`)
    },
    [navigate]
  )

  useEffect(() => {
    if (!enabled) return
    if (!interactionNotice) return
    if (noticeTimeoutMs <= 0) return
    const timer = window.setTimeout(() => setInteractionNotice(null), noticeTimeoutMs)
    return () => {
      window.clearTimeout(timer)
    }
  }, [enabled, interactionNotice, noticeTimeoutMs])

  return {
    selectedPoint,
    interactionNotice,
    activeInteraction,
    isQRScanning,
    qrTargetPoint,
    selectPoint,
    interactPoint,
    selectAction,
    scanQRPoint,
    handleQRScan,
    closeQRScanner,
    closeInteraction,
    startDialogue,
  }
}
