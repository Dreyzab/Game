
export interface HexCoordinate {
  q: number;
  r: number;
}

export enum BiomeType {
  BUNKER = 'BUNKER',
  WASTELAND = 'WASTELAND',
  FOREST = 'FOREST',
  URBAN = 'URBAN',
  INDUSTRIAL = 'INDUSTRIAL',
  WATER = 'WATER'
}

export enum ThreatLevel {
  SAFE = 'SAFE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EXTREME = 'EXTREME'
}

export enum ResourceType {
  NONE = 'NONE',
  SCRAP = 'SCRAP',
  FOOD = 'FOOD',
  WATER = 'WATER',
  FUEL = 'FUEL',
  TECH = 'TECH'
}

export interface HexCell extends HexCoordinate {
  biome: BiomeType;
  threatLevel: ThreatLevel;
  elevation: number; // 0-1
  isObstacle: boolean;
  resource: ResourceType;
}

export interface SurvivalPlayer {
  position: HexCoordinate;
  ap: number;
  maxAp: number;
  health: number;
  maxHealth: number;
  inventory: string[];
}

export interface GameState {
  map: HexCell[];
  player: SurvivalPlayer;
  revealedHexes: Set<string>; // Stored as "q,r" strings for easy lookup
  turn: number;
}
