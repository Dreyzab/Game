
// Types for BT
export type NodeStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING';

import { RankSystem, RankEntity } from '../combat/RankSystem';

export interface AIContext {
    npc: any; // NpcInstance
    battle: any; // Battle state
    targets: any[]; // Players
    rankSystem?: RankSystem;
}

export interface BTNode {
    type: 'SELECTOR' | 'SEQUENCE' | 'ACTION' | 'CONDITION';
    name?: string;
    children?: BTNode[];
    action?: string; // function name for ACTION
    condition?: string; // function name for CONDITION
    params?: any;
}


export interface AIAction {
    type: string;
    params?: any;
    result?: any;
    timestamp: number;
}

export class BehaviorTreeRunner {
    private context: AIContext;
    private executedActions: AIAction[] = [];

    constructor(context: AIContext) {
        this.context = context;
    }

    async run(root: BTNode): Promise<NodeStatus> {
        this.executedActions = [];
        return this.executeNode(root);
    }

    public getExecutedActions() {
        return this.executedActions;
    }

    private async executeNode(node: BTNode): Promise<NodeStatus> {
        switch (node.type) {
            case 'SELECTOR':
                for (const child of node.children || []) {
                    const status = await this.executeNode(child);
                    if (status === 'SUCCESS' || status === 'RUNNING') return status;
                }
                return 'FAILURE';

            case 'SEQUENCE':
                for (const child of node.children || []) {
                    const status = await this.executeNode(child);
                    if (status === 'FAILURE' || status === 'RUNNING') return status;
                }
                return 'SUCCESS';

            case 'CONDITION':
                // Conditions are now handled directly in evaluateCondition,
                // or some specific ones might be inlined here if needed.
                return this.evaluateCondition(node.condition!, node.params);

            case 'ACTION':
                return this.executeAction(node); // Pass the whole node for action name and params

            default:
                return 'FAILURE';
        }
    }

    private async evaluateCondition(conditionName: string, params: any): Promise<NodeStatus> {
        // Implement specific conditions here
        // Example: check ammo, check health, check distance
        const { npc, battle, targets } = this.context;

        if (conditionName === 'HAS_AMMO') {
            return (npc.ammoCount > 0) ? 'SUCCESS' : 'FAILURE';
        }

        if (conditionName === 'HAS_AMMO_AT_LEAST') {
            const amount = params?.amount ?? 1;
            return (npc.ammoCount >= amount) ? 'SUCCESS' : 'FAILURE';
        }

        if (conditionName === 'IS_LOW_HP') {
            const threshold = params?.threshold || 30; // percent
            const pct = (npc.currentHp / npc.template.maxHp) * 100;
            return (pct < threshold) ? 'SUCCESS' : 'FAILURE';
        }

        if (conditionName === 'IS_IN_RANGE') {
            if (!this.context.rankSystem) return 'SUCCESS';
            const target = targets[0]; // Assuming targeting first player for now
            // Distance check? Or just Rank check.
            // Let's assume params.idealRank for "My Rank"
            // Or params.distance <= X.
            // Let's implement simple "Must be at Rank X" for now.
            if (params?.idealRank) {
                return (npc.currentRank === params.idealRank) ? 'SUCCESS' : 'FAILURE';
            }
            return 'SUCCESS';
        }

        return 'FAILURE';
    }

    private async executeAction(node: BTNode): Promise<NodeStatus> {
        const actionName = node.action;
        const params = node.params;
        const now = Date.now();

        console.log(`[AI] Executing Action: ${actionName} for NPC ${this.context.npc.id}`);

        if (actionName === 'MOVE_TOWARDS_PLAYER') {
            if (!this.context.rankSystem) return 'FAILURE';
            // Logic to move
            const npcId = this.context.npc.id;
            // Get current Rank
            const currentRank = this.context.npc.currentRank;
            // Target is Player (Rank 4 -> 1). NPC (Rank 1 -> 4).
            // Actually RankSystem handles "Advance".
            // If NPC is at Rank 2 (Enemy side), Advance means going to Rank 1?
            // Wait, RankSystem defined: Player Ranks 4,3,2,1. Enemy Ranks 1,2,3,4 ??
            // Or shared 4 ranks?
            // Let's assume standard JRPG: Shared Ranks 1,2,3,4.
            // Player at 1 (Front), 4 (Back).
            // Enemy at 1 (Front), 4 (Back).
            // "Advance" means moving to 1?
            // If I am at 2, Advance -> 1.
            // "Retreat" -> 2.

            // Try to Advance
            const originalRank = this.context.npc.currentRank;
            this.context.rankSystem.moveEntity(npcId, 'ADVANCE'); // This updates internal state of RankSystem
            // We need to sync back to context.npc
            const newRank = this.context.rankSystem.getEntity(npcId)?.currentRank || originalRank;
            this.context.npc.currentRank = newRank;

            if (newRank !== originalRank) {
                this.executedActions.push({ type: 'MOVE', params: { from: originalRank, to: newRank }, timestamp: now });
                return 'SUCCESS';
            }
            return 'FAILURE';
        }

        if (actionName === 'MOVE_AWAY_FROM_PLAYER') {
            if (!this.context.rankSystem) return 'FAILURE';

            const npcId = this.context.npc.id;
            const originalRank = this.context.npc.currentRank;
            this.context.rankSystem.moveEntity(npcId, 'RETREAT');
            const newRank = this.context.rankSystem.getEntity(npcId)?.currentRank || originalRank;
            this.context.npc.currentRank = newRank;

            if (newRank !== originalRank) {
                this.executedActions.push({ type: 'MOVE', params: { from: originalRank, to: newRank }, timestamp: now });
                return 'SUCCESS';
            }
            return 'FAILURE';
        }

        if (actionName === 'ATTACK' || actionName === 'ATTACK_MELEE' || actionName === 'ATTACK_CLOSEST') {
            // Check range first? Usually done by CONDITION node sequence.
            // Apply damage.
            const damage = params?.damage || 5;
            this.executedActions.push({ type: 'ATTACK', params: { damage, target: 'player', kind: 'melee' }, timestamp: now });
            return 'SUCCESS';
        }

        if (actionName === 'ATTACK_RANGED') {
            const damage = params?.damage || 5;
            const ammoCost = params?.ammoCost ?? 1;
            if ((this.context.npc.ammoCount ?? 0) < ammoCost) {
                return 'FAILURE';
            }
            this.context.npc.ammoCount = Math.max(0, (this.context.npc.ammoCount ?? 0) - ammoCost);
            this.executedActions.push({
                type: 'ATTACK',
                params: { damage, target: 'player', kind: 'ranged', ammoCost },
                timestamp: now
            });
            return 'SUCCESS';
        }

        return 'FAILURE';
    }
}
