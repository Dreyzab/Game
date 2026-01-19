/**
 * Survival Mode REST API Routes
 * Endpoints for session management, zone entry, and event resolution
 */
import { Elysia } from "elysia";
export declare const survivalRoutes: (app: Elysia) => Elysia<"", {
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
    survival: {
        sessions: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        session: import("../../shared/types/survival").SurvivalState;
                        error?: undefined;
                        status?: undefined;
                    } | {
                        error: any;
                        status: number;
                        session?: undefined;
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
    survival: {
        sessions: {
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            status: number;
                            session?: undefined;
                        } | {
                            session: import("../../shared/types/survival").SurvivalState;
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
    survival: {
        sessions: {
            ":id": {
                join: {
                    post: {
                        body: {
                            role?: string | undefined;
                            playerName?: string | undefined;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                session: import("../../shared/types/survival").SurvivalState;
                                player: import("../../shared/types/survival").SurvivalPlayer;
                                error?: undefined;
                                status?: undefined;
                            } | {
                                error: any;
                                status: number;
                                session?: undefined;
                                player?: undefined;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                role: {
                    post: {
                        body: {
                            role: string;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                session: import("../../shared/types/survival").SurvivalState;
                                error?: undefined;
                                status?: undefined;
                            } | {
                                error: any;
                                status: number;
                                session?: undefined;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                start: {
                    post: {
                        body: unknown;
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                session: import("../../shared/types/survival").SurvivalState;
                                error?: undefined;
                                status?: undefined;
                            } | {
                                error: any;
                                status: number;
                                session?: undefined;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                enter: {
                    post: {
                        body: {
                            zoneId: string;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                event: import("../../shared/types/survival").SurvivalEvent | null;
                                zoneInfo?: {
                                    threatLevel: string;
                                    lootQuality: string;
                                };
                            } | {
                                error: any;
                                status: number;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                "zone-action": {
                    post: {
                        body: {
                            actionId: string;
                            zoneId: string;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                message: string;
                                state: import("../../shared/types/survival").SurvivalState;
                            } | {
                                error: any;
                                status: number;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                resolve: {
                    post: {
                        body: {
                            optionId: string;
                            eventId: string;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                effect: import("../../shared/types/survival").EventEffect;
                                message: string;
                            } | {
                                error: any;
                                status: number;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                "complete-battle": {
                    post: {
                        body: {
                            hp?: number | undefined;
                            result: string;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                message: string;
                                state: import("../../shared/types/survival").SurvivalState;
                            } | {
                                error: any;
                                status: number;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                "consume-transition": {
                    post: {
                        body: unknown;
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                state: import("../../shared/types/survival").SurvivalState;
                            } | {
                                error: any;
                                status: number;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                transfer: {
                    post: {
                        body: {
                            items: {
                                templateId: string;
                                quantity: number;
                            }[];
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                session: import("../../shared/types/survival").SurvivalState;
                                error?: undefined;
                                status?: undefined;
                            } | {
                                error: any;
                                status: number;
                                session?: undefined;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                move: {
                    post: {
                        body: {
                            targetHex: {
                                q: number;
                                r: number;
                            };
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                message: string;
                                arriveAtWorldTimeMs?: number;
                            } | {
                                error: any;
                                status: number;
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                trader: {
                    get: {
                        body: unknown;
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                inventory?: undefined;
                            } | {
                                inventory: import("../../services/traderService").TraderInventoryItem[];
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
    };
} & {
    survival: {
        sessions: {
            ":id": {
                trader: {
                    buy: {
                        post: {
                            body: {
                                templateId: string;
                                quantity: number;
                            };
                            params: {
                                id: string;
                            } & {};
                            query: unknown;
                            headers: unknown;
                            response: {
                                200: {
                                    success: boolean;
                                    message: string;
                                } | {
                                    error: string;
                                    status: number;
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
        };
    };
} & {
    survival: {
        sessions: {
            ":id": {
                trader: {
                    sell: {
                        post: {
                            body: {
                                templateId: string;
                                quantity: number;
                            };
                            params: {
                                id: string;
                            } & {};
                            query: unknown;
                            headers: unknown;
                            response: {
                                200: {
                                    success: boolean;
                                    message: string;
                                } | {
                                    error: string;
                                    status: number;
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
