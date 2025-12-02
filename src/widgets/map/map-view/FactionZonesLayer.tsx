import React, { useEffect, useMemo } from 'react'
import type { Map, GeoJSONSource } from 'mapbox-gl'
import { useQuery } from 'convex/react'
import { api } from '@/shared/api/convex'
import type { Id } from '../../../../../convex/_generated/dataModel'

interface FactionZonesLayerProps {
    map: Map | null
    visible: boolean
}

interface SafeZone {
    _id: Id<'safe_zones'>
    name?: string
    faction?: string
    polygon: { lat: number; lng: number }[]
    isActive: boolean
}

export const FactionZonesLayer: React.FC<FactionZonesLayerProps> = ({ map, visible }) => {
    const rawSafeZones = useQuery(api.zones.listActiveSafeZones, {})

    const safeZones = useMemo(() => {
        return (rawSafeZones || []) as SafeZone[]
    }, [rawSafeZones])

    const sourceId = 'faction-zones-source'
    const fillLayerId = 'faction-zones-fill'
    const lineLayerId = 'faction-zones-line'

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

        if (visible && safeZones.length > 0) {
            const features = safeZones.map((zone) => ({
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

            const source = map.getSource(sourceId) as GeoJSONSource
            if (source) {
                source.setData({
                    type: 'FeatureCollection',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    features: features as any
                })
            }
        }
    }, [map, visible, safeZones])

    return null
}
