import type { BTNode } from '../ai/BehaviorTreeRunner';
export type EnemyKey = 'rail_scorpion' | 'rust_marksman' | 'fjr_riot_guard' | 'anarchist_berserker' | 'echo_stalker_drone';
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
