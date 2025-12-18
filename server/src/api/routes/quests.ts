import { Elysia, t } from "elysia";
import { db } from "../../db";
import { quests, questProgress, players, gameProgress } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "../auth";
import { STARTING_SKILLS } from "../../lib/gameProgress";

const DEFAULT_SCENE_ID = 'prologue_coupe_start';

type AuthUser = { id: string; type: 'clerk' | 'guest' };

async function ensurePlayer(user: AuthUser) {
    const existing = await db.query.players.findFirst({
        where: user.type === 'clerk'
            ? eq(players.userId, user.id)
            : eq(players.deviceId, user.id)
    });

    if (existing) {
        const existingProgress = await db.query.gameProgress.findFirst({
            where: eq(gameProgress.playerId, existing.id)
        });
        if (!existingProgress) {
            const now = Date.now();
            await db.insert(gameProgress).values({
                playerId: existing.id,
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
        }

        return existing;
    }

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

export const questsRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/quests", (app) =>
            app
                // GET /quests - Get all quests state (active, available, completed)
                .get("/", async ({ user }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const player = await ensurePlayer(user as AuthUser);

                    // 1. Fetch Player's Progress
                    const allProgress = await db.query.questProgress.findMany({
                        where: eq(questProgress.playerId, player.id)
                    });

                    const activeIds = new Set<string>();
                    const completedIds = new Set<string>();

                    const activeList = [];
                    const completedList = [];

                    for (const p of allProgress) {
                        const qDef = await db.query.quests.findFirst({ where: eq(quests.id, p.questId) });
                        if (!qDef) continue;

                        if (p.status === 'completed') {
                            completedIds.add(p.questId);
                            completedList.push({
                                id: p.questId,
                                title: qDef.title,
                                status: 'completed',
                                completedAt: p.completedAt
                            });
                        } else if (p.status === 'active') {
                            activeIds.add(p.questId);
                            activeList.push({
                                id: p.questId,
                                title: qDef.title,
                                description: qDef.description,
                                status: 'active',
                                currentStep: p.currentStep,
                                progress: p.progress,
                                steps: qDef.steps
                            });
                        }
                    }

                    // 2. Determine Available Quests
                    // Logic: Is Active in DB? Prerequisites met? Not already started/completed?
                    // Fetch all active quests from DB definitions
                    const allQuests = await db.query.quests.findMany({
                        where: eq(quests.isActive, true)
                    });

                    const availableList = [];
                    for (const q of allQuests) {
                        if (activeIds.has(q.id) || completedIds.has(q.id)) continue;

                        // Check Prerequisites
                        const prereqs = q.prerequisites as string[] || [];
                        const unmet = prereqs.some(reqId => !completedIds.has(reqId));
                        if (unmet) continue;

                        availableList.push({
                            id: q.id,
                            title: q.title,
                            description: q.description,
                            recommendedLevel: q.phase
                        });
                    }

                    return {
                        active: activeList,
                        completed: completedList,
                        available: availableList
                    };
                })

                // POST /quests/start
                .post("/start", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const { questId } = body;

                    // Resolve Player
                    const player = await ensurePlayer(user as AuthUser);

                    // Check Quest Def
                    const qDef = await db.query.quests.findFirst({ where: eq(quests.id, questId) });
                    if (!qDef || !qDef.isActive) return { error: "Quest unavailable", status: 400 };

                    // Check Existing
                    const existing = await db.query.questProgress.findFirst({
                        where: and(eq(questProgress.playerId, player.id), eq(questProgress.questId, questId))
                    });
                    if (existing) return { error: "Quest already started/completed", status: 400 };

                    // Start
                    const [newProg] = await db.insert(questProgress).values({
                        playerId: player.id,
                        userId: user.id, // storing auth ID for backup
                        questId: questId,
                        currentStep: (qDef.steps as any[])?.[0]?.id || 'start',
                        status: 'active',
                        startedAt: Date.now(),
                        progress: 0
                    }).returning();

                    return { started: true, questId };
                }, {
                    body: t.Object({ questId: t.String() })
                })

                // POST /quests/update (generic update for steps)
                .post("/update", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const { questId, status, progress, currentStep } = body;

                    const player = await ensurePlayer(user as AuthUser);

                    const existing = await db.query.questProgress.findFirst({
                        where: and(eq(questProgress.playerId, player.id), eq(questProgress.questId, questId))
                    });
                    if (!existing) return { error: "Quest not active", status: 404 };

                    await db.update(questProgress)
                        .set({
                            status: status as any, // 'active' | 'completed' | 'failed'
                            progress: progress,
                            currentStep: currentStep,
                            completedAt: status === 'completed' ? Date.now() : undefined
                        })
                        .where(eq(questProgress.id, existing.id));

                    return { success: true };
                }, {
                    body: t.Object({
                        questId: t.String(),
                        status: t.Optional(t.String()),
                        progress: t.Optional(t.Any()),
                        currentStep: t.Optional(t.String())
                    })
                })
        );
