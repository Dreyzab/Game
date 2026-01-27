/**
 * @fileoverview Ñ'ÑøÑúÑóÑýÑø¥? ÑóÑñ¥'¥?¥'Ñ§Ñø ÑïÑ¯¥? Mapbox GL JS Ñ§Ñø¥?¥'¥<
 * FSD: shared/ui
 * 
 * Ñ~Ñ«Ñ÷¥ÅÑ÷ÑøÑ¯Ñ÷ÑúÑ÷¥?¥ŸÑæ¥' Ñ§Ñø¥?¥'¥Ÿ, ÑïÑóÑñÑøÑýÑ¯¥?Ñæ¥' Ñ§ÑóÑ«¥'¥?ÑóÑ¯¥< Ñ«ÑøÑýÑ÷ÑüÑø¥ÅÑ÷Ñ÷ Ñ÷ ÑüÑæÑóÑ¯ÑóÑ§Ñø¥ÅÑ÷Ñ÷,
 * ÑóÑñ¥?ÑøÑñÑø¥'¥<ÑýÑøÑæ¥' Ñó¥^Ñ÷ÑñÑ§Ñ÷ ÑúÑøÑü¥?¥ŸÑúÑ§Ñ÷ ¥?¥'Ñ÷Ñ¯¥? (fallback Ñ«Ñø Carto)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl, { type StyleSpecification } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { cn } from '@/shared/lib/utils/cn'

// ÑYÑóÑ¯¥Ÿ¥ÎÑøÑæÑ¬ ¥'ÑóÑ§ÑæÑ« Ñ÷Ñú Ñ¨Ñæ¥?ÑæÑ¬ÑæÑ«Ñ«¥<¥. ÑóÑ§¥?¥ŸÑôÑæÑ«Ñ÷¥?
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Fallback ¥?¥'Ñ÷Ñ¯¥O (Carto Dark Matter) Ñæ¥?Ñ¯Ñ÷ ¥'ÑóÑ§ÑæÑ« Ñ«Ñæ ¥ŸÑ§ÑøÑúÑøÑ«
const FALLBACK_STYLE: StyleSpecification = {
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
}

export interface MapboxMapProps {
  /** Ñ?Ñø¥ÎÑøÑ¯¥OÑ«¥<Ñû ¥ÅÑæÑ«¥'¥? Ñ§Ñø¥?¥'¥< [lng, lat] */
  center?: [number, number]
  /** Ñ?Ñø¥ÎÑøÑ¯¥OÑ«¥<Ñû Ñú¥ŸÑ¬ */
  zoom?: number
  /** Ñ­¥'Ñ÷Ñ¯¥O Ñ§Ñø¥?¥'¥< (Mapbox style URL Ñ÷Ñ¯Ñ÷ ÑóÑñ¥SÑæÑ§¥' ¥?¥'Ñ÷Ñ¯¥?) */
  style?: string | StyleSpecification
  /** ÑoÑ÷Ñ«Ñ÷Ñ¬ÑøÑ¯¥OÑ«¥<Ñû Ñú¥ŸÑ¬ */
  minZoom?: number
  /** ÑoÑøÑ§¥?Ñ÷Ñ¬ÑøÑ¯¥OÑ«¥<Ñû Ñú¥ŸÑ¬ */
  maxZoom?: number
  /** Ñ?Ñø¥ÎÑøÑ¯¥OÑ«¥<Ñû bearing (Ñ¨ÑóÑýÑó¥?Ñó¥') */
  bearing?: number
  /** Ñ?Ñø¥ÎÑøÑ¯¥OÑ«¥<Ñû pitch (Ñ«ÑøÑ§Ñ¯ÑóÑ«) */
  pitch?: number
  /** CSS Ñ§Ñ¯Ñø¥?¥? ÑïÑ¯¥? Ñ§ÑóÑ«¥'ÑæÑûÑ«Ñæ¥?Ñø */
  className?: string
  /** ÑsÑóÑ¯Ññ¥?Ñ§ Ñ¨Ñó¥?Ñ¯Ñæ ÑúÑøÑü¥?¥ŸÑúÑ§Ñ÷ Ñ§Ñø¥?¥'¥< */
  onMapLoad?: (map: mapboxgl.Map) => void
  /** ÑsÑóÑ¯Ññ¥?Ñ§ Ñ¨¥?Ñ÷ Ñ÷ÑúÑ¬ÑæÑ«ÑæÑ«Ñ÷Ñ÷ Ñü¥?ÑøÑ«Ñ÷¥Å Ñ§Ñø¥?¥'¥< */
  onBoundsChange?: (bounds: mapboxgl.LngLatBounds) => void
  /** ÑsÑóÑ¯Ññ¥?Ñ§ Ñ¨¥?Ñ÷ Ñ÷ÑúÑ¬ÑæÑ«ÑæÑ«Ñ÷Ñ÷ Ñú¥ŸÑ¬Ñø */
  onZoomChange?: (zoom: number) => void
  /** ÑYÑóÑ§ÑøÑú¥<ÑýÑø¥'¥O Ñ¯Ñ÷ Ñ§ÑóÑ«¥'¥?ÑóÑ¯¥< Ñ«ÑøÑýÑ÷ÑüÑø¥ÅÑ÷Ñ÷ */
  showNavigation?: boolean
  /** ÑYÑóÑ§ÑøÑú¥<ÑýÑø¥'¥O Ñ¯Ñ÷ Ñ§ÑóÑ«¥'¥?ÑóÑ¯ ÑüÑæÑóÑ¯ÑóÑ§Ñø¥ÅÑ÷Ñ÷ */
  showGeolocate?: boolean
  /** ÑYÑóÑ§ÑøÑú¥<ÑýÑø¥'¥O Ñ¯Ñ÷ Ñ§ÑóÑ«¥'¥?ÑóÑ¯ Ñ¬Ñø¥?¥^¥'ÑøÑñÑø */
  showScale?: boolean
  /** Ñ"Ñæ¥'Ñ÷ (React ¥?Ñ¯ÑæÑ¬ÑæÑ«¥'¥< Ñ¨ÑóÑýÑæ¥?¥. Ñ§Ñø¥?¥'¥<) */
  children?: React.ReactNode
}

/**
 * Ñ'ÑøÑúÑóÑý¥<Ñû Ñ§ÑóÑ¬Ñ¨ÑóÑ«ÑæÑ«¥' Ñ§Ñø¥?¥'¥< Mapbox GL JS
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
  const boundsChangeRef = useRef<MapboxMapProps['onBoundsChange']>(onBoundsChange)
  const zoomChangeRef = useRef<MapboxMapProps['onZoomChange']>(onZoomChange)
  const lastBoundsRef = useRef<[number, number, number, number] | null>(null) // [N,S,E,W] ¥? ÑóÑ§¥?¥ŸÑüÑ¯ÑæÑ«Ñ÷ÑæÑ¬
  const lastZoomRef = useRef<number | null>(null) // Ñú¥ŸÑ¬ ¥? ÑóÑ§¥?¥ŸÑüÑ¯ÑæÑ«Ñ÷ÑæÑ¬
  const boundsEmitTimerRef = useRef<number | null>(null)
  const lastStyleRef = useRef<string | StyleSpecification | null>(null)
  const reqLogCountRef = useRef(0)
  const didNotifyMapRef = useRef(false)

  const resolvedStyle = useMemo(() => {
    if (typeof style === 'object') return style
    if (!MAPBOX_TOKEN) return FALLBACK_STYLE
    return style
  }, [style])

  useEffect(() => {
    boundsChangeRef.current = onBoundsChange
  }, [onBoundsChange])

  useEffect(() => {
    zoomChangeRef.current = onZoomChange
  }, [onZoomChange])

  useEffect(() => {
    const container = mapContainerRef.current
    const hasExistingMap = Boolean(mapRef.current)
    const rect = container?.getBoundingClientRect()
    if (!container || hasExistingMap) return

    // Mapbox GL JS ¥'¥?ÑæÑñ¥ŸÑæ¥' Ñ«ÑæÑ¨¥Ÿ¥?¥'ÑóÑû ¥'ÑóÑ§ÑæÑ« ÑïÑøÑôÑæ ÑïÑ¯¥? ¥?¥'Ñó¥?ÑóÑ«Ñ«Ñ÷¥. ¥'ÑøÑûÑ¯ÑóÑý.
    // ÑYÑó¥?¥'ÑóÑ¬¥Ÿ Ñ§Ñ¯ÑøÑï¥'Ñ¬ Ñ¯Ñ÷ÑñÑó ¥?ÑæÑøÑ¯¥OÑ«¥<Ñû ¥'ÑóÑ§ÑæÑ«, Ñ¯Ñ÷ÑñÑó ÑñÑæÑúÑóÑ¨Ñø¥?Ñ«¥<Ñû ÑúÑøÑüÑ¯¥Ÿ¥^Ñæ¥ÎÑ«¥<Ñû,
    // ¥Î¥'ÑóÑñ¥< fallback ¥?¥'Ñ÷Ñ¯¥O Carto Ñ¬ÑóÑü Ñó¥'¥?Ñ÷¥?ÑóÑýÑø¥'¥O¥?¥? Ñý ÑïÑæÑý-¥?ÑñÑó¥?Ñ§Ñæ.
    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN
    } else {
      mapboxgl.accessToken = 'dev-fallback-token'
      console.warn('[MapboxMap] VITE_MAPBOX_TOKEN is missing. Falling back to CARTO raster tiles.')
    }

    // ÑzÑ¨¥?ÑæÑïÑæÑ¯¥?ÑæÑ¬ ¥?¥'Ñ÷Ñ¯¥O ÑïÑ¯¥? Ñ÷¥?Ñ¨ÑóÑ¯¥OÑúÑóÑýÑøÑ«Ñ÷¥?
    const mapStyle: string | StyleSpecification = resolvedStyle
    const online = typeof navigator !== 'undefined' ? navigator.onLine : null
    const styleString = typeof mapStyle === 'string' ? mapStyle : null
    const isMapboxStyleUrl = typeof styleString === 'string' && styleString.startsWith('mapbox://styles/')
    const stylePath = isMapboxStyleUrl ? styleString.slice('mapbox://styles/'.length) : null
    const [styleUser, styleId] = stylePath ? stylePath.split('/').slice(0, 2) : [null, null]

    if (isMapboxStyleUrl && MAPBOX_TOKEN && styleUser && styleId) {
      // Code removed by script
    }

    try {
      // Ñ­ÑóÑúÑïÑø¥'Ñ¬ ¥?Ñ§ÑúÑæÑ¬Ñ¨Ñ¯¥?¥? Ñ§Ñø¥?¥'¥<
      const map = new mapboxgl.Map({
        container,
        style: mapStyle,
        center,
        zoom,
        minZoom,
        maxZoom,
        bearing,
        pitch,
        attributionControl: true,
        transformRequest: (url, resourceType) => {
          if (reqLogCountRef.current < 8) {
            reqLogCountRef.current += 1
            let safeUrl = url
            try {
              const u = new URL(url)
              u.searchParams.delete('access_token')
              u.searchParams.delete('token')
              safeUrl = u.toString()
            } catch {
              // ignore URL parse errors
            }
          }
          return { url }
        },
        // ÑœÑ¯¥Ÿ¥Î¥^ÑæÑ«Ñ«Ñø¥? Ñ¨¥?ÑóÑ÷ÑúÑýÑóÑïÑ÷¥'ÑæÑ¯¥OÑ«Ñó¥?¥'¥O
        fadeDuration: 100,
        refreshExpiredTiles: false,
      })

      mapRef.current = map
      lastStyleRef.current = mapStyle
      // MapView ждёт `onMapLoad`, но в некоторых случаях `load` не наступает (map не становится idle).
      // Чтобы не зависать на вечном "Loading map…" — считаем карту "готовой к использованию" сразу после конструктора.
      didNotifyMapRef.current = true
      setIsLoaded(true)
      onMapLoad?.(map)
    }

      map.once('render', () => {
      const canvas = map.getCanvas?.()
    })

    map.once('styledata', () => {
      const styleObj = (typeof map.getStyle === 'function' ? map.getStyle() : null) as any
      const sourcesCount = styleObj?.sources ? Object.keys(styleObj.sources).length : null
    })

    map.getCanvas?.().addEventListener('webglcontextlost', () => { }, { once: true })

    // ÑzÑñ¥?ÑøÑñÑó¥'¥ÎÑ÷Ñ§ ¥Ÿ¥?Ñ¨Ñæ¥^Ñ«ÑóÑû ÑúÑøÑü¥?¥ŸÑúÑ§Ñ÷
    map.on('load', () => {
      setIsLoaded(true)
      setError(null)
      if (!didNotifyMapRef.current) {
        didNotifyMapRef.current = true
        onMapLoad?.(map)
      }
    })

    // ÑzÑñ¥?ÑøÑñÑó¥'¥ÎÑ÷Ñ§ Ñó¥^Ñ÷ÑñÑóÑ§ ÑúÑøÑü¥?¥ŸÑúÑ§Ñ÷ ¥?¥'Ñ÷Ñ¯¥?
    map.on('error', (e) => {
      console.error('[MapboxMap] Mapbox error event', e)
      // Ñ¥?Ñ¯Ñ÷ Ñó¥^Ñ÷ÑñÑ§Ñø ¥?Ñý¥?ÑúÑøÑ«Ñø ¥?Ñó ¥?¥'Ñ÷Ñ¯ÑæÑ¬ Ñ÷ Ñ¬¥< Ñæ¥%¥' Ñ«Ñæ Ñ¨¥?ÑóÑñÑóÑýÑøÑ¯Ñ÷ fallback
      if (e.error?.message?.includes('style')) {
        console.warn('[MapboxMap] Map style failed to load. Check VITE_MAPBOX_TOKEN (401/403 usually means invalid token).')
      }

      setError('Failed to load map.')
    })

    // Ñ"ÑóÑñÑøÑýÑ¯¥?ÑæÑ¬ Ñ§ÑóÑ«¥'¥?ÑóÑ¯¥< Ñ«ÑøÑýÑ÷ÑüÑø¥ÅÑ÷Ñ÷
    if (showNavigation) {
      const nav = new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      })
      map.addControl(nav, 'top-right')
    }

    // Ñ"ÑóÑñÑøÑýÑ¯¥?ÑæÑ¬ Ñ§ÑóÑ«¥'¥?ÑóÑ¯ ÑüÑæÑóÑ¯ÑóÑ§Ñø¥ÅÑ÷Ñ÷
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
    }

    // Ñ"ÑóÑñÑøÑýÑ¯¥?ÑæÑ¬ Ñ§ÑóÑ«¥'¥?ÑóÑ¯ Ñ¬Ñø¥?¥^¥'ÑøÑñÑø
    if (showScale) {
      const scale = new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric',
      })
      map.addControl(scale, 'bottom-left')
    }

    // Ñ­Ñ¯¥Ÿ¥^Ñø¥'ÑæÑ¯Ñ÷ ¥?ÑóÑñ¥<¥'Ñ÷Ñû
    const roundCoord = (value: number) => Number(value.toFixed(4)) // 4 ÑúÑ«ÑøÑ§Ñø ~ 11 Ñ¬ ¥'Ñó¥ÎÑ«Ñó¥?¥'Ñ÷
    const roundZoom = (value: number) => Number(value.toFixed(1)) // ¥^ÑøÑü 0.1

    const emitBoundsThrottled = () => {
      boundsEmitTimerRef.current = null
      const callback = boundsChangeRef.current
      if (!callback) return
      const bounds = map.getBounds()
      if (!bounds) return

      const north = roundCoord(bounds.getNorth())
      const south = roundCoord(bounds.getSouth())
      const east = roundCoord(bounds.getEast())
      const west = roundCoord(bounds.getWest())

      const prev = lastBoundsRef.current
      const unchanged =
        prev &&
        prev[0] === north &&
        prev[1] === south &&
        prev[2] === east &&
        prev[3] === west

      if (unchanged) return

      lastBoundsRef.current = [north, south, east, west]
      callback(bounds)
    }

    const scheduleBoundsEmit = () => {
      if (boundsEmitTimerRef.current !== null) return
      boundsEmitTimerRef.current = window.setTimeout(emitBoundsThrottled, 150)
    }

    const handleMoveEnd = () => {
      scheduleBoundsEmit()
    }

    const handleZoomChange = () => {
      const callback = zoomChangeRef.current
      if (!callback) return
      const currentZoom = map.getZoom()
      const rounded = roundZoom(currentZoom)
      const prev = lastZoomRef.current
      if (prev !== null && Math.abs(prev - rounded) < 0.05) return
      lastZoomRef.current = rounded
      callback(rounded)
    }

    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleZoomChange)


    // Cleanup
    return () => {
      if (boundsEmitTimerRef.current !== null) {
        clearTimeout(boundsEmitTimerRef.current)
        boundsEmitTimerRef.current = null
      }
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleZoomChange)
      map.remove()
      mapRef.current = null
    }
  } catch (err) {
    console.error('[MapboxMap] Map initialization error', err)
    setError('Failed to initialize map.')
  }
}, [
  bearing,
  center,
  maxZoom,
  minZoom,
  onMapLoad,
  pitch,
  showGeolocate,
  showNavigation,
  showScale,
  style,
  resolvedStyle,
  zoom,
])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return
    if (lastStyleRef.current === resolvedStyle) return
    lastStyleRef.current = resolvedStyle

    try {
      map.setStyle(resolvedStyle as string | StyleSpecification)
    } catch (err) {
      console.error('[MapboxMap] Failed to set style', err)
    }
  }, [resolvedStyle, isLoaded])

// ÑzÑñÑ«ÑóÑýÑ¯¥?ÑæÑ¬ ¥ÅÑæÑ«¥'¥? Ñ§Ñø¥?¥'¥< Ñ¨¥?Ñ÷ Ñ÷ÑúÑ¬ÑæÑ«ÑæÑ«Ñ÷Ñ÷ Ñ¨¥?ÑóÑ¨¥?Ñø
useEffect(() => {
  if (mapRef.current && isLoaded) {
    mapRef.current.jumpTo({ center })
  }
}, [center, isLoaded])

// ÑzÑñÑ«ÑóÑýÑ¯¥?ÑæÑ¬ Ñú¥ŸÑ¬ Ñ¨¥?Ñ÷ Ñ÷ÑúÑ¬ÑæÑ«ÑæÑ«Ñ÷Ñ÷ Ñ¨¥?ÑóÑ¨¥?Ñø
useEffect(() => {
  if (mapRef.current && isLoaded) {
    mapRef.current.setZoom(zoom)
  }
}, [zoom, isLoaded])

return (
  <div className={cn('relative w-full h-full', className)}>
    <div ref={mapContainerRef} className="absolute inset-0" />

    {/* Ñ~Ñ«ÑïÑ÷Ñ§Ñø¥'Ñó¥? ÑúÑøÑü¥?¥ŸÑúÑ§Ñ÷ */}
    {!isLoaded && !error && (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
        <div className="text-white text-lg">Loading map…</div>
      </div>
    )}

    {/* Ñ­ÑóÑóÑñ¥%ÑæÑ«Ñ÷Ñæ ÑóÑñ Ñó¥^Ñ÷ÑñÑ§Ñæ */}
    {error && (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 z-10">
        <div className="text-white text-lg">{error}</div>
      </div>
    )}

    {/* Ñ"Ñó¥ÎÑæ¥?Ñ«Ñ÷Ñæ ¥?Ñ¯ÑæÑ¬ÑæÑ«¥'¥< (¥?ÑæÑ«ÑïÑæ¥?¥?¥'¥?¥? Ñ¨ÑóÑýÑæ¥?¥. Ñ§Ñø¥?¥'¥<) */}
    {isLoaded && children}
  </div>
)
}

export default MapboxMap
