import { describe, expect, test } from "bun:test";
import { BehaviorTreeRunner, BTNode } from "../../src/services/ai/BehaviorTreeRunner";

describe("BehaviorTreeRunner", () => {
    test("should execute SEQUENCE correctly", async () => {
        // Mock Context
        const context = {
            npc: { id: "npc_1", currentHp: 50 },
            battle: { id: 1 },
            targets: [{ id: "player_1" }]
        };

        const runner = new BehaviorTreeRunner(context);

        const tree: BTNode = {
            type: 'SEQUENCE',
            children: [
                { type: 'CONDITION', condition: 'HAS_AMMO', params: { threshold: 0 } },  // Mock condition
                { type: 'ACTION', action: 'ATTACK' }
            ]
        };

        // We need to extend the runner to support our mock conditions for testing or 
        // ensure the runner implementation handles "HAS_AMMO" which I added in the file.
        // In the file I added: HAS_AMMO checks npc.ammoCount.
        // But my mock npc doesn't have ammoCount.

        // Let's improve the mock NPC.
        context.npc = { ...context.npc, ammoCount: 10 } as any;

        const result = await runner.run(tree);
        expect(result).toBe("SUCCESS");
    });

    test("should fail SEQUENCE if condition fails", async () => {
        const context = {
            npc: { id: "npc_1", currentHp: 50, ammoCount: 0 } as any,
            battle: { id: 1 },
            targets: [{ id: "player_1" }]
        };

        const runner = new BehaviorTreeRunner(context);

        const tree: BTNode = {
            type: 'SEQUENCE',
            children: [
                { type: 'CONDITION', condition: 'HAS_AMMO' },
                { type: 'ACTION', action: 'ATTACK' }
            ]
        };

        const result = await runner.run(tree);
        expect(result).toBe("FAILURE");
    });
});
