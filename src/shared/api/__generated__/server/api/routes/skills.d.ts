import { Elysia } from "elysia";
export declare const SKILL_TREE: {
    perception: {
        level: number;
        subclasses: ({
            id: string;
            name: string;
            description: string;
            stats: {
                accuracy: number;
                range: number;
                vision?: undefined;
                stealth?: undefined;
            };
        } | {
            id: string;
            name: string;
            description: string;
            stats: {
                vision: number;
                stealth: number;
                accuracy?: undefined;
                range?: undefined;
            };
        })[];
    };
    solidarity: {
        level: number;
        subclasses: ({
            id: string;
            name: string;
            description: string;
            stats: {
                healing: number;
                resistance: number;
                defense?: undefined;
                aggro?: undefined;
            };
        } | {
            id: string;
            name: string;
            description: string;
            stats: {
                defense: number;
                aggro: number;
                healing?: undefined;
                resistance?: undefined;
            };
        })[];
    };
    force: {
        level: number;
        subclasses: ({
            id: string;
            name: string;
            description: string;
            stats: {
                health: number;
                speed: number;
                melee?: undefined;
                destruction?: undefined;
            };
        } | {
            id: string;
            name: string;
            description: string;
            stats: {
                melee: number;
                destruction: number;
                health?: undefined;
                speed?: undefined;
            };
        })[];
    };
};
export declare const skillsRoutes: (app: Elysia) => Elysia<"", {
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
    skills: {
        tree: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        perception: {
                            level: number;
                            subclasses: ({
                                id: string;
                                name: string;
                                description: string;
                                stats: {
                                    accuracy: number;
                                    range: number;
                                    vision?: undefined;
                                    stealth?: undefined;
                                };
                            } | {
                                id: string;
                                name: string;
                                description: string;
                                stats: {
                                    vision: number;
                                    stealth: number;
                                    accuracy?: undefined;
                                    range?: undefined;
                                };
                            })[];
                        };
                        solidarity: {
                            level: number;
                            subclasses: ({
                                id: string;
                                name: string;
                                description: string;
                                stats: {
                                    healing: number;
                                    resistance: number;
                                    defense?: undefined;
                                    aggro?: undefined;
                                };
                            } | {
                                id: string;
                                name: string;
                                description: string;
                                stats: {
                                    defense: number;
                                    aggro: number;
                                    healing?: undefined;
                                    resistance?: undefined;
                                };
                            })[];
                        };
                        force: {
                            level: number;
                            subclasses: ({
                                id: string;
                                name: string;
                                description: string;
                                stats: {
                                    health: number;
                                    speed: number;
                                    melee?: undefined;
                                    destruction?: undefined;
                                };
                            } | {
                                id: string;
                                name: string;
                                description: string;
                                stats: {
                                    melee: number;
                                    destruction: number;
                                    health?: undefined;
                                    speed?: undefined;
                                };
                            })[];
                        };
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
    skills: {
        subclasses: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: string[];
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
    skills: {
        unlock: {
            post: {
                body: {
                    subclassId: string;
                    baseSkillId: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        success?: undefined;
                        subclasses?: undefined;
                    } | {
                        success: boolean;
                        subclasses: string[];
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
