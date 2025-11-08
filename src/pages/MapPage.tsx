/**
 * @fileoverview Страница карты
 * FSD: pages/MapPage
 * 
 * Полноэкранная карта с floating контролами
 * Вся логика карты инкапсулирована в MapView
 */

import React, { useState } from 'react'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { MapView } from '@/widgets/map/map-view'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import type { MapPoint } from '@/shared/types/map'

export const MapPage: React.FC = () => {
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null)
  const [showSafeZones, setShowSafeZones] = useState(true)

  const handleSelectPoint = (point: MapPoint | null) => {
    setSelectedPoint(point)
    console.log('Selected point:', point)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* Заголовок и контролы - floating поверх карты */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-4 flex-wrap">
        {/* Заголовок */}
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl px-4 py-3">
          <Heading level={2} className="text-xl mb-1">Карта</Heading>
          <Text variant="muted" size="sm">
            Интерактивная карта с точками интереса и зонами
          </Text>
        </div>

        {/* Контролы карты */}
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl px-4 py-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSafeZones}
              onChange={(e) => setShowSafeZones(e.target.checked)}
              className="w-4 h-4 text-green-500 bg-gray-800 border-gray-700 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-300">Безопасные зоны</span>
          </label>
        </div>
      </div>

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
            onSelectPoint={handleSelectPoint}
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
    </div>
  )
}

export default MapPage
