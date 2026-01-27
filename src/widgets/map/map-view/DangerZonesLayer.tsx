import React, { useEffect, useCallback } from 'react'
import type { Map, GeoJSONSource } from 'mapbox-gl'
import type { DangerZone } from '@/shared/types/map'

interface DangerZonesLayerProps {
    map: Map | null
    visible: boolean
    dangerZones?: DangerZone[]
}

export const DangerZonesLayer: React.FC<DangerZonesLayerProps> = ({ map, visible, dangerZones = [] }) => {

    const sourceId = 'danger-zones-source'
    const fillLayerId = 'danger-zones-fill'
    const lineLayerId = 'danger-zones-line'

    const isMapStyleReady = useCallback(() => !!map && !!(map as any)?.style && !!map.isStyleLoaded?.(), [map])

    useEffect(() => {
        if (!map) return

        const ensureLayers = () => {
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
                    // Fill layer
                    map.addLayer({
                        id: fillLayerId,
                        type: 'fill',
                        source: sourceId,
                        paint: {
                            'fill-color': '#ef4444', // red-500
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
                            'line-color': '#ef4444',
                            'line-width': 2,
                            'line-dasharray': [2, 1]
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

        if (visible && dangerZones.length > 0) {
            const features = (dangerZones as DangerZone[]).map((zone) => ({
                type: 'Feature',
                properties: {
                    name: zone.name,
                    dangerLevel: zone.dangerLevel
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
    }, [map, visible, dangerZones, isMapStyleReady, sourceId, fillLayerId, lineLayerId])

    return null
}
