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
export type CoopQuestNodeInteraction = 'vote' | 'individual' | 'sync' | 'contribute';
export type CoopQuestChoiceAction = 'start_side_quest' | 'return' | 'start_expedition' | 'resolve_expedition_event' | 'advance_expedition_stage';
export type CoopExpeditionDeadlineEventKind = 'enemy' | 'check';
export interface CoopExpeditionDeadlineEvent {
    nodeId: string;
    kind?: CoopExpeditionDeadlineEventKind;
    weight?: number;
}
export interface CoopCampState {
    security: number;
    operatives: number;
    inventory: Record<string, number>;
}
export interface CoopQuestChoice {
    id: string;
    text: string;
    nextNodeId?: string;
    requiredRole?: CoopRoleId;
    effectText?: string;
    flags?: Record<string, any>;
    action?: CoopQuestChoiceAction;
    questId?: string;
    /** Base contribution score for this choice (opt-in). */
    baseScore?: number;
    /** Optional per-role multiplier overrides for this choice. */
    classMultipliers?: Partial<Record<CoopRoleId, number>>;
    /** Optional tags for score modifiers/artifacts (e.g. "analysis", "visual"). */
    scoreTags?: string[];
    /** Optional item requirement to enable this choice (templateId). */
    requiredItem?: string;
    /** Optional consumable cost (templateId + amount). */
    consumableCost?: {
        templateId: string;
        amount: number;
    };
    /** Optional flat bonus when consuming the above cost. */
    itemBonus?: number;
    /** Optional score modifier deltas to apply on resolve (multipliers; see `tag:*` convention). */
    applyScoreModifiers?: Record<string, number>;
    /** Optional status effect to apply on resolve (server-side). */
    applyStatus?: {
        target: 'all' | 'self' | 'others';
        statusId: string;
        turns?: number;
    };
    /** Optional expedition cost (time turns / research points). */
    cost?: {
        time?: number;
        rp?: number;
    };
    /** Optional expedition rewards (research points). */
    reward?: {
        rp?: number;
    };
    /** Optional expedition config payload (used by `action: 'start_expedition'`). */
    expedition?: {
        maxTurns?: number;
        waveNodeId?: string;
        deadlineEvents?: CoopExpeditionDeadlineEvent[];
        stagePoolId?: string;
        startStageIndex?: number;
    };
    /** Optional expedition event payload (used by `action: 'resolve_expedition_event'`). */
    expeditionEvent?: {
        id: string;
        actorRole?: CoopRoleId;
        successNextNodeId?: string;
        failureNextNodeId?: string;
    };
}
export interface CoopQuestNode {
    id: string;
    title: string;
    background?: string;
    description: string;
    privateText?: Partial<Record<CoopRoleId, string>>;
    interactionType: CoopQuestNodeInteraction;
    /** Optional override: require all players to vote before advancing. */
    requiresAllVotesForProgress?: boolean;
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
    /** Optional side-quest score accumulator (schema evolves; stored server-side). */
    score?: {
        current: number;
        target: number;
        history: number[];
    };
    /** Optional active score modifiers (multipliers; see `tag:*` convention). */
    modifiers?: Record<string, number>;
}
