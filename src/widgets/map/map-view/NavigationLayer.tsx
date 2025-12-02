import React, { useEffect } from 'react'
import type { Map, GeoJSONSource } from 'mapbox-gl'
import type { MapPoint } from '@/shared/types/map'

interface NavigationLayerProps {
    map: Map | null
    userLocation: GeolocationPosition | null
    targetPoint: MapPoint | null
}

export const NavigationLayer: React.FC<NavigationLayerProps> = ({
    map,
    userLocation,
    targetPoint
}) => {
    const sourceId = 'navigation-route-source'
    const layerId = 'navigation-route-line'

    useEffect(() => {
        if (!map) return

        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                }
            })

            map.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3b82f6', // blue-500
                    'line-width': 4,
                    'line-dasharray': [2, 2]
                }
            })
        }

        return () => {
            if (!map || !map.getStyle()) return
            if (map.getLayer(layerId)) map.removeLayer(layerId)
            if (map.getSource(sourceId)) map.removeSource(sourceId)
        }
    }, [map])

    useEffect(() => {
        if (!map || !map.getStyle()) return

        const source = map.getSource(sourceId) as GeoJSONSource
        if (!source) return

        if (userLocation && targetPoint) {
            const start = [userLocation.coords.longitude, userLocation.coords.latitude]
            const end = [targetPoint.coordinates.lng, targetPoint.coordinates.lat]

            source.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: [start, end]
                }
            })
            map.setLayoutProperty(layerId, 'visibility', 'visible')
        } else {
            map.setLayoutProperty(layerId, 'visibility', 'none')
        }
    }, [map, userLocation, targetPoint])

    return null
}
