import type { BTNode } from '../ai/BehaviorTreeRunner';
export type EnemyKey = 'rail_scorpion' | 'mutated_rat_swarm' | 'cult_neophyte' | 'scout_drone' | 'rust_marksman' | 'scavenger_bruiser' | 'mutated_boar' | 'cult_priest' | 'fjr_riot_guard' | 'anarchist_berserker' | 'echo_stalker_drone' | 'heavy_combat_drone' | 'tree_creature' | 'techno_beast' | 'ice_golem';
export declare const DEFAULT_ENEMY_KEY: EnemyKey;
export interface EnemyCatalogEntry {
    key: EnemyKey;
    name: string;
    faction: 'FJR' | 'SCAVENGER' | 'ANARCHIST' | 'ECHO';
    archetype: 'GRUNT' | 'ELITE' | 'BOSS' | 'SPECIAL';
    maxHp: number;
    maxStamina: number;
    maxMorale: number;
    preferredRank: number;
    baseForce?: number;
    baseEndurance?: number;
    baseReflex?: number;
    baseLogic?: number;
    basePsyche?: number;
    baseAuthority?: number;
    behaviorTreeId: string;
    behaviorTree: BTNode;
    initialAmmo?: number;
}
export declare const ENEMY_CATALOG: Record<EnemyKey, EnemyCatalogEntry>;
export declare function isEnemyKey(value: unknown): value is EnemyKey;
export declare function pickRandomEnemyKey(): EnemyKey;
