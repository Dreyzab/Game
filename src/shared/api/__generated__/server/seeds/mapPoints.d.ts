export type SeedMapPoint = {
    id: string;
    title: string;
    description: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    type: 'poi' | 'quest' | 'npc' | 'location' | 'board' | 'settlement' | 'anomaly';
    phase?: number;
    isActive: boolean;
    metadata?: {
        qrCode?: string;
    } & Record<string, unknown>;
    qrCode?: string;
    createdAt?: number;
};
export declare const SEED_MAP_POINTS: SeedMapPoint[];
export declare function getSeedMapPoints(): SeedMapPoint[];
