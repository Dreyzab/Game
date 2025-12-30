type SafeZone = {
    name: string;
    faction: string;
    polygon: Array<{
        lat: number;
        lng: number;
    }>;
    isActive: boolean;
};
type SeedSafeZone = Pick<SafeZone, 'name' | 'faction' | 'polygon' | 'isActive'>;
export declare const SEED_SAFE_ZONES: SeedSafeZone[];
export {};
