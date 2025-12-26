import type { AttributeGroup, VoiceId } from './parliament';
export type CoopRoleId = 'valkyrie' | 'vorschlag' | 'ghost' | 'shustrya';
export interface CoopRoleDefinition {
    id: CoopRoleId;
    label: string;
    nameRu: string;
    description: string;
    primaryGroup: AttributeGroup;
    focusVoices: VoiceId[];
    playstyleHint: string;
}
export declare const COOP_ROLES: Record<CoopRoleId, CoopRoleDefinition>;
export type CoopQuestNodeInteraction = 'vote' | 'individual' | 'sync';
export interface CoopQuestChoice {
    id: string;
    text: string;
    nextNodeId?: string;
    requiredRole?: CoopRoleId;
    effectText?: string;
}
export interface CoopQuestNode {
    id: string;
    title: string;
    background?: string;
    description: string;
    privateText?: Partial<Record<CoopRoleId, string>>;
    interactionType: CoopQuestNodeInteraction;
    choices: CoopQuestChoice[];
}
export interface CoopQuestState {
    nodeId: string;
    votes: Record<string, string>;
    ready: Record<string, boolean>;
    history: Array<{
        nodeId: string;
        choiceId?: string;
        actorId?: string;
        at: number;
    }>;
    startedAt: number;
    finishedAt?: number;
}
