export interface HexCoordinate {
  q: number
  r: number
}

export enum BiomeType {
  BUNKER = 'BUNKER',
  WASTELAND = 'WASTELAND',
  FOREST = 'FOREST',
  URBAN = 'URBAN',
  INDUSTRIAL = 'INDUSTRIAL',
  WATER = 'WATER',
  HOSPITAL = 'HOSPITAL',
  POLICE = 'POLICE',
  RIVER = 'RIVER',
  FACTORY = 'FACTORY',
  CITY_HIGH = 'CITY_HIGH',
  ADMIN = 'ADMIN',
  SKYSCRAPER = 'SKYSCRAPER',
  FIRE_STATION = 'FIRE_STATION',
  MALL = 'MALL',
  RAILWAY_DEPOT = 'RAILWAY_DEPOT',
  BUILDING_LOW = 'BUILDING_LOW',
  PARKING_LOW = 'PARKING_LOW',
  WAREHOUSE = 'WAREHOUSE',
  GAS_STATION = 'GAS_STATION',
  SCAVENGER_CAMP = 'SCAVENGER_CAMP',
  ARMY_BASE = 'ARMY_BASE',
  AIRPORT = 'AIRPORT',
  ROAD_HIGH = 'ROAD_HIGH',
  ROAD_LOW = 'ROAD_LOW',
  ROAD_CITY = 'ROAD_CITY',
  ROAD_FOREST = 'ROAD_FOREST',
}

export enum ThreatLevel {
  SAFE = 'SAFE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EXTREME = 'EXTREME',
}

export enum ResourceType {
  NONE = 'NONE',
  SCRAP = 'SCRAP',
  FOOD = 'FOOD',
  WATER = 'WATER',
  FUEL = 'FUEL',
  TECH = 'TECH',
}

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
