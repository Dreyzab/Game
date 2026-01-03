import { Elysia } from "elysia";
import { type QrAction } from "../../lib/qrBonuses";
export declare const mapRoutes: (app: Elysia) => Elysia<"", {
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
    map: {
        points: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        points: ({
                            id: any;
                            title: any;
                            description: any;
                            lat: any;
                            lng: any;
                            type: any;
                            phase: any;
                            isActive: any;
                            metadata: any;
                            status: string;
                            discoveredAt: number | undefined;
                            researchedAt: number | undefined;
                        } | null)[];
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
    map: {
        discover: {
            post: {
                body: {
                    lat: number;
                    lng: number;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        discoveredIds?: undefined;
                    } | {
                        success: boolean;
                        discoveredIds: string[];
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
    map: {
        "activate-qr": {
            post: {
                body: {
                    pointId?: string | undefined;
                    qrData: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        error: string;
                        status: number;
                        kind?: undefined;
                        gated?: undefined;
                        actions?: undefined;
                        bonusId?: undefined;
                        title?: undefined;
                        alreadyClaimed?: undefined;
                        awardedItems?: undefined;
                        pointId?: undefined;
                        unlockStatus?: undefined;
                    } | {
                        success: boolean;
                        kind: string;
                        gated: boolean;
                        actions: QrAction[];
                        error?: undefined;
                        status?: undefined;
                        bonusId?: undefined;
                        title?: undefined;
                        alreadyClaimed?: undefined;
                        awardedItems?: undefined;
                        pointId?: undefined;
                        unlockStatus?: undefined;
                    } | {
                        success: boolean;
                        kind: string;
                        bonusId: string;
                        title: string;
                        alreadyClaimed: boolean;
                        actions: QrAction[];
                        awardedItems: {
                            itemId: string;
                            quantity: number;
                            dbId?: string;
                        }[];
                        error?: undefined;
                        status?: undefined;
                        gated?: undefined;
                        pointId?: undefined;
                        unlockStatus?: undefined;
                    } | {
                        success: boolean;
                        kind: string;
                        pointId: string;
                        status: string;
                        unlockStatus: "researched" | "already_researched";
                        actions: QrAction[];
                        error?: undefined;
                        gated?: undefined;
                        bonusId?: undefined;
                        title?: undefined;
                        alreadyClaimed?: undefined;
                        awardedItems?: undefined;
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
    map: {
        zones: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        zones: {
                            id: number;
                            status: "locked" | "peace" | "contested" | null;
                            name: string;
                            center: {
                                lat: number;
                                lng: number;
                            };
                            radius: number;
                            ownerFactionId: string | null;
                            health: number | null;
                            lastCapturedAt: number | null;
                        }[];
                        safeZones: {
                            id: number;
                            title: string | null;
                            isActive: boolean | null;
                            faction: string | null;
                            polygon: {
                                lat: number;
                                lng: number;
                            }[];
                        }[];
                        dangerZones: ({
                            id: number;
                            title: string | null;
                            isActive: boolean | null;
                            polygon: {
                                lat: number;
                                lng: number;
                            }[];
                            key: string | null;
                            dangerLevel: string | null;
                            spawnPoints: {
                                lat: number;
                                lng: number;
                            }[] | null;
                        } | {
                            hasActiveRift: boolean;
                            riftIntensity: number | null;
                            id: number;
                            title: string | null;
                            isActive: boolean | null;
                            polygon: {
                                lat: number;
                                lng: number;
                            }[];
                            key: string | null;
                            dangerLevel: string | null;
                            spawnPoints: {
                                lat: number;
                                lng: number;
                            }[] | null;
                        })[];
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
} & {
    derive: {
        readonly user: {
            id: string;
            type: "clerk" | "guest";
        } | null;
        readonly isGuest: boolean;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: import("elysia").ExtractErrorFromHandle<{
        readonly user: {
            id: string;
            type: "clerk" | "guest";
        } | null;
        readonly isGuest: boolean;
    }>;
}>;
