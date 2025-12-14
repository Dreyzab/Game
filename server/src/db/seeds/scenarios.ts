
import { db } from "../index";
import { behaviorTrees, npcTemplates } from "../schema/npcs";
import { eq } from "drizzle-orm";

export async function seedScenarios() {
    console.log("Seeding Scenarios...");

    // 1. Define Scorpion Behavior Tree
    const scorpionTree = {
        type: "SELECTOR",
        children: [
            // Priority 1: Attack if at Rank 1 (Front Line)
            {
                type: "SEQUENCE",
                children: [
                    { type: "CONDITION", condition: "IS_IN_RANGE", params: { idealRank: 1 } },
                    { type: "ACTION", action: "ATTACK_MELEE", params: { damage: 15 } } // Need to handle ATTACK_MELEE in Runner
                ]
            },
            // Priority 2: Move Forward
            {
                type: "ACTION",
                action: "MOVE_TOWARDS_PLAYER",
                params: {}
            }
        ]
    };

    await db.insert(behaviorTrees).values({
        id: "scorpion_rush",
        tree: scorpionTree as any
    }).onConflictDoUpdate({
        target: behaviorTrees.id,
        set: { tree: scorpionTree as any }
    });

    // 2. Define Rail Scorpion Template
    // We try to find if it exists or create new.
    // Drizzle doesn't support onConflictDoUpdate effectively without unique constraint on name?
    // We'll search by name first.

    const existing = await db.query.npcTemplates.findFirst({
        where: eq(npcTemplates.name, "Rail Scorpion")
    });

    const scorpionData = {
        name: "Rail Scorpion",
        faction: "SCAVENGER", // enum
        archetype: "GRUNT", // enum
        maxHp: 60,
        maxStamina: 20,
        maxMorale: 10,
        aiBehaviorTreeId: "scorpion_rush",
        preferredRank: 1,
        // Stats
        baseForce: 4,
        baseReflex: 8, // fast
        baseEndurance: 4,
        baseLogic: 1,
        basePsyche: 1,
        baseAuthority: 1
    };

    if (existing) {
        await db.update(npcTemplates)
            .set(scorpionData as any)
            .where(eq(npcTemplates.id, existing.id));
        console.log("Updated Rail Scorpion");
    } else {
        await db.insert(npcTemplates).values(scorpionData as any);
        console.log("Created Rail Scorpion");
    }

    console.log("Scenario Seeding Complete.");
}

// Allow running directly if file is executed
if (import.meta.main) {
    seedScenarios().catch(console.error);
}
