/**
 * Region Presets for Survival Mode
 * Each region has unique biome/resource weights and features.
 */

import type { RegionConfig } from './types'

/**
 * Freiburg - Default starting region (current behavior)
 * Balanced biome distribution, no special features.
 */
export const DEFAULT_REGION: RegionConfig = {
    id: 'default',
    name: 'Freiburg',
    nameRu: 'Фрайбург',
    geoCenterLngLat: [7.8494, 48.0],
    biomeWeights: {},
    resourceWeights: {},
    features: {},
    imageUrl: '/images/regions/freiburg.jpg',
}

/**
 * Karlsruhe - University/Tech Hub
 * Higher TECH, ADMIN, CITY_HIGH biomes. River (Rhine) enabled.
 */
export const KARLSRUHE_REGION: RegionConfig = {
    id: 'karlsruhe',
    name: 'Karlsruhe',
    nameRu: 'Карлсруэ',
    geoCenterLngLat: [8.400769917884332, 49.002891944526624],
    biomeWeights: {
        ADMIN: 2.5,       // Palace area
        CITY_HIGH: 2.0,   // City center
        URBAN: 1.5,
        HOSPITAL: 1.3,    // Klinikum
        INDUSTRIAL: 0.8,  // Less industrial
        FOREST: 0.7,      // Less forest (Hardtwald is smaller than Schwarzwald)
    },
    resourceWeights: {
        TECH: 2.5,        // University/KIT tech hub
        SCRAP: 1.2,
        FOOD: 0.9,
    },
    features: {
        river: true,      // Rhine river
    },
    imageUrl: '/images/regions/karlsruhe.jpg',
}

/** All available regions */
export const REGIONS: RegionConfig[] = [
    DEFAULT_REGION,
    KARLSRUHE_REGION,
]

/** Lookup region by ID (returns default if not found) */
export function getRegionById(id: string | null | undefined): RegionConfig {
    if (!id) return DEFAULT_REGION
    return REGIONS.find(r => r.id === id) ?? DEFAULT_REGION
}
