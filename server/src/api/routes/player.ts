import { Elysia, t } from "elysia";
import { db } from "../../db";
import { players, gameProgress, quests } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "../auth";
import { needsSkillsNormalization, normalizeSkills, STARTING_SKILLS } from "../../lib/gameProgress";
import { deriveOnboardingSkills, ONBOARDING_SKILLS_APPLIED_FLAG } from "../../lib/onboarding";
import { randomBytes, scryptSync } from "node:crypto";
import { resetSelf } from "../../services/playerReset";

const DEFAULT_SCENE_ID = 'prologue_coupe_start';
const NICKNAME_FLAG = 'nickname_set';
const CITY_REGISTERED_FLAG = 'city_registered';
const REGISTERED_VIA_CLERK_FLAG = 'registered_via_clerk';
const REGISTERED_VIA_PASSWORD_FLAG = 'registered_via_password';
const MAX_PLAYER_NAME_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const SAFE_SCENE_ID_RE = /^[a-z0-9_-]+$/i;

type PlayerRow = typeof players.$inferSelect;
type PublicPlayer = Omit<PlayerRow, "passwordHash" | "passwordSalt">;

function toPublicPlayer(player: PlayerRow | null): PublicPlayer | null {
    if (!player) return null;
    const { passwordHash: _hash, passwordSalt: _salt, ...rest } = player;
    return rest;
}

function normalizePlayerName(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.length > MAX_PLAYER_NAME_LENGTH) return null;
    return trimmed;
}

function normalizePassword(raw: unknown): string | null {
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.length < MIN_PASSWORD_LENGTH) return null;
    if (trimmed.length > MAX_PASSWORD_LENGTH) return null;
    return trimmed;
}

function normalizeSceneId(raw: unknown): string | null {
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (!SAFE_SCENE_ID_RE.test(trimmed)) return null;
    if (trimmed.length > 128) return null;
    return trimmed;
}

function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return { salt, hash };
}

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

                    const questCountRows = await db
                        .select({ count: sql<number>`count(*)` })
                        .from(quests)
                        .where(eq(quests.isActive, true));
                    const totalQuests = Number(questCountRows[0]?.count ?? 0);

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

                    return { player: toPublicPlayer(player), progress, totalQuests };
                })

                .post("/init", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    const desiredName = normalizePlayerName(body?.name);

                    // Check existence
                    let player = await db.query.players.findFirst({
                        where: user.type === 'clerk'
                            ? eq(players.userId, user.id)
                            : eq(players.deviceId, user.id)
                    });

                    if (player) {
                        const now = Date.now();

                        // Ensure progress exists for legacy records.
                        let progress = await db.query.gameProgress.findFirst({
                            where: eq(gameProgress.playerId, player.id)
                        });

                        if (!progress) {
                            await db.insert(gameProgress).values({
                                playerId: player.id,
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
                            progress = await db.query.gameProgress.findFirst({
                                where: eq(gameProgress.playerId, player.id)
                            });
                        }

                        if (desiredName && desiredName !== player.name) {
                            const [updatedPlayer] = await db.update(players)
                                .set({ name: desiredName, updatedAt: now })
                                .where(eq(players.id, player.id))
                                .returning();
                            player = updatedPlayer ?? player;
                        }

                        if (desiredName && progress) {
                            const currentFlags = (progress.flags as Record<string, unknown> | null) ?? {};
                            const nextFlags = { ...currentFlags, [NICKNAME_FLAG]: true } as Record<string, unknown>;

                            // Do not accidentally auto-register by setting the nickname.
                            if (nextFlags[CITY_REGISTERED_FLAG] === true) {
                                // ok
                            }

                            await db.update(gameProgress)
                                .set({ flags: nextFlags as any, updatedAt: now })
                                .where(eq(gameProgress.id, progress.id));
                        }

                        return { player: toPublicPlayer(player), created: false };
                    }

                    // Create Player
                    const [newPlayer] = await db.insert(players).values({
                        userId: user.type === 'clerk' ? user.id : undefined,
                        deviceId: user.type === 'guest' ? user.id : undefined,
                        name: desiredName ?? (user.type === 'guest' ? `Guest-${user.id.slice(0, 4)}` : "Wanderer"),
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    }).returning();

                    // Create Progress
                    const initialFlags: Record<string, unknown> = desiredName ? { [NICKNAME_FLAG]: true } : {};
                    await db.insert(gameProgress).values({
                        playerId: newPlayer.id,
                        currentScene: DEFAULT_SCENE_ID,
                        visitedScenes: [],
                        flags: initialFlags as any,
                        skills: STARTING_SKILLS,
                        level: 1,
                        xp: 0,
                        skillPoints: 0,
                        phase: 1,
                        reputation: {},
                        updatedAt: Date.now()
                    });

                    return { player: toPublicPlayer(newPlayer), created: true };
                 }, {
                     body: t.Object({
                         name: t.Optional(t.String()) // Optional explicit name
                     })
                 })

                // POST /player/city-registration - finalize onboarding registration (clerk/password)
                .post("/city-registration", async ({ user, body, headers }) => {
                    if (!user) {
                        return { success: false, error: "Unauthorized", status: 401 };
                    }

                    const method = body?.method;
                    if (method !== "clerk" && method !== "password") {
                        return { success: false, error: "Invalid method", status: 400 };
                    }

                    const desiredName = normalizePlayerName(body?.nickname);
                    const desiredScene = normalizeSceneId(body?.returnScene);
                    const password = method === "password" ? normalizePassword(body?.password) : null;

                    if (method === "password" && !password) {
                        return {
                            success: false,
                            error: `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters`,
                            status: 400,
                        };
                    }

                    const now = Date.now();
                    const deviceIdHeader = headers["x-device-id"];

                    const findPlayerByUser = async () =>
                        db.query.players.findFirst({
                            where: user.type === "clerk"
                                ? eq(players.userId, user.id)
                                : eq(players.deviceId, user.id),
                        });

                    const ensureProgressForPlayer = async (playerId: number) => {
                        let progress = await db.query.gameProgress.findFirst({
                            where: eq(gameProgress.playerId, playerId),
                        });

                        if (!progress) {
                            await db.insert(gameProgress).values({
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
                                updatedAt: now,
                            });

                            progress = await db.query.gameProgress.findFirst({
                                where: eq(gameProgress.playerId, playerId),
                            });
                        }

                        if (!progress) {
                            return null;
                        }

                        // Ensure defaults for legacy records.
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
                                .set({ ...patch, updatedAt: now })
                                .where(eq(gameProgress.id, progress.id))
                                .returning();
                            progress = updated ?? { ...progress, ...patch };
                        }

                        return progress;
                    };

                    let player = null as Awaited<ReturnType<typeof findPlayerByUser>> | null;

                    if (method === "clerk") {
                        if (user.type !== "clerk") {
                            return { success: false, error: "Clerk sign-in required", status: 401 };
                        }

                        if (typeof deviceIdHeader !== "string" || !deviceIdHeader.trim()) {
                            return { success: false, error: "Missing x-device-id for linking", status: 400 };
                        }

                        const guestPlayer = await db.query.players.findFirst({
                            where: eq(players.deviceId, deviceIdHeader),
                        });

                        const clerkPlayer = await db.query.players.findFirst({
                            where: eq(players.userId, user.id),
                        });

                        if (guestPlayer && clerkPlayer && guestPlayer.id !== clerkPlayer.id) {
                            return {
                                success: false,
                                error: "This Clerk account already has another character. Linking is not supported yet.",
                                status: 409,
                            };
                        }

                        player = guestPlayer ?? clerkPlayer ?? null;

                        if (!player) {
                            const [created] = await db.insert(players).values({
                                userId: user.id,
                                name: desiredName ?? "Wanderer",
                                createdAt: now,
                                updatedAt: now,
                            }).returning();
                            player = created ?? null;
                        } else if (player.userId !== user.id) {
                            const [updated] = await db.update(players)
                                .set({ userId: user.id, updatedAt: now })
                                .where(eq(players.id, player.id))
                                .returning();
                            player = updated ?? player;
                        }
                    } else {
                        player = await findPlayerByUser();
                    }

                    if (!player) {
                        return { success: false, error: "Player not found", status: 404 };
                    }

                    const playerId = player.id;

                    const progress = await ensureProgressForPlayer(player.id);
                    if (!progress) {
                        return { success: false, error: "Progress not found", status: 404 };
                    }

                    const currentFlags = (progress.flags as Record<string, unknown> | null) ?? {};
                    const nextFlags: Record<string, unknown> = { ...currentFlags };

                    const currentName = player.name;
                    const nextName = desiredName ?? currentName;

                    if (method === "password") {
                        // Enforce nickname uniqueness among password-registered accounts.
                        const candidates = await db.query.players.findMany({
                            where: eq(players.name, nextName),
                            limit: 20,
                        });
                        const conflict = candidates.find(
                            (candidate) => candidate.id !== playerId && typeof candidate.passwordHash === "string" && candidate.passwordHash.length > 0,
                        );
                        if (conflict) {
                            return {
                                success: false,
                                error: "Nickname is already taken for password registration. Choose another.",
                                status: 409,
                            };
                        }
                    }

                    if (desiredName && desiredName !== currentName) {
                        const [updated] = await db.update(players)
                            .set({ name: desiredName, updatedAt: now })
                            .where(eq(players.id, player.id))
                            .returning();
                        player = updated ?? player;
                    }

                    if (method === "password" && password) {
                        const { salt, hash } = hashPassword(password);
                        const [updated] = await db.update(players)
                            .set({ passwordHash: hash, passwordSalt: salt, updatedAt: now })
                            .where(eq(players.id, player.id))
                            .returning();
                        player = updated ?? player;
                    }

                    nextFlags[NICKNAME_FLAG] = true;
                    nextFlags[CITY_REGISTERED_FLAG] = true;

                    if (method === "clerk") {
                        nextFlags[REGISTERED_VIA_CLERK_FLAG] = true;
                        delete nextFlags[REGISTERED_VIA_PASSWORD_FLAG];
                    } else {
                        nextFlags[REGISTERED_VIA_PASSWORD_FLAG] = true;
                        delete nextFlags[REGISTERED_VIA_CLERK_FLAG];
                    }

                    const shouldApplySkills = nextFlags[ONBOARDING_SKILLS_APPLIED_FLAG] !== true;
                    const baseSkills = (progress.skills as Record<string, unknown> | null) ?? STARTING_SKILLS;
                    const nextSkills = shouldApplySkills
                        ? deriveOnboardingSkills(nextFlags, baseSkills)
                        : normalizeSkills(baseSkills);

                    if (shouldApplySkills) {
                        nextFlags[ONBOARDING_SKILLS_APPLIED_FLAG] = true;
                    }

                    const patch: Record<string, unknown> = {
                        flags: nextFlags as any,
                        skills: nextSkills as any,
                        updatedAt: now,
                    };

                    if (desiredScene) {
                        patch.currentScene = desiredScene;
                    }

                    const [updatedProgress] = await db.update(gameProgress)
                        .set(patch as any)
                        .where(eq(gameProgress.id, progress.id))
                        .returning();

                    return {
                        success: true,
                        player: toPublicPlayer(player),
                        progress: updatedProgress ?? progress,
                    };
                }, {
                    body: t.Object({
                        method: t.Union([t.Literal("clerk"), t.Literal("password")]),
                        nickname: t.Optional(t.String()),
                        password: t.Optional(t.String()),
                        returnScene: t.Optional(t.String()),
                    })
                })

                .post("/reset-self", async ({ user }) => {
                    if (!user) return { ok: false, error: "Unauthorized", status: 401 };

                    const player = await db.query.players.findFirst({
                        where: user.type === 'clerk'
                            ? eq(players.userId, user.id)
                            : eq(players.deviceId, user.id)
                    });

                    if (!player) {
                        return { ok: true, reset: false };
                    }

                    const result = await resetSelf(user as any, player.id);
                    return { ok: true, reset: true, result };
                })
         );
