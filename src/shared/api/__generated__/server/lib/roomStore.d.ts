type Role = 'body' | 'mind' | 'social' | 'assault' | 'support' | 'scout';
/**
 * Cooperative Quest — lightweight state machine for the shared LCSD quest.
 *
 * The narrative text itself lives on the client side; the server only
 * tracks which node the room is currently on, who made which choice,
 * and enforces simple role-based restrictions for some options.
 */
export type CoopQuestNodeId = 'forest_boundary' | 'golem_engagement' | 'dwarf_encounter' | 'amulet_reveal' | 'quest_complete';
export type CoopQuestChoice = {
    id: string;
    text: string;
    nextNodeId: CoopQuestNodeId;
    requiredRole?: Role;
};
export type CoopQuestNode = {
    id: CoopQuestNodeId;
    title: string;
    description: string;
    choices: CoopQuestChoice[];
};
export type CoopQuestState = {
    nodeId: CoopQuestNodeId;
    history: {
        nodeId: CoopQuestNodeId;
        choiceId?: string;
        actorId?: string;
        at: number;
    }[];
    startedAt: number;
    finishedAt?: number;
};
export declare const COOP_QUEST_NODES: Record<CoopQuestNodeId, CoopQuestNode>;
export type CoopPlayer = {
    id: string;
    role?: Role;
    ready: boolean;
};
export type CoopRoom = {
    code: string;
    hostId: string;
    status: 'lobby' | 'in_progress' | 'finished';
    players: CoopPlayer[];
    quest?: CoopQuestState;
    updatedAt: number;
};
export type PvpMatch = {
    id: string;
    status: 'matching' | 'active' | 'finished';
    players: string[];
    startedAt: number;
    updatedAt: number;
};
export declare function createCoopRoom(userId: string, role?: Role): CoopRoom;
export declare function getCoopRoom(code: string): CoopRoom | undefined;
export declare function joinCoopRoom(code: string, userId: string, role?: Role): CoopRoom | null;
export declare function leaveCoopRoom(code: string, userId: string): CoopRoom | null;
export declare function setCoopReady(code: string, userId: string, ready: boolean): CoopRoom | null;
export declare function startCoop(code: string, userId: string): CoopRoom | null;
/**
 * Получить состояние кооперативного квеста для комнаты.
 */
export declare function getCoopQuest(code: string): CoopQuestState | null;
/**
 * Применить выбор в кооперативном квесте с простыми проверками ролей.
 */
export declare function applyCoopQuestChoice(code: string, userId: string, choiceId: string): {
    quest: CoopQuestState | null;
    error?: string;
};
export declare function createPvpMatch(userId: string): PvpMatch;
export declare function joinPvpMatch(matchId: string, userId: string): PvpMatch | null;
export declare function getPvpMatch(matchId: string): PvpMatch | undefined;
export declare function resetPvpRuntime(): void;
export declare function resetCoopRuntime(): void;
export {};
