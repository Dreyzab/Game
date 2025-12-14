export type NodeStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING';
import { RankSystem } from '../combat/RankSystem';
export interface AIContext {
    npc: any;
    battle: any;
    targets: any[];
    rankSystem?: RankSystem;
}
export interface BTNode {
    type: 'SELECTOR' | 'SEQUENCE' | 'ACTION' | 'CONDITION';
    name?: string;
    children?: BTNode[];
    action?: string;
    condition?: string;
    params?: any;
}
export interface AIAction {
    type: string;
    params?: any;
    result?: any;
    timestamp: number;
}
export declare class BehaviorTreeRunner {
    private context;
    private executedActions;
    constructor(context: AIContext);
    run(root: BTNode): Promise<NodeStatus>;
    getExecutedActions(): AIAction[];
    private executeNode;
    private evaluateCondition;
    private executeAction;
}
