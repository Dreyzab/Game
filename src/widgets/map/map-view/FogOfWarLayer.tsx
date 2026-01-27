import React, { useEffect } from 'react'
import type { Map, GeoJSONSource } from 'mapbox-gl'
import type { MapPoint, SafeZone, ConditionalZone } from '@/shared/types/map'
import { useFogOfWar } from '@/features/map'

interface FogOfWarLayerProps {
    map: Map | null
    playerPosition: GeolocationPosition | null
    points: MapPoint[]
    mainFactionZones?: SafeZone[]
    conditionalZones?: ConditionalZone[]
    playerVisionRadiusMeters?: number
    defaultPointRevealRadiusMeters?: number
    visible: boolean
}

export const FogOfWarLayer: React.FC<FogOfWarLayerProps> = ({
    map,
    playerPosition,
    points,
    mainFactionZones = [],
    conditionalZones = [],
    playerVisionRadiusMeters,
    defaultPointRevealRadiusMeters,
    visible
}) => {
    const sourceId = 'fog-of-war-source'
    const layerId = 'fog-of-war-layer'
    const isMapStyleReady = () => !!map && !!(map as any)?.style && !!map.isStyleLoaded?.()

    const mask = useFogOfWar({
        points,
        mainFactionZones,
        conditionalZones,
        playerPosition,
        playerVisionRadiusMeters,
        defaultPointRevealRadiusMeters,
        visible
    })

    // Initialize source and layer
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

                if (!map.getLayer(layerId)) {
                    map.addLayer({
                        id: layerId,
                        type: 'fill',
                        source: sourceId,
                        paint: {
                            'fill-color': '#000000',
                            'fill-opacity': 0.6,
                            'fill-outline-color': 'transparent'
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

    // Update visibility
    useEffect(() => {
        if (!map || !isMapStyleReady()) return
        try {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(
                    layerId,
                    'visibility',
                    visible ? 'visible' : 'none'
                )
            }
        } catch {
            // ignore transient style-loading errors
        }
    }, [map, visible])

    // Update data
    useEffect(() => {
        if (!map || !isMapStyleReady() || !mask) return
        try {
            const source = map.getSource(sourceId) as GeoJSONSource
            if (source) {
                source.setData(mask)
            }
        } catch {
            // ignore transient style-loading errors
        }
    }, [map, mask])

    return null
}
