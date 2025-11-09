/**
 * @fileoverview Хуки для работы с данными карты
 * FSD: shared/hooks
 * 
 * Хуки для загрузки точек карты и зон из Convex
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { convexQueries } from '@/shared/api/convex'
import type { MapPoint, SafeZone, BBox } from '@/shared/types/map'
import type { LngLatBounds } from 'mapbox-gl'

/**
 * Хук для получения видимых точек карты
 */
export function useVisibleMapPoints(params: {
  bbox?: BBox
  phase?: number
  limit?: number
  deviceId?: string
  userId?: string
}) {
  const { bbox, phase, limit = 100, deviceId, userId } = params

  const queryArgs = useMemo(
    () => ({
      deviceId,
      userId,
      bbox,
      phase,
      limit,
    }),
    [bbox, deviceId, limit, phase, userId]
  )

  const [data, setData] = useState<{ points: MapPoint[]; timestamp: number; ttlMs: number } | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  console.log('📊 [useMapData] Запрос точек карты:', {
    bbox: queryArgs.bbox
      ? `${queryArgs.bbox.minLat.toFixed(3)},${queryArgs.bbox.minLng.toFixed(3)} - ${queryArgs.bbox.maxLat.toFixed(3)},${queryArgs.bbox.maxLng.toFixed(3)}`
      : 'весь мир',
    phase: queryArgs.phase ?? 'все фазы',
    limit: queryArgs.limit,
    deviceId: queryArgs.deviceId ? `${String(queryArgs.deviceId).substring(0, 8)}...` : 'нет',
  })

  // Загружаем данные с Convex
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await convexQueries.mapPoints.listVisible(queryArgs)
        
        if (!cancelled) {
          setData(result)
          
          if (result?.points) {
            console.log(`✅ [useMapData] Получено точек: ${result.points.length}`)
            console.log('📍 [useMapData] Детали точек:', result.points.map((p: MapPoint) => ({
              id: p.id,
              title: p.title,
              type: p.type,
              status: p.status,
              coords: `${p.coordinates.lat.toFixed(4)}, ${p.coordinates.lng.toFixed(4)}`,
              danger: p.metadata?.danger_level,
              faction: p.metadata?.faction
            })))
          }
        }
      } catch (error) {
        console.error('❌ [useMapData] Ошибка загрузки точек:', error)
        if (!cancelled) {
          setData({ points: [], timestamp: Date.now(), ttlMs: 0 })
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [queryArgs])

  return {
    points: (data?.points || []) as MapPoint[],
    isLoading,
    timestamp: data?.timestamp,
    ttlMs: data?.ttlMs,
  }
}

/**
 * Хук для получения безопасных зон
 */
export function useSafeZones(params: {
  bbox?: BBox
  enabled?: boolean
}) {
  const { bbox, enabled = true } = params
  const [data, setData] = useState<SafeZone[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const queryArgs = useMemo(() => (bbox ? { bbox } : undefined), [bbox])

  console.log('🟢 [useMapData] Запрос безопасных зон:', {
    enabled,
    bbox: queryArgs?.bbox
      ? `${queryArgs.bbox.minLat.toFixed(3)},${queryArgs.bbox.minLng.toFixed(3)} - ${queryArgs.bbox.maxLat.toFixed(3)},${queryArgs.bbox.maxLng.toFixed(3)}`
      : 'весь мир'
  })

  // Загружаем данные с Convex только если enabled
  useEffect(() => {
    if (!enabled) {
      setData([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await convexQueries.zones.listSafeZones(queryArgs ?? {})
        
        if (!cancelled) {
          setData(result)
          
          if (result) {
            console.log(`✅ [useMapData] Получено безопасных зон: ${result.length}`)
            if (result.length > 0) {
              console.log('🟢 [useMapData] Детали зон:', result.map((z: SafeZone) => ({
                id: z.id,
                name: z.name,
                faction: z.faction,
                points: z.polygon.length
              })))
            }
          }
        }
      } catch (error) {
        console.error('❌ [useMapData] Ошибка загрузки зон:', error)
        if (!cancelled) {
          setData([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [enabled, queryArgs])

  return {
    zones: (data || []) as SafeZone[],
    isLoading,
  }
}

/**
 * Хук для получения геолокации пользователя
 */
export function useGeolocation(options: {
  accuracy?: 'high' | 'low'
  watch?: boolean
  enabled?: boolean
} = {}) {
  const { accuracy = 'high', watch = false, enabled = true } = options

  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getCurrentPosition = useCallback(() => {
    if (!enabled || !navigator.geolocation) {
      console.warn('⚠️ [useGeolocation] Геолокация недоступна')
      setError({
        code: 0,
        message: 'Геолокация недоступна',
      } as GeolocationPositionError)
      return
    }

    console.log('📍 [useGeolocation] Запрос геолокации...')
    setIsLoading(true)
    setError(null)

    const options: PositionOptions = {
      enableHighAccuracy: accuracy === 'high',
      timeout: 10000,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('✅ [useGeolocation] Позиция получена:', {
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          accuracy: `${pos.coords.accuracy.toFixed(0)}м`
        })
        setPosition(pos)
        setIsLoading(false)
      },
      (err) => {
        console.error('❌ [useGeolocation] Ошибка:', err.message)
        setError(err)
        setIsLoading(false)
      },
      options
    )
  }, [accuracy, enabled])

  useEffect(() => {
    if (!enabled) return

    if (watch) {
      // Режим отслеживания позиции
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition(pos)
          setIsLoading(false)
        },
        (err) => {
          setError(err)
          setIsLoading(false)
        },
        {
          enableHighAccuracy: accuracy === 'high',
          timeout: 10000,
          maximumAge: 0,
        }
      )

      return () => {
        navigator.geolocation.clearWatch(watchId)
      }
    } else {
      // Одноразовый запрос
      getCurrentPosition()
    }
  }, [enabled, watch, accuracy, getCurrentPosition])

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
  }
}

/**
 * Хук для центрирования карты на пользователе
 */
export function useCenterOnUser(params: {
  position: GeolocationPosition | null
  getCurrentPosition: () => void
}) {
  const { position, getCurrentPosition } = params

  const [center, setCenter] = useState<[number, number] | undefined>(undefined)
  const [isRequesting, setIsRequesting] = useState(false)

  const handleLocateUser = () => {
    setIsRequesting(true)
    getCurrentPosition()
  }

  useEffect(() => {
    if (isRequesting && position) {
      setCenter([position.coords.longitude, position.coords.latitude])
      setIsRequesting(false)
    }
  }, [position, isRequesting])

  return {
    center,
    setCenter,
    handleLocateUser,
  }
}

/**
 * Вычисляет расстояние между двумя точками (формула Haversine)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Радиус Земли в км
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Конвертирует BBox из Mapbox в формат для Convex
 */
export function convertBBoxToConvex(bounds: LngLatBounds): BBox {
  return {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast(),
  }
}

