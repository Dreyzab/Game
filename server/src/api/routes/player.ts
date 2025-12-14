import { Elysia, t } from "elysia";
import { db } from "../../db";
import { players, gameProgress } from "../../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../auth";
import { needsSkillsNormalization, normalizeSkills, STARTING_SKILLS } from "../../lib/gameProgress";

const DEFAULT_SCENE_ID = 'prologue_coupe_start';

export const playerRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/player", (app) =>
            app
                .get("/", async ({ user }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    // Find player by userId (Clerk) or deviceId (Guest)
                    let player = await db.query.players.findFirst({
                        where: user.type === 'clerk'
                            ? eq(players.userId, user.id)
                            : eq(players.deviceId, user.id)
                    });

                    if (!player) {
                        // Return null to let frontend decide or call /init
                        return { player: null };
                    }

                    // Fetch progress
                    let progress = await db.query.gameProgress.findFirst({
                        where: eq(gameProgress.playerId, player.id)
                    });

                    // Ensure defaults + canonical skill ids for existing saves
                    if (progress) {
                        const patch: Partial<typeof progress> = {};
                        if (!progress.visitedScenes) patch.visitedScenes = [];
                        if (!progress.flags) patch.flags = {};
                        if (!progress.skills || needsSkillsNormalization(progress.skills)) {
                            patch.skills = normalizeSkills(progress.skills);
                        }
                        if ((progress as any).reputation === null || (progress as any).reputation === undefined) {
                            (patch as any).reputation = {};
                        }
                        if (progress.phase === null || progress.phase === undefined) patch.phase = 1;

                        if (Object.keys(patch).length > 0) {
                            const [updated] = await db.update(gameProgress)
                                .set({ ...patch, updatedAt: Date.now() })
                                .where(eq(gameProgress.id, progress.id))
                                .returning();
                            progress = updated ?? { ...progress, ...patch };
                        }
                    }

                    return { player, progress };
                })

                .post("/init", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    // Check existence
                    let player = await db.query.players.findFirst({
                        where: user.type === 'clerk'
                            ? eq(players.userId, user.id)
                            : eq(players.deviceId, user.id)
                    });

                    if (player) return { player, created: false };

                    // Create Player
                    const [newPlayer] = await db.insert(players).values({
                        userId: user.type === 'clerk' ? user.id : undefined,
                        deviceId: user.type === 'guest' ? user.id : undefined,
                        name: user.type === 'guest' ? `Guest-${user.id.slice(0, 4)}` : "Wanderer",
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    }).returning();

                    // Create Progress
                    await db.insert(gameProgress).values({
                        playerId: newPlayer.id,
                        currentScene: DEFAULT_SCENE_ID,
                        visitedScenes: [],
                        flags: {},
                        skills: STARTING_SKILLS,
                        level: 1,
                        xp: 0,
                        skillPoints: 0,
                        phase: 1,
                        reputation: {},
                        updatedAt: Date.now()
                    });

                    return { player: newPlayer, created: true };
                }, {
                    body: t.Object({
                        name: t.Optional(t.String()) // Optional explicit name
                    })
                })
        );
