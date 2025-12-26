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
                            code: string;
                            status: string | null;
                            hostId: number;
                            sceneId: string | null;
                            questNode: import("../../shared/types/coop").CoopQuestNode;
                            participants: {
                                id: number;
                                name: string;
                                role: string | null;
                                ready: boolean | null;
                            }[];
                            votes: {
                                id: number;
                                createdAt: number;
                                sessionId: number;
                                sceneId: string;
                                choiceId: string;
                                voterId: number;
                            }[];
                        } | null;
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
                                code: string;
                                status: string | null;
                                hostId: number;
                                sceneId: string | null;
                                questNode: import("../../shared/types/coop").CoopQuestNode;
                                participants: {
                                    id: number;
                                    name: string;
                                    role: string | null;
                                    ready: boolean | null;
                                }[];
                                votes: {
                                    id: number;
                                    createdAt: number;
                                    sessionId: number;
                                    sceneId: string;
                                    choiceId: string;
                                    voterId: number;
                                }[];
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
                                room: {
                                    code: string;
                                    status: string | null;
                                    hostId: number;
                                    sceneId: string | null;
                                    questNode: import("../../shared/types/coop").CoopQuestNode;
                                    participants: {
                                        id: number;
                                        name: string;
                                        role: string | null;
                                        ready: boolean | null;
                                    }[];
                                    votes: {
                                        id: number;
                                        createdAt: number;
                                        sessionId: number;
                                        sceneId: string;
                                        choiceId: string;
                                        voterId: number;
                                    }[];
                                } | null;
                                error?: undefined;
                                status?: undefined;
                            } | {
                                error: any;
                                status: number;
                                room?: undefined;
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
                                room?: undefined;
                            } | {
                                room: {
                                    code: string;
                                    status: string | null;
                                    hostId: number;
                                    sceneId: string | null;
                                    questNode: import("../../shared/types/coop").CoopQuestNode;
                                    participants: {
                                        id: number;
                                        name: string;
                                        role: string | null;
                                        ready: boolean | null;
                                    }[];
                                    votes: {
                                        id: number;
                                        createdAt: number;
                                        sessionId: number;
                                        sceneId: string;
                                        choiceId: string;
                                        voterId: number;
                                    }[];
                                } | null;
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
                                    code: string;
                                    status: string | null;
                                    hostId: number;
                                    sceneId: string | null;
                                    questNode: import("../../shared/types/coop").CoopQuestNode;
                                    participants: {
                                        id: number;
                                        name: string;
                                        role: string | null;
                                        ready: boolean | null;
                                    }[];
                                    votes: {
                                        id: number;
                                        createdAt: number;
                                        sessionId: number;
                                        sceneId: string;
                                        choiceId: string;
                                        voterId: number;
                                    }[];
                                } | null;
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
                                room: {
                                    code: string;
                                    status: string | null;
                                    hostId: number;
                                    sceneId: string | null;
                                    questNode: import("../../shared/types/coop").CoopQuestNode;
                                    participants: {
                                        id: number;
                                        name: string;
                                        role: string | null;
                                        ready: boolean | null;
                                    }[];
                                    votes: {
                                        id: number;
                                        createdAt: number;
                                        sessionId: number;
                                        sceneId: string;
                                        choiceId: string;
                                        voterId: number;
                                    }[];
                                } | null;
                                error?: undefined;
                                status?: undefined;
                            } | {
                                error: any;
                                status: number;
                                room?: undefined;
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
                            asPlayerId?: number | undefined;
                            choiceId: string;
                        };
                        params: {
                            code: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                room: {
                                    code: string;
                                    status: string | null;
                                    hostId: number;
                                    sceneId: string | null;
                                    questNode: import("../../shared/types/coop").CoopQuestNode;
                                    participants: {
                                        id: number;
                                        name: string;
                                        role: string | null;
                                        ready: boolean | null;
                                    }[];
                                    votes: {
                                        id: number;
                                        createdAt: number;
                                        sessionId: number;
                                        sceneId: string;
                                        choiceId: string;
                                        voterId: number;
                                    }[];
                                } | null;
                                error?: undefined;
                                status?: undefined;
                            } | {
                                error: any;
                                status: number;
                                room?: undefined;
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
                force: {
                    post: {
                        body: {
                            nodeId: string;
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
                                    code: string;
                                    status: string | null;
                                    hostId: number;
                                    sceneId: string | null;
                                    questNode: import("../../shared/types/coop").CoopQuestNode;
                                    participants: {
                                        id: number;
                                        name: string;
                                        role: string | null;
                                        ready: boolean | null;
                                    }[];
                                    votes: {
                                        id: number;
                                        createdAt: number;
                                        sessionId: number;
                                        sceneId: string;
                                        choiceId: string;
                                        voterId: number;
                                    }[];
                                } | null;
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
                debug: {
                    add_bot: {
                        post: {
                            body: unknown;
                            params: {
                                code: string;
                            } & {};
                            query: unknown;
                            headers: unknown;
                            response: {
                                200: {
                                    room: {
                                        code: string;
                                        status: string | null;
                                        hostId: number;
                                        sceneId: string | null;
                                        questNode: import("../../shared/types/coop").CoopQuestNode;
                                        participants: {
                                            id: number;
                                            name: string;
                                            role: string | null;
                                            ready: boolean | null;
                                        }[];
                                        votes: {
                                            id: number;
                                            createdAt: number;
                                            sessionId: number;
                                            sceneId: string;
                                            choiceId: string;
                                            voterId: number;
                                        }[];
                                    } | null;
                                    error?: undefined;
                                    status?: undefined;
                                } | {
                                    error: any;
                                    status: number;
                                    room?: undefined;
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
