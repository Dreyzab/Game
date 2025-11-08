/**
 * @fileoverview Контрол для управления слоями безопасных зон на карте
 * FSD: widgets/map/map-view
 * 
 * Управляет GeoJSON sources и слоями для отображения безопасных зон
 */

import mapboxgl from 'mapbox-gl'
import type { SafeZone } from '@/shared/types/map'

const SAFE_ZONES_SOURCE_ID = 'safe-zones-source'
const SAFE_ZONES_FILL_LAYER_ID = 'safe-zones-fill'
const SAFE_ZONES_LINE_LAYER_ID = 'safe-zones-line'
const SAFE_ZONES_LABEL_LAYER_ID = 'safe-zones-label'

/**
 * Контрол для управления безопасными зонами
 */
export class SafeZonesControl {
  private map: mapboxgl.Map
  private isVisible: boolean = true
  private zones: SafeZone[] = []
  private isInitialized: boolean = false

  constructor(map: mapboxgl.Map) {
    this.map = map
    this.initialize()
  }

  /**
   * Инициализация source и слоёв
   */
  private initialize() {
    // Ждём загрузки стиля карты
    if (!this.map.isStyleLoaded()) {
      this.map.once('style.load', () => {
        this.createLayers()
      })
    } else {
      this.createLayers()
    }

    // Пересоздаём слои при смене стиля
    this.map.on('style.load', () => {
      if (this.isInitialized) {
        this.createLayers()
        this.updateZones(this.zones)
      }
    })
  }

  /**
   * Создание source и слоёв
   */
  private createLayers() {
    // Проверяем, что source ещё не создан
    if (this.map.getSource(SAFE_ZONES_SOURCE_ID)) {
      return
    }

    // Создаём GeoJSON source
    this.map.addSource(SAFE_ZONES_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    // Слой заливки
    this.map.addLayer({
      id: SAFE_ZONES_FILL_LAYER_ID,
      type: 'fill',
      source: SAFE_ZONES_SOURCE_ID,
      paint: {
        'fill-color': '#10b981', // green-500
        'fill-opacity': 0.2,
      },
    })

    // Слой границ
    this.map.addLayer({
      id: SAFE_ZONES_LINE_LAYER_ID,
      type: 'line',
      source: SAFE_ZONES_SOURCE_ID,
      paint: {
        'line-color': '#10b981', // green-500
        'line-width': 2,
        'line-opacity': 0.8,
      },
    })

    // Слой лейблов
    this.map.addLayer({
      id: SAFE_ZONES_LABEL_LAYER_ID,
      type: 'symbol',
      source: SAFE_ZONES_SOURCE_ID,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 14,
        'text-anchor': 'center',
        'text-offset': [0, 0],
      },
      paint: {
        'text-color': '#10b981',
        'text-halo-color': '#000000',
        'text-halo-width': 2,
      },
    })

    this.isInitialized = true
    this.setVisible(this.isVisible)
  }

  /**
   * Обновление данных зон
   */
  updateZones(zones: SafeZone[]) {
    this.zones = zones

    if (!this.isInitialized) {
      return
    }

    const source = this.map.getSource(SAFE_ZONES_SOURCE_ID) as mapboxgl.GeoJSONSource
    if (!source) {
      return
    }

    // Конвертируем зоны в GeoJSON
    const features = zones.map((zone) => ({
      type: 'Feature' as const,
      properties: {
        id: zone.id,
        name: zone.name,
        faction: zone.faction || 'unknown',
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          zone.polygon.map((coord) => [coord.lng, coord.lat]),
        ],
      },
    }))

    // Обновляем данные
    source.setData({
      type: 'FeatureCollection',
      features,
    })
  }

  /**
   * Показать/скрыть зоны
   */
  setVisible(visible: boolean) {
    this.isVisible = visible

    if (!this.isInitialized) {
      return
    }

    const visibility = visible ? 'visible' : 'none'

    if (this.map.getLayer(SAFE_ZONES_FILL_LAYER_ID)) {
      this.map.setLayoutProperty(SAFE_ZONES_FILL_LAYER_ID, 'visibility', visibility)
    }

    if (this.map.getLayer(SAFE_ZONES_LINE_LAYER_ID)) {
      this.map.setLayoutProperty(SAFE_ZONES_LINE_LAYER_ID, 'visibility', visibility)
    }

    if (this.map.getLayer(SAFE_ZONES_LABEL_LAYER_ID)) {
      this.map.setLayoutProperty(SAFE_ZONES_LABEL_LAYER_ID, 'visibility', visibility)
    }
  }

  /**
   * Удаление слоёв и source
   */
  destroy() {
    if (!this.isInitialized) {
      return
    }

    // Удаляем слои
    if (this.map.getLayer(SAFE_ZONES_LABEL_LAYER_ID)) {
      this.map.removeLayer(SAFE_ZONES_LABEL_LAYER_ID)
    }

    if (this.map.getLayer(SAFE_ZONES_LINE_LAYER_ID)) {
      this.map.removeLayer(SAFE_ZONES_LINE_LAYER_ID)
    }

    if (this.map.getLayer(SAFE_ZONES_FILL_LAYER_ID)) {
      this.map.removeLayer(SAFE_ZONES_FILL_LAYER_ID)
    }

    // Удаляем source
    if (this.map.getSource(SAFE_ZONES_SOURCE_ID)) {
      this.map.removeSource(SAFE_ZONES_SOURCE_ID)
    }

    this.isInitialized = false
  }
}

export default SafeZonesControl

