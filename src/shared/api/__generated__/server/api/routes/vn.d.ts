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
        session: {
            start: {
                post: {
                    body: {
                        conditions?: any;
                        sceneId: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            status: number;
                            sessionId?: undefined;
                            sessionToken?: undefined;
                            seed?: undefined;
                            stateVersion?: undefined;
                            expiresAt?: undefined;
                            allowedOps?: undefined;
                            initialState?: undefined;
                        } | {
                            sessionId: string;
                            sessionToken: string;
                            seed: number;
                            stateVersion: any;
                            expiresAt: number;
                            allowedOps: string[];
                            initialState: {
                                hp: any;
                                skills: Record<string, number>;
                                flags: Record<string, any>;
                                reputation: any;
                                level: number | null;
                                xp: number | null;
                                phase: number | null;
                                stateVersion: any;
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
    };
} & {
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
                            attributes: any;
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
                            stateVersion: number | null;
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
                    sessionId: string;
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
                        decisionLog?: any[] | undefined;
                        questCommands?: {
                            progress?: number | undefined;
                            delta?: number | undefined;
                            reason?: string | undefined;
                            step?: string | undefined;
                            stepId?: string | undefined;
                            progressDelta?: number | undefined;
                            op: string;
                            questId: string;
                        }[] | undefined;
                    };
                    commitNonce: string;
                    sessionToken: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
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
