/**
 * Survival Hex Map feature module.
 * Ported from hexsurvival-tactical-map for in-game tactical navigation.
 */

export { SurvivalHexMap } from './ui/SurvivalHexMap'
export { SurvivalMapbox } from './ui/SurvivalMapbox'
export { SurvivalMapEditor } from './ui/SurvivalMapEditor'
export type { SurvivalMapboxRef } from './ui/SurvivalMapbox'
export { ModeSwitcher, type SurvivalMode } from './ui/components/ModeSwitcher'
export { default as RegionCard } from './ui/components/RegionCard'
export { DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS, hexToGeo } from './utils/geoMath'

// Re-export from shared hexmap module
export { generateMap, getHexCell, hexToString, getHexDistance } from '@/shared/hexmap'
export { REGIONS, DEFAULT_REGION, KARLSRUHE_REGION, getRegionById } from '@/shared/hexmap'
export type { RegionConfig, HexCell, HexCoordinate, BiomeType, ThreatLevel, ResourceType } from '@/shared/hexmap'


