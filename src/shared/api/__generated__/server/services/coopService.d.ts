import type { CoopRoleId } from '../shared/types/coop';
export declare const coopService: {
    createRoom(hostId: number, role?: CoopRoleId): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode;
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
        questNode: import("../shared/types/coop").CoopQuestNode;
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
        questNode: import("../shared/types/coop").CoopQuestNode;
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
        questNode: import("../shared/types/coop").CoopQuestNode;
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
        questNode: import("../shared/types/coop").CoopQuestNode;
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
    castVote(code: string, playerId: number, choiceId: string): Promise<{
        code: string;
        status: string | null;
        hostId: number;
        sceneId: string | null;
        questNode: import("../shared/types/coop").CoopQuestNode;
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
        questNode: import("../shared/types/coop").CoopQuestNode;
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
        questNode: import("../shared/types/coop").CoopQuestNode;
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
