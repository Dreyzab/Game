import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Skill Tree Definition
// Skill Tree Definition
export const SKILL_TREE = {
    "perception": {
        level: 5,
        subclasses: [
            {
                id: "sniper",
                name: "Sniper",
                description: "Master of long-range precision.",
                stats: { accuracy: 15, range: 10 }
            },
            {
                id: "scout",
                name: "Scout",
                description: "Expert in reconnaissance and stealth.",
                stats: { vision: 20, stealth: 10 }
            }
        ]
    },
    "solidarity": {
        level: 5,
        subclasses: [
            {
                id: "field_medic",
                name: "Field Medic",
                description: "Combat healer.",
                stats: { healing: 15, resistance: 5 }
            },
            {
                id: "guardian",
                name: "Guardian",
                description: "Protector of the weak.",
                stats: { defense: 15, aggro: 10 }
            }
        ]
    },
    "strength": {
        level: 5,
        subclasses: [
            {
                id: "juggernaut",
                name: "Juggernaut",
                description: "Unstoppable force.",
                stats: { health: 30, speed: -5 }
            },
            {
                id: "breacher",
                name: "Breacher",
                description: "Close-quarters specialist.",
                stats: { melee: 15, destruction: 10 }
            }
        ]
    }
};

/**
 * Unlock a subclass
 */
export const unlockSubclass = mutation({
    args: {
        deviceId: v.string(),
        subclassId: v.string(),
        baseSkillId: v.string()
    },
    handler: async (ctx, args) => {
        const progress = await ctx.db
            .query("game_progress")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!progress) throw new Error("Progress not found");

        const skillLevel = progress.skills?.[args.baseSkillId] ?? 0;
        // @ts-ignore
        const requirement = SKILL_TREE[args.baseSkillId];

        if (!requirement) throw new Error("Invalid base skill");
        if (skillLevel < requirement.level) throw new Error("Skill level too low");

        const subclasses = progress.subclasses ?? [];
        if (subclasses.includes(args.subclassId)) throw new Error("Already unlocked");

        // Check if subclass belongs to base skill
        const isValidSubclass = requirement.subclasses.some((s: any) => s.id === args.subclassId);
        if (!isValidSubclass) throw new Error("Invalid subclass for this skill");

        await ctx.db.patch(progress._id, {
            subclasses: [...subclasses, args.subclassId]
        });

        return { success: true };
    }
});

/**
 * Get unlocked subclasses
 */
export const getSubclasses = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        const progress = await ctx.db
            .query("game_progress")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        return progress?.subclasses ?? [];
    }
});

/**
 * Get Skill Tree Definitions
 */
export const getSkillTree = query({
    args: {},
    handler: async () => {
        return SKILL_TREE;
    }
});
