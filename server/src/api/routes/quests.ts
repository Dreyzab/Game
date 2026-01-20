import { Elysia, t } from "elysia";
import { db } from "../../db";
import { quests, questProgress, players, gameProgress } from "../../db/schema";
import { eq, and, inArray } from "drizzle-orm";
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
                stateVersion: 1,
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
        stateVersion: 1,
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

                    const allProgress = await db.query.questProgress.findMany({
                        where: eq(questProgress.playerId, player.id)
                    });

                    const progressQuestIds = allProgress.map((progress) => progress.questId);
                    const questDefs = progressQuestIds.length > 0
                        ? await db.query.quests.findMany({ where: inArray(quests.id, progressQuestIds) })
                        : [];
                    const questDefById = new Map(questDefs.map((def) => [def.id, def]));

                    const activeIds = new Set<string>();
                    const completedIds = new Set<string>();
                    const startedIds = new Set<string>();

                    const activeList = [];
                    const completedList = [];

                    for (const progress of allProgress) {
                        startedIds.add(progress.questId);

                        const questDef = questDefById.get(progress.questId);
                        const status = progress.status ?? 'active';
                        const entry = {
                            id: progress.questId,
                            title: questDef?.title ?? progress.questId,
                            description: questDef?.description ?? undefined,
                            status,
                            startedAt: progress.startedAt ?? undefined,
                            completedAt: progress.completedAt ?? undefined,
                            abandonedAt: (progress as any).abandonedAt ?? undefined,
                            failedAt: (progress as any).failedAt ?? undefined,
                            currentStep: progress.currentStep ?? undefined,
                            progress: typeof progress.progress === 'number' ? progress.progress : undefined,
                            steps: questDef?.steps ?? undefined,
                            phase: questDef?.phase ?? undefined,
                            recommendedLevel: questDef?.phase ?? undefined,
                        };

                        if (status === 'active') {
                            activeIds.add(progress.questId);
                            activeList.push(entry);
                        } else {
                            if (status === 'completed') {
                                completedIds.add(progress.questId);
                            }
                            completedList.push(entry);
                        }
                    }

                    const allQuests = await db.query.quests.findMany({
                        where: eq(quests.isActive, true)
                    });

                    const availableList = [];
                    for (const quest of allQuests) {
                        if (startedIds.has(quest.id)) continue;

                        const prereqs = (quest.prerequisites as string[]) || [];
                        const unmet = prereqs.some((reqId) => !completedIds.has(reqId));
                        if (unmet) continue;

                        availableList.push({
                            id: quest.id,
                            title: quest.title,
                            description: quest.description,
                            phase: quest.phase ?? undefined,
                            recommendedLevel: quest.phase ?? undefined,
                            steps: quest.steps ?? undefined,
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

                    // Upsert with conflict handling (race protection)
                    const [newProg] = await db.insert(questProgress).values({
                        playerId: player.id,
                        userId: user.id, // storing auth ID for backup
                        questId: questId,
                        currentStep: (qDef.steps as any[])?.[0]?.id || 'start',
                        status: 'active',
                        startedAt: Date.now(),
                        progress: 0
                    })
                        .onConflictDoNothing()
                        .returning();

                    if (!newProg) {
                        return { error: "Quest already started/completed", status: 400 };
                    }

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

                    const updatePatch: Record<string, unknown> = {};
                    const now = Date.now();

                    if (typeof status === 'string') {
                        if (!['active', 'completed', 'abandoned', 'failed'].includes(status)) {
                            return { error: "Invalid status", status: 400 };
                        }
                        updatePatch.status = status;
                        if (status === 'completed') {
                            updatePatch.completedAt = now;
                            updatePatch.failedAt = null;
                            updatePatch.abandonedAt = null;
                        } else if (status === 'failed') {
                            updatePatch.failedAt = now;
                            updatePatch.completedAt = null;
                            updatePatch.abandonedAt = null;
                        } else if (status === 'abandoned') {
                            updatePatch.abandonedAt = now;
                            updatePatch.completedAt = null;
                            updatePatch.failedAt = null;
                        } else if (status === 'active') {
                            updatePatch.completedAt = null;
                            updatePatch.failedAt = null;
                            updatePatch.abandonedAt = null;
                        }
                    }

                    if (progress !== undefined) {
                        updatePatch.progress = progress;
                    }
                    if (currentStep !== undefined) {
                        updatePatch.currentStep = currentStep;
                    }

                    if (Object.keys(updatePatch).length === 0) {
                        return { success: true };
                    }

                    await db.update(questProgress)
                        .set(updatePatch)
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
