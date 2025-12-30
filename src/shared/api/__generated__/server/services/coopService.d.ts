import type { CoopExpeditionDeadlineEvent, CoopExpeditionDeadlineEventKind, CoopRoleId } from '../shared/types/coop';
type CoopCampState = {
    security: number;
    operatives: number;
    inventory: Record<string, number>;
};
type CoopExpeditionState = {
    turnCount: number;
    maxTurns: number;
    researchPoints: number;
    waveNodeId?: string;
    wavePending?: boolean;
    deadlineEvents?: CoopExpeditionDeadlineEvent[];
    pendingNodeId?: string;
    pendingKind?: CoopExpeditionDeadlineEventKind;
    poolId?: string;
    stageIndex?: number;
    stageId?: string;
    hubNodeId?: string;
    missions?: Record<string, {
        kind: 'sidequest' | 'node';
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
};
export declare const coopService: {
    createRoom(hostId: number, role?: CoopRoleId): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    getRoomState(code: string): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    joinRoom(code: string, playerId: number, role?: CoopRoleId): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    setReady(code: string, playerId: number, isReady: boolean): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    startSession(code: string, hostId: number): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    markReached(code: string, playerId: number, nodeId: string): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    castVote(code: string, requesterPlayerId: number, choiceId: string, asPlayerId?: number, nodeId?: string): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    getCamp(code: string, playerId: number): Promise<CoopCampState>;
    getCampShop(code: string, playerId: number): Promise<{
        currencyTemplateId: string;
        currencyAmount: number;
        stock: import("../lib/vendorStock").VendorStockItem[];
    }>;
    callReinforcements(code: string, playerId: number, count?: number): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    purchaseCampItem(code: string, playerId: number, templateId: string, quantity?: number): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    withdrawFromCamp(code: string, playerId: number, templateId: string, quantity?: number): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    depositToCamp(code: string, playerId: number, itemId: string, quantity?: number): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    rewardCamp(code: string, playerId: number, kind: "research" | "combat", amount?: number): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    leaveRoom(code: string, playerId: number): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    forceScene(code: string, nodeId: string): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
    addBotToRoom(code: string): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode | null;
        camp: CoopCampState | null;
        expedition: CoopExpeditionState | null;
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
    } | null>;
};
export {};
