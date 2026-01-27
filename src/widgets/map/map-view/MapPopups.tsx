import React, { useEffect, useMemo, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { MapPointPopup } from '@/entities/map-point/ui/MapPointPopup'
import { DetectivePopup } from '@/features/detective/map/DetectivePopup'
import type { MapPoint } from '@/shared/types/map'
import type { DetectivePointMetadata } from '@/features/detective/map/types'
import { useMapPointInteraction, type InteractionKey } from '@/entities/map-point/model/useMapPointInteraction'

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
    const selectedPoint = useMemo(
        () => points.find((p) => p.id === selectedPointId) ?? null,
        [points, selectedPointId]
    )
    const { actions } = useMapPointInteraction(selectedPoint)

    // Tooltip (hover)
    useEffect(() => {
        if (!map) return

        try {
            if (tooltipRef.current) {
                try {
                    tooltipRef.current.popup.remove()
                    queueMicrotask(() => {
                        try {
                            if (tooltipRef.current?.root) {
                                tooltipRef.current.root.unmount()
                            }
                        } catch (e) {
                            console.warn(`[MapPopups] Failed to unmount tooltip root:`, e)
                        }
                    })
                    tooltipRef.current = null
                } catch (e) {
                    console.error('[MapPopups] Failed to remove tooltip:', e)
                    tooltipRef.current = null
                }
            }

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
                    const allowUnsafeTooltipHtml =
                        (import.meta.env.VITE_ENABLE_UNSAFE_TOOLTIP_HTML ?? '').toLowerCase() === 'true'

                    if (allowUnsafeTooltipHtml) {
                        el.innerHTML = `
            <div class="font-bold mb-1">${point.title}</div>
            <div class="text-xs text-gray-300">${point.description || "No description"}</div>
            ${point.distance !== undefined ? `<div class="text-xs text-gray-400 mt-1">Dist: ${point.distance < 1 ? `${Math.round(point.distance * 1000)} m` : `${point.distance.toFixed(1)} km`}</div>` : ''}
          `
                    } else {
                        const titleEl = document.createElement('div')
                        titleEl.className = 'font-bold mb-1'
                        titleEl.textContent = point.title

                        const descEl = document.createElement('div')
                        descEl.className = 'text-xs text-gray-300'
                        descEl.textContent = point.description || 'No description'

                        el.appendChild(titleEl)
                        el.appendChild(descEl)

                        if (point.distance !== undefined) {
                            const distanceEl = document.createElement('div')
                            distanceEl.className = 'text-xs text-gray-400 mt-1'
                            distanceEl.textContent =
                                point.distance < 1
                                    ? `Dist: ${Math.round(point.distance * 1000)} m`
                                    : `Dist: ${point.distance.toFixed(1)} km`
                            el.appendChild(distanceEl)
                        }
                    }

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
                    console.error('[MapPopups] Failed to create tooltip:', e)
                }
            }
        } catch (error) {
            console.error(`[MapPopups] General error in tooltip effect:`, error)
        }
    }, [map, hoveredPointId, selectedPointId, points])

    // Popup (selection)
    useEffect(() => {
        if (!map) return

        try {
            if (!selectedPointId) {
                if (popupRef.current) {
                    try {
                        popupRef.current.popup.remove()
                        queueMicrotask(() => {
                            try {
                                popupRef.current?.root.unmount()
                            } catch (e) {
                                console.warn(`[MapPopups] Failed to unmount popup root:`, e)
                            }
                        })
                        popupRef.current = null
                    } catch (e) {
                        console.error('[MapPopups] Failed to remove popup:', e)
                        popupRef.current = null
                    }
                }
                return
            }

            const point = points.find((p) => p.id === selectedPointId)
            if (!point) return

            if (!point.coordinates || typeof point.coordinates.lng !== 'number' || typeof point.coordinates.lat !== 'number') {
                return
            }

            const renderPopupContent = (root: Root) => {
                const detMeta = point.metadata as unknown as DetectivePointMetadata | undefined

                if (detMeta?.detectiveType) {
                    root.render(
                        <DetectivePopup
                            point={point}
                            onClose={() => onSelectPoint(null)}
                            onAction={(action) => {
                                console.log('[Detective] Action:', action, point.id)
                                if (action === 'investigate' || action === 'interrogate') {
                                    onInteractPoint?.(point)
                                } else if (action === 'enter') {
                                    onInteractPoint?.(point)
                                }
                            }}
                        />
                    )
                } else {
                    root.render(
                        <MapPointPopup
                            point={point}
                            actions={actions}
                            onClose={() => onSelectPoint(null)}
                            onInteract={() => onInteractPoint?.(point)}
                            onNavigate={() => onNavigatePoint?.(point)}
                            onScanQR={() => onScanQRPoint?.(point)}
                            onActionSelect={(key) => onActionSelect?.(point, key)}
                        />
                    )
                }
            }

            if (!popupRef.current) {
                try {
                    const el = document.createElement('div')
                    const root = createRoot(el)
                    renderPopupContent(root)

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

                    popupRef.current = { popup, root }
                } catch (e) {
                    console.error('[MapPopups] Failed to create popup:', e)
                }
            } else {
                try {
                    popupRef.current.popup.setLngLat([point.coordinates.lng, point.coordinates.lat])
                } catch (e) {
                    console.warn(`[MapPopups] Failed to update popup pos, recreating`, e)
                    try {
                        popupRef.current.popup.remove()
                        queueMicrotask(() => popupRef.current?.root.unmount())
                    } catch (removeError) {
                        console.error(`[MapPopups] Failed to remove broken popup`, removeError)
                    }
                    popupRef.current = null
                    return
                }

                try {
                    renderPopupContent(popupRef.current.root)
                } catch (e) {
                    console.error(`[MapPopups] Failed to update popup content:`, e)
                }
            }

        } catch (error) {
            console.error(`[MapPopups] General error in popup effect:`, error)
        }
    }, [map, selectedPointId, points, actions, onSelectPoint, onInteractPoint, onNavigatePoint, onScanQRPoint, onActionSelect])

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
