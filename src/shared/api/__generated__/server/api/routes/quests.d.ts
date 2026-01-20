import { Elysia } from "elysia";
export declare const questsRoutes: (app: Elysia) => Elysia<"", {
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
    quests: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    error: string;
                    status: number;
                    active?: undefined;
                    completed?: undefined;
                    available?: undefined;
                } | {
                    active: {
                        id: string;
                        title: string;
                        description: string | undefined;
                        status: "completed" | "active" | "abandoned" | "failed";
                        startedAt: number | undefined;
                        completedAt: number | undefined;
                        abandonedAt: any;
                        failedAt: any;
                        currentStep: string | undefined;
                        progress: number | undefined;
                        steps: any[] | undefined;
                        phase: number | undefined;
                        recommendedLevel: number | undefined;
                    }[];
                    completed: {
                        id: string;
                        title: string;
                        description: string | undefined;
                        status: "completed" | "active" | "abandoned" | "failed";
                        startedAt: number | undefined;
                        completedAt: number | undefined;
                        abandonedAt: any;
                        failedAt: any;
                        currentStep: string | undefined;
                        progress: number | undefined;
                        steps: any[] | undefined;
                        phase: number | undefined;
                        recommendedLevel: number | undefined;
                    }[];
                    available: {
                        id: string;
                        title: string;
                        description: string;
                        phase: number | undefined;
                        recommendedLevel: number | undefined;
                        steps: any[] | undefined;
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
} & {
    quests: {
        start: {
            post: {
                body: {
                    questId: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        started?: undefined;
                        questId?: undefined;
                    } | {
                        started: boolean;
                        questId: string;
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
    quests: {
        update: {
            post: {
                body: {
                    status?: string | undefined;
                    progress?: any;
                    currentStep?: string | undefined;
                    questId: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        success?: undefined;
                    } | {
                        success: boolean;
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
