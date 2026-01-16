export interface HexCoordinate {
  q: number
  r: number
}

// String literal union type for biomes (compatible with erasableSyntaxOnly)
export type BiomeType =
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

// Array of all biome values for iteration
export const BIOME_VALUES: BiomeType[] = [
  'BUNKER', 'WASTELAND', 'FOREST', 'URBAN', 'INDUSTRIAL', 'WATER',
  'HOSPITAL', 'POLICE', 'RIVER', 'FACTORY', 'CITY_HIGH', 'ADMIN',
  'SKYSCRAPER', 'FIRE_STATION', 'MALL', 'RAILWAY_DEPOT', 'BUILDING_LOW',
  'PARKING_LOW', 'WAREHOUSE', 'GAS_STATION', 'SCAVENGER_CAMP', 'ARMY_BASE',
  'AIRPORT', 'ROAD_HIGH', 'ROAD_LOW', 'ROAD_CITY', 'ROAD_FOREST'
]

export type ThreatLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

// Array of all threat level values for iteration
export const THREAT_VALUES: ThreatLevel[] = ['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'EXTREME']

export type ResourceType = 'NONE' | 'SCRAP' | 'FOOD' | 'WATER' | 'FUEL' | 'TECH'

// Array of all resource type values for iteration
export const RESOURCE_VALUES: ResourceType[] = ['NONE', 'SCRAP', 'FOOD', 'WATER', 'FUEL', 'TECH']

export interface HexCell extends HexCoordinate {
  biome: BiomeType
  threatLevel: ThreatLevel
  elevation: number
  isObstacle: boolean
  resource: ResourceType
}

export interface SurvivalPlayer {
  position: HexCoordinate
  ap: number
  maxAp: number
  health: number
  maxHealth: number
  inventory: string[]
}

export interface GameState {
  map: HexCell[]
  player: SurvivalPlayer
  revealedHexes: Set<string>
  turn: number
}
