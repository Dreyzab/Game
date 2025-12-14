import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { players, gameProgress, sceneLogs } from "../../db/schema";
import { auth } from "../auth";
import { awardXPAndLevelUp, mergeFlags, mergeReputation, needsSkillsNormalization, normalizeSkills, STARTING_SKILLS } from "../../lib/gameProgress";
import { awardItemsToPlayer } from "../../lib/itemAward";

const DEFAULT_SCENE_ID = 'prologue_coupe_start';

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

async function ensureProgress(playerId: number) {
    const existing = await db.query.gameProgress.findFirst({
        where: eq(gameProgress.playerId, playerId)
    });
    if (existing) {
        const patch: Partial<typeof existing> = {};
        if (!existing.visitedScenes) patch.visitedScenes = [];
        if (!existing.flags) patch.flags = {};
        if (!existing.skills || needsSkillsNormalization(existing.skills)) {
            patch.skills = normalizeSkills(existing.skills);
        }
        if ((existing as any).reputation === null || (existing as any).reputation === undefined) {
            (patch as any).reputation = {};
        }
        if (existing.phase === null || existing.phase === undefined) patch.phase = 1;

        if (Object.keys(patch).length > 0) {
            const [updated] = await db.update(gameProgress)
                .set({ ...patch, updatedAt: Date.now() })
                .where(eq(gameProgress.id, existing.id))
                .returning();
            return updated ?? { ...existing, ...patch };
        }
        return existing;
    }

    const now = Date.now();
    const [created] = await db.insert(gameProgress).values({
        playerId,
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
    }).returning();

    return created;
}

export const vnRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/vn", (app) =>
            app
                // GET /vn/state - current VN progress
                .get("/state", async ({ user }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    const player = await ensurePlayer(user as AuthUser);
                    const progress = await ensureProgress(player.id);

                    return {
                        progress: {
                            ...progress,
                            visitedScenes: progress.visitedScenes ?? [],
                            flags: progress.flags ?? {},
                            reputation: (progress as any).reputation ?? {},
                            skills: progress.skills ?? {},
                        }
                    };
                })

                // POST /vn/commit - commit scene results
                .post("/commit", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    const player = await ensurePlayer(user as AuthUser);
                    const progress = await ensureProgress(player.id);
                    const now = Date.now();

                    const visited = new Set<string>(progress.visitedScenes ?? []);
                    visited.add(body.sceneId);
                    body.payload.visitedScenes?.forEach((s: string) => visited.add(s));

                    const flags = mergeFlags(progress.flags, body.payload.addFlags, body.payload.removeFlags);
                    const reputation = mergeReputation((progress as any).reputation, body.payload.reputation);

                    const xpGain = body.payload.xpDelta ?? 0;
                    const xpResult = awardXPAndLevelUp(progress.level, progress.xp, progress.skillPoints, xpGain);

                    const nextPhase = Math.max(progress.phase ?? 1, body.payload.advancePhaseTo ?? progress.phase ?? 1);

                    await db.update(gameProgress)
                        .set({
                            currentScene: body.sceneId,
                            visitedScenes: Array.from(visited),
                            flags,
                            level: xpResult.level,
                            xp: xpResult.xp,
                            skillPoints: xpResult.skillPoints,
                            phase: nextPhase,
                            reputation,
                            updatedAt: now
                        })
                        .where(eq(gameProgress.id, progress.id));

                    // Выдаём предметы игроку, если есть
                    const awardedItems: Array<{ itemId: string; quantity: number; dbId?: string }> = [];
                    if (body.payload.items && body.payload.items.length > 0) {
                        const itemAwards = body.payload.items.map((item) => ({
                            itemId: item.itemId,
                            quantity: item.quantity ?? 1,
                        }));
                        
                        const results = await awardItemsToPlayer(player.id, itemAwards);
                        
                        for (const result of results) {
                            if (result.success) {
                                awardedItems.push({
                                    itemId: result.itemId,
                                    quantity: result.quantity,
                                    dbId: result.dbId,
                                });
                            } else {
                                console.warn(`[vn/commit] Failed to award item: ${result.itemId}`, result.error);
                            }
                        }
                    }

                    await db.insert(sceneLogs).values({
                        playerId: player.id,
                        userId: user.type === 'clerk' ? user.id : undefined,
                        deviceId: user.type === 'guest' ? user.id : undefined,
                        sceneId: body.sceneId,
                        choices: body.payload.choices ?? [],
                        payload: body.payload,
                        startedAt: body.payload.startedAt ?? now,
                        finishedAt: body.payload.finishedAt ?? now,
                        createdAt: now
                    });

                    return {
                        success: true,
                        progress: {
                            ...progress,
                            currentScene: body.sceneId,
                            visitedScenes: Array.from(visited),
                            flags,
                            level: xpResult.level,
                            xp: xpResult.xp,
                            skillPoints: xpResult.skillPoints,
                            phase: nextPhase,
                            reputation,
                            updatedAt: now
                        },
                        awardedItems,
                    };
                }, {
                    body: t.Object({
                        sceneId: t.String(),
                        payload: t.Object({
                            startedAt: t.Optional(t.Number()),
                            finishedAt: t.Optional(t.Number()),
                            visitedScenes: t.Optional(t.Array(t.String())),
                            choices: t.Optional(t.Array(t.Object({
                                sceneId: t.String(),
                                lineId: t.Optional(t.String()),
                                choiceId: t.String(),
                                effects: t.Optional(t.Any())
                            }))),
                            addFlags: t.Optional(t.Array(t.String())),
                            removeFlags: t.Optional(t.Array(t.String())),
                            xpDelta: t.Optional(t.Number()),
                            reputation: t.Optional(t.Record(t.String(), t.Number())),
                            quests: t.Optional(t.Array(t.String())),
                            items: t.Optional(t.Array(t.Object({
                                itemId: t.String(),
                                quantity: t.Optional(t.Number())
                            }))),
                            advancePhaseTo: t.Optional(t.Number())
                        })
                    })
                })

                // POST /vn/advice - log internal voice advice views
                .post("/advice", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const player = await ensurePlayer(user as AuthUser);
                    await ensureProgress(player.id);

                    const now = Date.now();

                    await db.insert(sceneLogs).values({
                        playerId: player.id,
                        userId: user.type === 'clerk' ? user.id : undefined,
                        deviceId: user.type === 'guest' ? user.id : undefined,
                        sceneId: body.sceneId,
                        choices: [],
                        payload: {
                            type: 'advice_viewed',
                            lineId: body.lineId,
                            characterId: body.characterId,
                            choiceContext: body.choiceContext,
                            skillLevel: body.skillLevel,
                            viewOrder: body.viewOrder
                        },
                        startedAt: now,
                        finishedAt: now,
                        createdAt: now
                    });

                    return { success: true, timestamp: now };
                }, {
                    body: t.Object({
                        sceneId: t.String(),
                        lineId: t.String(),
                        characterId: t.String(),
                        choiceContext: t.Array(t.String()),
                        skillLevel: t.Number(),
                        viewOrder: t.Number(),
                    })
                })
        );
