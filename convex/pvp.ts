import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Constants
const INITIAL_HP = 100;
const INITIAL_ENERGY = 10;
const MAX_ENERGY = 10;
const HAND_SIZE = 5;

// Rank Preferences
const RANK_PREFS: Record<string, number[]> = {
    "assault": [1, 2],
    "medic": [3, 2],
    "sniper": [4, 3],
    "scout": [1, 2],
    "default": [2, 3]
};

// Basic Card Types
const BASIC_DECK = [
    { id: "strike", name: "Удар", cost: 2, damage: 10, type: "attack", range: [1, 2] },
    { id: "shot", name: "Выстрел", cost: 3, damage: 15, type: "attack", range: [3, 4] },
    { id: "heal", name: "Бинт", cost: 4, heal: 15, type: "heal", range: [1, 2, 3, 4] },
    { id: "defend", name: "Укрытие", cost: 2, defense: 10, type: "defense", range: [1, 2, 3, 4] },
];

function getInitialDeck() {
    const deck = [...BASIC_DECK, ...BASIC_DECK, ...BASIC_DECK];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function drawCards(deck: any[], hand: any[], count: number) {
    const newDeck = [...deck];
    const newHand = [...hand];
    for (let i = 0; i < count; i++) {
        if (newDeck.length > 0) {
            newHand.push(newDeck.pop());
        }
    }
    return { newDeck, newHand };
}

// Helper to calculate efficacy based on rank
function calculateEfficacy(card: any, currentRank: number, optimalRank: number = 0): number {
    // Simplified: If card has range, check if current rank is in range
    if (card.range && !card.range.includes(currentRank)) {
        return 0.6; // Penalty for being out of position
    }
    return 1.0;
}

export const createBattle = mutation({
    args: {
        deviceId: v.string(),
        classId: v.optional(v.string()), // Host's class
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player) throw new Error("Player not found");

        const hostClass = args.classId || "default";
        const preferredRanks = RANK_PREFS[hostClass] || RANK_PREFS["default"];
        const hostRank = preferredRanks[0]; // Take best rank

        const p1Deck = getInitialDeck();
        const { newDeck, newHand } = drawCards(p1Deck, [], HAND_SIZE);

        const battleId = await ctx.db.insert("battles", {
            hostId: player._id,
            status: "waiting",
            participants: [{
                playerId: player._id,
                rank: hostRank,
                classId: hostClass,
                joinedAt: Date.now()
            }],
            state: {
                formation: {
                    [hostRank.toString()]: {
                        playerId: player._id,
                        health: INITIAL_HP,
                        maxHealth: INITIAL_HP,
                        energy: INITIAL_ENERGY,
                        maxEnergy: MAX_ENERGY,
                        hand: newHand,
                        deck: newDeck,
                        discard: [],
                        effects: []
                    }
                },
                enemies: [{
                    id: "enemy_1",
                    name: "Cyber-Wolf",
                    health: 200,
                    maxHealth: 200,
                    rank: 1
                }]
            },
            logs: [{
                message: `Lobby created by ${player.name} (${hostClass})`,
                timestamp: Date.now(),
                actorId: player._id
            }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return battleId;
    },
});

export const joinBattle = mutation({
    args: {
        deviceId: v.string(),
        battleId: v.id("battles"),
        classId: v.string(),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player) throw new Error("Player not found");

        const battle = await ctx.db.get(args.battleId);
        if (!battle) throw new Error("Battle not found");
        if (battle.status !== "waiting") throw new Error("Battle is not open");

        // Check if already joined
        if (battle.participants.some(p => p.playerId === player._id)) {
            return { success: true, message: "Already joined" };
        }

        // Auto-Formation Logic
        const preferredRanks = RANK_PREFS[args.classId] || RANK_PREFS["default"];
        let assignedRank = -1;

        // Try preferred ranks
        for (const rank of preferredRanks) {
            if (!battle.state.formation[rank.toString()]) {
                assignedRank = rank;
                break;
            }
        }

        // If preferred full, find any empty slot 1-4
        if (assignedRank === -1) {
            for (let r = 1; r <= 4; r++) {
                if (!battle.state.formation[r.toString()]) {
                    assignedRank = r;
                    break;
                }
            }
        }

        if (assignedRank === -1) throw new Error("Lobby is full");

        // Init State
        const deck = getInitialDeck();
        const { newDeck, newHand } = drawCards(deck, [], HAND_SIZE);

        const newParticipant = {
            playerId: player._id,
            rank: assignedRank,
            classId: args.classId,
            joinedAt: Date.now()
        };

        const newFormationState = {
            playerId: player._id,
            health: INITIAL_HP,
            maxHealth: INITIAL_HP,
            energy: INITIAL_ENERGY,
            maxEnergy: MAX_ENERGY,
            hand: newHand,
            deck: newDeck,
            discard: [],
            effects: []
        };

        // Update Battle
        await ctx.db.patch(args.battleId, {
            participants: [...battle.participants, newParticipant],
            state: {
                ...battle.state,
                formation: {
                    ...battle.state.formation,
                    [assignedRank.toString()]: newFormationState
                }
            },
            logs: [...battle.logs, {
                message: `${player.name} joined as ${args.classId} at Rank ${assignedRank}`,
                timestamp: Date.now(),
                actorId: player._id
            }],
            updatedAt: Date.now()
        });

        return { success: true, rank: assignedRank };
    },
});

export const startBattle = mutation({
    args: {
        deviceId: v.string(),
        battleId: v.id("battles"),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();
        if (!player) throw new Error("Player not found");

        const battle = await ctx.db.get(args.battleId);
        if (!battle) throw new Error("Battle not found");
        if (battle.hostId !== player._id) throw new Error("Only host can start battle");
        if (battle.status !== "waiting") throw new Error("Battle already started");

        // Initialize Turn Order
        // 1. Players sorted by rank (or speed in future)
        // 2. Enemies
        const playerIds = battle.participants.map(p => p.playerId);
        const enemyIds = battle.state.enemies.map(e => e.id);

        // Simple initiative: Players first, then enemies
        const turnOrder = [...playerIds, ...enemyIds];

        await ctx.db.patch(args.battleId, {
            status: "active",
            turnOrder: turnOrder,
            currentTurnPlayerId: playerIds[0], // First player starts
            round: 1,
            logs: [...battle.logs, {
                message: "Battle started!",
                timestamp: Date.now(),
                actorId: player._id
            }],
            updatedAt: Date.now()
        });
    }
});

export const endTurn = mutation({
    args: {
        deviceId: v.string(),
        battleId: v.id("battles"),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();
        if (!player) throw new Error("Player not found");

        const battle = await ctx.db.get(args.battleId);
        if (!battle) throw new Error("Battle not found");
        if (battle.status !== "active") throw new Error("Battle not active");

        // Check if it's player's turn
        if (battle.currentTurnPlayerId !== player._id) {
            // Allow passing turn if it's currently an enemy's turn (debug/manual override) or if we implement AI later
            // For now, strict check
            throw new Error("Not your turn");
        }

        const currentTurnIndex = battle.turnOrder!.indexOf(player._id);
        if (currentTurnIndex === -1) throw new Error("Player not in turn order");

        let nextTurnIndex = (currentTurnIndex + 1) % battle.turnOrder!.length;
        let nextActorId = battle.turnOrder![nextTurnIndex];
        let round = battle.round || 1;

        // If we wrapped around, increment round
        if (nextTurnIndex === 0) {
            round++;
        }

        // REGENERATE ENERGY/DRAW for the NEXT player if it is a player
        const nextParticipant = battle.participants.find(p => p.playerId === nextActorId);
        let formationUpdate = {};

        if (nextParticipant) {
            const rank = nextParticipant.rank.toString();
            const nextPlayerState = battle.state.formation[rank];
            if (nextPlayerState) {
                // Energy Regen
                const newEnergy = Math.min(nextPlayerState.maxEnergy, nextPlayerState.energy + 2); // +2 per turn

                // Draw Card
                let { newDeck, newHand } = drawCards(nextPlayerState.deck, nextPlayerState.hand, 1);

                formationUpdate = {
                    [`state.formation.${rank}`]: {
                        ...nextPlayerState,
                        energy: newEnergy,
                        hand: newHand,
                        deck: newDeck
                    }
                };
            }
        }

        await ctx.db.patch(args.battleId, {
            currentTurnPlayerId: nextActorId,
            round: round,
            ...formationUpdate,
            logs: [...battle.logs, {
                message: `Turn ended. Next: ${nextActorId}`,
                timestamp: Date.now(),
                actorId: player._id
            }],
            updatedAt: Date.now()
        });
    }
});

export const playCard = mutation({
    args: {
        deviceId: v.string(),
        battleId: v.id("battles"),
        cardIndex: v.number(),
        targetId: v.optional(v.string()) // Enemy ID or Ally Rank?
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();
        if (!player) throw new Error("Player not found");

        const battle = await ctx.db.get(args.battleId);
        if (!battle) throw new Error("Battle not found");

        // Find player in formation
        const participant = battle.participants.find(p => p.playerId === player._id);
        if (!participant) throw new Error("You are not in this battle");

        const myRank = participant.rank.toString();
        const myState = battle.state.formation[myRank];
        if (!myState) throw new Error("Formation state error");

        // Validate Turn
        if (battle.status === "active") {
            if (battle.currentTurnPlayerId !== player._id) throw new Error("Not your turn");
        }

        // Validate Turn
        if (battle.status === "active") {
            if (battle.currentTurnPlayerId !== player._id) throw new Error("Not your turn");
        }

        // Validate Card
        if (args.cardIndex < 0 || args.cardIndex >= myState.hand.length) throw new Error("Invalid card");
        const card = myState.hand[args.cardIndex];

        if (myState.energy < card.cost) throw new Error("Not enough energy");

        // Calculate Efficacy
        const efficacy = calculateEfficacy(card, participant.rank);

        // Apply Effects
        let logMsg = `${player.name} uses ${card.name} (Eff: ${efficacy * 100}%)`;
        const newEnemies = [...battle.state.enemies];

        if (card.type === "attack") {
            const damage = Math.floor(card.damage * efficacy);
            // Default target first enemy if none specified
            const targetIndex = 0;
            if (newEnemies[targetIndex]) {
                newEnemies[targetIndex].health -= damage;
                logMsg += ` for ${damage} damage!`;
            }
        } else if (card.type === "heal") {
            const heal = Math.floor(card.heal * efficacy);
            // Self heal for MVP
            myState.health = Math.min(myState.maxHealth, myState.health + heal);
            logMsg += ` healing self for ${heal}`;
        }

        // Update State
        const newHand = [...myState.hand];
        newHand.splice(args.cardIndex, 1);

        const newFormationState = {
            ...myState,
            energy: myState.energy - card.cost,
            hand: newHand,
            discard: [...myState.discard, card]
        };

        const newState = {
            ...battle.state,
            formation: {
                ...battle.state.formation,
                [myRank]: newFormationState
            },
            enemies: newEnemies
        };

        // Check Battle Status
        let status = battle.status;
        let winnerId = battle.winnerId;
        let finalLogMsg = "";

        const allEnemiesDead = newEnemies.every(e => e.health <= 0);
        let rewards: any[] = [];

        if (allEnemiesDead) {
            status = "finished";
            winnerId = "players";
            finalLogMsg = "Victory! All enemies defeated.";

            // Calculate Rewards
            const xpReward = 100;
            const goldReward = Math.floor(Math.random() * 40) + 10; // 10-50 Gold
            const itemReward = Math.random() > 0.5 ? "medkit" : null; // 50% chance for medkit

            // Distribute to all participants
            rewards = await Promise.all(battle.participants.map(async (p) => {
                // Update Game Progress
                const playerDoc = await ctx.db.get(p.playerId);
                if (playerDoc) {
                    const progress = await ctx.db
                        .query("game_progress")
                        .withIndex("by_deviceId", (q) => q.eq("deviceId", playerDoc.deviceId))
                        .first();

                    if (progress) {
                        await ctx.db.patch(progress._id, {
                            experience: (progress.experience || 0) + xpReward,
                            gold: (progress.gold || 0) + goldReward
                        });
                    }

                    // Add Item
                    if (itemReward) {
                        // In a real app, we'd fetch the template from `items` (templates) or a config
                        // For now, hardcoding the medkit details to satisfy schema
                        await ctx.db.insert("items", {
                            ownerId: playerDoc.deviceId,
                            templateId: itemReward,
                            instanceId: crypto.randomUUID(),
                            quantity: 1,
                            kind: "consumable",
                            name: "Medkit",
                            description: "Restores health.",
                            rarity: "common",
                            icon: "medkit_icon",
                            stats: {
                                weight: 0.5,
                                width: 1,
                                height: 1
                            },
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        });
                    }
                }

                return {
                    playerId: p.playerId,
                    xp: xpReward,
                    gold: goldReward,
                    items: itemReward ? [itemReward] : []
                };
            }));
        }

        const newLogs = [...battle.logs, {
            message: logMsg,
            timestamp: Date.now(),
            actorId: player._id
        }];

        if (finalLogMsg) {
            newLogs.push({
                message: finalLogMsg,
                timestamp: Date.now(),
                actorId: "system"
            });
        }

        await ctx.db.patch(args.battleId, {
            status: status,
            winnerId: winnerId,
            state: newState,
            logs: newLogs,
            rewards: rewards.length > 0 ? rewards : undefined,
            updatedAt: Date.now()
        });
    }
});

export const getBattle = query({
    args: { battleId: v.id("battles") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.battleId);
    },
});

export const getOpenBattles = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("battles")
            .withIndex("by_status", (q) => q.eq("status", "waiting"))
            .order("desc")
            .take(20);
    },
});

export const getLobbyQR = query({
    args: { battleId: v.id("battles") },
    handler: async (ctx, args) => {
        // In real app, sign this token
        return `grezwanderer://join?battleId=${args.battleId}`;
    }
});
