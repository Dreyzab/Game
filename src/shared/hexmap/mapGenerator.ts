/**
 * Shared Hex Map Generator
 * Deterministic procedural generation with region support.
 * Used by both client and server.
 */

import type { BiomeType, HexCell, HexCoordinate, RegionConfig, ResourceType, ThreatLevel } from './types'
import { DEFAULT_REGION, getRegionById } from './regions'

// ============================================================================
// Random & Hash Utilities
// ============================================================================

class PseudoRandom {
    seed: number
    constructor(seed: number) {
        this.seed = Math.floor(seed) >>> 0
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233280
    }
}

/** Simple string hash (djb2) */
function hashString(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    }
    return hash >>> 0
}

/** Mix seed with region for deterministic variation */
function mixSeed(baseSeed: number, regionId: string): number {
    return (baseSeed ^ hashString(regionId)) >>> 0
}

// ============================================================================
// Hex Math
// ============================================================================

export function hexToString(hex: HexCoordinate): string {
    return `${hex.q},${hex.r}`
}

export function getHexDistance(a: HexCoordinate, b: HexCoordinate): number {
    return Math.max(
        Math.abs(a.q - b.q),
        Math.abs(a.r - b.r),
        Math.abs((a.q + a.r) - (b.q + b.r))
    )
}

const getNeighbors = (q: number, r: number): HexCoordinate[] => [
    { q: q + 1, r },
    { q: q - 1, r },
    { q, r: r + 1 },
    { q, r: r - 1 },
    { q: q + 1, r: r - 1 },
    { q: q - 1, r: r + 1 },
]

// ============================================================================
// Weighted Selection
// ============================================================================

function weightedSelect<T extends string>(
    rng: PseudoRandom,
    options: T[],
    weights: Partial<Record<T, number>>,
    defaultWeight = 1.0
): T {
    const totalWeight = options.reduce((sum, opt) => sum + (weights[opt] ?? defaultWeight), 0)
    let roll = rng.next() * totalWeight

    for (const opt of options) {
        roll -= weights[opt] ?? defaultWeight
        if (roll <= 0) return opt
    }

    return options[options.length - 1]
}

// ============================================================================
// River Generation
// ============================================================================

function generateRiverPath(
    rng: PseudoRandom,
    mapMap: Map<string, HexCell>,
    radius: number
): void {
    // Find edge hexes for start/end
    const edgeHexes: HexCoordinate[] = []
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius)
        const r2 = Math.min(radius, -q + radius)
        for (const r of [r1, r2]) {
            const dist = getHexDistance({ q: 0, r: 0 }, { q, r })
            if (dist === radius) {
                edgeHexes.push({ q, r })
            }
        }
    }

    if (edgeHexes.length < 2) return

    // Pick start and end on opposite sides
    const startIdx = Math.floor(rng.next() * edgeHexes.length)
    const start = edgeHexes[startIdx]

    // Find hex roughly opposite
    let end = edgeHexes[0]
    let maxDist = 0
    for (const candidate of edgeHexes) {
        const dist = getHexDistance(start, candidate)
        if (dist > maxDist) {
            maxDist = dist
            end = candidate
        }
    }

    // Pathfind with random wobble
    const path: HexCoordinate[] = [start]
    let current = start
    const visited = new Set<string>([hexToString(start)])

    while (getHexDistance(current, end) > 1 && path.length < radius * 4) {
        const neighbors = getNeighbors(current.q, current.r)

        // Score neighbors: prefer closer to end, add randomness
        let bestNeighbor: HexCoordinate | null = null
        let bestScore = Infinity

        for (const neighbor of neighbors) {
            const key = hexToString(neighbor)
            if (visited.has(key)) continue

            const cell = mapMap.get(key)
            if (!cell) continue

            // Skip bunker
            if (cell.biome === 'BUNKER') continue

            const distToEnd = getHexDistance(neighbor, end)
            const wobble = rng.next() * 2
            const score = distToEnd + wobble

            if (score < bestScore) {
                bestScore = score
                bestNeighbor = neighbor
            }
        }

        if (!bestNeighbor) break

        path.push(bestNeighbor)
        visited.add(hexToString(bestNeighbor))
        current = bestNeighbor
    }

    // Apply river to path
    for (const hex of path) {
        const cell = mapMap.get(hexToString(hex))
        if (cell && cell.biome !== 'BUNKER') {
            cell.biome = 'RIVER'
            cell.resource = 'WATER'
            cell.threatLevel = 'SAFE'
        }
    }
}

// ============================================================================
// Map Generation
// ============================================================================


export interface GenerateMapOptions {
    region?: RegionConfig | string
}

/**
 * Generate a hex map with optional region configuration.
 * 
 * @param radius - Map radius in hexes
 * @param seed - Base seed for deterministic generation
 * @param options - Optional region config or region ID
 */
export function generateMap(
    radius: number,
    seed: number = Date.now(),
    options?: GenerateMapOptions
): HexCell[] {
    // Resolve region
    const region: RegionConfig = typeof options?.region === 'string'
        ? getRegionById(options.region)
        : options?.region ?? DEFAULT_REGION

    // Mix seed with region for unique but deterministic maps
    const effectiveSeed = mixSeed(seed, region.id)
    const rng = new PseudoRandom(effectiveSeed)

    const mapMap = new Map<string, HexCell>()
    const biomeWeights = region.biomeWeights ?? {}
    const resourceWeights = region.resourceWeights ?? {}

    // 1. Initialize Base Grid
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius)
        const r2 = Math.min(radius, -q + radius)

        for (let r = r1; r <= r2; r++) {
            const dist = getHexDistance({ q: 0, r: 0 }, { q, r })
            let biome: BiomeType = 'WASTELAND'
            let threat: ThreatLevel = 'LOW'
            const elevation = rng.next()
            const isObstacle = false
            let resource: ResourceType = 'NONE'

            const noise = rng.next()

            // Base layer (hardcoded for inner hexes)
            if (dist === 0) {
                biome = 'BUNKER'
                threat = 'SAFE'
            } else if (dist === 1) {
                // Inner City Hub
                if (q === 1 && r === 0) {
                    biome = 'ADMIN'
                    threat = 'SAFE'
                    resource = 'TECH'
                } else if (q === -1 && r === 0) {
                    biome = 'MALL'
                    threat = 'LOW'
                    resource = 'FOOD'
                } else if (q === 0 && r === 1) {
                    biome = 'FIRE_STATION'
                    threat = 'LOW'
                    resource = 'WATER'
                } else if (q === 0 && r === -1) {
                    biome = 'SKYSCRAPER'
                    threat = 'MEDIUM'
                    resource = 'SCRAP'
                } else if (q === 1 && r === -1) {
                    biome = 'ARMY_BASE'
                    threat = 'HIGH'
                    resource = 'TECH'
                } else {
                    biome = 'CITY_HIGH'
                    threat = 'MEDIUM'
                }
            } else if (dist === 2) {
                // Ring 2: Major Infrastructure
                if (q === 2 && r === 0) {
                    biome = 'AIRPORT'
                    threat = 'EXTREME'
                    resource = 'TECH'
                } else if (q === -2 && r === 0) {
                    biome = 'RAILWAY_DEPOT'
                    threat = 'HIGH'
                    resource = 'FUEL'
                } else if (q === 0 && r === 2) {
                    biome = 'WAREHOUSE'
                    threat = 'MEDIUM'
                    resource = 'SCRAP'
                } else {
                    biome = 'URBAN'
                }
            } else {
                // Outer zones: Use weighted generation
                const baseBiomes: BiomeType[] = ['WASTELAND', 'FOREST', 'URBAN', 'INDUSTRIAL', 'WATER']

                // Adjust weights based on noise
                const adjustedWeights: Partial<Record<BiomeType, number>> = { ...biomeWeights }
                if (noise < 0.15) adjustedWeights['WATER'] = (adjustedWeights['WATER'] ?? 1) * 3
                else if (noise < 0.35) adjustedWeights['FOREST'] = (adjustedWeights['FOREST'] ?? 1) * 2
                else if (noise > 0.6) adjustedWeights['URBAN'] = (adjustedWeights['URBAN'] ?? 1) * 2
                else if (noise > 0.5) adjustedWeights['INDUSTRIAL'] = (adjustedWeights['INDUSTRIAL'] ?? 1) * 1.5

                biome = weightedSelect(rng, baseBiomes, adjustedWeights)

                // Set threat based on biome
                if (biome === 'WATER' || biome === 'FOREST') {
                    threat = 'SAFE'
                } else if (biome === 'URBAN') {
                    threat = 'MEDIUM'
                } else if (biome === 'INDUSTRIAL') {
                    threat = 'HIGH'
                }

                // Assign resource with weights
                if (biome !== 'WATER') {
                    const resourceOptions: ResourceType[] = ['NONE', 'SCRAP', 'FOOD', 'TECH', 'FUEL']
                    const baseResourceWeights: Partial<Record<ResourceType, number>> = {
                        NONE: 5,
                        SCRAP: 2,
                        FOOD: 1,
                        TECH: 0.5,
                        FUEL: 0.8,
                        ...resourceWeights
                    }

                    if (biome === 'FOREST') baseResourceWeights['FOOD'] = (baseResourceWeights['FOOD'] ?? 1) * 2
                    if (biome === 'INDUSTRIAL') baseResourceWeights['FUEL'] = (baseResourceWeights['FUEL'] ?? 1) * 2
                    if (biome === 'URBAN') baseResourceWeights['SCRAP'] = (baseResourceWeights['SCRAP'] ?? 1) * 1.5

                    resource = weightedSelect(rng, resourceOptions, baseResourceWeights)
                }

                // Random special buildings
                if (rng.next() < 0.05 && biome === 'URBAN') {
                    const specials: BiomeType[] = ['HOSPITAL', 'POLICE', 'SCAVENGER_CAMP']
                    biome = weightedSelect(rng, specials, biomeWeights)
                    threat = biome === 'HOSPITAL' ? 'MEDIUM' : 'HIGH'
                }
            }

            const cell: HexCell = {
                q,
                r,
                biome,
                threatLevel: threat,
                elevation,
                isObstacle,
                resource,
            }
            mapMap.set(hexToString(cell), cell)
        }
    }

    // 2. City Sprawl
    const citySeeds = Math.floor(radius / 2) + 2
    const landCells = Array.from(mapMap.values()).filter(c => c.biome !== 'WATER' && c.biome !== 'BUNKER')

    for (let i = 0; i < citySeeds; i++) {
        const target = landCells[Math.floor(rng.next() * landCells.length)]
        if (!target) continue

        const cityBiomes: BiomeType[] = ['HOSPITAL', 'POLICE', 'CITY_HIGH', 'FACTORY']
        target.biome = weightedSelect(rng, cityBiomes, biomeWeights)

        if (target.biome === 'HOSPITAL') {
            target.resource = 'TECH'
            target.threatLevel = 'MEDIUM'
        } else if (target.biome === 'POLICE') {
            target.resource = 'SCRAP'
            target.threatLevel = 'HIGH'
        } else if (target.biome === 'CITY_HIGH') {
            target.resource = 'TECH'
            target.threatLevel = 'EXTREME'
        } else {
            target.resource = 'FUEL'
            target.threatLevel = 'MEDIUM'
        }
    }

    // 3. Harbor Logic (Urban near Water -> Industrial)
    for (const cell of mapMap.values()) {
        if (cell.biome === 'URBAN') {
            const neighbors = getNeighbors(cell.q, cell.r)
            const nearWater = neighbors.some(n => {
                const nc = mapMap.get(hexToString(n))
                return nc && (nc.biome === 'WATER' || nc.biome === 'RIVER')
            })
            if (nearWater && rng.next() > 0.3) {
                cell.biome = 'INDUSTRIAL'
                cell.resource = 'SCRAP'
            }
        }
    }

    // 4. River Generation (if enabled)
    if (region.features?.river) {
        generateRiverPath(rng, mapMap, radius)
    }

    return Array.from(mapMap.values())
}

/**
 * Get a specific hex cell from a generated map (for server-side encounter generation).
 * Pure function - deterministically regenerates the cell.
 */
export function getHexCell(
    radius: number,
    seed: number,
    hex: HexCoordinate,
    options?: GenerateMapOptions
): HexCell | null {
    const map = generateMap(radius, seed, options)
    return map.find(c => c.q === hex.q && c.r === hex.r) ?? null
}
