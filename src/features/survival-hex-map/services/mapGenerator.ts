import { BiomeType, type HexCell, type HexCoordinate, ResourceType, ThreatLevel } from '../types'
import { getHexDistance, hexToString } from '../utils/hexMath'

class PseudoRandom {
  seed: number
  constructor(seed: number) {
    this.seed = seed
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
}

// Helpers
const getNeighbors = (q: number, r: number) => [
  { q: q + 1, r },
  { q: q - 1, r },
  { q, r: r + 1 },
  { q, r: r - 1 },
  { q: q + 1, r: r - 1 },
  { q: q - 1, r: r + 1 },
]

export const generateMap = (radius: number): HexCell[] => {
  const mapMap = new Map<string, HexCell>()
  const rng = new PseudoRandom(Date.now()) // Use varying seed or fixed for determinism

  // 1. Initialize Base Grid (Wasteland + Water + Forest Noise)
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius)
    const r2 = Math.min(radius, -q + radius)

    for (let r = r1; r <= r2; r++) {
      const dist = getHexDistance({ q: 0, r: 0 }, { q, r })
      let biome = BiomeType.WASTELAND
      let threat = ThreatLevel.LOW
      const elevation = rng.next()
      let isObstacle = false
      let resource = ResourceType.NONE

      const noise = rng.next()

      // Base layer
      if (dist === 0) {
        biome = BiomeType.BUNKER
        threat = ThreatLevel.SAFE
      } else if (dist === 1) {
        // Inner City Hub around Bunker (Expanded 1)
        if (q === 1 && r === 0) {
          biome = BiomeType.ADMIN
          threat = ThreatLevel.SAFE
          resource = ResourceType.TECH
        } else if (q === -1 && r === 0) {
          biome = BiomeType.MALL
          threat = ThreatLevel.LOW
          resource = ResourceType.FOOD
        } else if (q === 0 && r === 1) {
          biome = BiomeType.FIRE_STATION
          threat = ThreatLevel.LOW
          resource = ResourceType.WATER
        } else if (q === 0 && r === -1) {
          biome = BiomeType.SKYSCRAPER
          threat = ThreatLevel.MEDIUM
          resource = ResourceType.SCRAP
        } else if (q === 1 && r === -1) {
          biome = BiomeType.ARMY_BASE
          threat = ThreatLevel.HIGH
          resource = ResourceType.TECH // Weapon Tech
        } else {
          biome = BiomeType.CITY_HIGH
          threat = ThreatLevel.MEDIUM
        }
      } else if (dist === 2) {
        // Inner Ring 2: Major Infrastructure
        if (q === 2 && r === 0) {
          biome = BiomeType.AIRPORT
          threat = ThreatLevel.EXTREME
          resource = ResourceType.TECH
        } else if (q === -2 && r === 0) {
          biome = BiomeType.RAILWAY_DEPOT
          threat = ThreatLevel.HIGH
          resource = ResourceType.FUEL
        } else if (q === 0 && r === 2) {
          biome = BiomeType.WAREHOUSE
          threat = ThreatLevel.MEDIUM
          resource = ResourceType.SCRAP
        } else {
          biome = BiomeType.URBAN
        }
      } else {
        if (noise < 0.15) {
          biome = BiomeType.WATER
          threat = ThreatLevel.SAFE
        } else if (noise < 0.35) {
          biome = BiomeType.FOREST
          threat = ThreatLevel.SAFE
          resource = Math.random() > 0.7 ? ResourceType.FOOD : ResourceType.NONE

          if (Math.random() < 0.05) {
            biome = BiomeType.SCAVENGER_CAMP
            threat = ThreatLevel.MEDIUM
            resource = ResourceType.SCRAP
          }

        } else if (noise > 0.6) {
          biome = BiomeType.URBAN
          threat = ThreatLevel.MEDIUM
          resource = Math.random() > 0.6 ? ResourceType.SCRAP : ResourceType.NONE

          const subTypeRoll = rng.next()
          if (subTypeRoll > 0.9) {
            biome = BiomeType.GAS_STATION
            resource = ResourceType.FUEL
          } else if (subTypeRoll > 0.8) {
            biome = BiomeType.PARKING_LOW
            resource = ResourceType.SCRAP
          } else if (subTypeRoll > 0.7) {
            biome = BiomeType.BUILDING_LOW
            resource = ResourceType.SCRAP
          }

        } else if (noise > 0.5) {
          biome = BiomeType.INDUSTRIAL
          threat = ThreatLevel.HIGH
          resource = Math.random() > 0.5 ? ResourceType.FUEL : ResourceType.SCRAP
        } else {
          biome = BiomeType.WASTELAND
          threat = ThreatLevel.LOW

          if (Math.random() < 0.02) {
            biome = BiomeType.SCAVENGER_CAMP
            threat = ThreatLevel.MEDIUM
            resource = ResourceType.SCRAP
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
  const landCells = cells.filter(c => c.biome !== BiomeType.WATER && c.biome !== BiomeType.BUNKER)

  // 2. Seed City Centers
  // Hospitals, Police Stations, Factories, City High
  const citySeeds = Math.floor(radius / 2) + 2

  for (let i = 0; i < citySeeds; i++) {
    const target = landCells[Math.floor(rng.next() * landCells.length)]
    if (!target) continue

    const typeRoll = rng.next()
    if (typeRoll > 0.7) {
      target.biome = BiomeType.HOSPITAL
      target.resource = ResourceType.TECH // Medical supplies modeled as Tech or maybe distinct
      target.threatLevel = ThreatLevel.MEDIUM
    } else if (typeRoll > 0.5) {
      target.biome = BiomeType.POLICE
      target.resource = ResourceType.SCRAP // Guns/Ammo as Scrap/Tech
      target.threatLevel = ThreatLevel.HIGH
    } else if (typeRoll > 0.3) {
      target.biome = BiomeType.CITY_HIGH
      target.resource = ResourceType.TECH
      target.threatLevel = ThreatLevel.EXTREME
    } else {
      target.biome = BiomeType.FACTORY
      target.resource = ResourceType.FUEL
      target.threatLevel = ThreatLevel.MEDIUM
    }
  }

  // 3. Sprawl: Grow Urban/Industrial around seeds
  // Multiple passes to simulate growth
  const sprawlPasses = 2
  for (let p = 0; p < sprawlPasses; p++) {
    const currentMap = Array.from(mapMap.values())
    // Iterate over a copy or use current state? iterating current is fine for organic growth
    // Identify 'influencers'
    const influencers = currentMap.filter(c =>
      [BiomeType.CITY_HIGH, BiomeType.HOSPITAL, BiomeType.POLICE, BiomeType.FACTORY, BiomeType.URBAN, BiomeType.INDUSTRIAL].includes(c.biome)
    )

    for (const center of influencers) {
      const neighbors = getNeighbors(center.q, center.r)

      for (const nCoord of neighbors) {
        const nKey = hexToString(nCoord as HexCoordinate)
        const neighbor = mapMap.get(nKey)

        if (neighbor && neighbor.biome !== BiomeType.WATER && neighbor.biome !== BiomeType.BUNKER) {
          // Don't overwrite higher tier buildings with generic urban
          const highTier = [BiomeType.CITY_HIGH, BiomeType.HOSPITAL, BiomeType.POLICE, BiomeType.FACTORY]
          if (highTier.includes(neighbor.biome)) continue;

          const growChance = 0.5 - (p * 0.15) // Decay growth by pass
          if (rng.next() < growChance) {
            // If center is Factory, spread Industrial. Else Urban.
            if (center.biome === BiomeType.FACTORY || center.biome === BiomeType.INDUSTRIAL) {
              neighbor.biome = BiomeType.INDUSTRIAL
              if (rng.next() > 0.7) neighbor.resource = ResourceType.FUEL
              else neighbor.resource = ResourceType.SCRAP
              neighbor.threatLevel = ThreatLevel.MEDIUM
            } else {
              neighbor.biome = BiomeType.URBAN
              if (rng.next() > 0.8) neighbor.resource = ResourceType.TECH
              else neighbor.resource = ResourceType.SCRAP
              neighbor.threatLevel = ThreatLevel.HIGH
            }
          }
        }
      }
    }
  }


  // 4. Harbor Logic: Urban touching Water -> Industrial/Harbor
  for (const cell of mapMap.values()) {
    if (cell.biome === BiomeType.URBAN) {
      const neighbors = getNeighbors(cell.q, cell.r)
      let nearWater = false
      for (const n of neighbors) {
        const nc = mapMap.get(hexToString(n as HexCoordinate))
        if (nc && (nc.biome === BiomeType.WATER || nc.biome === BiomeType.RIVER)) {
          nearWater = true
          break
        }
      }
      if (nearWater && rng.next() > 0.3) {
        cell.biome = BiomeType.INDUSTRIAL // "Harbor" visuals usu. industrial
        cell.resource = ResourceType.SCRAP
      }
    }
  }

  // 5. River Logic refinement (optional, noise already keeps them somewhat contiguous if tuned, 
  // but we can add 'flow' if we want. For now relies on noise).
  // Let's at least rename small water bodies deep inland? No, keep simple.

  return Array.from(mapMap.values())
}
