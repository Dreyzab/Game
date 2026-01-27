import React, { useEffect, useMemo, useCallback } from 'react'
import type { Map, GeoJSONSource } from 'mapbox-gl'

interface ZonesLayerProps {
    map: Map | null
    visible?: boolean
    zones?: Array<{
        id: number | string
        name?: string
        center?: { lat: number; lng: number }
        radius?: number
        ownerFactionId?: string
        status?: string
    }>
}

export const ZonesLayer: React.FC<ZonesLayerProps> = ({ map, visible = true, zones = [] }) => {
    const sourceId = 'zones-source'
    const circleLayerId = 'zones-circle'
    const labelLayerId = 'zones-label'

    const geojson = useMemo(() => {
        if (!zones || zones.length === 0) return null

        const features = zones
            .filter(zone => zone && zone.center && typeof zone.center.lng === 'number' && typeof zone.center.lat === 'number')
            .map((zone) => {
                const center = zone.center!
                return ({
                    type: 'Feature' as const,
                    geometry: {
                        type: 'Point' as const,
                        coordinates: [center.lng, center.lat]
                    },
                    properties: {
                        id: zone.id,
                        name: zone.name || 'Unknown Zone',
                        radius: zone.radius || 100,
                        color: zone.ownerFactionId === 'stalkers' ? '#00ff00' :
                            zone.ownerFactionId === 'bandits' ? '#ff0000' : '#888888',
                        opacity: zone.status === 'locked' ? 0.1 : 0.3
                    }
                })
            })

        return {
            type: 'FeatureCollection' as const,
            features
        }
    }, [zones])

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

                // Circle layer
                if (!map.getLayer(circleLayerId)) {
                    map.addLayer({
                        id: circleLayerId,
                        type: 'circle',
                        source: sourceId,
                        paint: {
                            'circle-radius': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                10, ['/', ['get', 'radius'], 20],
                                15, ['/', ['get', 'radius'], 1]
                            ],
                            'circle-color': ['get', 'color'],
                            'circle-opacity': ['get', 'opacity'],
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#ffffff'
                        }
                    })
                }

                // Label layer
                if (!map.getLayer(labelLayerId)) {
                    map.addLayer({
                        id: labelLayerId,
                        type: 'symbol',
                        source: sourceId,
                        layout: {
                            'text-field': ['get', 'name'],
                            'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                            'text-radial-offset': 0.5,
                            'text-justify': 'auto',
                            'text-size': 12
                        },
                        paint: {
                            'text-color': '#ffffff',
                            'text-halo-color': '#000000',
                            'text-halo-width': 2
                        }
                    })
                }
            } catch {
                // Ignore transient style-loading errors
            }
        }

        ensureLayers()
        map.on('styledata', ensureLayers)

        return () => {
            map.off('styledata', ensureLayers)

            if (!isMapStyleReady()) return
            try {
                if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId)
                if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId)
                if (map.getSource(sourceId)) map.removeSource(sourceId)
            } catch {
                // cleanup
            }
        }
    }, [map, isMapStyleReady])

    useEffect(() => {
        if (!map || !isMapStyleReady()) return

        try {
            const visibility = visible ? 'visible' : 'none'
            if (map.getLayer(circleLayerId)) {
                map.setLayoutProperty(circleLayerId, 'visibility', visibility)
            }
            if (map.getLayer(labelLayerId)) {
                map.setLayoutProperty(labelLayerId, 'visibility', visibility)
            }

            if (visible && geojson) {
                const source = map.getSource(sourceId) as GeoJSONSource
                if (source) {
                    source.setData(geojson)
                }
            }
        } catch {
            // ignore
        }
    }, [map, visible, geojson, isMapStyleReady])

    return null
}
