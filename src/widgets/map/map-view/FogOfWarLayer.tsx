import React, { useEffect } from 'react'
import type { Map, GeoJSONSource } from 'mapbox-gl'
import type { MapPoint } from '@/shared/types/map'
import { useFogOfWar } from '@/features/map/hooks/useFogOfWar'

interface FogOfWarLayerProps {
    map: Map | null
    playerPosition: GeolocationPosition | null
    discoveredPoints: MapPoint[]
    visible: boolean
}

export const FogOfWarLayer: React.FC<FogOfWarLayerProps> = ({
    map,
    playerPosition,
    discoveredPoints,
    visible
}) => {
    const sourceId = 'fog-of-war-source'
    const layerId = 'fog-of-war-layer'

    const mask = useFogOfWar({
        discoveredPoints,
        playerPosition,
        visible
    })

    // Initialize source and layer
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

        return () => {
            if (!map || !map.getStyle()) return
            if (map.getLayer(layerId)) map.removeLayer(layerId)
            if (map.getSource(sourceId)) map.removeSource(sourceId)
        }
    }, [map])

    // Update visibility
    useEffect(() => {
        if (!map || !map.getStyle()) return

        if (map.getLayer(layerId)) {
            map.setLayoutProperty(
                layerId,
                'visibility',
                visible ? 'visible' : 'none'
            )
        }
    }, [map, visible])

    // Update data
    useEffect(() => {
        if (!map || !map.getStyle() || !mask) return

        const source = map.getSource(sourceId) as GeoJSONSource
        if (source) {
            source.setData(mask)
        }
    }, [map, mask])

    return null
}
