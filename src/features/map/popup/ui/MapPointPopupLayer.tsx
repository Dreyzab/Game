/**
 * @fileoverview Слой управления попапами точек на карте
 * FSD: features/map/popup
 * 
 * Управляет отображением React попапов в Mapbox
 */

import React, { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { MapPointPopup } from '@/entities/map-point/ui'
import { useMapPointInteraction, type InteractionKey } from '@/entities/map-point/model/useMapPointInteraction'
import type { MapPoint } from '@/shared/types/map'

export interface MapPointPopupLayerProps {
  map: mapboxgl.Map | null
  point: MapPoint | null
  onClose: () => void
  onInteract?: () => void
  onNavigate?: () => void
  onScanQR?: () => void
  onActionSelect?: (action: InteractionKey) => void
}

/**
 * Компонент-обёртка для управления попапом на карте
 */
export const MapPointPopupLayer: React.FC<MapPointPopupLayerProps> = ({
  map,
  point,
  onClose,
  onInteract,
  onNavigate,
  onScanQR,
  onActionSelect,
}) => {
  const popupRef = useRef<{ popup: mapboxgl.Popup; root: Root } | null>(null)
  const { actions } = useMapPointInteraction(point)

  useEffect(() => {
    if (!map || !point) {
      // Удаляем попап, если точка не выбрана
      if (popupRef.current) {
        popupRef.current.popup.remove()
        queueMicrotask(() => popupRef.current?.root.unmount())
        popupRef.current = null
      }
      return
    }

    // Удаляем старый попап
    if (popupRef.current) {
      popupRef.current.popup.remove()
      queueMicrotask(() => popupRef.current?.root.unmount())
      popupRef.current = null
    }

    // Создаём новый попап
    const el = document.createElement('div')
    const root = createRoot(el)

    root.render(
      <MapPointPopup
        point={point}
        actions={actions}
        onClose={onClose}
        onInteract={onInteract}
        onNavigate={onNavigate}
        onScanQR={onScanQR}
        onActionSelect={onActionSelect}
      />
    )

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 25,
      maxWidth: '320px',
    })
      .setLngLat([point.coordinates.lng, point.coordinates.lat])
      .setDOMContent(el)
      .addTo(map)

    popup.on('close', onClose)

    popupRef.current = { popup, root }

    // Cleanup при размонтировании
    return () => {
      if (popupRef.current) {
        popupRef.current.popup.remove()
        queueMicrotask(() => popupRef.current?.root.unmount())
        popupRef.current = null
      }
    }
  }, [map, point, actions, onClose, onInteract, onNavigate, onScanQR, onActionSelect])

  return null
}

export default MapPointPopupLayer
