
export const MAX_RANK = 4;
export const MIN_RANK = 1;
export const WALL_SLAM_DAMAGE = 20;

export interface RankEntity {
    id: string;
    currentRank: number; // 1 (Front) to 4 (Back)
    side: 'PLAYER' | 'ENEMY';
}

export type MovementResult = {
    success: boolean;
    newRank: number;
    wallSlam?: boolean;
    collidedWith?: string; // ID of entity collided with
    log?: string;
};

export class RankSystem {
    private entities: RankEntity[] = [];

    constructor(entities: RankEntity[]) {
        this.entities = entities;
    }

    public getEntity(id: string) {
        return this.entities.find(e => e.id === id);
    }

    public getEntityAt(rank: number, side: 'PLAYER' | 'ENEMY') {
        return this.entities.find(e => e.currentRank === rank && e.side === side);
    }

    public moveEntity(id: string, direction: 'ADVANCE' | 'RETREAT'): MovementResult {
        const entity = this.getEntity(id);
        if (!entity) return { success: false, newRank: 0, log: "Entity not found" };

        const delta = direction === 'ADVANCE' ? -1 : 1; // Advance = Lower Rank (towards center/front)
        // Wait, normally Rank 1 is Front. Rank 4 is Back.
        // Yes. So Advance = reduce rank (4 -> 3 -> 2 -> 1). Retreat = increase rank.

        const targetRank = entity.currentRank + delta;

        if (targetRank < MIN_RANK) {
            // Front Wall? Usually you can't go past 1.
            return { success: false, newRank: entity.currentRank, log: "Already at Front" };
        }

        if (targetRank > MAX_RANK) {
            // Back Wall / Escape?
            // For now, treat as Wall Slam if pushed, or just Blocked if retreating voluntarily?
            // Let's say you just can't retreat further voluntarily.
            return { success: false, newRank: entity.currentRank, log: "Already at Back" };
        }

        // Check Collision
        // Is turn-based strategy allowing multiple units in same rank?
        // Let's assume Unique Ranks for now to keep it simple ("Slot" system).
        // If complex, multiple entities can share a rank.
        // Enemie.md "Rank System" usually implies slots in traditional RPGs.
        // Let's allow overlap for now unless specified otherwise, to avoid "Traffic Jam" logic complexity for MVP.
        // Actually, if we want "Wall Slam", that implies displacement.
        // Let's stick to simple: No collision check for MVP, just bounds check.
        // If we want Collision, we'd check `getEntityAt(targetRank, entity.side)`.

        entity.currentRank = targetRank;
        return { success: true, newRank: targetRank, log: `Moved to Rank ${targetRank}` };
    }

    public applyKnockback(targetId: string, force: number): MovementResult {
        const entity = this.getEntity(targetId);
        if (!entity) return { success: false, newRank: 0 };

        // Knockback pushes AWAY.
        // Usually increases Rank (1 -> 2 -> ... -> 4 -> WALL).
        const targetRank = entity.currentRank + force;

        if (targetRank > MAX_RANK) {
            // Wall Slam!
            entity.currentRank = MAX_RANK;
            return {
                success: true,
                newRank: MAX_RANK,
                wallSlam: true,
                log: `Slammed into back wall!`
            };
        }

        entity.currentRank = targetRank;
        return { success: true, newRank: targetRank, log: `Knocked back to Rank ${targetRank}` };
    }

    public applyPull(targetId: string, force: number): MovementResult {
        const entity = this.getEntity(targetId);
        if (!entity) return { success: false, newRank: 0 };

        // Pull pulls CLOSER (decreases rank).
        const targetRank = Math.max(MIN_RANK, entity.currentRank - force);

        entity.currentRank = targetRank;
        return { success: true, newRank: targetRank, log: `Pulled to Rank ${targetRank}` };
    }
}
