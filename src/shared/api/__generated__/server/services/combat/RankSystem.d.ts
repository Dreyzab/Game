export declare const MAX_RANK = 4;
export declare const MIN_RANK = 1;
export declare const WALL_SLAM_DAMAGE = 20;
export interface RankEntity {
    id: string;
    currentRank: number;
    side: 'PLAYER' | 'ENEMY';
}
export type MovementResult = {
    success: boolean;
    newRank: number;
    wallSlam?: boolean;
    collidedWith?: string;
    log?: string;
};
export declare class RankSystem {
    private entities;
    constructor(entities: RankEntity[]);
    getEntity(id: string): RankEntity | undefined;
    getEntityAt(rank: number, side: 'PLAYER' | 'ENEMY'): RankEntity | undefined;
    moveEntity(id: string, direction: 'ADVANCE' | 'RETREAT'): MovementResult;
    applyKnockback(targetId: string, force: number): MovementResult;
    applyPull(targetId: string, force: number): MovementResult;
}
