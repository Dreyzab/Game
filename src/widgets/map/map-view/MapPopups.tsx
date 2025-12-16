import React, { useEffect, useMemo, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { MapPointPopup } from '@/entities/map-point/ui/MapPointPopup'
import type { MapPoint } from '@/shared/types/map'
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
            // ÑœÑïÑøÑ¯¥?ÑæÑ¬ ¥?¥'Ñø¥?¥<Ñû tooltip
            if (tooltipRef.current) {
                try {
                    tooltipRef.current.popup.remove()
                    queueMicrotask(() => {
                        try {
                            if (tooltipRef.current?.root) {
                                tooltipRef.current.root.unmount()
                            }
                        } catch (e) {
                            console.warn(`ƒsÿ‹÷? [MapPopups] Ñz¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ¥?ÑøÑúÑ¬ÑóÑ«¥'Ñ÷¥?ÑóÑýÑøÑ«Ñ÷Ñ÷ tooltip:`, e)
                        }
                    })
                    tooltipRef.current = null
                } catch (e) {
                    console.error('ƒ?O [MapPopups] Ñz¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ¥ŸÑïÑøÑ¯ÑæÑ«Ñ÷Ñ÷ tooltip:', e)
                    tooltipRef.current = null
                }
            }

            // Ñ­ÑóÑúÑïÑø¥'Ñ¬ tooltip ¥'ÑóÑ¯¥OÑ§Ñó Ñæ¥?Ñ¯Ñ÷ Ñ«Ñæ¥' Ñý¥<Ññ¥?ÑøÑ«Ñ«ÑóÑû ¥'Ñó¥ÎÑ§Ñ÷ Ñ÷ Ñæ¥?¥'¥O Ñ«ÑøÑýÑæÑïÑæÑ«Ñ÷Ñæ
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

                    // Legacy tooltip HTML (kept behind a flag to avoid XSS risks)
                    if (allowUnsafeTooltipHtml) {
                        el.innerHTML = `
            <div class="font-bold mb-1">${point.title}</div>
            <div class="text-xs text-gray-300">${point.description || "Ñ?Ñæ¥' ÑóÑ¨Ñ÷¥?ÑøÑ«Ñ÷¥?"}</div>
            ${point.distance !== undefined ? `<div class="text-xs text-gray-400 mt-1">ÐY"? ${point.distance < 1 ? `${Math.round(point.distance * 1000)} Ñ¬` : `${point.distance.toFixed(1)} Ñ§Ñ¬`}</div>` : ''}
          `

                    }

                    const titleEl = document.createElement('div')
                    titleEl.className = 'font-bold mb-1'
                    titleEl.textContent = point.title

                    const descEl = document.createElement('div')
                    descEl.className = 'text-xs text-gray-300'
                    descEl.textContent = point.description || 'Нет описания'

                    el.appendChild(titleEl)
                    el.appendChild(descEl)

                    if (point.distance !== undefined) {
                        const distanceEl = document.createElement('div')
                        distanceEl.className = 'text-xs text-gray-400 mt-1'
                        distanceEl.textContent =
                            point.distance < 1
                                ? `Расстояние: ${Math.round(point.distance * 1000)} м`
                                : `Расстояние: ${point.distance.toFixed(1)} км`
                        el.appendChild(distanceEl)
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
                    console.error('ƒ?O [MapPopups] Ñz¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ¥?ÑóÑúÑïÑøÑ«Ñ÷Ñ÷ tooltip:', e)
                }
            }
        } catch (error) {
            console.error(`ƒ?O [MapPopups] Ñs¥?Ñ÷¥'Ñ÷¥ÎÑæ¥?Ñ§Ñø¥? Ñó¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ÑóÑñÑ«ÑóÑýÑ¯ÑæÑ«Ñ÷Ñ÷ tooltip:`, error)
        }
    }, [map, hoveredPointId, selectedPointId, points])

    // Popup (selection)
    useEffect(() => {
        if (!map) return

        try {
            // Ñ¥?Ñ¯Ñ÷ Ñ«Ñæ¥' Ñý¥<Ññ¥?ÑøÑ«Ñ«ÑóÑû ¥'Ñó¥ÎÑ§Ñ÷, ¥ŸÑïÑøÑ¯¥?ÑæÑ¬ Ñ¨ÑóÑ¨ÑøÑ¨
            if (!selectedPointId) {
                if (popupRef.current) {
                    try {
                        popupRef.current.popup.remove()
                        queueMicrotask(() => {
                            try {
                                popupRef.current?.root.unmount()
                            } catch (e) {
                                console.warn(`ƒsÿ‹÷? [MapPopups] Ñz¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ¥?ÑøÑúÑ¬ÑóÑ«¥'Ñ÷¥?ÑóÑýÑøÑ«Ñ÷Ñ÷ Ñ¨ÑóÑ¨ÑøÑ¨Ñø:`, e)
                            }
                        })
                        popupRef.current = null
                    } catch (e) {
                        console.error('ƒ?O [MapPopups] Ñz¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ¥ŸÑïÑøÑ¯ÑæÑ«Ñ÷Ñ÷ Ñ¨ÑóÑ¨ÑøÑ¨Ñø:', e)
                        popupRef.current = null
                    }
                }
                return
            }

            // Ñ¥?Ñ¯Ñ÷ Ñ¨ÑóÑ¨ÑøÑ¨ ¥ŸÑôÑæ ¥?¥Ÿ¥%Ñæ¥?¥'Ñý¥ŸÑæ¥', ÑóÑñÑ«ÑóÑýÑ¯¥?ÑæÑ¬ ÑæÑüÑó Ñ§ÑóÑ«¥'ÑæÑ«¥' (Ñ÷Ñ¯Ñ÷ Ñ«Ñæ ÑïÑæÑ¯ÑøÑæÑ¬ Ñ«Ñ÷¥ÎÑæÑüÑó, Ñæ¥?Ñ¯Ñ÷ ¥?¥'Ñó ¥'Ñó¥' ÑôÑæ Ñ¨ÑóÑ¨ÑøÑ¨)
            // Ñ?Ñó ÑúÑïÑæ¥?¥O Ñ¬¥< Ñ¨¥?Ñó¥?¥'Ñó Ñ¨Ñæ¥?ÑæÑïÑóÑúÑïÑøÑæÑ¬ Ñ÷Ñ¯Ñ÷ ÑóÑñÑ«ÑóÑýÑ¯¥?ÑæÑ¬, Ñæ¥?Ñ¯Ñ÷ id Ñ÷ÑúÑ¬ÑæÑ«Ñ÷Ñ¯¥?¥?.
            // Ñ' Ñó¥?Ñ÷ÑüÑ÷Ñ«ÑøÑ¯Ñæ Ññ¥<Ñ¯Ñó: Ñæ¥?Ñ¯Ñ÷ ¥?¥Ÿ¥%Ñæ¥?¥'Ñý¥ŸÑæ¥', Ñ«Ñæ Ñ¨Ñæ¥?ÑæÑïÑóÑúÑïÑøÑæÑ¬. Ñ?Ñó Ñ«ÑøÑ¬ Ñ«¥ŸÑôÑ«Ñó ÑóÑñÑ«ÑóÑýÑ¯¥?¥'¥O Ñ§ÑóÑ«¥'ÑæÑ«¥'.
            // ÑYÑó¥?¥'ÑóÑ¬¥Ÿ ¥?ÑøÑúÑïÑæÑ¯Ñ÷Ñ¬ ¥?ÑóÑúÑïÑøÑ«Ñ÷Ñæ Ñ÷ ÑóÑñÑ«ÑóÑýÑ¯ÑæÑ«Ñ÷Ñæ.

            const point = points.find((p) => p.id === selectedPointId)
            if (!point) return

            if (!point.coordinates || typeof point.coordinates.lng !== 'number' || typeof point.coordinates.lat !== 'number') {
                return
            }

            if (!popupRef.current) {
                // Ñ­ÑóÑúÑïÑøÑæÑ¬ Ñ«ÑóÑý¥<Ñû
                try {
                    const el = document.createElement('div')
                    const root = createRoot(el)

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
                    console.error('ƒ?O [MapPopups] Ñz¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ¥?ÑóÑúÑïÑøÑ«Ñ÷Ñ÷ Ñ¨ÑóÑ¨ÑøÑ¨Ñø:', e)
                }
            } else {
                // ÑzÑñÑ«ÑóÑýÑ¯¥?ÑæÑ¬ ¥?¥Ÿ¥%Ñæ¥?¥'Ñý¥Ÿ¥Z¥%Ñ÷Ñû Ñ÷ Ñ¨Ñæ¥?ÑæÑ«Ñó¥?Ñ÷Ñ¬ Ñ«Ñø Ñ«ÑóÑý¥<Ñæ Ñ§ÑóÑó¥?ÑïÑ÷Ñ«Ñø¥'¥<
                try {
                    popupRef.current.popup.setLngLat([point.coordinates.lng, point.coordinates.lat])
                } catch (e) {
                    console.warn(`ƒsÿ‹÷? [MapPopups] Ñ?Ñæ ¥ŸÑïÑøÑ¯Ñó¥?¥O ÑóÑñÑ«ÑóÑýÑ÷¥'¥O Ñ§ÑóÑó¥?ÑïÑ÷Ñ«Ñø¥'¥< Ñ¨ÑóÑ¨ÑøÑ¨Ñø, Ñ¨Ñæ¥?Ñæ¥?ÑóÑúÑïÑø¥'Ñ¬`, e)
                    try {
                        popupRef.current.popup.remove()
                        queueMicrotask(() => popupRef.current?.root.unmount())
                    } catch (removeError) {
                        console.error(`ƒ?O [MapPopups] Ñz¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ¥ŸÑïÑøÑ¯ÑæÑ«Ñ÷Ñ÷ Ñ¨ÑóÑ¨ÑøÑ¨Ñø Ñ¨Ñæ¥?ÑæÑï Ñ¨Ñæ¥?Ñæ¥?ÑóÑúÑïÑøÑ«Ñ÷ÑæÑ¬`, removeError)
                    }
                    popupRef.current = null
                    return
                }

                try {
                    popupRef.current.root.render(
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
                } catch (e) {
                    console.error(`ƒ?O [MapPopups] Ñz¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ÑóÑñÑ«ÑóÑýÑ¯ÑæÑ«Ñ÷Ñ÷ Ñ§ÑóÑ«¥'ÑæÑ«¥'Ñø Ñ¨ÑóÑ¨ÑøÑ¨Ñø:`, e)
                }
            }

        } catch (error) {
            console.error(`ƒ?O [MapPopups] Ñs¥?Ñ÷¥'Ñ÷¥ÎÑæ¥?Ñ§Ñø¥? Ñó¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ ¥?ÑóÑúÑïÑøÑ«Ñ÷Ñ÷ Ñ¨ÑóÑ¨ÑøÑ¨Ñø:`, error)
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
