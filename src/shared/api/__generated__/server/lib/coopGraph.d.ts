import type { CoopQuestNode } from '../shared/types/coop';
export type CoopNodeId = string;
export type CoopGraphId = string;
export interface CoopGraphDefinition {
    id: CoopGraphId;
    nodes: Record<CoopNodeId, CoopQuestNode>;
}
export interface CoopGraphValidationResult {
    errors: string[];
    warnings: string[];
}
export declare class CoopGraphEngine {
    private readonly nodes;
    private readonly nodeToGraph;
    constructor(graphs: CoopGraphDefinition[]);
    getNode(nodeId: CoopNodeId): CoopQuestNode | undefined;
    requireNode(nodeId: CoopNodeId): CoopQuestNode;
    getGraphId(nodeId: CoopNodeId): CoopGraphId | undefined;
    listNodeIds(): CoopNodeId[];
    validate(options?: {
        allowDynamicReturn?: boolean;
    }): CoopGraphValidationResult;
}
export declare const coopGraph: CoopGraphEngine;
