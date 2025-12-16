import React, { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { PlayerMarker } from './PlayerMarker'

export interface OtherPlayersLayerProps {
    map: mapboxgl.Map | null
    userLocation: GeolocationPosition | null
    players?: Array<{
        _id: string
        name?: string
        status?: string
        factionId?: string
        location?: { lat: number; lng: number }
    }>
}

export const OtherPlayersLayer: React.FC<OtherPlayersLayerProps> = ({
    map,
    players = [],
}) => {

    const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: Root }>>(new Map())

    useEffect(() => {
        if (!map || !players) return

        const currentMarkers = markersRef.current
        const playerIds = new Set(players.map(p => p._id))

        // 1. Remove markers for players who left or moved out of range
        for (const [id, { marker, root }] of currentMarkers.entries()) {
            if (!playerIds.has(id)) {
                marker.remove()
                queueMicrotask(() => root.unmount())
                currentMarkers.delete(id)
            }
        }

        // 2. Update or create markers
        for (const player of players) {
            if (!player.location) continue

            const existing = currentMarkers.get(player._id)

            if (existing) {
                // Update position
                existing.marker.setLngLat([player.location.lng, player.location.lat])

                // Update content (e.g. status change)
                existing.root.render(
                    <PlayerMarker
                        name={player.name}
                        status={player.status}
                        factionId={player.factionId}
                    />
                )
            } else {
                // Create new marker
                const el = document.createElement('div')
                const root = createRoot(el)

                root.render(
                    <PlayerMarker
                        name={player.name}
                        status={player.status}
                        factionId={player.factionId}
                    />
                )

                const marker = new mapboxgl.Marker({
                    element: el,
                    anchor: 'center',
                })
                    .setLngLat([player.location.lng, player.location.lat])
                    .addTo(map)

                currentMarkers.set(player._id, { marker, root })
            }
        }

    }, [map, players])

    // Cleanup on unmount
    useEffect(() => {
        const markers = markersRef.current
        return () => {
            for (const { marker, root } of markers.values()) {
                marker.remove()
                queueMicrotask(() => root.unmount())
            }
            markers.clear()
        }
    }, [])

    return null
}
