/**
 * @fileoverview Главный компонент карты
 * FSD: widgets/map/map-view
 * 
 * Интегрирует MapboxMap, маркеры, попапы и безопасные зоны
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { MapboxMap } from '@/shared/ui/MapboxMap'
import { MapPointMarker } from '@/entities/map-point/ui/MapPointMarker'
import { MapPointPopup } from '@/entities/map-point/ui/MapPointPopup'
import { SafeZonesControl } from './SafeZonesControl'
import { 
  useVisibleMapPoints, 
  useSafeZones, 
  useGeolocation,
  useCenterOnUser,
  convertBBoxToConvex 
} from '@/shared/hooks/useMapData'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import type { MapPoint, BBox } from '@/shared/types/map'
import { cn } from '@/shared/lib/utils/cn'

export interface MapViewProps {
  /** Начальный центр карты */
  initialCenter?: [number, number]
  /** Начальный зум */
  initialZoom?: number
  /** CSS класс */
  className?: string
  /** Показывать ли безопасные зоны */
  showSafeZones?: boolean
  /** Колбэк при выборе точки */
  onSelectPoint?: (point: MapPoint | null) => void
  /** Колбэк при взаимодействии */
  onInteractPoint?: (point: MapPoint) => void
  /** Колбэк при нажатии "Навигация" */
  onNavigatePoint?: (point: MapPoint) => void
  /** Колбэк при запуске QR */
  onScanQRPoint?: (point: MapPoint) => void
}

/**
 * Главный компонент карты
 */
export const MapView: React.FC<MapViewProps> = ({
  initialCenter = [7.8494, 48.0],
  initialZoom = 13,
  className,
  showSafeZones = true,
  onSelectPoint,
  onInteractPoint,
  onNavigatePoint,
  onScanQRPoint,
}) => {
  const { deviceId } = useDeviceId()
  
  // Состояние карты
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [bbox, setBbox] = useState<BBox | undefined>(undefined)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const initialCenterRef = useRef<[number, number]>(initialCenter)
  const initialZoomRef = useRef(initialZoom)
  const centerRef = useRef<[number, number]>(initialCenterRef.current)
  const zoomRef = useRef(initialZoomRef.current)

  // Геолокация
  const { position, isLoading: isGeoLoading, getCurrentPosition } = useGeolocation({
    accuracy: 'high',
    watch: false,
    enabled: true,
  })
  const { center: userCenter, handleLocateUser } = useCenterOnUser({
    position,
    getCurrentPosition,
  })

  // Обновляем центр при геолокации
  useEffect(() => {
    if (!userCenter || !map) {
      return
    }

    centerRef.current = userCenter
    map.flyTo({
      center: userCenter,
      duration: 800,
    })
  }, [map, userCenter])

  // Данные карты
  const { points, isLoading: isPointsLoading } = useVisibleMapPoints({
    bbox,
    deviceId,
    limit: 100,
  })

  const { zones, isLoading: isZonesLoading } = useSafeZones({
    bbox,
    enabled: showSafeZones,
  })

  // Refs для маркеров и попапов
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: Root }>>(new Map())
  const popupRef = useRef<{ popup: mapboxgl.Popup; root: Root } | null>(null)
  const safeZonesControlRef = useRef<SafeZonesControl | null>(null)

  /**
   * Обработчик загрузки карты
   */
  const handleMapLoad = useCallback((loadedMap: mapboxgl.Map) => {
    try {
      console.log('🗺️ [MapView] Карта загружена, инициализация компонентов')
      
      if (!loadedMap) {
        console.error('❌ [MapView] Карта не передана в handleMapLoad')
        return
      }
      
      setMap(loadedMap)

      // Инициализируем контрол безопасных зон
      console.log('🟢 [MapView] Инициализация контрола безопасных зон')
      safeZonesControlRef.current = new SafeZonesControl(loadedMap)

      // Получаем начальные границы
      const bounds = loadedMap.getBounds()
      if (bounds) {
        const bbox = convertBBoxToConvex(bounds)
        console.log('📐 [MapView] Начальные границы карты:', bbox)
        setBbox(bbox)
      } else {
        console.warn('⚠️ [MapView] Не удалось получить границы карты')
      }
    } catch (error) {
      console.error('❌ [MapView] Ошибка при инициализации карты:', error)
    }
  }, [])

  /**
   * Обработчик изменения границ карты
   */
  const handleBoundsChange = useCallback((bounds: mapboxgl.LngLatBounds) => {
    setBbox(convertBBoxToConvex(bounds))
  }, [])

  /**
   * Обработчик изменения зума
   */
  const handleZoomChange = useCallback((newZoom: number) => {
    zoomRef.current = newZoom
  }, [])

  /**
   * Обработчик выбора точки
   */
  const handleSelectPoint = useCallback((point: MapPoint | null) => {
    if (point) {
      console.log(`🎯 [MapView] Выбрана точка: ${point.title} (${point.id})`)
      console.log('📍 [MapView] Координаты точки:', point.coordinates)
    } else {
      console.log('❌ [MapView] Снят выбор точки')
    }
    
    setSelectedPointId(point?.id || null)
    onSelectPoint?.(point)

    if (point && map) {
      // Летим к точке
      const currentZoom = map.getZoom()
      const safeZoom = Number.isFinite(currentZoom) ? currentZoom : zoomRef.current
      const targetZoom = Math.max(safeZoom ?? 0, 15)
      console.log(`✈️ [MapView] Полёт к точке. Целевой зум: ${targetZoom}`)
      centerRef.current = [point.coordinates.lng, point.coordinates.lat]
      map.flyTo({
        center: [point.coordinates.lng, point.coordinates.lat],
        zoom: targetZoom,
        duration: 1000,
      })
    }
  }, [map, onSelectPoint])

  /**
   * Обновление маркеров
   */
  useEffect(() => {
    if (!map) return

    try {
      console.log(`🎯 [MapView] Обновление маркеров. Всего точек: ${points.length}`)

      const currentMarkers = markersRef.current

      // Удаляем маркеры, которых больше нет в данных
      const pointIds = new Set(points.map((p) => p.id))
      let removedCount = 0
      for (const [id, { marker, root }] of currentMarkers.entries()) {
        if (!pointIds.has(id)) {
          try {
            marker.remove()
            queueMicrotask(() => {
              try {
                root.unmount()
              } catch (e) {
                console.warn('⚠️ [MapView] Ошибка при размонтировании маркера:', e)
              }
            })
            currentMarkers.delete(id)
            removedCount++
          } catch (e) {
            console.error('❌ [MapView] Ошибка при удалении маркера:', id, e)
          }
        }
      }
      if (removedCount > 0) {
        console.log(`🗑️ [MapView] Удалено маркеров: ${removedCount}`)
      }

      // Добавляем или обновляем маркеры
      let addedCount = 0
      let updatedCount = 0
      for (const point of points) {
        // Проверяем валидность точки
        if (!point || !point.id || !point.coordinates) {
          console.warn('⚠️ [MapView] Невалидная точка:', point)
          continue
        }
        const existing = currentMarkers.get(point.id)

        if (existing) {
          try {
            // Обновляем существующий маркер
            const { marker, root } = existing
            marker.setLngLat([point.coordinates.lng, point.coordinates.lat])
            
            // Обновляем React-контент
            root.render(
              <MapPointMarker
                point={point}
                isSelected={selectedPointId === point.id}
                onClick={() => handleSelectPoint(point)}
              />
            )
            updatedCount++
          } catch (e) {
            console.error('❌ [MapView] Ошибка при обновлении маркера:', point.id, e)
          }
        } else {
          try {
            // Создаём новый маркер
            const el = document.createElement('div')
            el.style.cssText = 'width: 32px; height: 32px;'  // Уменьшенный размер для контейнера
            const root = createRoot(el)

            root.render(
              <MapPointMarker
                point={point}
                isSelected={selectedPointId === point.id}
                onClick={() => handleSelectPoint(point)}
              />
            )

            const marker = new mapboxgl.Marker({
              element: el,
              anchor: 'center',
            })
              .setLngLat([point.coordinates.lng, point.coordinates.lat])
              .addTo(map)

            console.log(`📍 [MapView] Маркер создан: ${point.title} на [${point.coordinates.lng}, ${point.coordinates.lat}]`)
            
            currentMarkers.set(point.id, { marker, root })
            addedCount++
          } catch (e) {
            console.error('❌ [MapView] Ошибка при создании маркера:', point.id, e)
          }
        }
      }
      
      if (addedCount > 0) {
        console.log(`➕ [MapView] Добавлено новых маркеров: ${addedCount}`)
      }
      if (updatedCount > 0) {
        console.log(`🔄 [MapView] Обновлено маркеров: ${updatedCount}`)
      }
      console.log(`✅ [MapView] Всего маркеров на карте: ${currentMarkers.size}`)
    } catch (error) {
      console.error('❌ [MapView] Критическая ошибка при обновлении маркеров:', error)
    }
  }, [map, points, selectedPointId, handleSelectPoint])

  /**
   * Обновление попапа
   */
  useEffect(() => {
    if (!map) return

    try {
      // Удаляем старый попап
      if (popupRef.current) {
        console.log('🗑️ [MapView] Удаление попапа')
        try {
          popupRef.current.popup.remove()
          queueMicrotask(() => {
            try {
              popupRef.current?.root.unmount()
            } catch (e) {
              console.warn('⚠️ [MapView] Ошибка при размонтировании попапа:', e)
            }
          })
          popupRef.current = null
        } catch (e) {
          console.error('❌ [MapView] Ошибка при удалении попапа:', e)
          popupRef.current = null
        }
      }

      // Создаём новый попап для выбранной точки
      if (selectedPointId) {
        const point = points.find((p) => p.id === selectedPointId)
        if (!point) {
          console.warn(`⚠️ [MapView] Точка ${selectedPointId} не найдена в списке`)
          return
        }

        if (!point.coordinates || typeof point.coordinates.lng !== 'number' || typeof point.coordinates.lat !== 'number') {
          console.error('❌ [MapView] Невалидные координаты точки:', point)
          return
        }

        console.log(`💬 [MapView] Создание попапа для точки: ${point.title} (${point.id})`)

        try {
          const el = document.createElement('div')
          const root = createRoot(el)

          root.render(
            <MapPointPopup
              point={point}
              onClose={() => handleSelectPoint(null)}
              onInteract={() => {
                console.log('🔄 [MapView] Взаимодействие с точкой:', point.id)
                onInteractPoint?.(point)
              }}
              onNavigate={() => {
                console.log('🧭 [MapView] Навигация к точке:', point.id)
                onNavigatePoint?.(point)
              }}
              onScanQR={() => {
                console.log('📷 [MapView] Сканирование QR для точки:', point.id)
                onScanQRPoint?.(point)
              }}
            />
          )

          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 25,
            maxWidth: '320px',
          })
            .setLngLat([point.coordinates.lng, point.coordinates.lat])
            .setDOMContent(el)
            .addTo(map)

          popup.on('close', () => {
            handleSelectPoint(null)
          })

          popupRef.current = { popup, root }
        } catch (e) {
          console.error('❌ [MapView] Ошибка при создании попапа:', e)
        }
      }
    } catch (error) {
      console.error('❌ [MapView] Критическая ошибка при обновлении попапа:', error)
    }
  }, [map, selectedPointId, points, handleSelectPoint, onInteractPoint, onNavigatePoint, onScanQRPoint])

  /**
   * Обновление безопасных зон
   */
  useEffect(() => {
    if (safeZonesControlRef.current) {
      console.log(`🟢 [MapView] Обновление безопасных зон. Всего: ${zones.length}, Видимость: ${showSafeZones}`)
      safeZonesControlRef.current.updateZones(zones)
      safeZonesControlRef.current.setVisible(showSafeZones)
    }
  }, [zones, showSafeZones])

  /**
   * Cleanup при размонтировании
   */
  useEffect(() => {
    const markersStore = markersRef.current
    const popupStore = popupRef.current
    const safeZonesStore = safeZonesControlRef.current

    return () => {
      for (const { marker, root } of markersStore.values()) {
        marker.remove()
        queueMicrotask(() => root.unmount())
      }
      markersStore.clear()

      if (popupStore) {
        popupStore.popup.remove()
        queueMicrotask(() => popupStore.root.unmount())
        popupRef.current = null
      }

      if (safeZonesStore) {
        safeZonesStore.destroy()
        safeZonesControlRef.current = null
      }
    }
  }, [])

  return (
    <div className={cn('relative w-full h-full', className)}>
      <MapboxMap
        center={initialCenterRef.current}
        zoom={initialZoomRef.current}
        onMapLoad={handleMapLoad}
        onBoundsChange={handleBoundsChange}
        onZoomChange={handleZoomChange}
        showNavigation
        showGeolocate
        showScale
        className="absolute inset-0"
      />

      {/* Кнопка центрирования на пользователе */}
      <button
        onClick={handleLocateUser}
        disabled={isGeoLoading}
        className={cn(
          'absolute top-4 left-4 z-10',
          'bg-white text-gray-900 rounded-lg shadow-lg',
          'px-4 py-2 font-medium',
          'hover:bg-gray-100 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Центрировать на моём местоположении"
      >
        {isGeoLoading ? 'Определение...' : '📍 Моё местоположение'}
      </button>

      {/* Индикатор загрузки */}
      {(isPointsLoading || isZonesLoading) && (
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
          Загрузка данных...
        </div>
      )}

      {/* Счётчик точек */}
      <div className="absolute bottom-4 right-4 z-10 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
        Точек: {points.length}
      </div>
    </div>
  )
}

export default MapView
