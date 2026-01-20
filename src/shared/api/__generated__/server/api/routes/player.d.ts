import { Elysia } from "elysia";
import { players } from "../../db/schema";
type PlayerRow = typeof players.$inferSelect;
type PublicPlayer = Omit<PlayerRow, "passwordHash" | "passwordSalt">;
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
                    totalQuests?: undefined;
                } | {
                    player: null;
                    error?: undefined;
                    status?: undefined;
                    progress?: undefined;
                    totalQuests?: undefined;
                } | {
                    player: PublicPlayer | null;
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
                        stateVersion: number | null;
                    } | undefined;
                    totalQuests: number;
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
                        player: PublicPlayer | null;
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
} & {
    player: {
        "city-registration": {
            post: {
                body: {
                    password?: string | undefined;
                    nickname?: string | undefined;
                    returnScene?: string | undefined;
                    method: "clerk" | "password";
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        error: string;
                        status: number;
                        player?: undefined;
                        progress?: undefined;
                    } | {
                        success: boolean;
                        player: PublicPlayer | null;
                        progress: {
                            id: number;
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
                            stateVersion: number | null;
                            updatedAt: number;
                        };
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
} & {
    player: {
        "reset-self": {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        ok: boolean;
                        error: string;
                        status: number;
                        reset?: undefined;
                        result?: undefined;
                    } | {
                        ok: boolean;
                        reset: boolean;
                        error?: undefined;
                        status?: undefined;
                        result?: undefined;
                    } | {
                        ok: boolean;
                        reset: boolean;
                        result: import("../../services/playerReset").ResetSelfResult;
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
} & {
    player: {
        locale: {
            post: {
                body: {
                    locale: "ru" | "en" | "de";
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        success?: undefined;
                        locale?: undefined;
                    } | {
                        success: boolean;
                        locale: string | null;
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
export {};
