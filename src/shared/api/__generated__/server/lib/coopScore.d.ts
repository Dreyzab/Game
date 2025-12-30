import type { CoopQuestChoice, CoopQuestNode, CoopRoleId } from '../shared/types/coop';
export interface CoopSideQuestMeta {
    stages: number;
    baseStageAvg?: number;
    difficultyFactor?: number;
}
export declare const DEFAULT_BASE_STAGE_AVG = 10;
export declare const DEFAULT_DIFFICULTY_FACTOR = 1;
/**
 * Tunable per-side-quest metadata for target scaling.
 * Keep conservative defaults so old content remains playable.
 */
export declare const COOP_SIDE_QUEST_META: Record<string, CoopSideQuestMeta>;
export declare function getSideQuestMeta(questId: string | undefined): CoopSideQuestMeta;
export declare function computeTargetTotal(params: {
    baseStageAvg?: number;
    stages: number;
    players: number;
    difficultyFactor?: number;
}): number;
export declare function computeAutoStagesFromGraph(params: {
    entryNodeId: string;
    getNode: (nodeId: string) => CoopQuestNode | undefined;
    getGraphId?: (nodeId: string) => string | undefined;
}): number;
export interface CoopScoreBreakdown {
    baseScore: number;
    classMult: number;
    buffMult: number;
    statusMult: number;
    itemBonus: number;
    artifactBonus: number;
    finalScore: number;
}
export declare function getClassMultiplier(choice: CoopQuestChoice, role?: CoopRoleId | null): number;
/**
 * Score modifiers are stored as multipliers.
 * Convention:
 * - `foo`: global multiplier (applies to all actions)
 * - `tag:visual`: applies only if `choiceTags` contains "visual"
 */
export declare function computeBuffMultiplier(modifiers: Record<string, number> | undefined, choiceTags: string[] | undefined): number;
export declare function computeStatusMultiplier(statusTurns: Record<string, number> | undefined, choiceTags: string[] | undefined): number;
export declare function calculateContributionScore(params: {
    baseScore: number;
    classMult?: number;
    buffMult?: number;
    statusMult?: number;
    itemBonus?: number;
    artifactBonus?: number;
}): CoopScoreBreakdown;
export declare function tryConsumeInventory(inventory: Record<string, number>, templateId: string, amount: number): boolean;
