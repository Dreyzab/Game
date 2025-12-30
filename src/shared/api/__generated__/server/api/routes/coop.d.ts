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
                            questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                pendingNodeId?: string;
                                pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
                                questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                    deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                    pendingNodeId?: string;
                                    pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
                                    questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                        deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
                                    questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                        deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
                                    questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                        deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
                                    questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                        deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
                                    questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                        deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
                                    questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                        deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
                            node: import("../../shared/types/coop").CoopQuestNode;
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
                                    questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                        deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                        pendingNodeId?: string;
                                        pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
                                        questNode: import("../../shared/types/coop").CoopQuestNode | null;
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
                                            deadlineEvents?: import("../../shared/types/coop").CoopExpeditionDeadlineEvent[];
                                            pendingNodeId?: string;
                                            pendingKind?: import("../../shared/types/coop").CoopExpeditionDeadlineEventKind;
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
