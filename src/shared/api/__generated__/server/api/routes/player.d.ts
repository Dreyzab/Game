import { Elysia } from "elysia";
export declare const playerRoutes: (app: Elysia) => Elysia<"", {
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
    player: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    error: string;
                    status: number;
                    player?: undefined;
                    progress?: undefined;
                } | {
                    player: null;
                    error?: undefined;
                    status?: undefined;
                    progress?: undefined;
                } | {
                    player: {
                        id: number;
                        status: string | null;
                        userId: string | null;
                        deviceId: string | null;
                        name: string;
                        fame: number | null;
                        factionId: string | null;
                        squadId: string | null;
                        location: {
                            lat: number;
                            lng: number;
                        } | null;
                        lastSeen: number | null;
                        createdAt: number;
                        updatedAt: number;
                    };
                    progress: {
                        id: number;
                        updatedAt: number;
                        playerId: number;
                        currentScene: string | null;
                        visitedScenes: string[] | null;
                        flags: Record<string, any> | null;
                        level: number | null;
                        xp: number | null;
                        skillPoints: number | null;
                        skills: Record<string, number> | null;
                        subclasses: string[] | null;
                        gold: number | null;
                        reputation: Record<string, number> | null;
                        hp: number | null;
                        maxHp: number | null;
                        morale: number | null;
                        maxMorale: number | null;
                        stamina: number | null;
                        maxStamina: number | null;
                        phase: number | null;
                    } | undefined;
                    error?: undefined;
                    status?: undefined;
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
} & {
    player: {
        init: {
            post: {
                body: {
                    name?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        player?: undefined;
                        created?: undefined;
                    } | {
                        player: {
                            id: number;
                            status: string | null;
                            userId: string | null;
                            deviceId: string | null;
                            name: string;
                            fame: number | null;
                            factionId: string | null;
                            squadId: string | null;
                            location: {
                                lat: number;
                                lng: number;
                            } | null;
                            lastSeen: number | null;
                            createdAt: number;
                            updatedAt: number;
                        };
                        created: boolean;
                        error?: undefined;
                        status?: undefined;
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
