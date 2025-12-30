import type { CoopExpeditionDeadlineEvent } from '../shared/types/coop';
export type CoopExpeditionStagePoolId = 'rift';
export type CoopExpeditionMissionKind = 'sidequest' | 'node';
export interface CoopExpeditionMissionTemplateBase {
    id: string;
    title: string;
    weight?: number;
    timeCost?: number;
    baseThreat?: number;
}
export interface CoopExpeditionSideQuestTemplate extends CoopExpeditionMissionTemplateBase {
    kind: 'sidequest';
    questId: string;
    entryNodeId: string;
}
export interface CoopExpeditionNodeTemplate extends CoopExpeditionMissionTemplateBase {
    kind: 'node';
    nodeId: string;
}
export type CoopExpeditionMissionTemplate = CoopExpeditionSideQuestTemplate | CoopExpeditionNodeTemplate;
export interface CoopExpeditionMissionModifier {
    id: string;
    label: string;
    weight?: number;
    scoreModifiers?: Record<string, number>;
    applyStatuses?: Record<string, number>;
}
export interface CoopExpeditionStageDefinition {
    id: string;
    /** Which node presents the stage missions (usually a hub). */
    hubNodeId: string;
    /** Choice ids (slots) in the hub node that represent missions. */
    missionChoiceIds: string[];
    /** How many random missions to generate for this stage (unique missions fill first). */
    randomMissionCount: number;
    /** Pre-authored, stage-specific missions (usually unique side quests). */
    uniqueMissions?: CoopExpeditionMissionTemplate[];
    /** Random mission pool for this stage. */
    randomMissions: CoopExpeditionMissionTemplate[];
    /** Deadline event pool (timer expiry) for this stage. */
    deadlineEvents?: CoopExpeditionDeadlineEvent[];
    /** Threat range for generated missions. */
    threatRange?: {
        min: number;
        max: number;
    };
    /** Stage modifier pool; each mission gets one modifier. */
    modifiers?: CoopExpeditionMissionModifier[];
}
export interface CoopExpeditionStagePool {
    id: CoopExpeditionStagePoolId;
    stages: CoopExpeditionStageDefinition[];
    defaultThreatRange: {
        min: number;
        max: number;
    };
    defaultModifiers: CoopExpeditionMissionModifier[];
}
export interface CoopGeneratedMissionInstance {
    kind: CoopExpeditionMissionKind;
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
}
export interface CoopGeneratedStageState {
    poolId: CoopExpeditionStagePoolId;
    stageIndex: number;
    stageId: string;
    hubNodeId: string;
    missionsByChoiceId: Record<string, CoopGeneratedMissionInstance>;
    deadlineEvents: CoopExpeditionDeadlineEvent[];
}
export declare const COOP_EXPEDITION_STAGE_POOLS: Record<CoopExpeditionStagePoolId, CoopExpeditionStagePool>;
export declare function getExpeditionStagePool(poolId: string | undefined): CoopExpeditionStagePool | null;
export declare function generateExpeditionStageState(params: {
    poolId: CoopExpeditionStagePoolId;
    stageIndex: number;
    takenQuestIds: Set<string>;
}): CoopGeneratedStageState;
