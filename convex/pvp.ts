import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Constants
const INITIAL_HP = 100;
const INITIAL_ENERGY = 10; // Simplified for PvP
const MAX_ENERGY = 10;
const HAND_SIZE = 5;

// Basic Card Types for MVP
// In a real system, these would come from the database/templates
const BASIC_DECK = [
    { id: "strike", name: "Удар", cost: 2, damage: 10, type: "attack" },
    { id: "strike", name: "Удар", cost: 2, damage: 10, type: "attack" },
    { id: "strike", name: "Удар", cost: 2, damage: 10, type: "attack" },
    { id: "block", name: "Блок", cost: 2, defense: 8, type: "defense" },
    { id: "block", name: "Блок", cost: 2, defense: 8, type: "defense" },
    { id: "heal", name: "Бинт", cost: 4, heal: 15, type: "utility" },
    { id: "fireball", name: "Огненный шар", cost: 5, damage: 25, type: "attack" },
];

function getInitialDeck() {
    // Clone and shuffle
    const deck = [...BASIC_DECK, ...BASIC_DECK]; // 14 cards
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

/**
 * Create a new battle lobby
 */
export const createBattle = mutation({
    args: {
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!player) throw new Error("Player not found");

        const p1Deck = getInitialDeck();
        const { newDeck, newHand } = drawCards(p1Deck, [], HAND_SIZE);

        const battleId = await ctx.db.insert("battles", {
            player1Id: player._id,
            status: "waiting",
            state: {
                p1Health: INITIAL_HP,
                p1MaxHealth: INITIAL_HP,
                p1Energy: INITIAL_ENERGY,
                p1Hand: newHand,
                p1Deck: newDeck,
                p1Discard: [],

                p2Health: INITIAL_HP,
                p2MaxHealth: INITIAL_HP,
                p2Energy: INITIAL_ENERGY,
                p2Hand: [],
                p2Deck: [],
                p2Discard: [],
            },
            logs: [{
                message: `Игрок ${player.name} создал арену`,
                timestamp: Date.now(),
                actorId: player._id
            }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return battleId;
    },
});

/**
 * Join an existing battle
 */
export const joinBattle = mutation({
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
        if (battle.status !== "waiting") throw new Error("Battle is not waiting for players");
        if (battle.player1Id === player._id) throw new Error("Cannot join your own battle");

        const p2Deck = getInitialDeck();
        const { newDeck, newHand } = drawCards(p2Deck, [], HAND_SIZE);

        await ctx.db.patch(args.battleId, {
            player2Id: player._id,
            status: "active",
            currentTurnPlayerId: battle.player1Id, // Player 1 starts
            "state.p2Hand": newHand,
            "state.p2Deck": newDeck,
            logs: [...battle.logs, {
                message: `Игрок ${player.name} присоединился! Бой начался!`,
                timestamp: Date.now(),
                actorId: player._id
            }],
            updatedAt: Date.now(),
        } as any);

        return { success: true };
    },
});

/**
 * Play a card
 */
export const playCard = mutation({
    args: {
        deviceId: v.string(),
        battleId: v.id("battles"),
        cardIndex: v.number(),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();
        if (!player) throw new Error("Player not found");

        const battle = await ctx.db.get(args.battleId);
        if (!battle) throw new Error("Battle not found");
        if (battle.status !== "active") throw new Error("Battle is not active");
        if (battle.currentTurnPlayerId !== player._id) throw new Error("Not your turn");

        const isP1 = battle.player1Id === player._id;
        const myHand = isP1 ? battle.state.p1Hand : battle.state.p2Hand;
        const myEnergy = isP1 ? battle.state.p1Energy : battle.state.p2Energy;

        if (args.cardIndex < 0 || args.cardIndex >= myHand.length) throw new Error("Invalid card index");

        const card = myHand[args.cardIndex];
        if (myEnergy < card.cost) throw new Error("Not enough energy");

        // Apply effects
        let p1Health = battle.state.p1Health;
        let p2Health = battle.state.p2Health;
        let logMsg = "";

        if (card.type === "attack") {
            const damage = card.damage || 0;
            if (isP1) {
                p2Health -= damage;
                logMsg = `${player.name} наносит ${damage} урона!`;
            } else {
                p1Health -= damage;
                logMsg = `${player.name} наносит ${damage} урона!`;
            }
        } else if (card.type === "heal") {
            const heal = card.heal || 0;
            if (isP1) {
                p1Health = Math.min(battle.state.p1MaxHealth, p1Health + heal);
                logMsg = `${player.name} лечится на ${heal}!`;
            } else {
                p2Health = Math.min(battle.state.p2MaxHealth, p2Health + heal);
                logMsg = `${player.name} лечится на ${heal}!`;
            }
        } else if (card.type === "defense") {
            // Simplified: defense just adds temp HP or reduces next damage (not implemented in MVP state yet)
            // For MVP let's just say it heals a bit or does nothing but log
            logMsg = `${player.name} встает в защитную стойку!`;
        }

        // Update state
        const newHand = [...myHand];
        newHand.splice(args.cardIndex, 1);
        const newDiscard = isP1 ? [...battle.state.p1Discard, card] : [...battle.state.p2Discard, card];

        // Check win condition
        let status: "waiting" | "active" | "finished" | "cancelled" = battle.status;
        let winnerId = battle.winnerId;

        if (p1Health <= 0) {
            status = "finished";
            winnerId = battle.player2Id;
            logMsg += " Игрок 1 повержен!";
        } else if (p2Health <= 0) {
            status = "finished";
            winnerId = battle.player1Id;
            logMsg += " Игрок 2 повержен!";
        }

        const updates: any = {
            logs: [...battle.logs, {
                message: logMsg,
                timestamp: Date.now(),
                actorId: player._id
            }],
            updatedAt: Date.now(),
            status,
            winnerId
        };

        if (isP1) {
            updates["state.p1Health"] = p1Health;
            updates["state.p2Health"] = p2Health;
            updates["state.p1Energy"] = myEnergy - card.cost;
            updates["state.p1Hand"] = newHand;
            updates["state.p1Discard"] = newDiscard;
        } else {
            updates["state.p1Health"] = p1Health;
            updates["state.p2Health"] = p2Health;
            updates["state.p2Energy"] = myEnergy - card.cost;
            updates["state.p2Hand"] = newHand;
            updates["state.p2Discard"] = newDiscard;
        }

        await ctx.db.patch(args.battleId, updates);
    }
});

/**
 * End turn
 */
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
        if (battle.status !== "active") throw new Error("Battle is not active");
        if (battle.currentTurnPlayerId !== player._id) throw new Error("Not your turn");

        const nextPlayerId = battle.player1Id === player._id ? battle.player2Id : battle.player1Id;
        if (!nextPlayerId) throw new Error("Next player not found");

        // Replenish energy and draw card for next player
        const isNextP1 = nextPlayerId === battle.player1Id;
        let deck = isNextP1 ? battle.state.p1Deck : battle.state.p2Deck;
        let hand = isNextP1 ? battle.state.p1Hand : battle.state.p2Hand;
        let discard = isNextP1 ? battle.state.p1Discard : battle.state.p2Discard;

        // Draw 1 card
        if (deck.length === 0) {
            // Reshuffle discard
            if (discard.length > 0) {
                deck = [...discard];
                // Shuffle
                for (let i = deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [deck[i], deck[j]] = [deck[j], deck[i]];
                }
                discard = [];
            }
        }

        const drawRes = drawCards(deck, hand, 1);

        const updates: any = {
            currentTurnPlayerId: nextPlayerId,
            logs: [...battle.logs, {
                message: `Ход переходит к следующему игроку`,
                timestamp: Date.now(),
                actorId: "system"
            }],
            updatedAt: Date.now()
        };

        if (isNextP1) {
            updates["state.p1Energy"] = MAX_ENERGY; // Reset energy to max
            updates["state.p1Deck"] = drawRes.newDeck;
            updates["state.p1Hand"] = drawRes.newHand;
            updates["state.p1Discard"] = discard;
        } else {
            updates["state.p2Energy"] = MAX_ENERGY;
            updates["state.p2Deck"] = drawRes.newDeck;
            updates["state.p2Hand"] = drawRes.newHand;
            updates["state.p2Discard"] = discard;
        }

        await ctx.db.patch(args.battleId, updates);
    }
});

/**
 * Get battle details
 */
export const getBattle = query({
    args: { battleId: v.id("battles") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.battleId);
    },
});

/**
 * Get active battles (Lobby)
 */
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
