import React, { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { MapPointPopup } from '@/entities/map-point/ui/MapPointPopup'
import type { MapPoint } from '@/shared/types/map'
import type { InteractionKey } from '@/features/interaction/model/useMapPointInteraction'

export interface MapPopupsProps {
    map: mapboxgl.Map | null
    points: MapPoint[]
    selectedPointId: string | null
    hoveredPointId: string | null
    onSelectPoint: (point: MapPoint | null) => void
    onInteractPoint?: (point: MapPoint) => void
    onNavigatePoint?: (point: MapPoint) => void
    onScanQRPoint?: (point: MapPoint) => void
    onActionSelect?: (point: MapPoint, action: InteractionKey) => void
}

export const MapPopups: React.FC<MapPopupsProps> = ({
    map,
    points,
    selectedPointId,
    hoveredPointId,
    onSelectPoint,
    onInteractPoint,
    onNavigatePoint,
    onScanQRPoint,
    onActionSelect,
}) => {
    const popupRef = useRef<{ popup: mapboxgl.Popup; root: Root } | null>(null)
    const tooltipRef = useRef<{ popup: mapboxgl.Popup; root: Root | null } | null>(null)

    // Tooltip (hover)
    useEffect(() => {
        if (!map) return

        try {
            // Удаляем старый tooltip
            if (tooltipRef.current) {
                try {
                    tooltipRef.current.popup.remove()
                    queueMicrotask(() => {
                        try {
                            if (tooltipRef.current?.root) {
                                tooltipRef.current.root.unmount()
                            }
                        } catch (e) {
                            console.warn('⚠️ [MapPopups] Ошибка при размонтировании tooltip:', e)
                        }
                    })
                    tooltipRef.current = null
                } catch (e) {
                    console.error('❌ [MapPopups] Ошибка при удалении tooltip:', e)
                    tooltipRef.current = null
                }
            }

            // Создаём tooltip только если нет выбранной точки и есть наведение
            if (hoveredPointId && !selectedPointId) {
                const point = points.find((p) => p.id === hoveredPointId)
                if (!point) return

                if (!point.coordinates || typeof point.coordinates.lng !== 'number' || typeof point.coordinates.lat !== 'number') {
                    return
                }

                try {
                    const el = document.createElement('div')
                    el.className = 'bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs'
                    el.style.zIndex = '1000'
                    el.innerHTML = `
            <div class="font-bold mb-1">${point.title}</div>
            <div class="text-xs text-gray-300">${point.description || 'Нет описания'}</div>
            ${point.distance !== undefined ? `<div class="text-xs text-gray-400 mt-1">📍 ${point.distance < 1 ? `${Math.round(point.distance * 1000)} м` : `${point.distance.toFixed(1)} км`}</div>` : ''}
          `

                    const tooltip = new mapboxgl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                        offset: 15,
                        maxWidth: '300px',
                        className: 'map-tooltip',
                    })
                        .setLngLat([point.coordinates.lng, point.coordinates.lat])
                        .setDOMContent(el)
                        .addTo(map)

                    tooltipRef.current = { popup: tooltip, root: null }
                } catch (e) {
                    console.error('❌ [MapPopups] Ошибка при создании tooltip:', e)
                }
            }
        } catch (error) {
            console.error('❌ [MapPopups] Критическая ошибка при обновлении tooltip:', error)
        }
    }, [map, hoveredPointId, selectedPointId, points])

    // Popup (selection)
    useEffect(() => {
        if (!map) return

        try {
            // Если нет выбранной точки, удаляем попап
            if (!selectedPointId) {
                if (popupRef.current) {
                    try {
                        popupRef.current.popup.remove()
                        queueMicrotask(() => {
                            try {
                                popupRef.current?.root.unmount()
                            } catch (e) {
                                console.warn('⚠️ [MapPopups] Ошибка при размонтировании попапа:', e)
                            }
                        })
                        popupRef.current = null
                    } catch (e) {
                        console.error('❌ [MapPopups] Ошибка при удалении попапа:', e)
                        popupRef.current = null
                    }
                }
                return
            }

            // Если попап уже существует, обновляем его контент (или не делаем ничего, если это тот же попап)
            // Но здесь мы просто пересоздаем или обновляем, если id изменился.
            // В оригинале было: если существует, не пересоздаем. Но нам нужно обновлять контент.
            // Поэтому разделим создание и обновление.

            const point = points.find((p) => p.id === selectedPointId)
            if (!point) return

            if (!point.coordinates || typeof point.coordinates.lng !== 'number' || typeof point.coordinates.lat !== 'number') {
                return
            }

            if (!popupRef.current) {
                // Создаем новый
                try {
                    const el = document.createElement('div')
                    const root = createRoot(el)

                    root.render(
                        <MapPointPopup
                            point={point}
                            onClose={() => onSelectPoint(null)}
                            onInteract={() => onInteractPoint?.(point)}
                            onNavigate={() => onNavigatePoint?.(point)}
                            onScanQR={() => onScanQRPoint?.(point)}
                            onActionSelect={(key) => onActionSelect?.(point, key)}
                        />
                    )

                    const popup = new mapboxgl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                        closeOnMove: false,
                        offset: 25,
                        maxWidth: '320px',
                        focusAfterOpen: false,
                        className: 'custom-popup',
                    })
                        .setLngLat([point.coordinates.lng, point.coordinates.lat])
                        .setDOMContent(el)
                        .addTo(map)

                    popup.on('close', () => {
                        // Handled by onClose prop usually
                    })

                    popupRef.current = { popup, root }
                } catch (e) {
                    console.error('❌ [MapPopups] Ошибка при создании попапа:', e)
                }
            } else {
                // Обновляем существующий и переносим на новые координаты
                try {
                    popupRef.current.popup.setLngLat([point.coordinates.lng, point.coordinates.lat])
                } catch (e) {
                    console.warn('⚠️ [MapPopups] Не удалось обновить координаты попапа, пересоздаём', e)
                    try {
                        popupRef.current.popup.remove()
                        queueMicrotask(() => popupRef.current?.root.unmount())
                    } catch (removeError) {
                        console.error('❌ [MapPopups] Ошибка при удалении попапа перед пересозданием', removeError)
                    }
                    popupRef.current = null
                    return
                }

                try {
                    popupRef.current.root.render(
                        <MapPointPopup
                            point={point}
                            onClose={() => onSelectPoint(null)}
                            onInteract={() => onInteractPoint?.(point)}
                            onNavigate={() => onNavigatePoint?.(point)}
                            onScanQR={() => onScanQRPoint?.(point)}
                            onActionSelect={(key) => onActionSelect?.(point, key)}
                        />
                    )
                } catch (e) {
                    console.error('❌ [MapPopups] Ошибка при обновлении контента попапа:', e)
                }
            }

        } catch (error) {
            console.error('❌ [MapPopups] Критическая ошибка при создании попапа:', error)
        }
    }, [map, selectedPointId, points, onSelectPoint, onInteractPoint, onNavigatePoint, onScanQRPoint, onActionSelect])

    // Cleanup
    useEffect(() => {
        const popupStore = popupRef.current
        const tooltipStore = tooltipRef.current

        return () => {
            if (popupStore) {
                popupStore.popup.remove()
                queueMicrotask(() => popupStore.root.unmount())
                popupRef.current = null
            }

            if (tooltipStore) {
                tooltipStore.popup.remove()
                queueMicrotask(() => {
                    if (tooltipStore?.root) {
                        tooltipStore.root.unmount()
                    }
                })
                tooltipRef.current = null
            }
        }
    }, [])

    return null
}
