
import { HexCell, BiomeType, ThreatLevel, ResourceType } from '../types';
import { getHexDistance } from '../utils/hexMath';

// Simple Pseudo-random number generator for consistent demos
class PseudoRandom {
  seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export const generateMap = (radius: number): HexCell[] => {
  const map: HexCell[] = [];
  const rng = new PseudoRandom(12345); // Fixed seed for reproducibility

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);

    for (let r = r1; r <= r2; r++) {
      const dist = getHexDistance({ q: 0, r: 0 }, { q, r });
      let biome = BiomeType.WASTELAND;
      let threat = ThreatLevel.LOW;
      let elevation = rng.next();
      let isObstacle = false;
      let resource = ResourceType.NONE;

      // Center is always Bunker
      if (dist === 0) {
        biome = BiomeType.BUNKER;
        threat = ThreatLevel.SAFE;
        elevation = 0.5;
      } else {
        // Procedural rules for Biome & Threat
        const noise = rng.next();
        
        if (dist > 6) {
            threat = ThreatLevel.HIGH;
        } else if (dist > 3) {
            threat = ThreatLevel.MEDIUM;
        }

        if (noise > 0.8) {
          biome = BiomeType.URBAN;
          threat = ThreatLevel.EXTREME;
        } else if (noise > 0.6) {
          biome = BiomeType.FOREST;
        } else if (noise > 0.4) {
          biome = BiomeType.INDUSTRIAL;
        } else if (noise < 0.1) {
            biome = BiomeType.WATER;
            isObstacle = true;
        }

        // Resource Distribution Logic
        const resRoll = rng.next();
        
        if (biome === BiomeType.URBAN) {
          if (resRoll > 0.7) resource = ResourceType.SCRAP;
          else if (resRoll < 0.1) resource = ResourceType.TECH;
        } else if (biome === BiomeType.INDUSTRIAL) {
          if (resRoll > 0.6) resource = ResourceType.FUEL;
          else if (resRoll < 0.2) resource = ResourceType.SCRAP;
        } else if (biome === BiomeType.FOREST) {
          if (resRoll > 0.5) resource = ResourceType.FOOD;
        } else if (biome === BiomeType.WATER) {
          if (resRoll > 0.7) resource = ResourceType.WATER;
        } else if (biome === BiomeType.WASTELAND) {
          if (resRoll > 0.9) resource = ResourceType.SCRAP;
        }
      }

      map.push({
        q,
        r,
        biome,
        threatLevel: threat,
        elevation,
        isObstacle,
        resource
      });
    }
  }

  return map;
};
