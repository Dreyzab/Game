import { Elysia } from "elysia";
export declare const resonanceRoutes: (app: Elysia) => Elysia<"", {
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
    resonance: {
        sessions: {
            post: {
                body: {
                    hostName?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        session?: undefined;
                    } | {
                        session: import("../../lib/resonance/types").ResonanceSession;
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
    resonance: {
        sessions: {
            ":code": {
                join: {
                    post: {
                        body: {
                            deviceId?: string | undefined;
                            name?: string | undefined;
                            rank?: number | undefined;
                            archetype?: string | undefined;
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                                scene?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("../../lib/resonance/types").SceneNode | undefined;
                                    injection: string | undefined;
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
    };
} & {
    resonance: {
        sessions: {
            ":code": {
                state: {
                    get: {
                        body: unknown;
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                                scene?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("../../lib/resonance/types").SceneNode | undefined;
                                    injection: string | undefined;
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
    };
} & {
    resonance: {
        sessions: {
            ":code": {
                vote: {
                    post: {
                        body: {
                            optionId: string;
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                                scene?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
                                error: "NOT_VOTE_SCENE" | "OPTION_INVALID" | null;
                                scene: {
                                    scene: import("../../lib/resonance/types").SceneNode | undefined;
                                    injection: string | undefined;
                                };
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
    resonance: {
        sessions: {
            ":code": {
                check: {
                    post: {
                        body: {
                            onSuccess?: any;
                            positionOptimum?: number | undefined;
                            onFail?: any;
                            skill: string;
                            dc: number;
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                                result?: undefined;
                                scene?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
                                result: {
                                    success: boolean;
                                    reason: "PLAYER_NOT_FOUND";
                                    roll?: undefined;
                                    total?: undefined;
                                } | {
                                    success: boolean;
                                    roll: number;
                                    total: number;
                                    reason?: undefined;
                                };
                                scene: {
                                    scene: import("../../lib/resonance/types").SceneNode | undefined;
                                    injection: string | undefined;
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
    };
} & {
    resonance: {
        sessions: {
            ":code": {
                "item-use": {
                    post: {
                        body: {
                            targetPlayerId?: string | undefined;
                            context?: string | undefined;
                            itemId: string;
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                                scene?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("../../lib/resonance/types").SceneNode | undefined;
                                    injection: string | undefined;
                                };
                                error: "PLAYER_NOT_FOUND" | "ITEM_NOT_FOUND" | "COOLDOWN" | "NO_CHARGES" | null;
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
    resonance: {
        sessions: {
            ":code": {
                interrupt: {
                    post: {
                        body: {
                            targetOptionId?: string | undefined;
                            type: "rebellion" | "force_next";
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                                scene?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
                                error: "PLAYER_NOT_FOUND" | "SCENE_NOT_FOUND" | null;
                                scene: {
                                    scene: import("../../lib/resonance/types").SceneNode | undefined;
                                    injection: string | undefined;
                                };
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
    resonance: {
        sessions: {
            ":code": {
                brake: {
                    post: {
                        body: {
                            active: boolean;
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                                scene?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("../../lib/resonance/types").SceneNode | undefined;
                                    injection: string | undefined;
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
    };
} & {
    resonance: {
        sessions: {
            ":code": {
                kudos: {
                    post: {
                        body: {
                            tag: string;
                            toPlayerId: string;
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
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
    resonance: {
        sessions: {
            ":code": {
                proxemic: {
                    post: {
                        body: {
                            hint: string;
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
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
    resonance: {
        sessions: {
            ":code": {
                advance: {
                    post: {
                        body: {
                            nextSceneId?: string | undefined;
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                status: number;
                                session?: undefined;
                                scene?: undefined;
                            } | {
                                session: import("../../lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("../../lib/resonance/types").SceneNode | undefined;
                                    injection: string | undefined;
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
