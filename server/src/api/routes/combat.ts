import { Elysia, t } from "elysia";
import { db } from "../../db";
import { battles, battleParticipants, players, npcInstances, npcTemplates, behaviorTrees, gameProgress } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "../auth";
import { synthesizeCard, createMoveCard } from "../../services/combat/CardFactory";
import { BehaviorTreeRunner } from "../../services/ai/BehaviorTreeRunner";
import { RankSystem, RankEntity, WALL_SLAM_DAMAGE } from '../../services/combat/RankSystem';
import { DEFAULT_ENEMY_KEY, ENEMY_CATALOG, isEnemyKey, pickRandomEnemyKey } from "../../services/combat/enemyCatalog";
import { STARTING_SKILLS } from "../../lib/gameProgress";

// --- Constants & Helpers ---
const INITIAL_HP = 100;
const INITIAL_ENERGY = 10;
const MAX_ENERGY = 10;
const HAND_SIZE = 5;
const DEFAULT_SCENE_ID = 'prologue_coupe_start';

// Removing old BASIC_DECK if not needed for refactored system
const BASIC_DECK: any[] = [];

type AuthUser = { id: string; type: 'clerk' | 'guest' };

async function ensurePlayer(user: AuthUser) {
    const existing = await db.query.players.findFirst({
        where: user.type === 'clerk'
            ? eq(players.userId, user.id)
            : eq(players.deviceId, user.id)
    });

    if (existing) return existing;

    const now = Date.now();
    const [created] = await db.insert(players).values({
        userId: user.type === 'clerk' ? user.id : undefined,
        deviceId: user.type === 'guest' ? user.id : undefined,
        name: user.type === 'guest' ? `Guest-${user.id.slice(0, 4)}` : 'Wanderer',
        createdAt: now,
        updatedAt: now
    }).returning();

    await db.insert(gameProgress).values({
        playerId: created.id,
        currentScene: DEFAULT_SCENE_ID,
        visitedScenes: [],
        flags: {},
        skills: STARTING_SKILLS,
        level: 1,
        xp: 0,
        skillPoints: 0,
        phase: 1,
        reputation: {},
        updatedAt: now
    });

    return created;
}

function buildNpcTemplateValues(enemy: (typeof ENEMY_CATALOG)[keyof typeof ENEMY_CATALOG]) {
    const values: any = {
        name: enemy.name,
        faction: enemy.faction,
        archetype: enemy.archetype,
        maxHp: enemy.maxHp,
        maxStamina: enemy.maxStamina,
        maxMorale: enemy.maxMorale,
        aiBehaviorTreeId: enemy.behaviorTreeId,
        preferredRank: enemy.preferredRank,
    };

    if (typeof enemy.baseForce === 'number') values.baseForce = enemy.baseForce;
    if (typeof enemy.baseEndurance === 'number') values.baseEndurance = enemy.baseEndurance;
    if (typeof enemy.baseReflex === 'number') values.baseReflex = enemy.baseReflex;
    if (typeof enemy.baseLogic === 'number') values.baseLogic = enemy.baseLogic;
    if (typeof enemy.basePsyche === 'number') values.basePsyche = enemy.basePsyche;
    if (typeof enemy.baseAuthority === 'number') values.baseAuthority = enemy.baseAuthority;

    return values;
}

async function ensureEnemyTemplate(enemyKey: keyof typeof ENEMY_CATALOG) {
    const enemy = ENEMY_CATALOG[enemyKey];

    await db.insert(behaviorTrees).values({
        id: enemy.behaviorTreeId,
        tree: enemy.behaviorTree as any
    }).onConflictDoUpdate({ target: behaviorTrees.id, set: { tree: enemy.behaviorTree as any } });

    const existing = await db.query.npcTemplates.findFirst({ where: eq(npcTemplates.name, enemy.name) });
    const values = buildNpcTemplateValues(enemy);

    if (!existing) {
        const [created] = await db.insert(npcTemplates).values(values).returning();
        return { template: created, initialAmmo: enemy.initialAmmo };
    }

    await db.update(npcTemplates).set(values).where(eq(npcTemplates.id, existing.id));
    const updated = await db.query.npcTemplates.findFirst({ where: eq(npcTemplates.id, existing.id) });
    return { template: updated ?? existing, initialAmmo: enemy.initialAmmo };
}

function getInitialDeck() {
    const deck = [];
    // 3 Rusty Pipes
    for (let i = 0; i < 3; i++) {
        deck.push(synthesizeCard({
            name: "Rusty Pipe",
            baseDamage: 8,
            damageType: 'PHYSICAL',
            validRanks: [1, 2],
            baseAp: 1,
            baseStamina: 2,
            defaultEffects: [],
            condition: 100,
            heat: 0
        } as any, null, { voiceMight: 0, voiceTech: 0 }));
    }

    // 2 Moves
    deck.push(createMoveCard('ADVANCE'));
    deck.push(createMoveCard('RETREAT'));

    // Shuffle
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

function calculateEfficacy(card: any, currentRank: number): number {
    if (card.range && !card.range.includes(currentRank)) {
        return 0.6; // Penalty
    }
    return 1.0;
}

async function buildBattleResponse(battle: any, participant: any) {
    if (!battle || !participant) return null;

    const enemies = await db.select().from(npcInstances).where(eq(npcInstances.combatSessionId, String(battle.id)));
    const enemyStates = await Promise.all(enemies.map(async (e) => {
        const tpl = await db.query.npcTemplates.findFirst({ where: eq(npcTemplates.id, e.templateId!) });
        return {
            id: e.id,
            name: tpl?.name || "Unknown Enemy",
            hp: e.currentHp,
            maxHp: tpl?.maxHp || 100,
            rank: e.currentRank || 2,
            defense: 0,
            activeEffects: e.statusEffects || []
        }
    }));

    return {
        _id: String(battle.id),
        isActive: battle.status === 'active',
        status: battle.status,
        phase: battle.phase,
        turn: battle.round,
        turnOrder: battle.turnOrder,
        currentActorIndex: battle.currentActorIndex || 0,
        currentTurnActorId: battle.currentTurnActorId,

        playerState: {
            hp: participant.hp,
            maxHp: participant.maxHp,
            rank: participant.rank || 2,
            energy: participant.energy,
            maxEnergy: participant.maxEnergy,
            stamina: 10, maxStamina: 10,
            morale: 10, maxMorale: 10,
            weaponCondition: 100, weaponHeat: 0,
            currentAmmo: 10,
            jamState: { isJammed: false, jamChance: 0 },
            posture: 'neutral'
        },
        enemyStates,
        hand: participant.hand,
        logs: battle.logs || []
    };
}

// --- Routes ---
export const combatRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/combat", (app) =>
            app
                // GET /active - Get current active battle for player
                .get("/active", async ({ user }) => {
                    if (!user) return null;

                    const player = await ensurePlayer(user as AuthUser);

                    const activePart = await db.query.battleParticipants.findFirst({
                        where: eq(battleParticipants.playerId, player.id),
                        orderBy: (bp, { desc }) => [desc(bp.joinedAt)]
                    });

                    if (!activePart) return null;

                    const battle = await db.query.battles.findFirst({
                        where: eq(battles.id, activePart.battleId)
                    });

                    if (!battle) return null;

                    return buildBattleResponse(battle, activePart);
                })

                // GET /enemies - List available enemy variants
                .get("/enemies", async ({ user }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    return {
                        enemies: Object.values(ENEMY_CATALOG).map((enemy) => ({
                            key: enemy.key,
                            name: enemy.name,
                            faction: enemy.faction,
                            archetype: enemy.archetype,
                            maxHp: enemy.maxHp,
                            preferredRank: enemy.preferredRank,
                        }))
                    };
                })

                // POST /create
                .post("/create", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    const player = await ensurePlayer(user as AuthUser);

                    const requestedKey = (body as any)?.enemyKey;
                    const enemyKey =
                        requestedKey === 'random'
                            ? pickRandomEnemyKey()
                            : isEnemyKey(requestedKey)
                                ? requestedKey
                                : DEFAULT_ENEMY_KEY;

                    const now = Date.now();
                    const initialDeck = getInitialDeck();
                    const { newDeck, newHand } = drawCards(initialDeck, [], HAND_SIZE);

                    // Create Battle
                    const [battle] = await db.insert(battles).values({
                        hostId: player.id,
                        status: 'active',
                        phase: 'player_turn',
                        isActive: true,
                        round: 1,
                        currentTurnActorId: String(player.id),
                        currentActorIndex: 0,
                        turnOrder: [String(player.id)], // Enemies added later
                        enemies: [], // Deprecated JSON
                        logs: [{ message: `Battle started`, timestamp: now, actorId: 'system' }],
                        createdAt: now,
                        updatedAt: now
                    }).returning();

                    const { template, initialAmmo } = await ensureEnemyTemplate(enemyKey);

                    // Spawn NPC Instance
                    const [npc] = await db.insert(npcInstances).values({
                        templateId: template.id,
                        combatSessionId: String(battle.id),
                        currentHp: template.maxHp,
                        currentStamina: template.maxStamina,
                        currentMorale: template.maxMorale,
                        currentRank: template.preferredRank,
                        side: 'ENEMY',
                        ...(typeof initialAmmo === 'number' ? { ammoCount: initialAmmo } : {})
                    }).returning();

                    // Update Turn Order
                    const turnOrder = [String(player.id), npc.id];
                    await db.update(battles).set({ turnOrder }).where(eq(battles.id, battle.id));

                    await db.insert(battleParticipants).values({
                        battleId: battle.id,
                        playerId: player.id,
                        rank: 2,
                        hp: INITIAL_HP, maxHp: INITIAL_HP,
                        energy: INITIAL_ENERGY, maxEnergy: MAX_ENERGY,
                        deck: newDeck,
                        hand: newHand,
                        discard: [],
                        joinedAt: now
                    });

                    await db.update(battles)
                        .set({
                            logs: [...(battle.logs as any[]), { message: `Enemy encountered: ${template.name}`, timestamp: now, actorId: 'system' }],
                            updatedAt: now
                        })
                        .where(eq(battles.id, battle.id));

                    return { success: true, battleId: battle.id, enemyKey };
                }, {
                    body: t.Optional(t.Object({
                        enemyKey: t.Optional(t.String()),
                    }))
                })

                // POST /play
                .post("/play", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const { battleId, cardId, targetId } = body;

                    const player = await ensurePlayer(user as AuthUser);

                    const battle = await db.query.battles.findFirst({ where: eq(battles.id, Number(battleId)) });
                    if (!battle) return { error: "Invalid battle", status: 400 };
                    if (battle.status !== "active") return { error: "Battle not active", status: 400 };

                    if (battle.currentTurnActorId !== String(player.id)) return { error: "Not your turn", status: 400 };

                    const participant = await db.query.battleParticipants.findFirst({
                        where: and(eq(battleParticipants.battleId, battle.id), eq(battleParticipants.playerId, player.id))
                    });
                    if (!participant) return { error: "Not in battle", status: 404 };

                    const hand = participant.hand as any[];
                    const cardIndex = hand.findIndex(c => c.id === cardId);
                    if (cardIndex === -1) return { error: "Card not in hand", status: 400 };

                    const card = hand[cardIndex];
                    if ((participant.energy || 0) < card.cost) return { error: "Not enough energy", status: 400 };

                    const efficacy = calculateEfficacy(card, participant.rank);
                    let logMsg = `${player.name} uses ${card.name}`;

                    // Fetch Enemies
                    const enemies = await db.select().from(npcInstances).where(eq(npcInstances.combatSessionId, String(battle.id)));
                    let victory = false;

                    if (card.type === 'attack') {
                        const dmg = Math.floor(card.damage * efficacy);
                        // Default to first enemy if no target
                        const target = enemies.find(e => e.id === targetId) || enemies[0];

                        if (target) {
                            const newHp = Math.max(0, target.currentHp - dmg);
                            await db.update(npcInstances).set({ currentHp: newHp }).where(eq(npcInstances.id, target.id));

                            logMsg += ` dealing ${dmg} damage to ${target.id.substring(0, 4)}...`; // Ideally name
                            if (newHp === 0) logMsg += ` (Dead)`;
                        }
                    } else if (card.type === 'heal') {
                        const heal = Math.floor(card.heal * efficacy);
                        participant.hp = Math.min((participant.maxHp || 100), (participant.hp || 0) + heal);
                        logMsg += ` healing ${heal} HP`;
                    }

                    // Check Victory
                    const updatedEnemies = await db.select().from(npcInstances).where(eq(npcInstances.combatSessionId, String(battle.id)));
                    if (updatedEnemies.every(e => e.currentHp <= 0)) {
                        victory = true;
                        logMsg += " VICTORY!";
                    }

                    // Hand / Discard Logic
                    hand.splice(cardIndex, 1);
                    const discard = participant.discard as any[];
                    discard.push(card);

                    await db.transaction(async (tx) => {
                        await tx.update(battleParticipants)
                            .set({
                                hp: participant.hp,
                                energy: (participant.energy || 0) - card.cost,
                                hand: hand,
                                discard: discard
                            })
                            .where(eq(battleParticipants.id, participant.id));

                        await tx.update(battles)
                            .set({
                                status: victory ? 'finished' : 'active',
                                phase: victory ? 'victory' : 'player_turn',
                                isActive: !victory,
                                winnerId: victory ? 'players' : null,
                                logs: [...(battle.logs as any[]), { message: logMsg, timestamp: Date.now(), actorId: String(player.id) }],
                                updatedAt: Date.now()
                            })
                            .where(eq(battles.id, battle.id));
                    });

                    return { success: true };
                }, {
                    body: t.Object({ battleId: t.String(), cardId: t.String(), targetId: t.Optional(t.String()) })
                })

                // POST /endTurn
                .post("/endTurn", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const { battleId } = body;

                    const player = await ensurePlayer(user as AuthUser);

                    const battle = await db.query.battles.findFirst({ where: eq(battles.id, Number(battleId)) });
                    if (!battle || battle.status !== 'active') return { error: "Invalid battle", status: 400 };

                    const turnOrder = battle.turnOrder as string[];
                    const currentIndex = turnOrder.indexOf(battle.currentTurnActorId || "");
                    const nextIndex = (currentIndex + 1) % turnOrder.length;
                    const nextActorId = turnOrder[nextIndex];

                    let newRound = battle.round || 1;
                    if (nextIndex === 0) newRound++;

                    let logsToAdd = [];

                    // Enemy AI turn
                    // We need to check if nextActorId corresponds to an NPC instance.
                    // Since we use UUIDs for NPCs now, and player ID is int (casted to string),
                    // we can try to fetch from npcInstances.

                    const npcInstance = await db.query.npcInstances.findFirst({ where: eq(npcInstances.id, nextActorId) });
                    const participant = await db.query.battleParticipants.findFirst({
                        where: and(eq(battleParticipants.battleId, battle.id), eq(battleParticipants.playerId, player.id))
                    });

                    if (npcInstance && participant && participant.hp) {
                        // It is an NPC's turn.
                        // Load Template for BT ID
                        const template = await db.query.npcTemplates.findFirst({ where: eq(npcTemplates.id, npcInstance.templateId!) });

                        if (template) {
                            // Initialize BT Runner
                            // Load all enemies for RankSystem context
                            const allEnemies = await db.select().from(npcInstances).where(eq(npcInstances.combatSessionId, String(battle.id)));

                            const rankEntities: RankEntity[] = [
                                { id: String(player.id), currentRank: participant.rank || 2, side: 'PLAYER' },
                                ...allEnemies.filter(e => e.currentHp > 0).map(e => ({
                                    id: e.id,
                                    currentRank: e.currentRank || 2,
                                    side: 'ENEMY' as const
                                }))
                            ];
                            const rankSystem = new RankSystem(rankEntities);

                            // Fetch Behavior Tree
                            let aiTree = null;
                            if (template.aiBehaviorTreeId) {
                                const btRecord = await db.query.behaviorTrees.findFirst({ where: eq(behaviorTrees.id, template.aiBehaviorTreeId) });
                                if (btRecord) aiTree = btRecord.tree;
                            }

                            // Fallback Tree
                            const defaultTree = {
                                type: 'SELECTOR',
                                children: [
                                    {
                                        type: 'SEQUENCE',
                                        children: [
                                            { type: 'CONDITION', condition: 'IS_IN_RANGE', params: { idealRank: 1 } },
                                            { type: 'ACTION', action: 'ATTACK_CLOSEST', params: { damage: (template.baseForce || 5) * 2 } }
                                        ]
                                    },
                                    { type: 'ACTION', action: 'MOVE_TOWARDS_PLAYER' }
                                ]
                            };

                            const runner = new BehaviorTreeRunner({
                                npc: { ...npcInstance, template },
                                battle: battle,
                                targets: [participant],
                                rankSystem: rankSystem
                            });

                            await runner.run((aiTree || defaultTree) as any);
                            const actions = runner.getExecutedActions();

                            let dmg = 0;
                            let ammoSpent = 0;
                            let rangedAttacks = 0;

                            for (const action of actions) {
                                if (action.type === 'MOVE') {
                                    // Persist Movement
                                    await db.update(npcInstances)
                                        .set({ currentRank: action.params?.to })
                                        .where(eq(npcInstances.id, npcInstance.id));

                                    logsToAdd.push({
                                        message: `${template.name} moves to Rank ${action.params?.to}`,
                                        timestamp: action.timestamp,
                                        actorId: npcInstance.id
                                    });
                                }
                                if (action.type === 'ATTACK') {
                                    dmg += (action.params?.damage || 0);
                                    const ammoCost = action.params?.ammoCost ?? 0;
                                    if (ammoCost > 0) {
                                        ammoSpent += ammoCost;
                                        rangedAttacks += 1;
                                    }
                                }
                            }

                            const nextHp = Math.max(0, participant.hp - dmg);
                            const isDefeat = nextHp <= 0;

                            if (dmg > 0) {
                                const enemyLog = {
                                    message: `${template.name} ${rangedAttacks > 0 ? 'shoots' : 'attacks'} dealing ${dmg} damage!`,
                                    timestamp: Date.now(),
                                    actorId: npcInstance.id
                                };
                                logsToAdd.push(enemyLog);
                            }

                            if (isDefeat) {
                                logsToAdd.push({ message: 'DEFEAT', timestamp: Date.now(), actorId: 'system' });
                            }

                            await db.transaction(async (tx) => {
                                if (ammoSpent > 0) {
                                    const remainingAmmo = Math.max(0, (npcInstance.ammoCount ?? 0) - ammoSpent);
                                    await tx.update(npcInstances)
                                        .set({ ammoCount: remainingAmmo })
                                        .where(eq(npcInstances.id, npcInstance.id));

                                    if (remainingAmmo === 0) {
                                        logsToAdd.push({
                                            message: `${template.name} runs out of ammo!`,
                                            timestamp: Date.now(),
                                            actorId: npcInstance.id
                                        });
                                    }
                                }

                                await tx.update(battleParticipants)
                                    .set({ hp: nextHp })
                                    .where(eq(battleParticipants.id, participant.id));

                                await tx.update(battles)
                                    .set({
                                        currentTurnActorId: isDefeat ? battle.currentTurnActorId : String(player.id), // Pass back to player
                                        // Skip other enemies for this simplified turn-based (Player -> Enemy1 -> Player)
                                        // If we want Player -> Enemy1 -> Enemy2 -> Player, we shouldn't hardcode skip.
                                        // To keep it simple: Just advance to Next Index (which is this Enemy), then loop?
                                        // No, we are INSIDE the "endTurn" call initiated by PLAYER.
                                        // So Player turn ends -> Next is Enemy.
                                        // Enemy acts immediately (synchronous AI).
                                        // Then Turn passes to NEXT actor (could be Enemy 2 or Player).
                                        currentActorIndex: isDefeat ? currentIndex : (nextIndex + 1) % turnOrder.length, // crude loop
                                        round: newRound, // logic needs check
                                        status: isDefeat ? 'finished' : 'active',
                                        phase: isDefeat ? 'defeat' : 'player_turn',
                                        isActive: !isDefeat,
                                        winnerId: isDefeat ? 'enemies' : null,
                                        logs: [...(battle.logs as any[]), ...logsToAdd],
                                        updatedAt: Date.now()
                                    })
                                    .where(eq(battles.id, battle.id));
                            });

                            return { success: true, nextActorId: isDefeat ? null : String(player.id) };
                        }
                    }

                    // If next actor is NOT an NPC (e.g. PvP or just pass), just update pointer
                    await db.update(battles)
                        .set({
                            currentTurnActorId: nextActorId,
                            currentActorIndex: nextIndex,
                            round: newRound,
                            phase: nextActorId.startsWith('npc') || nextActorId.startsWith('enemy') ? 'enemy_turn' : 'player_turn',
                            logs: [...(battle.logs as any[]), { message: `Turn passes to ${nextActorId}`, timestamp: Date.now(), actorId: 'system' }],
                            updatedAt: Date.now()
                        })
                        .where(eq(battles.id, battle.id));

                    return { success: true, nextActorId };
                }, {
                    body: t.Object({ battleId: t.String() })
                })
        );
