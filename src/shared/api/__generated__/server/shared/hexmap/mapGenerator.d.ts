/**
 * Shared Hex Map Generator
 * Deterministic procedural generation with region support.
 * Used by both client and server.
 */
import type { HexCell, HexCoordinate, RegionConfig } from './types';
export declare function hexToString(hex: HexCoordinate): string;
export declare function getHexDistance(a: HexCoordinate, b: HexCoordinate): number;
export interface GenerateMapOptions {
    region?: RegionConfig | string;
}
/**
 * Generate a hex map with optional region configuration.
 *
 * @param radius - Map radius in hexes
 * @param seed - Base seed for deterministic generation
 * @param options - Optional region config or region ID
 */
export declare function generateMap(radius: number, seed?: number, options?: GenerateMapOptions): HexCell[];
/**
 * Get a specific hex cell from a generated map (for server-side encounter generation).
 * Pure function - deterministically regenerates the cell.
 */
export declare function getHexCell(radius: number, seed: number, hex: HexCoordinate, options?: GenerateMapOptions): HexCell | null;
