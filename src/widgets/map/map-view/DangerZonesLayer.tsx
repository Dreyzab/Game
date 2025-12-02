import React, { useEffect } from 'react'
import type { Map, GeoJSONSource } from 'mapbox-gl'
import { useQuery } from 'convex/react'
import { api } from '@/shared/api/convex'
import type { DangerZone } from '@/shared/types/map'

interface DangerZonesLayerProps {
    map: Map | null
    visible: boolean
}

export const DangerZonesLayer: React.FC<DangerZonesLayerProps> = ({ map, visible }) => {
    const dangerZones = useQuery(api.zones.listDangerZones, {}) || []

    const sourceId = 'danger-zones-source'
    const fillLayerId = 'danger-zones-fill'
    const lineLayerId = 'danger-zones-line'

    useEffect(() => {
        if (!map) return

        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            })

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

        return () => {
            if (!map || !map.getStyle()) return
            if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId)
            if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId)
            if (map.getSource(sourceId)) map.removeSource(sourceId)
        }
    }, [map])

    useEffect(() => {
        if (!map || !map.getStyle()) return

        const visibility = visible ? 'visible' : 'none'
        if (map.getLayer(fillLayerId)) map.setLayoutProperty(fillLayerId, 'visibility', visibility)
        if (map.getLayer(lineLayerId)) map.setLayoutProperty(lineLayerId, 'visibility', visibility)

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

            const source = map.getSource(sourceId) as GeoJSONSource
            if (source) {
                source.setData({
                    type: 'FeatureCollection',
                    features: features as any
                })
            }
        }
    }, [map, visible, dangerZones])

    return null
}
