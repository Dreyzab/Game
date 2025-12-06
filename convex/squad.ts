import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Create a new squad
 */
export const createSquad = mutation({
    args: {
        deviceId: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player) throw new Error("Player not found");
        if (player.squadId) throw new Error("Already in a squad");

        const squadId = await ctx.db.insert("squads", {
            leaderId: player._id,
            name: args.name,
            members: [player._id],
            formation: {
                "1": player._id, // Leader defaults to Rank 1
            },
            status: "idle",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.patch(player._id, { squadId });

        return squadId;
    },
});

/**
 * Join a squad via code (squadId for now)
 */
export const joinSquad = mutation({
    args: {
        deviceId: v.string(),
        squadId: v.id("squads"),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player) throw new Error("Player not found");
        if (player.squadId) throw new Error("Already in a squad");

        const squad = await ctx.db.get(args.squadId);
        if (!squad) throw new Error("Squad not found");
        if (squad.members.length >= 4) throw new Error("Squad is full");

        // Find empty rank
        let assignedRank = "4";
        for (let r = 2; r <= 4; r++) {
            // @ts-ignore
            if (!squad.formation[r.toString()]) {
                assignedRank = r.toString();
                break;
            }
        }

        await ctx.db.patch(args.squadId, {
            members: [...squad.members, player._id],
            formation: {
                ...squad.formation,
                [assignedRank]: player._id
            },
            updatedAt: Date.now(),
        });

        await ctx.db.patch(player._id, { squadId: args.squadId });

        return { success: true, rank: assignedRank };
    },
});

/**
 * Update Formation (Drag & Drop)
 */
export const updateFormation = mutation({
    args: {
        deviceId: v.string(),
        squadId: v.id("squads"),
        formation: v.record(
            v.string(),
            v.union(v.id("players"), v.null())
        )
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player) throw new Error("Player not found");

        const squad = await ctx.db.get(args.squadId);
        if (!squad) throw new Error("Squad not found");
        if (squad.leaderId !== player._id) throw new Error("Only leader can update formation");

        await ctx.db.patch(args.squadId, {
            formation: args.formation,
            updatedAt: Date.now(),
        });
    }
});

/**
 * Get Squad Details
 */
export const getSquad = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player || !player.squadId) return null;

        const squad = await ctx.db.get(player.squadId);
        if (!squad) return null;

        // Enrich members
        const members = await Promise.all(squad.members.map(async (id) => {
            return await ctx.db.get(id);
        }));

        return { ...squad, membersDetail: members };
    }
});

/**
 * Leave Squad
 */
export const leaveSquad = mutation({
    args: {
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player || !player.squadId) throw new Error("Not in a squad");

        const squad = await ctx.db.get(player.squadId);
        if (!squad) throw new Error("Squad not found");

        const newMembers = squad.members.filter(id => id !== player._id);

        // Remove from formation
        const newFormation = { ...squad.formation };
        for (const [rank, pid] of Object.entries(newFormation)) {
            if (pid === player._id) {
                // @ts-ignore
                delete newFormation[rank];
            }
        }

        if (newMembers.length === 0) {
            // Delete squad if empty
            await ctx.db.delete(player.squadId);
        } else {
            // If leader left, assign new leader
            let newLeaderId = squad.leaderId;
            if (squad.leaderId === player._id) {
                newLeaderId = newMembers[0];
            }

            await ctx.db.patch(player.squadId, {
                members: newMembers,
                formation: newFormation,
                leaderId: newLeaderId,
                updatedAt: Date.now(),
            });
        }

        await ctx.db.patch(player._id, { squadId: undefined });
    }
});

/**
 * Deploy Squad to PvE Battle
 */
export const deploySquad = mutation({
    args: {
        deviceId: v.string(),
        squadId: v.id("squads"),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player) throw new Error("Player not found");

        const squad = await ctx.db.get(args.squadId);
        if (!squad) throw new Error("Squad not found");
        if (squad.leaderId !== player._id) throw new Error("Only leader can deploy");

        // Create Battle with Squad Formation
        // We need to map squad formation (playerId) to battle participant state
        const participants = [];
        const formationState: any = {};

        // Helper to init state (reuse from pvp.ts logic ideally, but duplicating for speed)
        const getInitialState = (pid: string) => ({
            playerId: pid,
            health: 100,
            maxHealth: 100,
            energy: 10,
            maxEnergy: 10,
            hand: [],
            deck: [], // Should fetch player's deck
            discard: [],
            effects: []
        });

        for (const [rank, pid] of Object.entries(squad.formation)) {
            if (pid) {
                participants.push({
                    playerId: pid,
                    rank: parseInt(rank),
                    classId: "assault", // TODO: Fetch actual class
                    joinedAt: Date.now()
                });
                formationState[rank] = getInitialState(pid);
            }
        }

        const battleId = await ctx.db.insert("battles", {
            hostId: player._id,
            status: "active", // Start immediately for PvE
            participants,
            state: {
                formation: formationState,
                enemies: [{
                    id: "enemy_boss",
                    name: "Alpha Wolf",
                    health: 500,
                    maxHealth: 500,
                    rank: 1
                }]
            },
            logs: [{
                message: `Squad ${squad.name} deployed to zone!`,
                timestamp: Date.now(),
                actorId: player._id
            }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Update squad status
        await ctx.db.patch(args.squadId, { status: "in_battle" });

        return battleId;
    }
});

/**
 * Interact with Squad Member (Heal/Trade)
 */
export const interactSquadMember = mutation({
    args: {
        deviceId: v.string(),
        targetId: v.id("players"),
        action: v.union(v.literal("heal"), v.literal("trade")),
        itemId: v.optional(v.id("items"))
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player || !player.squadId) throw new Error("Not in a squad");

        const squad = await ctx.db.get(player.squadId);
        if (!squad) throw new Error("Squad not found");

        if (!squad.members.includes(args.targetId)) throw new Error("Target not in squad");

        if (args.action === "heal") {
            // Logic: Consume medkit from player, heal target
            const medkit = await ctx.db
                .query("items")
                .withIndex("by_owner", (q) => q.eq("ownerId", args.deviceId))
                .filter((q) => q.eq(q.field("templateId"), "medkit"))
                .first();

            if (!medkit) throw new Error("No medkit found");

            // Consume medkit
            if (medkit.quantity > 1) {
                await ctx.db.patch(medkit._id, { quantity: medkit.quantity - 1 });
            } else {
                await ctx.db.delete(medkit._id);
            }

            // Heal target
            const targetPlayer = await ctx.db.get(args.targetId);
            if (!targetPlayer) throw new Error("Target player not found");

            const targetProg = await ctx.db
                .query("game_progress")
                .withIndex("by_deviceId", (q) => q.eq("deviceId", targetPlayer.deviceId))
                .first();

            if (targetProg) {
                const currentHp = targetProg.hp || 100;
                const maxHp = targetProg.maxHp || 100;
                const newHp = Math.min(maxHp, currentHp + 50); // Heal 50
                await ctx.db.patch(targetProg._id, { hp: newHp });
            }

            return { success: true, message: "Healed target" };
        }

        if (args.action === "trade") {
            if (!args.itemId) throw new Error("Item ID required for trade");

            const item = await ctx.db.get(args.itemId);
            if (!item) throw new Error("Item not found");

            // Create Trade
            await ctx.db.insert("trades", {
                senderId: player._id,
                receiverId: args.targetId,
                itemInstanceId: item.instanceId,
                status: "pending",
                createdAt: Date.now()
            });

            return { success: true, message: "Trade offer sent" };
        }

        return { success: false, message: "Action not implemented" };
    }
});

export const confirmTrade = mutation({
    args: {
        deviceId: v.string(),
        tradeId: v.id("trades"),
        action: v.union(v.literal("accept"), v.literal("reject"))
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();
        if (!player) throw new Error("Player not found");

        const trade = await ctx.db.get(args.tradeId);
        if (!trade) throw new Error("Trade not found");

        if (trade.receiverId !== player._id) throw new Error("Not authorized");
        if (trade.status !== "pending") throw new Error("Trade not pending");

        if (args.action === "reject") {
            await ctx.db.patch(args.tradeId, { status: "rejected", completedAt: Date.now() });
            return { success: true, message: "Trade rejected" };
        }

        // Accept
        const item = await ctx.db
            .query("items")
            .withIndex("by_instance", (q) => q.eq("instanceId", trade.itemInstanceId))
            .first();

        if (!item) throw new Error("Item not found");

        // Transfer ownership
        await ctx.db.patch(item._id, {
            ownerId: player.deviceId,
            containerId: undefined,
            slot: undefined,
            updatedAt: Date.now()
        });

        await ctx.db.patch(args.tradeId, { status: "completed", completedAt: Date.now() });

        return { success: true, message: "Trade accepted" };
    }
});

export const depositToStash = mutation({
    args: {
        deviceId: v.string(),
        itemId: v.id("items")
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();
        if (!player || !player.squadId) throw new Error("Not in a squad");

        const item = await ctx.db.get(args.itemId);
        if (!item) throw new Error("Item not found");
        if (item.ownerId !== player.deviceId) throw new Error("Not your item");

        // Transfer to Squad Stash (using squadId as ownerId)
        await ctx.db.patch(item._id, {
            ownerId: player.squadId,
            containerId: undefined,
            slot: undefined,
            updatedAt: Date.now()
        });

        return { success: true };
    }
});

export const withdrawFromStash = mutation({
    args: {
        deviceId: v.string(),
        itemId: v.id("items")
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();
        if (!player || !player.squadId) throw new Error("Not in a squad");

        const item = await ctx.db.get(args.itemId);
        if (!item) throw new Error("Item not found");

        // Check if item is owned by squad
        if (item.ownerId !== player.squadId) throw new Error("Item not in stash");

        // Transfer to Player
        await ctx.db.patch(item._id, {
            ownerId: player.deviceId,
            containerId: undefined,
            slot: undefined,
            updatedAt: Date.now()
        });

        return { success: true };
    }
});

/**
 * Helper for Visual Novel to check Squad Status
 */
export const getSquadStateForVN = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player || !player.squadId) return null;

        const squad = await ctx.db.get(player.squadId);
        if (!squad) return null;

        // Get classes of all members
        const members = await Promise.all(squad.members.map(async (id) => {
            const p = await ctx.db.get(id);
            return { id: p?._id, name: p?.name };
        }));

        return {
            squadId: squad._id,
            memberCount: squad.members.length,
            hasMedic: false,
            hasSniper: false,
            averageLevel: 1,
            members
        };
    }
});
