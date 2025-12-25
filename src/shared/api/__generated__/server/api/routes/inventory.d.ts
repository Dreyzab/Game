import { Elysia } from "elysia";
type EquipmentSlots = {
    primary: any | null;
    secondary: any | null;
    melee: any | null;
    helmet: any | null;
    armor: any | null;
    clothing_top: any | null;
    clothing_bottom: any | null;
    backpack: any | null;
    rig: any | null;
    artifacts: any[];
    quick: Array<any | null>;
};
export declare const inventoryRoutes: (app: Elysia) => Elysia<"", {
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
    inventory: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    items: any[];
                    containers: any[];
                    equipment: EquipmentSlots;
                } | {
                    error: string;
                    status: number;
                    items?: undefined;
                } | {
                    items: never[];
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
    inventory: {
        trade: {
            offer: {
                post: {
                    body: {
                        receiverId: number;
                        itemId: string;
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
    };
} & {
    inventory: {
        trade: {
            execute: {
                post: {
                    body: {
                        playerOfferIds?: string[] | undefined;
                        traderOffer?: {
                            quantity?: number | undefined;
                            templateId: string;
                        }[] | undefined;
                        npcId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            status: number;
                            success?: undefined;
                            soldItems?: undefined;
                            receivedItems?: undefined;
                            failedAwards?: undefined;
                            balance?: undefined;
                        } | {
                            success: boolean;
                            soldItems: string[];
                            receivedItems: {
                                itemId: string;
                                quantity: number;
                                dbId: string | undefined;
                            }[];
                            failedAwards: string[] | undefined;
                            balance: {
                                playerTotal: number;
                                traderTotal: number;
                                difference: number;
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
    inventory: {
        repair: {
            post: {
                body: {
                    itemId: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        success?: undefined;
                        repaired?: undefined;
                        message?: undefined;
                        itemId?: undefined;
                        condition?: undefined;
                        newCondition?: undefined;
                        scrapSpent?: undefined;
                        suggestedPrice?: undefined;
                    } | {
                        success: boolean;
                        repaired: boolean;
                        message: string;
                        itemId: string;
                        condition: number | null;
                        error?: undefined;
                        status?: undefined;
                        newCondition?: undefined;
                        scrapSpent?: undefined;
                        suggestedPrice?: undefined;
                    } | {
                        success: boolean;
                        repaired: boolean;
                        itemId: string;
                        newCondition: number;
                        scrapSpent: number | undefined;
                        suggestedPrice: number;
                        error?: undefined;
                        status?: undefined;
                        message?: undefined;
                        condition?: undefined;
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
    inventory: {
        upgrade: {
            post: {
                body: {
                    itemId: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        success?: undefined;
                        itemId?: undefined;
                        scrapSpent?: undefined;
                        upgradeLevel?: undefined;
                        stats?: undefined;
                    } | {
                        success: boolean;
                        itemId: string;
                        scrapSpent: number | undefined;
                        upgradeLevel: any;
                        stats: any;
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
    inventory: {
        stash: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        items?: undefined;
                    } | {
                        items: {
                            id: string;
                            templateId: string;
                            instanceId: string;
                            kind: string;
                            name: string;
                            quantity: number;
                            condition: number;
                            gridPosition: {
                                x: number;
                                y: number;
                                rotation?: number;
                            } | null;
                            stats: {
                                damage?: number;
                                defense?: number;
                                weight: number;
                                width: number;
                                height: number;
                                maxDurability?: number;
                                specialEffects?: any[];
                                containerConfig?: {
                                    width: number;
                                    height: number;
                                    name?: string;
                                };
                            } | null;
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
    inventory: {
        stash: {
            move: {
                post: {
                    body: {
                        gridPosition?: {
                            rotation?: number | undefined;
                            x: number;
                            y: number;
                        } | undefined;
                        itemId: string;
                        toStash: boolean;
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
