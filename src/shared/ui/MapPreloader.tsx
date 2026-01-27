import React from 'react'
import type { StyleSpecification } from 'mapbox-gl'
import { MapboxMap } from '@/shared/ui/MapboxMap'

interface MapPreloaderProps {
  style?: string | StyleSpecification
}

export const MapPreloader: React.FC<MapPreloaderProps> = ({ style }) => {
  return (
    <div className="fixed -left-[9999px] -top-[9999px] w-[2px] h-[2px] overflow-hidden opacity-0 pointer-events-none">
      <MapboxMap
        center={[7.8494, 48.0]}
        zoom={13}
        style={style}
        showNavigation={false}
        showGeolocate={false}
        showScale={false}
        className="w-[2px] h-[2px]"
      />
    </div>
  )
}

export default MapPreloader
