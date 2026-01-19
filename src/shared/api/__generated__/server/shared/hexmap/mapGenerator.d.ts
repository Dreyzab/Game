export interface HexCoordinate {
    q: number;
    r: number;
}
export type HexBiomeType = 'BUNKER' | 'WASTELAND' | 'FOREST' | 'URBAN' | 'INDUSTRIAL' | 'WATER' | 'HOSPITAL' | 'POLICE' | 'RIVER' | 'FACTORY' | 'CITY_HIGH' | 'ADMIN' | 'SKYSCRAPER' | 'FIRE_STATION' | 'MALL' | 'RAILWAY_DEPOT' | 'BUILDING_LOW' | 'PARKING_LOW' | 'WAREHOUSE' | 'GAS_STATION' | 'SCAVENGER_CAMP' | 'ARMY_BASE' | 'AIRPORT' | 'ROAD_HIGH' | 'ROAD_LOW' | 'ROAD_CITY' | 'ROAD_FOREST';
export type HexThreatLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type HexResourceType = 'NONE' | 'SCRAP' | 'FOOD' | 'WATER' | 'FUEL' | 'TECH';
export interface HexCell extends HexCoordinate {
    biome: HexBiomeType;
    threatLevel: HexThreatLevel;
    elevation: number;
    isObstacle: boolean;
    resource: HexResourceType;
}
export declare function hexToString(h: HexCoordinate): string;
export declare function getHexDistance(a: HexCoordinate, b: HexCoordinate): number;
export declare function generateHexMap(radius: number, seed: number): Map<string, HexCell>;
export declare function getHexCell(radius: number, seed: number, hex: HexCoordinate): HexCell | null;
