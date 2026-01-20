/**
 * Region Presets for Survival Mode
 * Each region has unique biome/resource weights and features.
 */
import type { RegionConfig } from './types';
/**
 * Freiburg - Default starting region (current behavior)
 * Balanced biome distribution, no special features.
 */
export declare const DEFAULT_REGION: RegionConfig;
/**
 * Karlsruhe - University/Tech Hub
 * Higher TECH, ADMIN, CITY_HIGH biomes. River (Rhine) enabled.
 */
export declare const KARLSRUHE_REGION: RegionConfig;
/** All available regions */
export declare const REGIONS: RegionConfig[];
/** Lookup region by ID (returns default if not found) */
export declare function getRegionById(id: string | null | undefined): RegionConfig;
