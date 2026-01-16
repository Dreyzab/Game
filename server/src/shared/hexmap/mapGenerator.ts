export interface HexCoordinate {
    q: number
    r: number
}

export type HexBiomeType =
    | 'BUNKER'
    | 'WASTELAND'
    | 'FOREST'
    | 'URBAN'
    | 'INDUSTRIAL'
    | 'WATER'
    | 'HOSPITAL'
    | 'POLICE'
    | 'RIVER'
    | 'FACTORY'
    | 'CITY_HIGH'
    | 'ADMIN'
    | 'SKYSCRAPER'
    | 'FIRE_STATION'
    | 'MALL'
    | 'RAILWAY_DEPOT'
    | 'BUILDING_LOW'
    | 'PARKING_LOW'
    | 'WAREHOUSE'
    | 'GAS_STATION'
    | 'SCAVENGER_CAMP'
    | 'ARMY_BASE'
    | 'AIRPORT'
    | 'ROAD_HIGH'
    | 'ROAD_LOW'
    | 'ROAD_CITY'
    | 'ROAD_FOREST'

export type HexThreatLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export type HexResourceType = 'NONE' | 'SCRAP' | 'FOOD' | 'WATER' | 'FUEL' | 'TECH'

export interface HexCell extends HexCoordinate {
    biome: HexBiomeType
    threatLevel: HexThreatLevel
    elevation: number
    isObstacle: boolean
    resource: HexResourceType
}

class PseudoRandom {
    seed: number

    constructor(seed: number) {
        // Keep it in 32-bit safe range for deterministic behavior
        this.seed = Math.floor(seed) >>> 0
    }

    next(): number {
        // LCG (same shape as client) - deterministic
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233280
    }
}

export function hexToString(h: HexCoordinate): string {
    return `${h.q},${h.r}`
}

export function getHexDistance(a: HexCoordinate, b: HexCoordinate): number {
    // axial distance = max(|dq|,|dr|,|dq+dr|)
    const dq = Math.abs(a.q - b.q)
    const dr = Math.abs(a.r - b.r)
    const ds = Math.abs((a.q + a.r) - (b.q + b.r))
    return Math.max(dq, dr, ds)
}

const getNeighbors = (q: number, r: number) => [
    { q: q + 1, r },
    { q: q - 1, r },
    { q, r: r + 1 },
    { q, r: r - 1 },
    { q: q + 1, r: r - 1 },
    { q: q - 1, r: r + 1 },
]

export function generateHexMap(radius: number, seed: number): Map<string, HexCell> {
    const mapMap = new Map<string, HexCell>()
    const rng = new PseudoRandom(seed)

    // 1) Base grid
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius)
        const r2 = Math.min(radius, -q + radius)

        for (let r = r1; r <= r2; r++) {
            const dist = getHexDistance({ q: 0, r: 0 }, { q, r })

            let biome: HexBiomeType = 'WASTELAND'
            let threat: HexThreatLevel = 'LOW'
            const elevation = rng.next()
            const isObstacle = false
            let resource: HexResourceType = 'NONE'

            const noise = rng.next()

            if (dist === 0) {
                biome = 'BUNKER'
                threat = 'SAFE'
            } else if (dist === 1) {
                // Same layout as client generator (deterministic)
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
                if (noise < 0.15) {
                    biome = 'WATER'
                    threat = 'SAFE'
                } else if (noise < 0.35) {
                    biome = 'FOREST'
                    threat = 'SAFE'
                    resource = rng.next() > 0.7 ? 'FOOD' : 'NONE'

                    if (rng.next() < 0.05) {
                        biome = 'SCAVENGER_CAMP'
                        threat = 'MEDIUM'
                        resource = 'SCRAP'
                    }
                } else if (noise > 0.6) {
                    biome = 'URBAN'
                    threat = 'MEDIUM'
                    resource = rng.next() > 0.6 ? 'SCRAP' : 'NONE'

                    const subTypeRoll = rng.next()
                    if (subTypeRoll > 0.9) {
                        biome = 'GAS_STATION'
                        resource = 'FUEL'
                    } else if (subTypeRoll > 0.8) {
                        biome = 'PARKING_LOW'
                        resource = 'SCRAP'
                    } else if (subTypeRoll > 0.7) {
                        biome = 'BUILDING_LOW'
                        resource = 'SCRAP'
                    }
                } else if (noise > 0.5) {
                    biome = 'INDUSTRIAL'
                    threat = 'HIGH'
                    resource = rng.next() > 0.5 ? 'FUEL' : 'SCRAP'
                } else {
                    biome = 'WASTELAND'
                    threat = 'LOW'

                    if (rng.next() < 0.02) {
                        biome = 'SCAVENGER_CAMP'
                        threat = 'MEDIUM'
                        resource = 'SCRAP'
                    }
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

    const cells = Array.from(mapMap.values())
    const landCells = cells.filter(c => c.biome !== 'WATER' && c.biome !== 'BUNKER')

    // 2) City seeds
    const citySeeds = Math.floor(radius / 2) + 2

    for (let i = 0; i < citySeeds; i++) {
        const target = landCells[Math.floor(rng.next() * landCells.length)]
        if (!target) continue

        const typeRoll = rng.next()
        if (typeRoll > 0.7) {
            target.biome = 'HOSPITAL'
            target.resource = 'TECH'
            target.threatLevel = 'MEDIUM'
        } else if (typeRoll > 0.5) {
            target.biome = 'POLICE'
            target.resource = 'SCRAP'
            target.threatLevel = 'HIGH'
        } else if (typeRoll > 0.3) {
            target.biome = 'CITY_HIGH'
            target.resource = 'TECH'
            target.threatLevel = 'EXTREME'
        } else {
            target.biome = 'FACTORY'
            target.resource = 'FUEL'
            target.threatLevel = 'MEDIUM'
        }
    }

    // 3) Sprawl
    const sprawlPasses = 2
    for (let p = 0; p < sprawlPasses; p++) {
        const currentMap = Array.from(mapMap.values())
        const influencerBiomes: HexBiomeType[] = ['CITY_HIGH', 'HOSPITAL', 'POLICE', 'FACTORY', 'URBAN', 'INDUSTRIAL']
        const influencers = currentMap.filter(c => influencerBiomes.includes(c.biome))

        for (const center of influencers) {
            const neighbors = getNeighbors(center.q, center.r)
            for (const nCoord of neighbors) {
                const nKey = hexToString(nCoord as HexCoordinate)
                const neighbor = mapMap.get(nKey)
                if (neighbor && neighbor.biome !== 'WATER' && neighbor.biome !== 'BUNKER') {
                    const highTier: HexBiomeType[] = ['CITY_HIGH', 'HOSPITAL', 'POLICE', 'FACTORY']
                    if (highTier.includes(neighbor.biome)) continue

                    const growChance = 0.5 - (p * 0.15)
                    if (rng.next() < growChance) {
                        if (center.biome === 'FACTORY' || center.biome === 'INDUSTRIAL') {
                            neighbor.biome = 'INDUSTRIAL'
                            neighbor.resource = rng.next() > 0.7 ? 'FUEL' : 'SCRAP'
                            neighbor.threatLevel = 'MEDIUM'
                        } else {
                            neighbor.biome = 'URBAN'
                            neighbor.resource = rng.next() > 0.8 ? 'TECH' : 'SCRAP'
                            neighbor.threatLevel = 'HIGH'
                        }
                    }
                }
            }
        }
    }

    // 4) Harbor-ish logic
    for (const cell of mapMap.values()) {
        if (cell.biome === 'URBAN') {
            const neighbors = getNeighbors(cell.q, cell.r)
            let nearWater = false
            for (const n of neighbors) {
                const nc = mapMap.get(hexToString(n as HexCoordinate))
                if (nc && (nc.biome === 'WATER' || nc.biome === 'RIVER')) {
                    nearWater = true
                    break
                }
            }
            if (nearWater && rng.next() > 0.3) {
                cell.biome = 'INDUSTRIAL'
                cell.resource = 'SCRAP'
            }
        }
    }

    return mapMap
}

export function getHexCell(radius: number, seed: number, hex: HexCoordinate): HexCell | null {
    // For MVP we regenerate (radius 14 is small). Can be memoized later by (seed,radius).
    const map = generateHexMap(radius, seed)
    return map.get(hexToString(hex)) ?? null
}

