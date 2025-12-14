/**
 * Mastery API Routes
 * =====================================================
 * Endpoints for weapon mastery progression system.
 * =====================================================
 */
import { Elysia } from 'elysia';
import { type WeaponMasteryType } from '../../db/schema';
export declare const masteryRoutes: (app: Elysia) => Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
    mastery: {};
} & {
    mastery: {
        my: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        masteries: never[];
                    } | {
                        masteries: {
                            id: number;
                            playerId: number;
                            weaponType: WeaponMasteryType;
                            level: number;
                            xp: number;
                            xpToNextLevel: number;
                            unlockedCards: import("../../db/schema").MasteryUnlock[] | null;
                            totalXpEarned: number;
                            totalKills: number;
                            createdAt: number;
                            updatedAt: number;
                        }[];
                        error?: undefined;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    mastery: {
        ":weaponType": {
            get: {
                body: unknown;
                params: {
                    weaponType: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        weaponType?: undefined;
                        level?: undefined;
                        xp?: undefined;
                        xpToNextLevel?: undefined;
                        unlockedCards?: undefined;
                        totalKills?: undefined;
                    } | {
                        weaponType: string;
                        level: number;
                        xp: number;
                        xpToNextLevel: number;
                        unlockedCards: string[];
                        totalKills: number;
                        error?: undefined;
                    } | {
                        unlockedCardIds: string[];
                        id: number;
                        playerId: number;
                        weaponType: WeaponMasteryType;
                        level: number;
                        xp: number;
                        xpToNextLevel: number;
                        unlockedCards: import("../../db/schema").MasteryUnlock[] | null;
                        totalXpEarned: number;
                        totalKills: number;
                        createdAt: number;
                        updatedAt: number;
                        error?: undefined;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    mastery: {
        "add-xp": {
            post: {
                body: {
                    kills?: number | undefined;
                    weaponType: string;
                    xpAmount: number;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        success?: undefined;
                        level?: undefined;
                        xp?: undefined;
                        xpToNextLevel?: undefined;
                        leveledUp?: undefined;
                        newUnlocks?: undefined;
                        totalKills?: undefined;
                    } | {
                        success: boolean;
                        level: number;
                        xp: number;
                        xpToNextLevel: number;
                        leveledUp: boolean;
                        newUnlocks: string[];
                        totalKills: number;
                        error?: undefined;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
