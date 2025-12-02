import React, { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { MapPointMarker } from '@/entities/map-point/ui/MapPointMarker'
import type { MapPoint } from '@/shared/types/map'

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
            // console.log(`🎯 [MapMarkers] Обновление маркеров. Всего точек: ${points.length}`)

            const currentMarkers = markersRef.current

            // Удаляем маркеры, которых больше нет в данных
            const pointIds = new Set(points.map((p) => p.id))
            for (const [id, { marker, root }] of currentMarkers.entries()) {
                if (!pointIds.has(id)) {
                    try {
                        marker.remove()
                        queueMicrotask(() => {
                            try {
                                root.unmount()
                            } catch (e) {
                                console.warn('⚠️ [MapMarkers] Ошибка при размонтировании маркера:', e)
                            }
                        })
                        currentMarkers.delete(id)
                    } catch (e) {
                        console.error('❌ [MapMarkers] Ошибка при удалении маркера:', id, e)
                    }
                }
            }

            // Добавляем или обновляем маркеры
            for (const point of points) {
                if (!point || !point.id || !point.coordinates) {
                    continue
                }
                const existing = currentMarkers.get(point.id)

                if (existing) {
                    try {
                        // Обновляем существующий маркер
                        const { marker, root } = existing
                        marker.setLngLat([point.coordinates.lng, point.coordinates.lat])

                        // Обновляем React-контент
                        root.render(
                            <MapPointMarker
                                point={point}
                                isSelected={selectedPointId === point.id}
                                isHovered={hoveredPointId === point.id}
                                onClick={() => onSelectPoint(point)}
                            />
                        )
                    } catch (e) {
                        console.error('❌ [MapMarkers] Ошибка при обновлении маркера:', point.id, e)
                    }
                } else {
                    try {
                        // Создаём новый маркер
                        const el = document.createElement('div')
                        el.style.cssText = 'width: 32px; height: 32px;'
                        const root = createRoot(el)

                        root.render(
                            <MapPointMarker
                                point={point}
                                isSelected={selectedPointId === point.id}
                                isHovered={hoveredPointId === point.id}
                                onClick={() => onSelectPoint(point)}
                            />
                        )

                        const marker = new mapboxgl.Marker({
                            element: el,
                            anchor: 'center',
                        })
                            .setLngLat([point.coordinates.lng, point.coordinates.lat])
                            .addTo(map)

                        // Добавляем обработчики наведения
                        el.addEventListener('mouseenter', () => {
                            onHoverPoint(point)
                        })
                        el.addEventListener('mouseleave', () => {
                            onHoverPoint(null)
                        })

                        currentMarkers.set(point.id, { marker, root })
                    } catch (e) {
                        console.error('❌ [MapMarkers] Ошибка при создании маркера:', point.id, e)
                    }
                }
            }
        } catch (error) {
            console.error('❌ [MapMarkers] Критическая ошибка при обновлении маркеров:', error)
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
