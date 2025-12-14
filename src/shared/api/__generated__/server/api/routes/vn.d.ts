import { Elysia } from "elysia";
export declare const vnRoutes: (app: Elysia) => Elysia<"", {
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
    vn: {
        state: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        progress?: undefined;
                    } | {
                        progress: {
                            visitedScenes: string[];
                            flags: Record<string, any>;
                            reputation: any;
                            skills: Record<string, number>;
                            id: number;
                            updatedAt: number;
                            playerId: number;
                            currentScene: string | null;
                            level: number | null;
                            xp: number | null;
                            skillPoints: number | null;
                            subclasses: string[] | null;
                            gold: number | null;
                            hp: number | null;
                            maxHp: number | null;
                            morale: number | null;
                            maxMorale: number | null;
                            stamina: number | null;
                            maxStamina: number | null;
                            phase: number | null;
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
    vn: {
        commit: {
            post: {
                body: {
                    sceneId: string;
                    payload: {
                        visitedScenes?: string[] | undefined;
                        reputation?: {} | undefined;
                        items?: {
                            quantity?: number | undefined;
                            itemId: string;
                        }[] | undefined;
                        quests?: string[] | undefined;
                        startedAt?: number | undefined;
                        choices?: {
                            effects?: any;
                            lineId?: string | undefined;
                            sceneId: string;
                            choiceId: string;
                        }[] | undefined;
                        finishedAt?: number | undefined;
                        addFlags?: string[] | undefined;
                        removeFlags?: string[] | undefined;
                        xpDelta?: number | undefined;
                        advancePhaseTo?: number | undefined;
                    };
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        success?: undefined;
                        progress?: undefined;
                        awardedItems?: undefined;
                    } | {
                        success: boolean;
                        progress: {
                            currentScene: string;
                            visitedScenes: string[];
                            flags: Record<string, unknown>;
                            level: number;
                            xp: number;
                            skillPoints: number;
                            phase: number;
                            reputation: Record<string, number>;
                            updatedAt: number;
                            id: number;
                            playerId: number;
                            skills: Record<string, number> | null;
                            subclasses: string[] | null;
                            gold: number | null;
                            hp: number | null;
                            maxHp: number | null;
                            morale: number | null;
                            maxMorale: number | null;
                            stamina: number | null;
                            maxStamina: number | null;
                        };
                        awardedItems: {
                            itemId: string;
                            quantity: number;
                            dbId?: string;
                        }[];
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
    vn: {
        advice: {
            post: {
                body: {
                    sceneId: string;
                    lineId: string;
                    characterId: string;
                    choiceContext: string[];
                    skillLevel: number;
                    viewOrder: number;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        success?: undefined;
                        timestamp?: undefined;
                    } | {
                        success: boolean;
                        timestamp: number;
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
