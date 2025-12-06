/**
 * @fileoverview Страница карты
 * FSD: pages/MapPage
 * 
 * Полноэкранная карта с floating контролами
 * Вся логика карты инкапсулирована в MapView
 */

import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { MapView, MapFilters, MapLegend, PointsListPanel, type MapFilterType } from '@/widgets/map/map-view'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import type { MapPoint, BBox } from '@/shared/types/map'
import { Routes } from '@/shared/lib/utils/navigation'
import { resolveSceneFromPoint } from '@/features/map/lib/resolveSceneBinding'
import { usePlayerProgress } from '@/shared/hooks/usePlayer'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import type { InteractionKey } from '@/features/interaction/model/useMapPointInteraction'
import {
  buildInteractionsForPoint,
  findInteractionByKey,
  type MapPointInteraction,
} from '@/features/interaction/model/mapPointInteractions'
import { MapPointInteractionModal } from '@/features/interaction/ui/MapPointInteractionModal'
import { QRPointActivation } from '@/entities/map-point/ui/QRPointActivation'
import { QuestTracker } from '@/widgets/map/map-view/QuestTracker'

export const MapPage: React.FC = () => {
  const navigate = useNavigate()
  const { progress } = usePlayerProgress()
  const { deviceId } = useDeviceId()
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null)

  // Layer States
  const [showSafeZones, setShowSafeZones] = useState(true)
  const [showDangerZones, setShowDangerZones] = useState(true)
  const [showFog, setShowFog] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [showPointsList, setShowPointsList] = useState(false)
  const [bbox, setBbox] = useState<BBox | undefined>(undefined)
  const [activeFilters, setActiveFilters] = useState<MapFilterType[]>(['quest', 'npc', 'poi', 'board', 'anomaly'])

  const [interactionNotice, setInteractionNotice] = useState<string | null>(null)
  const [activeInteraction, setActiveInteraction] = useState<{
    point: MapPoint
    interaction: MapPointInteraction
  } | null>(null)

  // QR Scanning State
  const [isQRScanning, setIsQRScanning] = useState(false)
  const [qrTargetPoint, setQrTargetPoint] = useState<MapPoint | null>(null)

  // Mutations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activateByQR = useMutation((api.mapPoints as any).activateByQR)

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

  const handleQRScan = useCallback(async (data: string) => {
    if (!deviceId || !qrTargetPoint) return

    try {
      // Вызываем мутацию бэкенда
      const result = await activateByQR({
        pointId: qrTargetPoint._id,
        qrCode: data,
        deviceId
      })

      if (result.success) {
        setInteractionNotice(result.message || 'QR-код успешно сканирован!')
        // Закрываем сканер
        setIsQRScanning(false)
        setQrTargetPoint(null)
      } else {
        setInteractionNotice(result.message || 'Ошибка при сканировании QR-кода')
      }
    } catch (error) {
      console.error('Ошибка при активации точки:', error)
      const message = error instanceof Error ? error.message : 'Не удалось активировать точку. Попробуйте позже.'
      setInteractionNotice(message)
    }
  }, [deviceId, qrTargetPoint, activateByQR])

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

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* Заголовок и контролы - floating поверх карты */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-start justify-between gap-4">
          {/* Заголовок */}
          <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl px-4 py-3 pointer-events-auto">
            <Heading level={2} className="text-xl mb-1">Карта</Heading>
            <Text variant="muted" size="sm">
              Интерактивная карта
            </Text>
          </div>

          {/* Контролы слоев */}
          <div className="flex flex-col gap-2 items-end pointer-events-auto">
            <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl px-3 py-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={showSafeZones}
                  onChange={(e) => setShowSafeZones(e.target.checked)}
                  className="w-4 h-4 text-green-500 bg-gray-800 border-gray-700 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-300">Безопасные зоны</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={showDangerZones}
                  onChange={(e) => setShowDangerZones(e.target.checked)}
                  className="w-4 h-4 text-red-500 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">Опасные зоны</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={showFog}
                  onChange={(e) => setShowFog(e.target.checked)}
                  className="w-4 h-4 text-gray-500 bg-gray-800 border-gray-700 rounded focus:ring-gray-500"
                />
                <span className="text-sm text-gray-300">Туман войны</span>
              </label>
            </div>

            <button
              onClick={() => setShowLegend(!showLegend)}
              className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {showLegend ? 'Скрыть легенду' : 'Показать легенду'}
            </button>
            <button
              onClick={() => setShowPointsList(!showPointsList)}
              className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {showPointsList ? 'Скрыть список' : 'Список объектов'}
            </button>
          </div>
        </div>



        // ...

      </div>

      {/* Quest Tracker - Top Left below header */}
      <div className="absolute top-24 left-4 z-20 pointer-events-auto">
        <QuestTracker />
      </div>

      {/* Фильтры - Centered Top */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <MapFilters
          activeFilters={activeFilters}
          onChange={setActiveFilters}
          className="bg-gray-900/90 backdrop-blur-md rounded-full shadow-2xl border border-white/10 px-4 py-2"
        />
      </div>

      {/* Легенда */}
      {showLegend && (
        <div className="absolute top-24 right-4 z-20 pointer-events-auto">
          <MapLegend />
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
              onClick={() => setSelectedPoint(null)}
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
          onScan={handleQRScan}
          onClose={() => setIsQRScanning(false)}
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
