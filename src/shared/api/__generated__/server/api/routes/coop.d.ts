import { Elysia } from "elysia";
export declare const coopRoutes: (app: Elysia) => Elysia<"", {
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
    coop: {
        rooms: {
            post: {
                body: {
                    role?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        room?: undefined;
                    } | {
                        room: {
                            players: {
                                id: string;
                                role: ("body" | "scout" | "mind" | "social" | "assault" | "support") | undefined;
                                ready: boolean;
                            }[];
                            quest: import("../../lib/roomStore").CoopQuestState | null;
                            code: string;
                            hostId: string;
                            status: "lobby" | "in_progress" | "finished";
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
    coop: {
        rooms: {
            ":code": {
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
                            room?: undefined;
                        } | {
                            room: {
                                players: {
                                    id: string;
                                    role: ("body" | "scout" | "mind" | "social" | "assault" | "support") | undefined;
                                    ready: boolean;
                                }[];
                                quest: import("../../lib/roomStore").CoopQuestState | null;
                                code: string;
                                hostId: string;
                                status: "lobby" | "in_progress" | "finished";
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
    };
} & {
    coop: {
        rooms: {
            ":code": {
                join: {
                    post: {
                        body: {
                            role?: string | undefined;
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
                                room?: undefined;
                            } | {
                                room: {
                                    players: {
                                        id: string;
                                        role: ("body" | "scout" | "mind" | "social" | "assault" | "support") | undefined;
                                        ready: boolean;
                                    }[];
                                    quest: import("../../lib/roomStore").CoopQuestState | null;
                                    code: string;
                                    hostId: string;
                                    status: "lobby" | "in_progress" | "finished";
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
        };
    };
} & {
    coop: {
        rooms: {
            ":code": {
                leave: {
                    post: {
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
                                ok?: undefined;
                                removed?: undefined;
                                room?: undefined;
                            } | {
                                ok: boolean;
                                removed: boolean;
                                error?: undefined;
                                status?: undefined;
                                room?: undefined;
                            } | {
                                room: {
                                    players: {
                                        id: string;
                                        role: ("body" | "scout" | "mind" | "social" | "assault" | "support") | undefined;
                                        ready: boolean;
                                    }[];
                                    quest: import("../../lib/roomStore").CoopQuestState | null;
                                    code: string;
                                    hostId: string;
                                    status: "lobby" | "in_progress" | "finished";
                                    updatedAt: number;
                                };
                                error?: undefined;
                                status?: undefined;
                                ok?: undefined;
                                removed?: undefined;
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
    coop: {
        rooms: {
            ":code": {
                ready: {
                    post: {
                        body: {
                            ready: boolean;
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
                                room?: undefined;
                            } | {
                                room: {
                                    players: {
                                        id: string;
                                        role: ("body" | "scout" | "mind" | "social" | "assault" | "support") | undefined;
                                        ready: boolean;
                                    }[];
                                    quest: import("../../lib/roomStore").CoopQuestState | null;
                                    code: string;
                                    hostId: string;
                                    status: "lobby" | "in_progress" | "finished";
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
        };
    };
} & {
    coop: {
        rooms: {
            ":code": {
                start: {
                    post: {
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
                                room?: undefined;
                            } | {
                                room: {
                                    players: {
                                        id: string;
                                        role: ("body" | "scout" | "mind" | "social" | "assault" | "support") | undefined;
                                        ready: boolean;
                                    }[];
                                    quest: import("../../lib/roomStore").CoopQuestState | null;
                                    code: string;
                                    hostId: string;
                                    status: "lobby" | "in_progress" | "finished";
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
        };
    };
} & {
    coop: {
        rooms: {
            ":code": {
                quest: {
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
                                quest?: undefined;
                                node?: undefined;
                            } | {
                                quest: import("../../lib/roomStore").CoopQuestState;
                                node: import("../../lib/roomStore").CoopQuestNode;
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
    coop: {
        rooms: {
            ":code": {
                quest: {
                    post: {
                        body: {
                            choiceId: string;
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
                                quest?: undefined;
                                node?: undefined;
                            } | {
                                quest: import("../../lib/roomStore").CoopQuestState;
                                node: import("../../lib/roomStore").CoopQuestNode;
                                error: string | undefined;
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
