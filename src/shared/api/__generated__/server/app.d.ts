import { Elysia } from "elysia";
export declare const app: Elysia<"", {
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
    player: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    error: string;
                    status: number;
                    player?: undefined;
                    progress?: undefined;
                } | {
                    player: null;
                    error?: undefined;
                    status?: undefined;
                    progress?: undefined;
                } | {
                    player: {
                        id: number;
                        status: string | null;
                        userId: string | null;
                        deviceId: string | null;
                        name: string;
                        fame: number | null;
                        factionId: string | null;
                        squadId: string | null;
                        location: {
                            lat: number;
                            lng: number;
                        } | null;
                        lastSeen: number | null;
                        createdAt: number;
                        updatedAt: number;
                    } | null;
                    progress: {
                        id: number;
                        updatedAt: number;
                        playerId: number;
                        currentScene: string | null;
                        visitedScenes: string[] | null;
                        flags: Record<string, any> | null;
                        level: number | null;
                        xp: number | null;
                        skillPoints: number | null;
                        skills: Record<string, number> | null;
                        subclasses: string[] | null;
                        gold: number | null;
                        reputation: Record<string, number> | null;
                        hp: number | null;
                        maxHp: number | null;
                        morale: number | null;
                        maxMorale: number | null;
                        stamina: number | null;
                        maxStamina: number | null;
                        phase: number | null;
                    } | undefined;
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
    player: {
        init: {
            post: {
                body: {
                    name?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        player?: undefined;
                        created?: undefined;
                    } | {
                        player: {
                            id: number;
                            status: string | null;
                            userId: string | null;
                            deviceId: string | null;
                            name: string;
                            fame: number | null;
                            factionId: string | null;
                            squadId: string | null;
                            location: {
                                lat: number;
                                lng: number;
                            } | null;
                            lastSeen: number | null;
                            createdAt: number;
                            updatedAt: number;
                        } | null;
                        created: boolean;
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
    player: {
        "city-registration": {
            post: {
                body: {
                    password?: string | undefined;
                    nickname?: string | undefined;
                    returnScene?: string | undefined;
                    method: "clerk" | "password";
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        error: string;
                        status: number;
                        player?: undefined;
                        progress?: undefined;
                    } | {
                        success: boolean;
                        player: {
                            id: number;
                            status: string | null;
                            userId: string | null;
                            deviceId: string | null;
                            name: string;
                            fame: number | null;
                            factionId: string | null;
                            squadId: string | null;
                            location: {
                                lat: number;
                                lng: number;
                            } | null;
                            lastSeen: number | null;
                            createdAt: number;
                            updatedAt: number;
                        } | null;
                        progress: {
                            id: number;
                            playerId: number;
                            currentScene: string | null;
                            visitedScenes: string[] | null;
                            flags: Record<string, any> | null;
                            level: number | null;
                            xp: number | null;
                            skillPoints: number | null;
                            skills: Record<string, number> | null;
                            subclasses: string[] | null;
                            gold: number | null;
                            reputation: Record<string, number> | null;
                            hp: number | null;
                            maxHp: number | null;
                            morale: number | null;
                            maxMorale: number | null;
                            stamina: number | null;
                            maxStamina: number | null;
                            phase: number | null;
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
    player: {
        "reset-self": {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        ok: boolean;
                        error: string;
                        status: number;
                        reset?: undefined;
                        result?: undefined;
                    } | {
                        ok: boolean;
                        reset: boolean;
                        error?: undefined;
                        status?: undefined;
                        result?: undefined;
                    } | {
                        ok: boolean;
                        reset: boolean;
                        result: import("./services/playerReset").ResetSelfResult;
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
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    items: any[];
                    containers: any[];
                    equipment: {
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
} & {
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
                        description: string;
                        status: string;
                        currentStep: string | null;
                        progress: unknown;
                        steps: any[] | null;
                    }[];
                    completed: {
                        id: string;
                        title: string;
                        status: string;
                        completedAt: number | null;
                    }[];
                    available: {
                        id: string;
                        title: string;
                        description: string;
                        recommendedLevel: number | null;
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
} & {
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
} & {
    map: {
        points: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        points: {
                            id: string;
                            title: string;
                            description: string | null;
                            lat: number;
                            lng: number;
                            type: string | null;
                            phase: number | null;
                            isActive: boolean | null;
                            metadata: any;
                            status: string;
                            discoveredAt: number | undefined;
                            researchedAt: number | undefined;
                        }[];
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
    map: {
        discover: {
            post: {
                body: {
                    lat: number;
                    lng: number;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        discoveredIds?: undefined;
                    } | {
                        success: boolean;
                        discoveredIds: string[];
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
    map: {
        "activate-qr": {
            post: {
                body: {
                    pointId?: string | undefined;
                    qrData: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        error: string;
                        status: number;
                        kind?: undefined;
                        gated?: undefined;
                        actions?: undefined;
                        bonusId?: undefined;
                        title?: undefined;
                        alreadyClaimed?: undefined;
                        awardedItems?: undefined;
                        pointId?: undefined;
                        unlockStatus?: undefined;
                    } | {
                        success: boolean;
                        kind: string;
                        gated: boolean;
                        actions: import("./lib/qrBonuses").QrAction[];
                        error?: undefined;
                        status?: undefined;
                        bonusId?: undefined;
                        title?: undefined;
                        alreadyClaimed?: undefined;
                        awardedItems?: undefined;
                        pointId?: undefined;
                        unlockStatus?: undefined;
                    } | {
                        success: boolean;
                        kind: string;
                        bonusId: string;
                        title: string;
                        alreadyClaimed: boolean;
                        actions: import("./lib/qrBonuses").QrAction[];
                        awardedItems: {
                            itemId: string;
                            quantity: number;
                            dbId?: string;
                        }[];
                        error?: undefined;
                        status?: undefined;
                        gated?: undefined;
                        pointId?: undefined;
                        unlockStatus?: undefined;
                    } | {
                        success: boolean;
                        kind: string;
                        pointId: string;
                        status: string;
                        unlockStatus: "researched" | "already_researched";
                        actions: import("./lib/qrBonuses").QrAction[];
                        error?: undefined;
                        gated?: undefined;
                        bonusId?: undefined;
                        title?: undefined;
                        alreadyClaimed?: undefined;
                        awardedItems?: undefined;
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
    map: {
        zones: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        zones: {
                            id: number;
                            status: "locked" | "peace" | "contested" | null;
                            name: string;
                            center: {
                                lat: number;
                                lng: number;
                            };
                            radius: number;
                            ownerFactionId: string | null;
                            health: number | null;
                            lastCapturedAt: number | null;
                        }[];
                        safeZones: {
                            id: number;
                            title: string | null;
                            isActive: boolean | null;
                            faction: string | null;
                            polygon: {
                                lat: number;
                                lng: number;
                            }[];
                        }[];
                        dangerZones: {
                            id: number;
                            title: string | null;
                            isActive: boolean | null;
                            polygon: {
                                lat: number;
                                lng: number;
                            }[];
                            dangerLevel: string | null;
                        }[];
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
                            key: import("./services/combat/enemyCatalog").EnemyKey;
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
                        enemyKey: import("./services/combat/enemyCatalog").EnemyKey;
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
                        duplicate?: undefined;
                        progress?: undefined;
                        awardedItems?: undefined;
                    } | {
                        success: boolean;
                        duplicate: undefined;
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
} & {
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
                            questNode: import("./shared/types/coop").CoopQuestNode | null;
                            camp: {
                                security: number;
                                operatives: number;
                                inventory: Record<string, number>;
                            } | null;
                            expedition: {
                                turnCount: number;
                                maxTurns: number;
                                researchPoints: number;
                                waveNodeId?: string;
                                wavePending?: boolean;
                                deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                pendingNodeId?: string;
                                pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                poolId?: string;
                                stageIndex?: number;
                                stageId?: string;
                                hubNodeId?: string;
                                missions?: Record<string, {
                                    kind: "sidequest" | "node";
                                    title: string;
                                    timeCost: number;
                                    threatLevel: number;
                                    modifierId: string;
                                    modifierLabel: string;
                                    isUnique?: boolean;
                                    questId?: string;
                                    entryNodeId?: string;
                                    nodeId?: string;
                                    scoreModifiers?: Record<string, number>;
                                    applyStatuses?: Record<string, number>;
                                }>;
                                playerTraits?: Record<string, string[]>;
                                injury?: {
                                    targetPlayerId: number;
                                    needsTreatment: boolean;
                                };
                                lastEvent?: {
                                    id: string;
                                    at: number;
                                    success: boolean;
                                    summary: string;
                                    perPlayer: Record<string, {
                                        pass: boolean;
                                        traitsAdded: string[];
                                    }>;
                                    targetPlayerId?: number;
                                    actorPlayerId?: number;
                                };
                            } | null;
                            encounter: {
                                id: string;
                                startedAt: number;
                                status: "active" | "resolved";
                                sceneId: string;
                                choiceId: string;
                                scenarioId?: string;
                                threatLevel: number;
                                returnNodeId: string;
                                defeatNodeId?: string;
                                rewardRp?: number;
                                players: {
                                    playerId: number;
                                    role: import("./shared/types/coop").CoopRoleId | null;
                                    hp: number;
                                    maxHp: number;
                                    morale: number;
                                    maxMorale: number;
                                    stamina: number;
                                    maxStamina: number;
                                    traits: string[];
                                }[];
                                result?: {
                                    outcome: "victory" | "defeat";
                                    resolvedAt: number;
                                };
                            } | null;
                            questScore: {
                                questId: string;
                                current: number;
                                target: number;
                                history: number[];
                                modifiers: Record<string, number>;
                                playerModifiers: Record<string, Record<string, number>>;
                                statuses: Record<string, number>;
                                playerStatuses: Record<string, Record<string, number>>;
                                stages: number;
                                lastStageTotal: number;
                                lastStageByPlayer: Record<string, number>;
                            } | null;
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
                                questNode: import("./shared/types/coop").CoopQuestNode | null;
                                camp: {
                                    security: number;
                                    operatives: number;
                                    inventory: Record<string, number>;
                                } | null;
                                expedition: {
                                    turnCount: number;
                                    maxTurns: number;
                                    researchPoints: number;
                                    waveNodeId?: string;
                                    wavePending?: boolean;
                                    deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                    pendingNodeId?: string;
                                    pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                    poolId?: string;
                                    stageIndex?: number;
                                    stageId?: string;
                                    hubNodeId?: string;
                                    missions?: Record<string, {
                                        kind: "sidequest" | "node";
                                        title: string;
                                        timeCost: number;
                                        threatLevel: number;
                                        modifierId: string;
                                        modifierLabel: string;
                                        isUnique?: boolean;
                                        questId?: string;
                                        entryNodeId?: string;
                                        nodeId?: string;
                                        scoreModifiers?: Record<string, number>;
                                        applyStatuses?: Record<string, number>;
                                    }>;
                                    playerTraits?: Record<string, string[]>;
                                    injury?: {
                                        targetPlayerId: number;
                                        needsTreatment: boolean;
                                    };
                                    lastEvent?: {
                                        id: string;
                                        at: number;
                                        success: boolean;
                                        summary: string;
                                        perPlayer: Record<string, {
                                            pass: boolean;
                                            traitsAdded: string[];
                                        }>;
                                        targetPlayerId?: number;
                                        actorPlayerId?: number;
                                    };
                                } | null;
                                encounter: {
                                    id: string;
                                    startedAt: number;
                                    status: "active" | "resolved";
                                    sceneId: string;
                                    choiceId: string;
                                    scenarioId?: string;
                                    threatLevel: number;
                                    returnNodeId: string;
                                    defeatNodeId?: string;
                                    rewardRp?: number;
                                    players: {
                                        playerId: number;
                                        role: import("./shared/types/coop").CoopRoleId | null;
                                        hp: number;
                                        maxHp: number;
                                        morale: number;
                                        maxMorale: number;
                                        stamina: number;
                                        maxStamina: number;
                                        traits: string[];
                                    }[];
                                    result?: {
                                        outcome: "victory" | "defeat";
                                        resolvedAt: number;
                                    };
                                } | null;
                                questScore: {
                                    questId: string;
                                    current: number;
                                    target: number;
                                    history: number[];
                                    modifiers: Record<string, number>;
                                    playerModifiers: Record<string, Record<string, number>>;
                                    statuses: Record<string, number>;
                                    playerStatuses: Record<string, Record<string, number>>;
                                    stages: number;
                                    lastStageTotal: number;
                                    lastStageByPlayer: Record<string, number>;
                                } | null;
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
                                    questNode: import("./shared/types/coop").CoopQuestNode | null;
                                    camp: {
                                        security: number;
                                        operatives: number;
                                        inventory: Record<string, number>;
                                    } | null;
                                    expedition: {
                                        turnCount: number;
                                        maxTurns: number;
                                        researchPoints: number;
                                        waveNodeId?: string;
                                        wavePending?: boolean;
                                        deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                        poolId?: string;
                                        stageIndex?: number;
                                        stageId?: string;
                                        hubNodeId?: string;
                                        missions?: Record<string, {
                                            kind: "sidequest" | "node";
                                            title: string;
                                            timeCost: number;
                                            threatLevel: number;
                                            modifierId: string;
                                            modifierLabel: string;
                                            isUnique?: boolean;
                                            questId?: string;
                                            entryNodeId?: string;
                                            nodeId?: string;
                                            scoreModifiers?: Record<string, number>;
                                            applyStatuses?: Record<string, number>;
                                        }>;
                                        playerTraits?: Record<string, string[]>;
                                        injury?: {
                                            targetPlayerId: number;
                                            needsTreatment: boolean;
                                        };
                                        lastEvent?: {
                                            id: string;
                                            at: number;
                                            success: boolean;
                                            summary: string;
                                            perPlayer: Record<string, {
                                                pass: boolean;
                                                traitsAdded: string[];
                                            }>;
                                            targetPlayerId?: number;
                                            actorPlayerId?: number;
                                        };
                                    } | null;
                                    encounter: {
                                        id: string;
                                        startedAt: number;
                                        status: "active" | "resolved";
                                        sceneId: string;
                                        choiceId: string;
                                        scenarioId?: string;
                                        threatLevel: number;
                                        returnNodeId: string;
                                        defeatNodeId?: string;
                                        rewardRp?: number;
                                        players: {
                                            playerId: number;
                                            role: import("./shared/types/coop").CoopRoleId | null;
                                            hp: number;
                                            maxHp: number;
                                            morale: number;
                                            maxMorale: number;
                                            stamina: number;
                                            maxStamina: number;
                                            traits: string[];
                                        }[];
                                        result?: {
                                            outcome: "victory" | "defeat";
                                            resolvedAt: number;
                                        };
                                    } | null;
                                    questScore: {
                                        questId: string;
                                        current: number;
                                        target: number;
                                        history: number[];
                                        modifiers: Record<string, number>;
                                        playerModifiers: Record<string, Record<string, number>>;
                                        statuses: Record<string, number>;
                                        playerStatuses: Record<string, Record<string, number>>;
                                        stages: number;
                                        lastStageTotal: number;
                                        lastStageByPlayer: Record<string, number>;
                                    } | null;
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
                                    questNode: import("./shared/types/coop").CoopQuestNode | null;
                                    camp: {
                                        security: number;
                                        operatives: number;
                                        inventory: Record<string, number>;
                                    } | null;
                                    expedition: {
                                        turnCount: number;
                                        maxTurns: number;
                                        researchPoints: number;
                                        waveNodeId?: string;
                                        wavePending?: boolean;
                                        deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                        poolId?: string;
                                        stageIndex?: number;
                                        stageId?: string;
                                        hubNodeId?: string;
                                        missions?: Record<string, {
                                            kind: "sidequest" | "node";
                                            title: string;
                                            timeCost: number;
                                            threatLevel: number;
                                            modifierId: string;
                                            modifierLabel: string;
                                            isUnique?: boolean;
                                            questId?: string;
                                            entryNodeId?: string;
                                            nodeId?: string;
                                            scoreModifiers?: Record<string, number>;
                                            applyStatuses?: Record<string, number>;
                                        }>;
                                        playerTraits?: Record<string, string[]>;
                                        injury?: {
                                            targetPlayerId: number;
                                            needsTreatment: boolean;
                                        };
                                        lastEvent?: {
                                            id: string;
                                            at: number;
                                            success: boolean;
                                            summary: string;
                                            perPlayer: Record<string, {
                                                pass: boolean;
                                                traitsAdded: string[];
                                            }>;
                                            targetPlayerId?: number;
                                            actorPlayerId?: number;
                                        };
                                    } | null;
                                    encounter: {
                                        id: string;
                                        startedAt: number;
                                        status: "active" | "resolved";
                                        sceneId: string;
                                        choiceId: string;
                                        scenarioId?: string;
                                        threatLevel: number;
                                        returnNodeId: string;
                                        defeatNodeId?: string;
                                        rewardRp?: number;
                                        players: {
                                            playerId: number;
                                            role: import("./shared/types/coop").CoopRoleId | null;
                                            hp: number;
                                            maxHp: number;
                                            morale: number;
                                            maxMorale: number;
                                            stamina: number;
                                            maxStamina: number;
                                            traits: string[];
                                        }[];
                                        result?: {
                                            outcome: "victory" | "defeat";
                                            resolvedAt: number;
                                        };
                                    } | null;
                                    questScore: {
                                        questId: string;
                                        current: number;
                                        target: number;
                                        history: number[];
                                        modifiers: Record<string, number>;
                                        playerModifiers: Record<string, Record<string, number>>;
                                        statuses: Record<string, number>;
                                        playerStatuses: Record<string, Record<string, number>>;
                                        stages: number;
                                        lastStageTotal: number;
                                        lastStageByPlayer: Record<string, number>;
                                    } | null;
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
                                    questNode: import("./shared/types/coop").CoopQuestNode | null;
                                    camp: {
                                        security: number;
                                        operatives: number;
                                        inventory: Record<string, number>;
                                    } | null;
                                    expedition: {
                                        turnCount: number;
                                        maxTurns: number;
                                        researchPoints: number;
                                        waveNodeId?: string;
                                        wavePending?: boolean;
                                        deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                        poolId?: string;
                                        stageIndex?: number;
                                        stageId?: string;
                                        hubNodeId?: string;
                                        missions?: Record<string, {
                                            kind: "sidequest" | "node";
                                            title: string;
                                            timeCost: number;
                                            threatLevel: number;
                                            modifierId: string;
                                            modifierLabel: string;
                                            isUnique?: boolean;
                                            questId?: string;
                                            entryNodeId?: string;
                                            nodeId?: string;
                                            scoreModifiers?: Record<string, number>;
                                            applyStatuses?: Record<string, number>;
                                        }>;
                                        playerTraits?: Record<string, string[]>;
                                        injury?: {
                                            targetPlayerId: number;
                                            needsTreatment: boolean;
                                        };
                                        lastEvent?: {
                                            id: string;
                                            at: number;
                                            success: boolean;
                                            summary: string;
                                            perPlayer: Record<string, {
                                                pass: boolean;
                                                traitsAdded: string[];
                                            }>;
                                            targetPlayerId?: number;
                                            actorPlayerId?: number;
                                        };
                                    } | null;
                                    encounter: {
                                        id: string;
                                        startedAt: number;
                                        status: "active" | "resolved";
                                        sceneId: string;
                                        choiceId: string;
                                        scenarioId?: string;
                                        threatLevel: number;
                                        returnNodeId: string;
                                        defeatNodeId?: string;
                                        rewardRp?: number;
                                        players: {
                                            playerId: number;
                                            role: import("./shared/types/coop").CoopRoleId | null;
                                            hp: number;
                                            maxHp: number;
                                            morale: number;
                                            maxMorale: number;
                                            stamina: number;
                                            maxStamina: number;
                                            traits: string[];
                                        }[];
                                        result?: {
                                            outcome: "victory" | "defeat";
                                            resolvedAt: number;
                                        };
                                    } | null;
                                    questScore: {
                                        questId: string;
                                        current: number;
                                        target: number;
                                        history: number[];
                                        modifiers: Record<string, number>;
                                        playerModifiers: Record<string, Record<string, number>>;
                                        statuses: Record<string, number>;
                                        playerStatuses: Record<string, Record<string, number>>;
                                        stages: number;
                                        lastStageTotal: number;
                                        lastStageByPlayer: Record<string, number>;
                                    } | null;
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
                                    questNode: import("./shared/types/coop").CoopQuestNode | null;
                                    camp: {
                                        security: number;
                                        operatives: number;
                                        inventory: Record<string, number>;
                                    } | null;
                                    expedition: {
                                        turnCount: number;
                                        maxTurns: number;
                                        researchPoints: number;
                                        waveNodeId?: string;
                                        wavePending?: boolean;
                                        deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                        poolId?: string;
                                        stageIndex?: number;
                                        stageId?: string;
                                        hubNodeId?: string;
                                        missions?: Record<string, {
                                            kind: "sidequest" | "node";
                                            title: string;
                                            timeCost: number;
                                            threatLevel: number;
                                            modifierId: string;
                                            modifierLabel: string;
                                            isUnique?: boolean;
                                            questId?: string;
                                            entryNodeId?: string;
                                            nodeId?: string;
                                            scoreModifiers?: Record<string, number>;
                                            applyStatuses?: Record<string, number>;
                                        }>;
                                        playerTraits?: Record<string, string[]>;
                                        injury?: {
                                            targetPlayerId: number;
                                            needsTreatment: boolean;
                                        };
                                        lastEvent?: {
                                            id: string;
                                            at: number;
                                            success: boolean;
                                            summary: string;
                                            perPlayer: Record<string, {
                                                pass: boolean;
                                                traitsAdded: string[];
                                            }>;
                                            targetPlayerId?: number;
                                            actorPlayerId?: number;
                                        };
                                    } | null;
                                    encounter: {
                                        id: string;
                                        startedAt: number;
                                        status: "active" | "resolved";
                                        sceneId: string;
                                        choiceId: string;
                                        scenarioId?: string;
                                        threatLevel: number;
                                        returnNodeId: string;
                                        defeatNodeId?: string;
                                        rewardRp?: number;
                                        players: {
                                            playerId: number;
                                            role: import("./shared/types/coop").CoopRoleId | null;
                                            hp: number;
                                            maxHp: number;
                                            morale: number;
                                            maxMorale: number;
                                            stamina: number;
                                            maxStamina: number;
                                            traits: string[];
                                        }[];
                                        result?: {
                                            outcome: "victory" | "defeat";
                                            resolvedAt: number;
                                        };
                                    } | null;
                                    questScore: {
                                        questId: string;
                                        current: number;
                                        target: number;
                                        history: number[];
                                        modifiers: Record<string, number>;
                                        playerModifiers: Record<string, Record<string, number>>;
                                        statuses: Record<string, number>;
                                        playerStatuses: Record<string, Record<string, number>>;
                                        stages: number;
                                        lastStageTotal: number;
                                        lastStageByPlayer: Record<string, number>;
                                    } | null;
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
                            nodeId?: string | undefined;
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
                                    questNode: import("./shared/types/coop").CoopQuestNode | null;
                                    camp: {
                                        security: number;
                                        operatives: number;
                                        inventory: Record<string, number>;
                                    } | null;
                                    expedition: {
                                        turnCount: number;
                                        maxTurns: number;
                                        researchPoints: number;
                                        waveNodeId?: string;
                                        wavePending?: boolean;
                                        deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                        poolId?: string;
                                        stageIndex?: number;
                                        stageId?: string;
                                        hubNodeId?: string;
                                        missions?: Record<string, {
                                            kind: "sidequest" | "node";
                                            title: string;
                                            timeCost: number;
                                            threatLevel: number;
                                            modifierId: string;
                                            modifierLabel: string;
                                            isUnique?: boolean;
                                            questId?: string;
                                            entryNodeId?: string;
                                            nodeId?: string;
                                            scoreModifiers?: Record<string, number>;
                                            applyStatuses?: Record<string, number>;
                                        }>;
                                        playerTraits?: Record<string, string[]>;
                                        injury?: {
                                            targetPlayerId: number;
                                            needsTreatment: boolean;
                                        };
                                        lastEvent?: {
                                            id: string;
                                            at: number;
                                            success: boolean;
                                            summary: string;
                                            perPlayer: Record<string, {
                                                pass: boolean;
                                                traitsAdded: string[];
                                            }>;
                                            targetPlayerId?: number;
                                            actorPlayerId?: number;
                                        };
                                    } | null;
                                    encounter: {
                                        id: string;
                                        startedAt: number;
                                        status: "active" | "resolved";
                                        sceneId: string;
                                        choiceId: string;
                                        scenarioId?: string;
                                        threatLevel: number;
                                        returnNodeId: string;
                                        defeatNodeId?: string;
                                        rewardRp?: number;
                                        players: {
                                            playerId: number;
                                            role: import("./shared/types/coop").CoopRoleId | null;
                                            hp: number;
                                            maxHp: number;
                                            morale: number;
                                            maxMorale: number;
                                            stamina: number;
                                            maxStamina: number;
                                            traits: string[];
                                        }[];
                                        result?: {
                                            outcome: "victory" | "defeat";
                                            resolvedAt: number;
                                        };
                                    } | null;
                                    questScore: {
                                        questId: string;
                                        current: number;
                                        target: number;
                                        history: number[];
                                        modifiers: Record<string, number>;
                                        playerModifiers: Record<string, Record<string, number>>;
                                        statuses: Record<string, number>;
                                        playerStatuses: Record<string, Record<string, number>>;
                                        stages: number;
                                        lastStageTotal: number;
                                        lastStageByPlayer: Record<string, number>;
                                    } | null;
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
                battle: {
                    resolve: {
                        post: {
                            body: {
                                players: {
                                    morale?: number | undefined;
                                    stamina?: number | undefined;
                                    playerId: number;
                                    hp: number;
                                }[];
                                result: "victory" | "defeat";
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
                                        questNode: import("./shared/types/coop").CoopQuestNode | null;
                                        camp: {
                                            security: number;
                                            operatives: number;
                                            inventory: Record<string, number>;
                                        } | null;
                                        expedition: {
                                            turnCount: number;
                                            maxTurns: number;
                                            researchPoints: number;
                                            waveNodeId?: string;
                                            wavePending?: boolean;
                                            deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                            pendingNodeId?: string;
                                            pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                            poolId?: string;
                                            stageIndex?: number;
                                            stageId?: string;
                                            hubNodeId?: string;
                                            missions?: Record<string, {
                                                kind: "sidequest" | "node";
                                                title: string;
                                                timeCost: number;
                                                threatLevel: number;
                                                modifierId: string;
                                                modifierLabel: string;
                                                isUnique?: boolean;
                                                questId?: string;
                                                entryNodeId?: string;
                                                nodeId?: string;
                                                scoreModifiers?: Record<string, number>;
                                                applyStatuses?: Record<string, number>;
                                            }>;
                                            playerTraits?: Record<string, string[]>;
                                            injury?: {
                                                targetPlayerId: number;
                                                needsTreatment: boolean;
                                            };
                                            lastEvent?: {
                                                id: string;
                                                at: number;
                                                success: boolean;
                                                summary: string;
                                                perPlayer: Record<string, {
                                                    pass: boolean;
                                                    traitsAdded: string[];
                                                }>;
                                                targetPlayerId?: number;
                                                actorPlayerId?: number;
                                            };
                                        } | null;
                                        encounter: {
                                            id: string;
                                            startedAt: number;
                                            status: "active" | "resolved";
                                            sceneId: string;
                                            choiceId: string;
                                            scenarioId?: string;
                                            threatLevel: number;
                                            returnNodeId: string;
                                            defeatNodeId?: string;
                                            rewardRp?: number;
                                            players: {
                                                playerId: number;
                                                role: import("./shared/types/coop").CoopRoleId | null;
                                                hp: number;
                                                maxHp: number;
                                                morale: number;
                                                maxMorale: number;
                                                stamina: number;
                                                maxStamina: number;
                                                traits: string[];
                                            }[];
                                            result?: {
                                                outcome: "victory" | "defeat";
                                                resolvedAt: number;
                                            };
                                        } | null;
                                        questScore: {
                                            questId: string;
                                            current: number;
                                            target: number;
                                            history: number[];
                                            modifiers: Record<string, number>;
                                            playerModifiers: Record<string, Record<string, number>>;
                                            statuses: Record<string, number>;
                                            playerStatuses: Record<string, Record<string, number>>;
                                            stages: number;
                                            lastStageTotal: number;
                                            lastStageByPlayer: Record<string, number>;
                                        } | null;
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
} & {
    coop: {
        rooms: {
            ":code": {
                reach: {
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
                                room: {
                                    code: string;
                                    status: string | null;
                                    hostId: number;
                                    sceneId: string | null;
                                    questNode: import("./shared/types/coop").CoopQuestNode | null;
                                    camp: {
                                        security: number;
                                        operatives: number;
                                        inventory: Record<string, number>;
                                    } | null;
                                    expedition: {
                                        turnCount: number;
                                        maxTurns: number;
                                        researchPoints: number;
                                        waveNodeId?: string;
                                        wavePending?: boolean;
                                        deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                        poolId?: string;
                                        stageIndex?: number;
                                        stageId?: string;
                                        hubNodeId?: string;
                                        missions?: Record<string, {
                                            kind: "sidequest" | "node";
                                            title: string;
                                            timeCost: number;
                                            threatLevel: number;
                                            modifierId: string;
                                            modifierLabel: string;
                                            isUnique?: boolean;
                                            questId?: string;
                                            entryNodeId?: string;
                                            nodeId?: string;
                                            scoreModifiers?: Record<string, number>;
                                            applyStatuses?: Record<string, number>;
                                        }>;
                                        playerTraits?: Record<string, string[]>;
                                        injury?: {
                                            targetPlayerId: number;
                                            needsTreatment: boolean;
                                        };
                                        lastEvent?: {
                                            id: string;
                                            at: number;
                                            success: boolean;
                                            summary: string;
                                            perPlayer: Record<string, {
                                                pass: boolean;
                                                traitsAdded: string[];
                                            }>;
                                            targetPlayerId?: number;
                                            actorPlayerId?: number;
                                        };
                                    } | null;
                                    encounter: {
                                        id: string;
                                        startedAt: number;
                                        status: "active" | "resolved";
                                        sceneId: string;
                                        choiceId: string;
                                        scenarioId?: string;
                                        threatLevel: number;
                                        returnNodeId: string;
                                        defeatNodeId?: string;
                                        rewardRp?: number;
                                        players: {
                                            playerId: number;
                                            role: import("./shared/types/coop").CoopRoleId | null;
                                            hp: number;
                                            maxHp: number;
                                            morale: number;
                                            maxMorale: number;
                                            stamina: number;
                                            maxStamina: number;
                                            traits: string[];
                                        }[];
                                        result?: {
                                            outcome: "victory" | "defeat";
                                            resolvedAt: number;
                                        };
                                    } | null;
                                    questScore: {
                                        questId: string;
                                        current: number;
                                        target: number;
                                        history: number[];
                                        modifiers: Record<string, number>;
                                        playerModifiers: Record<string, Record<string, number>>;
                                        statuses: Record<string, number>;
                                        playerStatuses: Record<string, Record<string, number>>;
                                        stages: number;
                                        lastStageTotal: number;
                                        lastStageByPlayer: Record<string, number>;
                                    } | null;
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
        nodes: {
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
                            node?: undefined;
                        } | {
                            node: import("./shared/types/coop").CoopQuestNode;
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
                                    questNode: import("./shared/types/coop").CoopQuestNode | null;
                                    camp: {
                                        security: number;
                                        operatives: number;
                                        inventory: Record<string, number>;
                                    } | null;
                                    expedition: {
                                        turnCount: number;
                                        maxTurns: number;
                                        researchPoints: number;
                                        waveNodeId?: string;
                                        wavePending?: boolean;
                                        deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                        poolId?: string;
                                        stageIndex?: number;
                                        stageId?: string;
                                        hubNodeId?: string;
                                        missions?: Record<string, {
                                            kind: "sidequest" | "node";
                                            title: string;
                                            timeCost: number;
                                            threatLevel: number;
                                            modifierId: string;
                                            modifierLabel: string;
                                            isUnique?: boolean;
                                            questId?: string;
                                            entryNodeId?: string;
                                            nodeId?: string;
                                            scoreModifiers?: Record<string, number>;
                                            applyStatuses?: Record<string, number>;
                                        }>;
                                        playerTraits?: Record<string, string[]>;
                                        injury?: {
                                            targetPlayerId: number;
                                            needsTreatment: boolean;
                                        };
                                        lastEvent?: {
                                            id: string;
                                            at: number;
                                            success: boolean;
                                            summary: string;
                                            perPlayer: Record<string, {
                                                pass: boolean;
                                                traitsAdded: string[];
                                            }>;
                                            targetPlayerId?: number;
                                            actorPlayerId?: number;
                                        };
                                    } | null;
                                    encounter: {
                                        id: string;
                                        startedAt: number;
                                        status: "active" | "resolved";
                                        sceneId: string;
                                        choiceId: string;
                                        scenarioId?: string;
                                        threatLevel: number;
                                        returnNodeId: string;
                                        defeatNodeId?: string;
                                        rewardRp?: number;
                                        players: {
                                            playerId: number;
                                            role: import("./shared/types/coop").CoopRoleId | null;
                                            hp: number;
                                            maxHp: number;
                                            morale: number;
                                            maxMorale: number;
                                            stamina: number;
                                            maxStamina: number;
                                            traits: string[];
                                        }[];
                                        result?: {
                                            outcome: "victory" | "defeat";
                                            resolvedAt: number;
                                        };
                                    } | null;
                                    questScore: {
                                        questId: string;
                                        current: number;
                                        target: number;
                                        history: number[];
                                        modifiers: Record<string, number>;
                                        playerModifiers: Record<string, Record<string, number>>;
                                        statuses: Record<string, number>;
                                        playerStatuses: Record<string, Record<string, number>>;
                                        stages: number;
                                        lastStageTotal: number;
                                        lastStageByPlayer: Record<string, number>;
                                    } | null;
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
                                        questNode: import("./shared/types/coop").CoopQuestNode | null;
                                        camp: {
                                            security: number;
                                            operatives: number;
                                            inventory: Record<string, number>;
                                        } | null;
                                        expedition: {
                                            turnCount: number;
                                            maxTurns: number;
                                            researchPoints: number;
                                            waveNodeId?: string;
                                            wavePending?: boolean;
                                            deadlineEvents?: import("./shared/types/coop").CoopExpeditionDeadlineEvent[];
                                            pendingNodeId?: string;
                                            pendingKind?: import("./shared/types/coop").CoopExpeditionDeadlineEventKind;
                                            poolId?: string;
                                            stageIndex?: number;
                                            stageId?: string;
                                            hubNodeId?: string;
                                            missions?: Record<string, {
                                                kind: "sidequest" | "node";
                                                title: string;
                                                timeCost: number;
                                                threatLevel: number;
                                                modifierId: string;
                                                modifierLabel: string;
                                                isUnique?: boolean;
                                                questId?: string;
                                                entryNodeId?: string;
                                                nodeId?: string;
                                                scoreModifiers?: Record<string, number>;
                                                applyStatuses?: Record<string, number>;
                                            }>;
                                            playerTraits?: Record<string, string[]>;
                                            injury?: {
                                                targetPlayerId: number;
                                                needsTreatment: boolean;
                                            };
                                            lastEvent?: {
                                                id: string;
                                                at: number;
                                                success: boolean;
                                                summary: string;
                                                perPlayer: Record<string, {
                                                    pass: boolean;
                                                    traitsAdded: string[];
                                                }>;
                                                targetPlayerId?: number;
                                                actorPlayerId?: number;
                                            };
                                        } | null;
                                        encounter: {
                                            id: string;
                                            startedAt: number;
                                            status: "active" | "resolved";
                                            sceneId: string;
                                            choiceId: string;
                                            scenarioId?: string;
                                            threatLevel: number;
                                            returnNodeId: string;
                                            defeatNodeId?: string;
                                            rewardRp?: number;
                                            players: {
                                                playerId: number;
                                                role: import("./shared/types/coop").CoopRoleId | null;
                                                hp: number;
                                                maxHp: number;
                                                morale: number;
                                                maxMorale: number;
                                                stamina: number;
                                                maxStamina: number;
                                                traits: string[];
                                            }[];
                                            result?: {
                                                outcome: "victory" | "defeat";
                                                resolvedAt: number;
                                            };
                                        } | null;
                                        questScore: {
                                            questId: string;
                                            current: number;
                                            target: number;
                                            history: number[];
                                            modifiers: Record<string, number>;
                                            playerModifiers: Record<string, Record<string, number>>;
                                            statuses: Record<string, number>;
                                            playerStatuses: Record<string, Record<string, number>>;
                                            stages: number;
                                            lastStageTotal: number;
                                            lastStageByPlayer: Record<string, number>;
                                        } | null;
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
} & {
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
                        session: import("./lib/resonance/types").ResonanceSession;
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
                                session: import("./lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("./lib/resonance/types").SceneNode | undefined;
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
                                session: import("./lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("./lib/resonance/types").SceneNode | undefined;
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
                                session: import("./lib/resonance/types").ResonanceSession;
                                error: "NOT_VOTE_SCENE" | "OPTION_INVALID" | null;
                                scene: {
                                    scene: import("./lib/resonance/types").SceneNode | undefined;
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
                            positionOptimum?: number | undefined;
                            onSuccess?: any;
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
                                session: import("./lib/resonance/types").ResonanceSession;
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
                                    scene: import("./lib/resonance/types").SceneNode | undefined;
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
                                session: import("./lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("./lib/resonance/types").SceneNode | undefined;
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
                                session: import("./lib/resonance/types").ResonanceSession;
                                error: "PLAYER_NOT_FOUND" | "SCENE_NOT_FOUND" | null;
                                scene: {
                                    scene: import("./lib/resonance/types").SceneNode | undefined;
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
                                session: import("./lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("./lib/resonance/types").SceneNode | undefined;
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
                                session: import("./lib/resonance/types").ResonanceSession;
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
                                session: import("./lib/resonance/types").ResonanceSession;
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
                                session: import("./lib/resonance/types").ResonanceSession;
                                scene: {
                                    scene: import("./lib/resonance/types").SceneNode | undefined;
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
    pvp: {
        queue: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        match?: undefined;
                    } | {
                        match: import("./lib/roomStore").PvpMatch;
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
    pvp: {
        match: {
            ":id": {
                join: {
                    post: {
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
                                match?: undefined;
                            } | {
                                match: import("./lib/roomStore").PvpMatch;
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
    pvp: {
        match: {
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
                            match?: undefined;
                        } | {
                            match: import("./lib/roomStore").PvpMatch;
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
    presence: {
        ping: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        ok: boolean;
                        timestamp: number;
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
    presence: {
        heartbeat: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        status: number;
                        ok?: undefined;
                    } | {
                        ok: boolean;
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
    presence: {
        online: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        online: string[];
                        count: number;
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
    mastery: {};
} & {
    mastery: {
        my: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        masteries: never[];
                    } | {
                        masteries: {
                            id: number;
                            playerId: number;
                            weaponType: import("./db/schema").WeaponMasteryType;
                            level: number;
                            xp: number;
                            xpToNextLevel: number;
                            unlockedCards: import("./db/schema").MasteryUnlock[] | null;
                            totalXpEarned: number;
                            totalKills: number;
                            createdAt: number;
                            updatedAt: number;
                        }[];
                        error?: undefined;
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
    mastery: {
        ":weaponType": {
            get: {
                body: unknown;
                params: {
                    weaponType: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        weaponType?: undefined;
                        level?: undefined;
                        xp?: undefined;
                        xpToNextLevel?: undefined;
                        unlockedCards?: undefined;
                        totalKills?: undefined;
                    } | {
                        weaponType: string;
                        level: number;
                        xp: number;
                        xpToNextLevel: number;
                        unlockedCards: string[];
                        totalKills: number;
                        error?: undefined;
                    } | {
                        unlockedCardIds: string[];
                        id: number;
                        playerId: number;
                        weaponType: import("./db/schema").WeaponMasteryType;
                        level: number;
                        xp: number;
                        xpToNextLevel: number;
                        unlockedCards: import("./db/schema").MasteryUnlock[] | null;
                        totalXpEarned: number;
                        totalKills: number;
                        createdAt: number;
                        updatedAt: number;
                        error?: undefined;
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
    mastery: {
        "add-xp": {
            post: {
                body: {
                    kills?: number | undefined;
                    weaponType: string;
                    xpAmount: number;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        success?: undefined;
                        level?: undefined;
                        xp?: undefined;
                        xpToNextLevel?: undefined;
                        leveledUp?: undefined;
                        newUnlocks?: undefined;
                        totalKills?: undefined;
                    } | {
                        success: boolean;
                        level: number;
                        xp: number;
                        xpToNextLevel: number;
                        leveledUp: boolean;
                        newUnlocks: string[];
                        totalKills: number;
                        error?: undefined;
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
    admin: {
        db: {
            "reset-all": {
                post: {
                    body: Partial<{}> | null;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            ok?: undefined;
                            result?: undefined;
                        } | {
                            ok: boolean;
                            result: import("./services/adminDbReset").ResetResult;
                            error?: undefined;
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
    admin: {
        db: {
            "reset-multiplayer": {
                post: {
                    body: Partial<{}> | null;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            ok?: undefined;
                            result?: undefined;
                            runtime?: undefined;
                        } | {
                            ok: boolean;
                            result: import("./services/adminDbReset").ResetResult;
                            runtime: {
                                presence: string;
                                pvp: string;
                            };
                            error?: undefined;
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
    admin: {
        db: {
            seed: {
                post: {
                    body: Partial<{}> | null;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                        } | {
                            success: boolean;
                            stats: any;
                            ok: boolean;
                            error?: undefined;
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
    ws: {
        subscribe: {
            body: {
                type: string;
                payload: any;
            };
            params: {};
            query: {};
            headers: {};
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
} & {
    get: {
        body: unknown;
        params: {};
        query: unknown;
        headers: unknown;
        response: {
            200: string;
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
export type App = typeof app;
