/**
 * @fileoverview Базовая обёртка для Mapbox GL JS карты
 * FSD: shared/ui
 * 
 * Инициализирует карту, добавляет контролы навигации и геолокации,
 * обрабатывает ошибки загрузки стиля (fallback на Carto)
 */

import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { cn } from '@/shared/lib/utils/cn'

// Получаем токен из переменных окружения
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Fallback стиль (Carto Dark Matter) если токен не указан
const FALLBACK_STYLE = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
} as const

export interface MapboxMapProps {
  /** Начальный центр карты [lng, lat] */
  center?: [number, number]
  /** Начальный зум */
  zoom?: number
  /** Стиль карты (Mapbox style URL или объект стиля) */
  style?: string | object
  /** Минимальный зум */
  minZoom?: number
  /** Максимальный зум */
  maxZoom?: number
  /** Начальный bearing (поворот) */
  bearing?: number
  /** Начальный pitch (наклон) */
  pitch?: number
  /** CSS класс для контейнера */
  className?: string
  /** Колбэк после загрузки карты */
  onMapLoad?: (map: mapboxgl.Map) => void
  /** Колбэк при изменении границ карты */
  onBoundsChange?: (bounds: mapboxgl.LngLatBounds) => void
  /** Колбэк при изменении зума */
  onZoomChange?: (zoom: number) => void
  /** Показывать ли контролы навигации */
  showNavigation?: boolean
  /** Показывать ли контрол геолокации */
  showGeolocate?: boolean
  /** Показывать ли контрол масштаба */
  showScale?: boolean
  /** Дети (React элементы поверх карты) */
  children?: React.ReactNode
}

/**
 * Базовый компонент карты Mapbox GL JS
 */
export const MapboxMap: React.FC<MapboxMapProps> = ({
  center = [7.8494, 48.0],
  zoom = 13,
  style = 'mapbox://styles/mapbox/dark-v11',
  minZoom = 0,
  maxZoom = 22,
  bearing = 0,
  pitch = 0,
  className,
  onMapLoad,
  onBoundsChange,
  onZoomChange,
  showNavigation = true,
  showGeolocate = true,
  showScale = true,
  children,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFallbackAttempted = useRef(false)

  useEffect(() => {
    if (!mapContainerRef.current) return

    console.log('🗺️ [MapboxMap] Начало инициализации карты')
    console.log('🔑 [MapboxMap] Токен Mapbox:', MAPBOX_TOKEN ? `${MAPBOX_TOKEN.substring(0, 15)}...` : 'НЕТ')

    // Устанавливаем токен Mapbox
    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN
      console.log('✅ [MapboxMap] Токен Mapbox установлен')
    } else {
      console.warn('⚠️ [MapboxMap] VITE_MAPBOX_TOKEN не установлен. Используется fallback стиль Carto.')
    }

    // Определяем стиль для использования
    const mapStyle = !MAPBOX_TOKEN || typeof style === 'object' 
      ? (style || FALLBACK_STYLE) as mapboxgl.StyleSpecification
      : style

    console.log('🎨 [MapboxMap] Используемый стиль:', typeof mapStyle === 'string' ? mapStyle : 'Fallback Carto')

    try {
      console.log('📍 [MapboxMap] Создание карты с параметрами:', { center, zoom, minZoom, maxZoom })
      
      // Создаём экземпляр карты
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center,
        zoom,
        minZoom,
        maxZoom,
        bearing,
        pitch,
        attributionControl: true,
        // Улучшенная производительность
        fadeDuration: 100,
        refreshExpiredTiles: false,
      })

      mapRef.current = map
      console.log('✅ [MapboxMap] Экземпляр карты создан')

      // Обработчик успешной загрузки
      map.on('load', () => {
        console.log('🎉 [MapboxMap] Карта успешно загружена!')
        setIsLoaded(true)
        setError(null)
        onMapLoad?.(map)
      })

      // Обработчик ошибок загрузки стиля
      map.on('error', (e) => {
        console.error('❌ [MapboxMap] Ошибка карты:', e)
        
        // Если ошибка связана со стилем и мы ещё не пробовали fallback
        if (e.error?.message?.includes('style') && !hasFallbackAttempted.current) {
          console.warn('⚠️ [MapboxMap] Ошибка загрузки стиля Mapbox. Переключаемся на fallback Carto.')
          hasFallbackAttempted.current = true
          map.setStyle(FALLBACK_STYLE as any)
        } else {
          console.error('❌ [MapboxMap] Критическая ошибка загрузки карты')
          setError('Ошибка загрузки карты')
        }
      })

      // Добавляем контролы навигации
      if (showNavigation) {
        const nav = new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        })
        map.addControl(nav, 'top-right')
        console.log('🧭 [MapboxMap] Контрол навигации добавлен')
      }

      // Добавляем контрол геолокации
      if (showGeolocate) {
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: true,
        })
        map.addControl(geolocate, 'top-right')
        console.log('📍 [MapboxMap] Контрол геолокации добавлен')
      }

      // Добавляем контрол масштаба
      if (showScale) {
        const scale = new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'metric',
        })
        map.addControl(scale, 'bottom-left')
        console.log('📏 [MapboxMap] Контрол масштаба добавлен')
      }

      // Слушатели событий
      if (onBoundsChange) {
        map.on('moveend', () => {
          const bounds = map.getBounds()
          if (bounds) {
            console.log('🔄 [MapboxMap] Границы карты изменились:', {
              north: bounds.getNorth().toFixed(4),
              south: bounds.getSouth().toFixed(4),
              east: bounds.getEast().toFixed(4),
              west: bounds.getWest().toFixed(4)
            })
            onBoundsChange(bounds)
          }
        })
      }

      if (onZoomChange) {
        map.on('zoom', () => {
          const zoom = map.getZoom()
          console.log('🔍 [MapboxMap] Зум изменился:', zoom.toFixed(2))
          onZoomChange(zoom)
        })
      }

      // Cleanup
      return () => {
        map.remove()
        mapRef.current = null
      }
    } catch (err) {
      console.error('Ошибка инициализации карты:', err)
      setError('Не удалось инициализировать карту')
    }
  }, []) // Инициализируем только один раз

  // Обновляем центр карты при изменении пропса
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      mapRef.current.jumpTo({ center })
    }
  }, [center, isLoaded])

  // Обновляем зум при изменении пропса
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      mapRef.current.setZoom(zoom)
    }
  }, [zoom, isLoaded])

  return (
    <div className={cn('relative w-full h-full', className)}>
      <div ref={mapContainerRef} className="absolute inset-0" />
      
      {/* Индикатор загрузки */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <div className="text-white text-lg">Загрузка карты...</div>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 z-10">
          <div className="text-white text-lg">{error}</div>
        </div>
      )}

      {/* Дочерние элементы (рендерятся поверх карты) */}
      {isLoaded && children}
    </div>
  )
}

export default MapboxMap

