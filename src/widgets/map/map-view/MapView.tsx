import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Map as MapboxMapInstance, LngLatBounds } from 'mapbox-gl'
import { MapboxMap } from '@/shared/ui/MapboxMap'
import { useAppAuth } from '@/shared/auth'
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
import { useInventoryStore } from '@/entities/inventory/model/store'
import { useDossierStore } from '@/features/detective/dossier'
import { DETECTIVE_CONFIG } from '@/features/detective/config'
import { getDetectivePoints } from '@/features/detective'
import { FREIBURG_1905 } from '@/shared/hexmap/regions'
import { DETECTIVE_MAP_STYLE } from '@/shared/config/mapStyles'

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
import { DetectiveModeLayer } from './DetectiveModeLayer'
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
  const { getToken } = useAppAuth()
  const gameMode = useInventoryStore((state) => state.gameMode)
  const isVintage = gameMode === 'detective'
  const detectivePointStates = useDossierStore((state) => state.pointStates)
  const toggleDossier = useDossierStore((state) => state.toggleOpen)

  // Состояние карты
  const [map, setMap] = useState<MapboxMapInstance | null>(null)
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

      ; (async () => {
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

  // Detective Mode: snap map to Freiburg 1905 center (Hardlinks are the source of truth).
  useEffect(() => {
    if (!map) return
    if (!isVintage) return

    const [lng, lat] = DETECTIVE_CONFIG.SPAWN_LNG_LAT ?? FREIBURG_1905.geoCenterLngLat

    // If we just entered mode, snap immediately (no animation) to simulate 'spawn'
    // or animate if we are just ensuring correct bounds. 
    // For now, let's fast fly.
    centerRef.current = [lng, lat]
    map.flyTo({
      center: [lng, lat],
      zoom: 15,
      offset: [0, 0], // Center it perfectly on the station/bureau
      duration: 2000, // Cinematic slow pan to the start
      essential: true
    })
  }, [isVintage, map])

  // Обновляем центр при геолокации
  useEffect(() => {
    if (!userCenter || !map || isVintage) {
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

  const mergedPoints = useMemo(() => {
    if (!isVintage) return points
    // In Detective Mode, we ONLY show points from the Case File (1905 era).
    // Standard game points (modern/fantasy) are hidden.
    return getDetectivePoints(detectivePointStates)
  }, [isVintage, points, detectivePointStates])

  const { safeZones, isLoading: isZonesLoading } = useSafeZones({
    bbox,
    enabled: showSafeZones,
  })

  // Фильтрация точек
  const filteredPoints = useMemo(() => {
    if (!activeFilters) return mergedPoints
    return mergedPoints.filter(p => {
      // Mapping schema types to filter types
      const type = p.type
      if (activeFilters.includes(type as MapFilterType)) return true
      if (type === 'settlement' || type === 'location') return activeFilters.includes('poi')
      return false
    })
  }, [mergedPoints, activeFilters])

  useEffect(() => {
    // #region agent log (debug)
    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/widgets/map/map-view/MapView.tsx:filteredPointsEffect',message:'map_points_state',data:{isVintage,hasMap:Boolean(map),bbox:bbox??null,pointsCount:points.length,mergedPointsCount:mergedPoints.length,filteredPointsCount:filteredPoints.length,detectivePointStatesCount:Object.keys(detectivePointStates??{}).length,activeFilters},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log (debug)
  }, [isVintage, map, bbox, points.length, mergedPoints.length, filteredPoints.length, detectivePointStates, activeFilters])

  // Автоматическое открытие ближайших точек карты по реальной геопозиции игрока
  useEffect(() => {
    if (isVintage) return
    if (!deviceId || !position) return

    const now = Date.now()
    // Не чаще, чем раз в 15 секунд
    if (lastDiscoveryRef.current && now - lastDiscoveryRef.current < 15000) {
      return
    }
    lastDiscoveryRef.current = now

    const { latitude, longitude } = position.coords

      ; (async () => {
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
  }, [deviceId, position, getToken, isVintage])

  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null)

  /**
   * Обработчик загрузки карты
   */
  const handleMapLoad = useCallback((loadedMap: MapboxMapInstance) => {
    try {
      console.log('🗺️ [MapView] Карта загружена, инициализация компонентов')

      if (!loadedMap) {
        console.error('❌ [MapView] Карта не передана в handleMapLoad')
        return
      }

      setMap(loadedMap)
      // #region agent log (debug)
      fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/widgets/map/map-view/MapView.tsx:handleMapLoad',message:'map_loaded',data:{isVintage,initialCenter:initialCenterRef.current,initialZoom:initialZoomRef.current,currentZoom:loadedMap.getZoom?.(),styleUrl:(loadedMap.getStyle?.() as any)?.sprite??null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion agent log (debug)

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
      {/* Vintage Style Overlay */}
      {isVintage && (
        <div
          className="absolute inset-0 pointer-events-none z-50 mix-blend-multiply opacity-15 bg-[#d4c5a3]"
          style={{ backgroundImage: 'url("/images/paper-texture.png")', backgroundSize: '200px' }}
        />
      )}

      {/* Map Container with Filters */}
      <div className={cn('absolute inset-0', isVintage && 'sepia-[.3] contrast-[1.05] brightness-95 saturate-[.9]')}>
        <MapboxMap
          center={initialCenterRef.current}
          zoom={initialZoomRef.current}
          onMapLoad={handleMapLoad}
          onBoundsChange={handleBoundsChange}
          onZoomChange={handleZoomChange}
          showNavigation={false}
          showGeolocate={false}
          showScale={false}
          className="absolute inset-0"
          style={isVintage ? DETECTIVE_MAP_STYLE : undefined}
        />
      </div>

      <FogOfWarLayer
        map={map}
        playerPosition={position}
        points={mergedPoints}
        visible={showFog}
      />

      <DangerZonesLayer
        map={map}
        // В детективном режиме эти зоны не должны отображаться (другой сеттинг/карта).
        visible={showDangerZones && !isVintage}
      />

      <FactionZonesLayer
        map={map}
        // В детективном режиме эти зоны не должны отображаться (другой сеттинг/карта).
        visible={showSafeZones && !isVintage}
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

      {/* DETECTIVE HUD */}
      {isVintage && (
        <>
          <div className="absolute top-4 left-4 z-40">
            <button
              onClick={toggleDossier}
              className="flex items-center gap-3 px-6 py-3 bg-[#1a1612] text-[#d4c5a3] border-2 border-[#d4c5a3] rounded shadow-[4px_4px_0_0_#d4c5a3] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#d4c5a3] transition-all font-serif font-bold tracking-widest uppercase"
            >
              <span className="text-xl">📁</span>
              <span>Case File</span>
            </button>
          </div>

          {/* Lazy Load Dossier UI */}
          <React.Suspense fallback={null}>
            <DossierOverlay />
          </React.Suspense>
        </>
      )}
      <DetectiveModeLayer
        map={map}
        userPosition={position}
        isVintage={isVintage}
      />
    </div>
  )
}

const DossierOverlay = React.lazy(() => import('@/features/detective/dossier').then(module => ({ default: module.Dossier })))

export default MapView
