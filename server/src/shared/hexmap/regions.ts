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

/**
 * Freiburg 1905 - Detective Mode Region
 * Vintage style, districts, specific biome weights.
 */
export const FREIBURG_1905: RegionConfig = {
    id: 'freiburg_1905',
    name: 'Freiburg (1905)',
    nameRu: 'Фрайбург (1905)',
    geoCenterLngLat: [7.8494, 47.9950], // Centered closer to Munster/Bank
    biomeWeights: {
        URBAN: 2.0,
        CITY_HIGH: 1.5,
        ADMIN: 1.0,
        FOREST: 0.5,
    },
    features: {
        river: true,
        vintageStyle: true,
    },
    imageUrl: '/images/regions/freiburg_old.jpg',
    districts: [
        {
            id: 'altstadt',
            name: 'Altstadt',
            center: [7.8529, 47.9955],
            radius: 400,
            meta: { risk: 'low', classBias: 'elite' }
        },
        {
            id: 'schneckenvorstadt',
            name: 'Schneckenvorstadt',
            center: [7.8488, 47.9930],
            radius: 300,
            meta: { risk: 'medium', classBias: 'worker' } // "Ecosphere of Vice"
        },
        {
            id: 'wiehre',
            name: 'Wiehre',
            center: [7.8500, 47.9850],
            radius: 500,
            meta: { risk: 'safe', classBias: 'bourgeois' }
        },
        {
            id: 'stuhlinger',
            name: 'Stühlinger',
            center: [7.8400, 47.9980], // Behind station
            radius: 400,
            meta: { risk: 'medium', classBias: 'worker' }
        }
    ]
}

/** All available regions */
export const REGIONS: RegionConfig[] = [
    DEFAULT_REGION,
    KARLSRUHE_REGION,
    FREIBURG_1905,
]

/** Lookup region by ID (returns default if not found) */
export function getRegionById(id: string | null | undefined): RegionConfig {
    if (!id) return DEFAULT_REGION
    return REGIONS.find(r => r.id === id) ?? DEFAULT_REGION
}
