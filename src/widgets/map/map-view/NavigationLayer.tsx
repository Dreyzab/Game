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
    const isMapStyleReady = () => !!map && !!(map as any)?.style && !!map.isStyleLoaded?.()

    useEffect(() => {
        if (!map) return

        const ensureLayers = () => {
            if (!isMapStyleReady()) return
            try {
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
                }

                if (!map.getLayer(layerId)) {
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
            } catch {
                // ignore transient style-loading errors
            }
        }

        ensureLayers()
        map.on('styledata', ensureLayers)

        return () => {
            map.off('styledata', ensureLayers)
            if (!isMapStyleReady()) return
            try {
                if (map.getLayer(layerId)) map.removeLayer(layerId)
                if (map.getSource(sourceId)) map.removeSource(sourceId)
            } catch {
                // cleanup should not crash the app
            }
        }
    }, [map])

    useEffect(() => {
        if (!map || !isMapStyleReady()) return

        try {
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
                if (map.getLayer(layerId)) {
                    map.setLayoutProperty(layerId, 'visibility', 'visible')
                }
            } else {
                if (map.getLayer(layerId)) {
                    map.setLayoutProperty(layerId, 'visibility', 'none')
                }
            }
        } catch {
            // ignore transient style-loading errors
        }
    }, [map, userLocation, targetPoint])

    return null
}
