import { describe, expect, test } from "bun:test";
import { RankSystem, RankEntity, MAX_RANK } from "../../src/services/combat/RankSystem";

describe("RankSystem", () => {
    test("moveEntity should change rank correctly", () => {
        const entity: RankEntity = { id: "p1", currentRank: 2, side: 'PLAYER' };
        const sys = new RankSystem([entity]);

        const res = sys.moveEntity("p1", "ADVANCE"); // 2 -> 1
        expect(res.success).toBe(true);
        expect(res.newRank).toBe(1);
        expect(entity.currentRank).toBe(1);
    });

    test("moveEntity should block moving past Front (Rank 1)", () => {
        const entity: RankEntity = { id: "p1", currentRank: 1, side: 'PLAYER' };
        const sys = new RankSystem([entity]);

        const res = sys.moveEntity("p1", "ADVANCE");
        expect(res.success).toBe(false);
        expect(entity.currentRank).toBe(1);
    });

    test("applyKnockback should increase rank and detect Wall Slam", () => {
        const entity: RankEntity = { id: "e1", currentRank: 3, side: 'ENEMY' };
        const sys = new RankSystem([entity]);

        // Push 2 ranks: 3 + 2 = 5 (> 4) -> Wall Slam
        const res = sys.applyKnockback("e1", 2);

        expect(res.success).toBe(true);
        expect(res.wallSlam).toBe(true);
        expect(res.newRank).toBe(MAX_RANK); // Clamped to 4
        expect(entity.currentRank).toBe(MAX_RANK);
    });
});
