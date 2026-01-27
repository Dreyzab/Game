import React, { useEffect, useMemo, useCallback } from 'react'
import type { Map, GeoJSONSource } from 'mapbox-gl'

interface FactionZonesLayerProps {
    map: Map | null
    visible: boolean
    safeZones?: SafeZone[]
}

interface SafeZone {
    _id: string
    name?: string
    faction?: string
    polygon: { lat: number; lng: number }[]
    isActive: boolean
}

export const FactionZonesLayer: React.FC<FactionZonesLayerProps> = ({ map, visible, safeZones = [] }) => {
    const processedSafeZones = useMemo(() => {
        return (safeZones || []) as SafeZone[]
    }, [safeZones])

    const sourceId = 'faction-zones-source'
    const fillLayerId = 'faction-zones-fill'
    const lineLayerId = 'faction-zones-line'

    const isMapStyleReady = useCallback(() => !!map && !!(map as any)?.style && !!map.isStyleLoaded?.(), [map])

    useEffect(() => {
        if (!map) return

        const ensureLayers = () => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: 'src/widgets/map/map-view/FactionZonesLayer.tsx:ensureLayers',
                    message: 'ensureLayers tick',
                    data: { ready: isMapStyleReady(), visible },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'post-fix',
                    hypothesisId: 'G'
                })
            }).catch(() => { })
            // #endregion agent log

            if (!isMapStyleReady()) return
            try {
                if (!map.getSource(sourceId)) {
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: []
                        }
                    })
                }
                if (!map.getLayer(fillLayerId)) {
                    // Fill layer with data-driven styling for factions
                    map.addLayer({
                        id: fillLayerId,
                        type: 'fill',
                        source: sourceId,
                        paint: {
                            'fill-color': [
                                'match',
                                ['get', 'faction'],
                                'fjr', '#1e3a8a',       // Deep Blue
                                'artisans', '#c2410c',  // Burnt Orange
                                'synthesis', '#10b981', // Emerald
                                'anarchists', '#991b1b',// Desaturated Red
                                'traders', '#7e22ce',   // Purple
                                'old_believers', '#d97706', // Amber
                                'farmers', '#3f6212',   // Olive
                                '#6b7280'               // Default Gray
                            ],
                            'fill-opacity': 0.2,
                        }
                    })
                }
                if (!map.getLayer(lineLayerId)) {
                    // Outline layer
                    map.addLayer({
                        id: lineLayerId,
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': [
                                'match',
                                ['get', 'faction'],
                                'fjr', '#1e3a8a',       // Deep Blue
                                'artisans', '#c2410c',  // Burnt Orange
                                'synthesis', '#10b981', // Emerald
                                'anarchists', '#991b1b',// Desaturated Red
                                'traders', '#7e22ce',   // Purple
                                'old_believers', '#d97706', // Amber
                                'farmers', '#3f6212',   // Olive
                                '#6b7280'               // Default Gray
                            ],
                            'line-width': 2,
                            'line-opacity': 0.6
                        }
                    })
                }
            } catch {
                // может попасть в окно смены стиля
            }
        }

        ensureLayers()
        map.on('styledata', ensureLayers)

        return () => {
            map.off('styledata', ensureLayers)
            if (!isMapStyleReady()) return
            try {
                if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId)
                if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId)
                if (map.getSource(sourceId)) map.removeSource(sourceId)
            } catch {
                // cleanup не должен ронять приложение
            }
        }
    }, [map, isMapStyleReady, sourceId, fillLayerId, lineLayerId, visible])

    useEffect(() => {
        if (!map || !isMapStyleReady()) return

        const visibility = visible ? 'visible' : 'none'
        try {
            if (map.getLayer(fillLayerId)) map.setLayoutProperty(fillLayerId, 'visibility', visibility)
            if (map.getLayer(lineLayerId)) map.setLayoutProperty(lineLayerId, 'visibility', visibility)
        } catch {
            return
        }

        if (visible && processedSafeZones.length > 0) {
            const features = processedSafeZones.map((zone) => ({
                type: 'Feature',
                properties: {
                    name: zone.name,
                    faction: zone.faction || 'unknown'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [zone.polygon.map((p) => [p.lng, p.lat])]
                }
            }))

            try {
                const source = map.getSource(sourceId) as GeoJSONSource
                if (source) {
                    source.setData({
                        type: 'FeatureCollection',
                        features: features as any
                    })
                }
            } catch {
                return
            }
        }
    }, [map, visible, processedSafeZones, isMapStyleReady, sourceId, fillLayerId, lineLayerId])

    return null
}
