import type { Map as MapboxMap, AnyLayer, FilterSpecification } from 'mapbox-gl'
import { MAPBOX_LAYER_Z_ORDER, type MapboxLayerId } from './layerConfig'

type LayerSpecWithoutId = Omit<AnyLayer, 'id'>

export interface LayerManagerInstance {
    add: (id: MapboxLayerId, spec: LayerSpecWithoutId) => void
    has: (id: MapboxLayerId) => boolean
    remove: (id: MapboxLayerId) => void
    setFilter: (id: MapboxLayerId, filter: FilterSpecification | null | undefined) => void
    getRegisteredLayers: () => string[]
}

/**
 * Create a LayerManager for automatic Mapbox layer z-ordering.
 * 
 * Instead of manually specifying `beforeId` for each layer,
 * LayerManager uses predefined z-order values to insert layers
 * in the correct rendering order.
 * 
 * Usage:
 * ```typescript
 * const layers = createLayerManager(map)
 * layers.add('HEX_FILL', { type: 'fill', source: 'hexgrid', ... })
 * layers.add('HEX_BORDER', { type: 'line', source: 'hexgrid', ... })
 * // Order doesn't matter - z-order is determined by MAPBOX_LAYER_Z_ORDER
 * ```
 */
export function createLayerManager(map: MapboxMap): LayerManagerInstance {
    const registeredLayers = new Map<string, number>()

    function findInsertionPoint(zOrder: number): string | undefined {
        // Find the layer with the smallest z-order that is still greater than the current one
        let bestCandidate: string | undefined
        let bestZ = Infinity

        for (const [layerId, layerZ] of registeredLayers) {
            if (layerZ > zOrder && layerZ < bestZ) {
                bestCandidate = layerId
                bestZ = layerZ
            }
        }

        return bestCandidate
    }

    return {
        add(id: MapboxLayerId, spec: LayerSpecWithoutId): void {
            const zOrder = MAPBOX_LAYER_Z_ORDER[id]
            const beforeId = findInsertionPoint(zOrder)

            map.addLayer({ ...spec, id } as AnyLayer, beforeId)
            registeredLayers.set(id, zOrder)
        },

        has(id: MapboxLayerId): boolean {
            return map.getLayer(id) !== undefined
        },

        remove(id: MapboxLayerId): void {
            if (map.getLayer(id)) {
                map.removeLayer(id)
                registeredLayers.delete(id)
            }
        },

        setFilter(id: MapboxLayerId, filter: FilterSpecification | null | undefined): void {
            if (map.getLayer(id)) {
                map.setFilter(id, filter)
            }
        },

        getRegisteredLayers(): string[] {
            return Array.from(registeredLayers.keys())
        }
    }
}

// Re-export for backwards compatibility
export const LayerManager = { create: createLayerManager }
