import React, { useEffect, useRef, useState } from 'react'
import mapboxgl, { Map as MapboxMapInstance, GeoJSONSource } from 'mapbox-gl'
import { createRoot } from 'react-dom/client'
import * as turf from '@turf/turf'
import { DetectiveMarker, getWalkingRoute, interpolatePosition, DETECTIVE_CONFIG } from '@/features/detective'
import { FREIBURG_1905 } from '@/shared/hexmap/regions'

interface DetectiveModeLayerProps {
    map: MapboxMapInstance | null
    userPosition: GeolocationPosition | null
    isVintage: boolean
}

export const DetectiveModeLayer: React.FC<DetectiveModeLayerProps> = ({
    map,
    userPosition,
    isVintage
}) => {
    // Movement State
    const [detectivePos, setDetectivePos] = useState<[number, number] | null>(null)
    const [isFallbackRoute, setIsFallbackRoute] = useState(false)
    const detectivePosRef = useRef<[number, number] | null>(null)
    const lastClickRef = useRef<number>(0)

    // Animation Refs
    const animationRef = useRef<number | null>(null)
    const routeStartRef = useRef<number>(0)
    const routeDurationRef = useRef<number>(0)
    const routePathRef = useRef<GeoJSON.LineString | null>(null)

    // Marker Ref
    const markerRef = useRef<mapboxgl.Marker | null>(null)
    const markerRootRef = useRef<any>(null)

    // Initialize position
    useEffect(() => {
        if (!detectivePos && isVintage) {
            const spawn =
                DETECTIVE_CONFIG.SPAWN_LNG_LAT ??
                (userPosition
                    ? ([userPosition.coords.longitude, userPosition.coords.latitude] as [number, number])
                    : (FREIBURG_1905.geoCenterLngLat as [number, number]))
            setDetectivePos(spawn)
            // #region agent log (debug)
            fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'src/widgets/map/map-view/DetectiveModeLayer.tsx:initSpawn', message: 'detective_spawn_set', data: { isVintage, spawn, usedUserPosition: Boolean(userPosition), hasSpawnOverride: Boolean(DETECTIVE_CONFIG.SPAWN_LNG_LAT) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H2' }) }).catch(() => { });
            // #endregion agent log (debug)
        }
    }, [detectivePos, isVintage, userPosition])

    useEffect(() => {
        detectivePosRef.current = detectivePos
    }, [detectivePos])

    // --- MAP LAYERS & SOURCES SETUP ---
    useEffect(() => {
        if (!map) return

        const addLayers = () => {
            const routeSourceId = 'detective-route-source'
            const routeLayerId = 'detective-route-line'
            const districtsSourceId = 'detective-districts-source'
            const districtsLayerId = 'detective-districts-fill'
            if (!(map as any)?.style || !map.isStyleLoaded?.()) return
            // #region agent log (debug)
            fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'src/widgets/map/map-view/DetectiveModeLayer.tsx:addLayers', message: 'detective_add_layers_attempt', data: { stylePresent: Boolean((map as any)?.style), styleLoaded: Boolean(map.isStyleLoaded?.()), hasRouteSource: Boolean(map.getSource?.(routeSourceId)), hasRouteLayer: Boolean(map.getLayer?.(routeLayerId)), hasDistrictsSource: Boolean(map.getSource?.(districtsSourceId)), hasDistrictsLayer: Boolean(map.getLayer?.(districtsLayerId)) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H4' }) }).catch(() => { });
            // #endregion agent log (debug)

            // 1. Route Layer
            if (!map.getSource(routeSourceId)) {
                map.addSource(routeSourceId, {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                })
                map.addLayer({
                    id: routeLayerId,
                    type: 'line',
                    source: routeSourceId,
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': '#ffaa00',
                        'line-width': 4,
                        'line-opacity': 0.8
                    }
                })
            }

            // 2. Districts Layer
            if (!map.getSource(districtsSourceId)) {
                map.addSource(districtsSourceId, {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                })
                map.addLayer({
                    id: districtsLayerId,
                    type: 'fill',
                    source: districtsSourceId,
                    paint: {
                        'fill-color': ['get', 'color'],
                        'fill-opacity': 0.15,
                        'fill-outline-color': ['get', 'color']
                    }
                }, routeLayerId)
            }
        }

        // Initial load
        if ((map as any)?.style && map.isStyleLoaded()) {
            addLayers()
        }

        // Handle style changes (when setStyle is called, layers are removed)
        const onStyleData = () => {
            if ((map as any)?.style && map.isStyleLoaded()) {
                addLayers()
            }
        }

        map.on('styledata', onStyleData)

        return () => {
            map.off('styledata', onStyleData)
            // Cleanup logic is complex here because we might want to keep layers if only re-rendering component
            // But if component unmounts, cleaning is good.
            const routeSourceId = 'detective-route-source'
            const routeLayerId = 'detective-route-line'
            const districtsSourceId = 'detective-districts-source'
            const districtsLayerId = 'detective-districts-fill'


            // Важно: в dev/StrictMode React может вызывать cleanup "сразу после mount",
            // а Mapbox во время setStyle может иметь map.style === undefined.
            // В этом состоянии map.getLayer/getSource падают через style.getOwnLayer/getOwnSource.
            const stylePresent = !!(map as any)?.style
            const styleLoaded = !!map.isStyleLoaded?.()
            if (!stylePresent || !styleLoaded) {
                return
            }

            try {
                if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId)
                if (map.getSource(routeSourceId)) map.removeSource(routeSourceId)
                if (map.getLayer(districtsLayerId)) map.removeLayer(districtsLayerId)
                if (map.getSource(districtsSourceId)) map.removeSource(districtsSourceId)
            } catch {
                // Cleanup should not crash.
                return
            }
        }
    }, [map])

    // --- RENDER DISTRICTS ---
    useEffect(() => {
        if (!map || !isVintage) return
        // map.getSource может падать, если стиль ещё не готов (map.style отсутствует)
        if (!(map as any)?.style || !map.isStyleLoaded?.()) return
        const source = map.getSource('detective-districts-source') as GeoJSONSource
        if (!source || !FREIBURG_1905.districts) return

        const features = FREIBURG_1905.districts.map(d => {
            const circle = turf.circle(d.center, d.radius || 300, { units: 'meters', steps: 64 })
            return turf.feature(circle.geometry, {
                id: d.id,
                name: d.name,
                color: d.id === 'altstadt' ? '#FFD700' :
                    d.id === 'schneckenvorstadt' ? '#FF4500' :
                        d.id === 'wiehre' ? '#00CED1' : '#9370DB'
            })
        })
        source.setData(turf.featureCollection(features))
    }, [map, isVintage])

    // --- MOVEMENT CLICK HANDLER ---
    useEffect(() => {
        if (!map || !isVintage) return

        const handleClick = async (e: mapboxgl.MapMouseEvent) => {
            const start = detectivePosRef.current
            if (!start) return

            const now = performance.now()
            if (now - lastClickRef.current < DETECTIVE_CONFIG.DEBOUNCE_MS) {
                return
            }
            lastClickRef.current = now

            try {
                const mapboxToken = (map as any)._requestManager?._customAccessToken || (window as any).mapboxgl?.accessToken || ''
                const end: [number, number] = [e.lngLat.lng, e.lngLat.lat]

                if (animationRef.current) cancelAnimationFrame(animationRef.current)

                const result = await getWalkingRoute(start, end, mapboxToken)
                // #region agent log (debug)
                fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'src/widgets/map/map-view/DetectiveModeLayer.tsx:handleClick', message: 'detective_route_result', data: { start, end, tokenPresent: Boolean(mapboxToken), isFallback: result?.isFallback ?? null, duration: result?.duration ?? null, geomType: result?.geometry?.type ?? null }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H4' }) }).catch(() => { });
                // #endregion agent log (debug)

                // Draw Route

                let source: GeoJSONSource | undefined
                try {
                    if (!(map as any)?.style || !map.isStyleLoaded?.()) return
                    source = map.getSource('detective-route-source') as GeoJSONSource
                } catch {
                    return
                }
                if (source) {
                    source.setData({
                        type: 'Feature',
                        properties: {},
                        geometry: result.geometry
                    })
                    setIsFallbackRoute(result.isFallback)
                }

                routePathRef.current = result.geometry
                routeDurationRef.current = result.duration * 1000
                routeStartRef.current = performance.now()

                const animate = (time: number) => {
                    const elapsed = time - routeStartRef.current
                    if (elapsed >= routeDurationRef.current) {
                        setDetectivePos(end)
                        detectivePosRef.current = end
                        if (source) source.setData({ type: 'FeatureCollection', features: [] }) // clear route
                        return
                    }

                    const newPos = interpolatePosition(
                        routePathRef.current!,
                        elapsed / 1000,
                        routeDurationRef.current / 1000
                    )
                    setDetectivePos(newPos)
                    detectivePosRef.current = newPos
                    animationRef.current = requestAnimationFrame(animate)
                }

                animationRef.current = requestAnimationFrame(animate)

            } catch (err) {
                console.error('Movement failed', err)
                // #region agent log (debug)
                fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'src/widgets/map/map-view/DetectiveModeLayer.tsx:handleClickCatch', message: 'detective_route_failed', data: { errorMessage: (err as any)?.message ?? String(err) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H4' }) }).catch(() => { });
                // #endregion agent log (debug)
            }
        }

        map.on('click', handleClick)
        return () => {
            map.off('click', handleClick)
        }
    }, [map, isVintage])

    // --- UPDATE ROUTE STYLE ON FALLBACK ---
    useEffect(() => {
        if (!map || !isVintage) return
        if (!(map as any)?.style || !map.isStyleLoaded?.()) return
        try {
            if (map.getLayer('detective-route-line')) {
                map.setPaintProperty('detective-route-line', 'line-color', isFallbackRoute ? '#d4c5a3' : '#ffaa00')
                map.setPaintProperty('detective-route-line', 'line-dasharray', isFallbackRoute ? [2, 2] : undefined)
            }
        } catch {
            // no-op: может попасть в окно смены стиля
        }
    }, [map, isVintage, isFallbackRoute])

    // --- MARKER RENDERING ---
    useEffect(() => {
        if (!map || !isVintage || !detectivePos) {
            if (markerRef.current) {
                markerRef.current.remove()
                markerRef.current = null
                if (markerRootRef.current) {
                    markerRootRef.current.unmount()
                    markerRootRef.current = null
                }
            }
            return
        }

        if (!markerRef.current) {
            const container = map.getContainer?.()
            if (!container) return
            const el = document.createElement('div')
            el.className = 'detective-marker-root'
            const root = createRoot(el)
            root.render(<DetectiveMarker />)
            markerRootRef.current = root

            markerRef.current = new mapboxgl.Marker({
                element: el,
                anchor: 'bottom'
            })
                .setLngLat(detectivePos)
                .addTo(map)
        } else {
            if (detectivePos) markerRef.current.setLngLat(detectivePos)
        }

    }, [map, isVintage, detectivePos])

    return null
}
