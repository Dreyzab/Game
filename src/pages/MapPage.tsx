/**
 * @fileoverview Страница карты
 * FSD: pages/MapPage
 * 
 * Полноэкранная карта с floating контролами
 * Вся логика карты инкапсулирована в MapView
 */

import React, { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { MapView, MapFilters, MapLegend, PointsListPanel, type MapFilterType } from '@/widgets/map/map-view'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import type { BBox } from '@/shared/types/map'
import { MapPointInteractionModal } from '@/features/interaction'
import { QRPointActivation } from '@/entities/map-point/ui/QRPointActivation'
import { QuestTracker } from '@/widgets/map/map-view/QuestTracker'
import { useMapInteractionFlow } from '@/processes/map-interaction-visual-novel'

export const MapPage: React.FC = () => {
  useEffect(() => {    return () => {    }
  }, [])

  const {
    selectedPoint,
    interactionNotice,
    activeInteraction,
    isQRScanning,
    qrTargetPoint,
    selectPoint: handleSelectPoint,
    interactPoint: handlePointInteract,
    selectAction: handleActionSelect,
    scanQRPoint: handleScanQRPoint,
    handleQRScan,
    closeQRScanner,
    closeInteraction: handleCloseInteraction,
    startDialogue: handleStartDialogue,
  } = useMapInteractionFlow()

  // Layer States
  const [showSafeZones, setShowSafeZones] = useState(true)
  const [showDangerZones, setShowDangerZones] = useState(true)
  const [showFog, setShowFog] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showPointsList, setShowPointsList] = useState(false)
  const [bbox, setBbox] = useState<BBox | undefined>(undefined)
  const [activeFilters, setActiveFilters] = useState<MapFilterType[]>(['quest', 'npc', 'poi', 'board', 'anomaly'])

  useEffect(() => {
    if (!isMenuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  /* moved to `src/processes/map-interaction-visual-novel/model/useMapInteractionFlow.ts`
  const [interactionNotice, setInteractionNotice] = useState<string | null>(null)
  const [activeInteraction, setActiveInteraction] = useState<{
    point: MapPoint
    interaction: MapPointInteraction
  } | null>(null)

  // QR Scanning State
  const [isQRScanning, setIsQRScanning] = useState(false)
  const [qrTargetPoint, setQrTargetPoint] = useState<MapPoint | null>(null)

  const handleSelectPoint = useCallback((point: MapPoint | null) => {
    setSelectedPoint(point)
    console.log('Selected point:', point)
  }, [])

  const handlePointInteract = useCallback(
    (point: MapPoint) => {
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
    [navigate, progress]
  )

  const handleActionSelect = useCallback(
    (point: MapPoint, action: InteractionKey) => {
      setSelectedPoint(point)

      if ((action === 'dialog' || action === 'quests') && !progress) {
        setInteractionNotice('Нужна авторизация для взаимодействия...')
        return
      }

      const interactions = buildInteractionsForPoint(point)
      const interaction = findInteractionByKey(interactions, action)

      if (!interaction) {
        setInteractionNotice('Скоро: интерфейс для действия — ' + action)
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
    [progress]
  )

  const handleScanQRPoint = useCallback((point: MapPoint) => {
    setQrTargetPoint(point)
    setIsQRScanning(true)
  }, [])

  const handleQRScan = useCallback(async (qrData: string) => {
    if (!qrTargetPoint) return

    try {
      const token = await getToken()
      const client = authenticatedClient(token ?? undefined, deviceId)
      const { data, error } = await client.map['activate-qr'].post({
        pointId: qrTargetPoint.id,
        qrData,
      })

      const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null

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

      type Action = Record<string, unknown> & { type: string }
      const isAction = (value: unknown): value is Action => isRecord(value) && typeof value.type === 'string'

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
      console.error('[MapPage] QR activation failed', err)
      setInteractionNotice('Ошибка активации QR. Проверьте соединение и попробуйте снова.')
    } finally {
      setIsQRScanning(false)
      setQrTargetPoint(null)
    }
  }, [deviceId, getToken, navigate, qrTargetPoint, queryClient])

  const handleCloseInteraction = useCallback(() => {
    setActiveInteraction(null)
  }, [])

  const handleStartDialogue = useCallback(
    (sceneId: string) => {
      setActiveInteraction(null)
      navigate(`${Routes.VISUAL_NOVEL}/${sceneId}`)
    },
    [navigate]
  )

  useEffect(() => {
    if (!interactionNotice) return
    const timer = window.setTimeout(() => setInteractionNotice(null), 4000)
    return () => {
      window.clearTimeout(timer)
    }
  }, [interactionNotice])
  */

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* Заголовок и контролы - floating поверх карты */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-start justify-between gap-4">
          {/* Меню */}
          <div className="flex flex-col gap-2 items-end pointer-events-auto">
            <button
              onClick={() => setIsMenuOpen((open) => !open)}
              className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              aria-haspopup="dialog"
              aria-expanded={isMenuOpen}
            >
              <span className="inline-flex items-center gap-2">
                {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                {isMenuOpen ? 'Закрыть меню' : 'Меню карты'}
              </span>
            </button>
          </div>
        </div>



        // ...

      </div>

      {/* Quest Tracker - Top Left below header */}
      <div className="absolute top-24 left-4 z-20 pointer-events-auto">
        <QuestTracker />
      </div>

      {isMenuOpen && (
        <div className="absolute inset-0 z-40 pointer-events-auto">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="absolute top-16 right-4 w-[min(92vw,420px)] max-h-[calc(100vh-5rem)] overflow-auto bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-bold text-white tracking-wider">Меню карты</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Фильтры, слои и легенда
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Закрыть меню"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500 mb-2">
                  Слои
                </div>
                <div className="space-y-2">
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 cursor-pointer hover:bg-black/30">
                    <span className="text-sm text-gray-200">Безопасные зоны</span>
                    <input
                      type="checkbox"
                      checked={showSafeZones}
                      onChange={(e) => setShowSafeZones(e.target.checked)}
                      className="w-4 h-4 text-green-500 bg-gray-800 border-gray-700 rounded focus:ring-green-500"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 cursor-pointer hover:bg-black/30">
                    <span className="text-sm text-gray-200">Опасные зоны</span>
                    <input
                      type="checkbox"
                      checked={showDangerZones}
                      onChange={(e) => setShowDangerZones(e.target.checked)}
                      className="w-4 h-4 text-red-500 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 cursor-pointer hover:bg-black/30">
                    <span className="text-sm text-gray-200">Туман войны</span>
                    <input
                      type="checkbox"
                      checked={showFog}
                      onChange={(e) => setShowFog(e.target.checked)}
                      className="w-4 h-4 text-gray-500 bg-gray-800 border-gray-700 rounded focus:ring-gray-500"
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500 mb-2">
                  Фильтры точек
                </div>
                <MapFilters
                  activeFilters={activeFilters}
                  onChange={setActiveFilters}
                  className="rounded-lg border border-white/10 bg-black/20 p-2"
                />
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500 mb-2">
                  Панели
                </div>
                <button
                  onClick={() => {
                    setShowPointsList((v) => !v)
                    setIsMenuOpen(false)
                  }}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 hover:bg-black/30 transition-colors text-left"
                >
                  {showPointsList ? 'Скрыть список объектов' : 'Открыть список объектов'}
                </button>
              </div>

              <div>
                <MapLegend className="bg-transparent border-0 p-0 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      {interactionNotice && (
        <div className="absolute top-32 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/15 bg-gray-900/85 px-5 py-2 text-xs uppercase tracking-[0.28em] text-white pointer-events-none">
          {interactionNotice}
        </div>
      )}

      {/* Карта - fullscreen */}
      <div className="absolute inset-0">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('❌ [MapPage] Ошибка в MapView:', error)
            console.error('📋 [MapPage] Component stack:', errorInfo.componentStack)
          }}
        >
          <MapView
            initialCenter={[7.8494, 48.0]}
            initialZoom={13}
            showSafeZones={showSafeZones}
            showDangerZones={showDangerZones}
            showFog={showFog}
            activeFilters={activeFilters}
            onSelectPoint={handleSelectPoint}
            onInteractPoint={handlePointInteract}
            onScanQRPoint={handleScanQRPoint}
            onActionSelect={handleActionSelect}
            onBoundsChange={setBbox}
            className="w-full h-full"
          />
        </ErrorBoundary>
      </div>

      {/* Информация о выбранной точке */}
      {selectedPoint && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl p-4 z-20">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-white">{selectedPoint.title}</h3>
            <button
              onClick={() => handleSelectPoint(null)}
              className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-300">{selectedPoint.description}</p>
          {selectedPoint.distance !== undefined && (
            <p className="text-xs text-gray-400 mt-2">
              Расстояние: {selectedPoint.distance < 1
                ? `${Math.round(selectedPoint.distance * 1000)} м`
                : `${selectedPoint.distance.toFixed(1)} км`}
            </p>
          )}
        </div>
      )}

      <MapPointInteractionModal
        interaction={activeInteraction?.interaction ?? null}
        onClose={handleCloseInteraction}
        onStartDialogue={handleStartDialogue}
      />

      {/* QR Scanner Modal */}
      {isQRScanning && qrTargetPoint && (
        <QRPointActivation
          pointTitle={qrTargetPoint.title}
          simulateData={qrTargetPoint.qrCode ?? `gw3:point:${qrTargetPoint.id}`}
          onScan={handleQRScan}
          onClose={closeQRScanner}
        />
      )}

      {/* Points List Panel */}
      {showPointsList && (
        <div className="absolute top-0 right-0 bottom-0 w-80 z-30 pointer-events-auto">
          <PointsListPanel
            bbox={bbox}
            activeFilters={activeFilters}
            onSelectPoint={handleSelectPoint}
            onClose={() => setShowPointsList(false)}
          />
        </div>
      )}
    </div>
  )
}

export default MapPage
