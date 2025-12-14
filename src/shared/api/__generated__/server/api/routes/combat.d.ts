import { Elysia } from "elysia";
export declare const combatRoutes: (app: Elysia) => Elysia<"", {
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
    combat: {
        active: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        _id: string;
                        isActive: boolean;
                        status: any;
                        phase: any;
                        turn: any;
                        turnOrder: any;
                        currentActorIndex: any;
                        currentTurnActorId: any;
                        playerState: {
                            hp: any;
                            maxHp: any;
                            rank: any;
                            energy: any;
                            maxEnergy: any;
                            stamina: number;
                            maxStamina: number;
                            morale: number;
                            maxMorale: number;
                            weaponCondition: number;
                            weaponHeat: number;
                            currentAmmo: number;
                            jamState: {
                                isJammed: boolean;
                                jamChance: number;
                            };
                            posture: string;
                        };
                        enemyStates: {
                            id: string;
                            name: string;
                            hp: number;
                            maxHp: number;
                            rank: number;
                            defense: number;
                            activeEffects: {};
                        }[];
                        hand: any;
                        logs: any;
                    } | null;
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
    combat: {
        enemies: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        enemies?: undefined;
                    } | {
                        enemies: {
                            key: import("../../services/combat/enemyCatalog").EnemyKey;
                            name: string;
                            faction: "FJR" | "SCAVENGER" | "ANARCHIST" | "ECHO";
                            archetype: "GRUNT" | "ELITE" | "BOSS" | "SPECIAL";
                            maxHp: number;
                            preferredRank: number;
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
    combat: {
        create: {
            post: {
                body: Partial<{
                    enemyKey?: string | undefined;
                }> | null;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        success?: undefined;
                        battleId?: undefined;
                        enemyKey?: undefined;
                    } | {
                        success: boolean;
                        battleId: number;
                        enemyKey: import("../../services/combat/enemyCatalog").EnemyKey;
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
    combat: {
        play: {
            post: {
                body: {
                    targetId?: string | undefined;
                    battleId: string;
                    cardId: string;
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
} & {
    combat: {
        endTurn: {
            post: {
                body: {
                    battleId: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        success?: undefined;
                        nextActorId?: undefined;
                    } | {
                        success: boolean;
                        nextActorId: string | null;
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
