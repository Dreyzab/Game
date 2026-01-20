/**
 * Shared Hexmap Types
 * Used by both client and server for deterministic map generation.
 */
export interface HexCoordinate {
    q: number;
    r: number;
}
export type BiomeType = 'BUNKER' | 'WASTELAND' | 'FOREST' | 'URBAN' | 'INDUSTRIAL' | 'WATER' | 'HOSPITAL' | 'POLICE' | 'RIVER' | 'FACTORY' | 'CITY_HIGH' | 'ADMIN' | 'SKYSCRAPER' | 'FIRE_STATION' | 'MALL' | 'RAILWAY_DEPOT' | 'BUILDING_LOW' | 'PARKING_LOW' | 'WAREHOUSE' | 'GAS_STATION' | 'SCAVENGER_CAMP' | 'ARMY_BASE' | 'AIRPORT' | 'ROAD_HIGH' | 'ROAD_LOW' | 'ROAD_CITY' | 'ROAD_FOREST';
export declare const BIOME_VALUES: BiomeType[];
export type ThreatLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export declare const THREAT_VALUES: ThreatLevel[];
export type ResourceType = 'NONE' | 'SCRAP' | 'FOOD' | 'WATER' | 'FUEL' | 'TECH';
export declare const RESOURCE_VALUES: ResourceType[];
export interface HexCell extends HexCoordinate {
    biome: BiomeType;
    threatLevel: ThreatLevel;
    elevation: number;
    isObstacle: boolean;
    resource: ResourceType;
}
export interface RegionConfig {
    id: string;
    name: string;
    nameRu: string;
    /** Geographic center [longitude, latitude] for Mapbox */
    geoCenterLngLat: [number, number];
    /** Multiplier for biome generation probability (1.0 = normal) */
    biomeWeights?: Partial<Record<BiomeType, number>>;
    /** Multiplier for resource assignment probability (1.0 = normal) */
    resourceWeights?: Partial<Record<ResourceType, number>>;
    /** Special map features */
    features?: {
        /** Force a river path across the map */
        river?: boolean;
    };
    /** Image for UI card */
    imageUrl?: string;
}
