import React, { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { MapPointMarker } from '@/entities/map-point/ui/MapPointMarker'
import { DetectivePointMarker } from '@/features/detective/map/DetectivePointMarker'
import type { MapPoint } from '@/shared/types/map'
import type { DetectivePointMetadata } from '@/features/detective/map/types'

export interface MapMarkersProps {
    map: mapboxgl.Map | null
    points: MapPoint[]
    selectedPointId: string | null
    hoveredPointId: string | null
    onSelectPoint: (point: MapPoint | null) => void
    onHoverPoint: (point: MapPoint | null) => void
}

export const MapMarkers: React.FC<MapMarkersProps> = ({
    map,
    points,
    selectedPointId,
    hoveredPointId,
    onSelectPoint,
    onHoverPoint,
}) => {
    const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; root: Root }>>(new Map())

    useEffect(() => {
        if (!map) return

        try {
            const currentMarkers = markersRef.current

            // ÑœÑïÑøÑ¯¥?ÑæÑ¬ Ñ¬Ñø¥?Ñ§Ñæ¥?¥<, Ñ§Ñó¥'Ñó¥?¥<¥. ÑñÑóÑ¯¥O¥^Ñæ Ñ«Ñæ¥' Ñý ÑïÑøÑ«Ñ«¥<¥.
            const pointIds = new Set(points.map((p) => p.id))
            for (const [id, { marker, root }] of currentMarkers.entries()) {
                if (!pointIds.has(id)) {
                    try {
                        marker.remove()
                        queueMicrotask(() => {
                            try {
                                root.unmount()
                            } catch (e) {
                                console.warn('[MapMarkers] Failed to unmount marker root', e)
                            }
                        })
                        currentMarkers.delete(id)
                    } catch (e) {
                        console.error('[MapMarkers] Failed to remove marker', id, e)
                    }
                }
            }

            // Ñ"ÑóÑñÑøÑýÑ¯¥?ÑæÑ¬ Ñ÷Ñ¯Ñ÷ ÑóÑñÑ«ÑóÑýÑ¯¥?ÑæÑ¬ Ñ¬Ñø¥?Ñ§Ñæ¥?¥<
            for (const point of points) {
                if (!point || !point.id || !point.coordinates) {
                    continue
                }
                const existing = currentMarkers.get(point.id)

                if (existing) {
                    try {
                        // ÑzÑñÑ«ÑóÑýÑ¯¥?ÑæÑ¬ ¥?¥Ÿ¥%Ñæ¥?¥'Ñý¥Ÿ¥Z¥%Ñ÷Ñû Ñ¬Ñø¥?Ñ§Ñæ¥?
                        const { marker, root } = existing
                        marker.setLngLat([point.coordinates.lng, point.coordinates.lat])

                        // ÑzÑñÑ«ÑóÑýÑ¯¥?ÑæÑ¬ React-Ñ§ÑóÑ«¥'ÑæÑ«¥'
                        const detMeta = point.metadata as unknown as DetectivePointMetadata | undefined
                        if (detMeta?.detectiveType) {
                            root.render(
                                <DetectivePointMarker
                                    type={detMeta.detectiveType}
                                    state={detMeta.detectiveState ?? 'discovered'}
                                    title={point.title}
                                    isSelected={selectedPointId === point.id}
                                    isHovered={hoveredPointId === point.id}
                                    onClick={() => onSelectPoint(point)}
                                />
                            )
                        } else {
                            root.render(
                                <MapPointMarker
                                    point={point}
                                    isSelected={selectedPointId === point.id}
                                    isHovered={hoveredPointId === point.id}
                                    onClick={() => onSelectPoint(point)}
                                />
                            )
                        }
                    } catch (e) {
                        console.error('[MapMarkers] Failed to update marker', point.id, e)
                    }
                } else {
                    try {
                        // Ñ­ÑóÑúÑïÑø¥'Ñ¬ Ñ«ÑóÑý¥<Ñû Ñ¬Ñø¥?Ñ§Ñæ¥?
                        const el = document.createElement('div')
                        el.style.cssText = 'width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;'
                        const root = createRoot(el)

                        const detMeta = point.metadata as unknown as DetectivePointMetadata | undefined
                        if (detMeta?.detectiveType) {
                            root.render(
                                <DetectivePointMarker
                                    type={detMeta.detectiveType}
                                    state={detMeta.detectiveState ?? 'discovered'}
                                    title={point.title}
                                    isSelected={selectedPointId === point.id}
                                    isHovered={hoveredPointId === point.id}
                                    onClick={() => onSelectPoint(point)}
                                />
                            )
                        } else {
                            root.render(
                                <MapPointMarker
                                    point={point}
                                    isSelected={selectedPointId === point.id}
                                    isHovered={hoveredPointId === point.id}
                                    onClick={() => onSelectPoint(point)}
                                />
                            )
                        }


                        const marker = new mapboxgl.Marker({
                            element: el,
                            anchor: 'center',
                        })
                            .setLngLat([point.coordinates.lng, point.coordinates.lat])
                            .addTo(map)

                        // Ñ"ÑóÑñÑøÑýÑ¯¥?ÑæÑ¬ ÑóÑñ¥?ÑøÑñÑó¥'¥ÎÑ÷Ñ§Ñ÷ Ñ«ÑøÑýÑæÑïÑæÑ«Ñ÷¥?
                        el.addEventListener('mouseenter', () => {
                            onHoverPoint(point)
                        })
                        el.addEventListener('mouseleave', () => {
                            onHoverPoint(null)
                        })

                        currentMarkers.set(point.id, { marker, root })
                    } catch (e) {
                        console.error('[MapMarkers] Failed to create marker', point.id, e)
                    }
                }
            }
        } catch (error) {
            console.error('[MapMarkers] Marker reconciliation failed', error)
        }
    }, [map, points, selectedPointId, hoveredPointId, onSelectPoint, onHoverPoint])

    // Cleanup
    useEffect(() => {
        const markersStore = markersRef.current
        return () => {
            for (const { marker, root } of markersStore.values()) {
                marker.remove()
                queueMicrotask(() => root.unmount())
            }
            markersStore.clear()
        }
    }, [])

    return null
}
