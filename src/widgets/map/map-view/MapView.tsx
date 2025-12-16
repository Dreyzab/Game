import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Map, LngLatBounds } from 'mapbox-gl'
import { useAuth } from '@clerk/clerk-react'
import { MapboxMap } from '@/shared/ui/MapboxMap'
import {
  useVisibleMapPoints,
  useSafeZones,
  useGeolocation,
  useCenterOnUser
} from '@/shared/hooks/useMapData'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { authenticatedClient } from '@/shared/api/client'
import type { MapPoint, BBox } from '@/shared/types/map'
import type { InteractionKey } from '@/entities/map-point/model/useMapPointInteraction'
import { cn } from '@/shared/lib/utils/cn'

/**
 * Convert Mapbox LngLatBounds to BBox format for API requests
 */
const convertBoundsToBBox = (bounds: LngLatBounds): BBox => ({
  minLat: bounds.getSouth(),
  maxLat: bounds.getNorth(),
  minLng: bounds.getWest(),
  maxLng: bounds.getEast(),
})

// Sub-components
import { MapMarkers } from './MapMarkers'
import { MapPopups } from './MapPopups'
import { MapControls } from './MapControls'
import { FogOfWarLayer } from './FogOfWarLayer'
import { DangerZonesLayer } from './DangerZonesLayer'
import { FactionZonesLayer } from './FactionZonesLayer'
import { NavigationLayer } from './NavigationLayer'
import { OtherPlayersLayer } from './OtherPlayersLayer'
import { ZonesLayer } from './ZonesLayer'
import type { MapFilterType } from './MapFilters'

const DEFAULT_FILTERS: MapFilterType[] = ['quest', 'npc', 'poi', 'board', 'anomaly']

export interface MapViewProps {
  /** Начальный центр карты */
  initialCenter?: [number, number]
  /** Начальный зум */
  initialZoom?: number
  /** CSS класс */
  className?: string
  /** Показывать ли безопасные зоны */
  showSafeZones?: boolean
  /** Показывать ли опасные зоны */
  showDangerZones?: boolean
  /** Показывать ли туман войны */
  showFog?: boolean
  /** Активные фильтры */
  activeFilters?: MapFilterType[]
  /** Колбэк при выборе точки */
  onSelectPoint?: (point: MapPoint | null) => void
  /** Колбэк при взаимодействии */
  onInteractPoint?: (point: MapPoint) => void
  /** Колбэк при нажатии "Навигация" */
  onNavigatePoint?: (point: MapPoint) => void
  /** Колбэк при запуске QR */
  onScanQRPoint?: (point: MapPoint) => void
  onActionSelect?: (point: MapPoint, action: InteractionKey) => void
  onBoundsChange?: (bbox: BBox) => void
}

/**
 * Главный компонент карты
 */
export const MapView: React.FC<MapViewProps> = ({
  initialCenter = [7.8494, 48.0],
  initialZoom = 13,
  className,
  showSafeZones = true,
  showDangerZones = true,
  showFog = true,
  activeFilters = DEFAULT_FILTERS,
  onSelectPoint,
  onInteractPoint,
  onNavigatePoint,
  onScanQRPoint,
  onActionSelect,
  onBoundsChange,
}) => {
  const { deviceId } = useDeviceId()
  const { getToken } = useAuth()

  // Состояние карты
  const [map, setMap] = useState<Map | null>(null)
  const [bbox, setBbox] = useState<BBox | undefined>(undefined)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [navigationTarget, setNavigationTarget] = useState<MapPoint | null>(null)

  const initialCenterRef = useRef<[number, number]>(initialCenter)
  const initialZoomRef = useRef(initialZoom)
  const centerRef = useRef<[number, number]>(initialCenterRef.current)
  const zoomRef = useRef(initialZoomRef.current)
  const lastBboxRef = useRef<BBox | undefined>(undefined)

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
  const lastDiscoveryRef = useRef<number>(0)

  // Multiplayer Heartbeat
  const lastHeartbeatRef = useRef<number>(0)

  useEffect(() => {
    if (!position || !deviceId) return

    const now = Date.now()
    // Send heartbeat every 5 seconds if position is available
    if (now - lastHeartbeatRef.current < 5000) return

    ;(async () => {
      try {
        const token = await getToken()
        const client = authenticatedClient(token ?? undefined, deviceId)
        await client.presence.heartbeat.post()
      } catch (err) {
        console.warn('[MapView] Heartbeat failed', err)
      }
    })()

    lastHeartbeatRef.current = now
  }, [position, deviceId, getToken])

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
    limit: 100,
  })

  const { safeZones, isLoading: isZonesLoading } = useSafeZones({
    bbox,
    enabled: showSafeZones,
  })

  // Фильтрация точек
  const filteredPoints = useMemo(() => {
    if (!activeFilters) return points
    return points.filter(p => {
      // Mapping schema types to filter types
      const type = p.type
      if (activeFilters.includes(type as MapFilterType)) return true
      if (type === 'settlement' || type === 'location') return activeFilters.includes('poi')
      return false
    })
  }, [points, activeFilters])

  // Автоматическое открытие ближайших точек карты по реальной геопозиции игрока
  useEffect(() => {
    if (!deviceId || !position) return

    const now = Date.now()
    // Не чаще, чем раз в 15 секунд
    if (lastDiscoveryRef.current && now - lastDiscoveryRef.current < 15000) {
      return
    }
    lastDiscoveryRef.current = now

    const { latitude, longitude } = position.coords

    ;(async () => {
        try {
          const token = await getToken()
          const client = authenticatedClient(token ?? undefined, deviceId)
          await client.map.discover.post({
            lat: latitude,
            lng: longitude,
          })
        } catch (error) {
          console.warn('[MapView] discoverByProximity failed', error)
        }
      })()
  }, [deviceId, position, getToken])

  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null)

  /**
   * Обработчик загрузки карты
   */
  const handleMapLoad = useCallback((loadedMap: Map) => {
    try {
      console.log('🗺️ [MapView] Карта загружена, инициализация компонентов')

      if (!loadedMap) {
        console.error('❌ [MapView] Карта не передана в handleMapLoad')
        return
      }

      setMap(loadedMap)

      // Получаем начальные границы
      const bounds = loadedMap.getBounds()
      if (bounds) {
        const bbox = convertBoundsToBBox(bounds)
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
  const handleBoundsChange = useCallback((bounds: LngLatBounds) => {
    const newBbox = convertBoundsToBBox(bounds)
    const prev = lastBboxRef.current

    const almostEqual = (a?: number, b?: number) => {
      if (a === undefined || b === undefined) return false
      return Math.abs(a - b) < 1e-6
    }

    const same =
      prev &&
      almostEqual(prev.minLat, newBbox.minLat) &&
      almostEqual(prev.maxLat, newBbox.maxLat) &&
      almostEqual(prev.minLng, newBbox.minLng) &&
      almostEqual(prev.maxLng, newBbox.maxLng)

    if (same) return

    lastBboxRef.current = newBbox
    setBbox(newBbox)
    onBoundsChange?.(newBbox)
  }, [onBoundsChange])

  /**
   * Обработчик изменения зума
   */
  const handleZoomChange = useCallback((newZoom: number) => {
    zoomRef.current = newZoom
  }, [])

  /**
   * Обработчик наведения на точку
   */
  const handleHoverPoint = useCallback((point: MapPoint | null) => {
    setHoveredPointId(point?.id || null)
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
      centerRef.current = [point.coordinates.lng, point.coordinates.lat]
      map.flyTo({
        center: [point.coordinates.lng, point.coordinates.lat],
        zoom: targetZoom,
        duration: 1000,
      })
    }
  }, [map, onSelectPoint])

  const handleNavigatePoint = useCallback((point: MapPoint) => {
    console.log('🧭 [MapView] Навигация к точке:', point.title)
    setNavigationTarget(point)
    onNavigatePoint?.(point)
  }, [onNavigatePoint])

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

      <FogOfWarLayer
        map={map}
        playerPosition={position}
        points={points}
        visible={showFog}
      />

      <DangerZonesLayer
        map={map}
        visible={showDangerZones}
      />

      <FactionZonesLayer
        map={map}
        visible={showSafeZones}
        safeZones={safeZones}
      />

      <NavigationLayer
        map={map}
        userLocation={position}
        targetPoint={navigationTarget}
      />

      <OtherPlayersLayer
        map={map}
        userLocation={position}
      />
      <ZonesLayer map={map} />

      {/* User Location Marker */}

      <MapMarkers
        map={map}
        points={filteredPoints}
        selectedPointId={selectedPointId}
        hoveredPointId={hoveredPointId}
        onSelectPoint={handleSelectPoint}
        onHoverPoint={handleHoverPoint}
      />

      <MapPopups
        map={map}
        points={filteredPoints}
        selectedPointId={selectedPointId}
        hoveredPointId={hoveredPointId}
        onSelectPoint={handleSelectPoint}
        onInteractPoint={onInteractPoint}
        onNavigatePoint={handleNavigatePoint}
        onScanQRPoint={onScanQRPoint}
        onActionSelect={onActionSelect}
      />

      <MapControls
        onLocateUser={handleLocateUser}
        isGeoLoading={isGeoLoading}
        isPointsLoading={isPointsLoading}
        isZonesLoading={isZonesLoading}
        pointsCount={filteredPoints.length}
      />
    </div>
  )
}

export default MapView
