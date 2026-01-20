import { Elysia, t } from "elysia";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db";
import { players, gameProgress, sceneLogs, vnSessions, vnCommits, questProgress, quests } from "../../db/schema";
import { auth } from "../auth";
import {
    generateSessionId,
    generateSeed,
    hashSnapshot,
    getSessionExpiry,
    signSessionToken,
    verifySessionToken,
    type SessionTokenPayload,
} from "../../lib/sessionCrypto";
import {
    awardXPAndLevelUp,
    LEGACY_SKILL_ID_MAP,
    mergeFlags,
    mergeReputation,
    needsSkillsNormalization,
    normalizeSkills,
    STARTING_SKILLS,
} from "../../lib/gameProgress";
import { awardItemsToPlayer } from "../../lib/itemAward";
import { hasItemTemplate } from "../../lib/itemTemplates";
import { calculateMaxResources } from "../../shared/lib/stats";

const DEFAULT_SCENE_ID = 'prologue_coupe_start';

const SAFE_ID_RE = /^[a-z0-9_-]+$/i;
const SAFE_FLAG_RE = /^[a-z0-9_:-]+$/i;

const MAX_FLAGS_PER_COMMIT = 50;
const MAX_ITEMS_PER_COMMIT = 10;
const MAX_ITEM_QUANTITY = 50;
const MAX_XP_DELTA = 500;
const MAX_SKILL_DELTA_PER_COMMIT = 10;
const MAX_SKILL_VALUE = 100;
const MAX_HP_DELTA_PER_COMMIT = 50;
const MAX_REPUTATION_ENTRIES = 20;
const MAX_REPUTATION_DELTA = 100;
const MAX_DECISION_LOG_ENTRIES = 500;
const MAX_QUEST_PROGRESS = 1000;
const MAX_QUEST_PROGRESS_DELTA = 1000;
const SESSION_DEFAULT_OPS = [
    'choice',
    'battle',
    'quest_start',
    'quest_progress',
    'quest_complete',
    'quest_fail',
    'quest_abandon',
];

type AuthUser = { id: string; type: 'clerk' | 'guest' };

function clampInt(value: unknown, min: number, max: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return min;
    const rounded = Math.trunc(value);
    return Math.max(min, Math.min(max, rounded));
}

function isSafeId(value: string): boolean {
    return value.length > 0 && value.length <= 128 && SAFE_ID_RE.test(value);
}

function clampSkillValue(value: number): number {
    return Math.max(0, Math.min(MAX_SKILL_VALUE, Math.trunc(value)));
}



function applyHpDeltasFromChoices(
    baseHpRaw: unknown,
    maxHp: number,
    choices: Array<{ effects: unknown }>
): { hp: number } {
    let hp = typeof baseHpRaw === 'number' && Number.isFinite(baseHpRaw)
        ? Math.max(0, Math.min(maxHp, Math.trunc(baseHpRaw)))
        : maxHp;

    for (const choice of choices) {
        const effects = (choice as any)?.effects;
        if (!Array.isArray(effects)) continue;

        for (const effect of effects) {
            if (!effect || typeof effect !== "object") continue;

            // Support: { type: 'immediate', action: 'hp_delta', data: { amount: -5 } }
            if ((effect as any).type === "immediate" && (effect as any).action === "hp_delta") {
                const data = (effect as any).data ?? {};
                const amountRaw = (data as any).amount;
                const delta = clampInt(amountRaw, -MAX_HP_DELTA_PER_COMMIT, MAX_HP_DELTA_PER_COMMIT);
                if (delta === 0) continue;
                hp = Math.max(0, Math.min(maxHp, hp + delta));
                continue;
            }

            // Optional support: { type: 'stat_modifier', stat: 'hp', delta: -5 }
            if ((effect as any).type === "stat_modifier") {
                const statRaw = typeof (effect as any).stat === "string" ? (effect as any).stat.trim() : "";
                if (statRaw !== 'hp' && statRaw !== 'health') continue;
                const delta = clampInt((effect as any).delta, -MAX_HP_DELTA_PER_COMMIT, MAX_HP_DELTA_PER_COMMIT);
                if (delta === 0) continue;
                hp = Math.max(0, Math.min(maxHp, hp + delta));
            }
        }
    }

    return { hp };
}

function applySkillDeltasFromChoices(
    baseSkills: Record<string, number>,
    choices: Array<{ effects: unknown }>
): Record<string, number> {
    const next = { ...baseSkills };

    for (const choice of choices) {
        const effects = (choice as any)?.effects;
        if (!Array.isArray(effects)) continue;

        for (const effect of effects) {
            if (!effect || typeof effect !== "object") continue;

            // Support: { type: 'immediate', action: 'skill_boost', data: { skillId, amount } }
            if ((effect as any).type === "immediate" && (effect as any).action === "skill_boost") {
                const data = (effect as any).data ?? {};
                const skillIdRaw = typeof data.skillId === "string" ? data.skillId.trim() : "";
                const amountRaw = data.amount;
                if (!skillIdRaw || !isSafeId(skillIdRaw)) continue;
                const skillId = LEGACY_SKILL_ID_MAP[skillIdRaw] ?? skillIdRaw;
                const delta = clampInt(amountRaw, -MAX_SKILL_DELTA_PER_COMMIT, MAX_SKILL_DELTA_PER_COMMIT);
                if (delta === 0) continue;
                next[skillId] = clampSkillValue((next[skillId] ?? 0) + delta);
                continue;
            }

            // Support: { type: 'stat_modifier', stat: 'knowledge', delta: 2 } or { stat: 'skill:knowledge', delta: 2 } (legacy: 'analysis')
            if ((effect as any).type === "stat_modifier") {
                const statRaw = typeof (effect as any).stat === "string" ? (effect as any).stat.trim() : "";
                const deltaRaw = (effect as any).delta;
                const delta = clampInt(deltaRaw, -MAX_SKILL_DELTA_PER_COMMIT, MAX_SKILL_DELTA_PER_COMMIT);
                if (!statRaw || delta === 0) continue;

                const skillIdRaw = statRaw.startsWith("skill:") ? statRaw.slice("skill:".length) : statRaw;
                if (!skillIdRaw || !isSafeId(skillIdRaw)) continue;
                if (skillIdRaw === "xp") continue;

                const skillId = LEGACY_SKILL_ID_MAP[skillIdRaw] ?? skillIdRaw;

                next[skillId] = clampSkillValue((next[skillId] ?? 0) + delta);
            }
        }
    }

    return next;
}

function sanitizeStringArray(
    values: unknown,
    options: { max: number; pattern?: RegExp; maxLen?: number } = { max: 50 }
): string[] {
    if (!Array.isArray(values)) return [];

    const { max, pattern, maxLen = 128 } = options;
    const out: string[] = [];

    for (const raw of values) {
        if (out.length >= max) break;
        if (typeof raw !== 'string') continue;
        const value = raw.trim();
        if (!value) continue;
        if (value.length > maxLen) continue;
        if (pattern && !pattern.test(value)) continue;
        out.push(value);
    }

    return out;
}

function sanitizeReputation(incoming: unknown): Record<string, number> | undefined {
    if (!incoming || typeof incoming !== 'object') return undefined;

    const source = incoming as Record<string, unknown>;
    const entries: [string, number][] = [];

    for (const [rawKey, rawDelta] of Object.entries(source)) {
        if (entries.length >= MAX_REPUTATION_ENTRIES) break;
        if (typeof rawKey !== 'string') continue;
        const key = rawKey.trim();
        if (!key || key.length > 64) continue;
        if (!SAFE_FLAG_RE.test(key)) continue;

        const delta = clampInt(rawDelta, -MAX_REPUTATION_DELTA, MAX_REPUTATION_DELTA);
        if (delta === 0) continue;
        entries.push([key, delta]);
    }

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function sanitizeItemAwards(incoming: unknown): Array<{ itemId: string; quantity: number }> {
    if (!Array.isArray(incoming)) return [];

    const awards: Array<{ itemId: string; quantity: number }> = [];

    for (const raw of incoming) {
        if (awards.length >= MAX_ITEMS_PER_COMMIT) break;
        if (!raw || typeof raw !== 'object') continue;
        const itemIdRaw = (raw as any).itemId;
        const quantityRaw = (raw as any).quantity;
        if (typeof itemIdRaw !== 'string') continue;
        const itemId = itemIdRaw.trim();
        if (!itemId || !isSafeId(itemId)) continue;
        if (!hasItemTemplate(itemId)) continue;

        const quantity = clampInt(quantityRaw ?? 1, 1, MAX_ITEM_QUANTITY);
        awards.push({ itemId, quantity });
    }

    return awards;
}

interface QuestCommand {
    op: 'start' | 'progress' | 'complete' | 'fail' | 'abandon';
    questId: string;
    step?: string;
    progress?: number;
    progressDelta?: number;
    reason?: string;
}

const MAX_QUEST_COMMANDS = 20;

function sanitizeQuestCommands(incoming: unknown): QuestCommand[] {
    if (!Array.isArray(incoming)) return [];

    const commands: QuestCommand[] = [];

    for (const raw of incoming) {
        if (commands.length >= MAX_QUEST_COMMANDS) break;
        if (!raw || typeof raw !== 'object') continue;

        const opRaw = (raw as any).op;
        const questIdRaw = (raw as any).questId;

        if (typeof opRaw !== 'string' || typeof questIdRaw !== 'string') continue;

        const op = opRaw.trim() as 'start' | 'progress' | 'complete' | 'fail' | 'abandon';
        const questId = questIdRaw.trim();

        if (!['start', 'progress', 'complete', 'fail', 'abandon'].includes(op)) continue;
        if (!questId || !isSafeId(questId)) continue;

        const cmd: QuestCommand = { op, questId };

        const stepRaw = typeof (raw as any).step === 'string'
            ? (raw as any).step
            : typeof (raw as any).stepId === 'string'
                ? (raw as any).stepId
                : undefined;
        if (typeof stepRaw === 'string') {
            cmd.step = stepRaw.trim().slice(0, 128);
        }

        if (typeof (raw as any).progress === 'number') {
            cmd.progress = clampInt((raw as any).progress, 0, MAX_QUEST_PROGRESS);
        }
        const progressDeltaRaw = typeof (raw as any).progressDelta === 'number'
            ? (raw as any).progressDelta
            : typeof (raw as any).delta === 'number'
                ? (raw as any).delta
                : undefined;
        if (typeof progressDeltaRaw === 'number') {
            const delta = clampInt(progressDeltaRaw, -MAX_QUEST_PROGRESS_DELTA, MAX_QUEST_PROGRESS_DELTA);
            if (delta !== 0) cmd.progressDelta = delta;
        }
        if (typeof (raw as any).reason === 'string') {
            cmd.reason = (raw as any).reason.trim().slice(0, 256);
        }

        commands.push(cmd);
    }

    return commands;
}

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
        stateVersion: 1,
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
        if ((existing as any).stateVersion === null || (existing as any).stateVersion === undefined) {
            (patch as any).stateVersion = 1;
        }

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
        stateVersion: 1,
        updatedAt: now
    }).returning();

    return created;
}

export const vnRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/vn", (app) =>
            app
                // POST /vn/session/start - create new VN session with HMAC token
                .post("/session/start", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    const player = await ensurePlayer(user as AuthUser);
                    const progress = await ensureProgress(player.id);

                    const sceneId = typeof body.sceneId === 'string' ? body.sceneId.trim() : '';
                    if (!sceneId || !isSafeId(sceneId)) {
                        return { error: "Invalid sceneId", status: 400 };
                    }

                    // Create snapshot of current state
                    const snapshot = {
                        hp: (progress as any).hp,
                        skills: progress.skills ?? {},
                        flags: progress.flags ?? {},
                        reputation: (progress as any).reputation ?? {},
                        level: progress.level,
                        xp: progress.xp,
                        phase: progress.phase,
                        stateVersion: (progress as any).stateVersion ?? 1,
                    };

                    const sessionId = generateSessionId();
                    const seed = generateSeed();
                    const snapshotHash = hashSnapshot(snapshot);
                    const stateVersion = snapshot.stateVersion;
                    const expiresAt = getSessionExpiry();
                    const allowedOps = SESSION_DEFAULT_OPS;

                    const tokenPayload: SessionTokenPayload = {
                        sessionId,
                        seed,
                        snapshotHash,
                        stateVersion,
                        expiresAt,
                        allowedOps,
                    };
                    const sessionToken = signSessionToken(tokenPayload);

                    // Store session in DB
                    await db.insert(vnSessions).values({
                        id: sessionId,
                        playerId: player.id,
                        sceneId,
                        seed,
                        stateVersion,
                        snapshotHash,
                        allowedOps,
                        initialState: snapshot,
                        expiresAt,
                        createdAt: Date.now(),
                    });

                    return {
                        sessionId,
                        sessionToken,
                        seed,
                        stateVersion,
                        expiresAt,
                        allowedOps,
                        initialState: snapshot,
                    };
                }, {
                    body: t.Object({
                        sceneId: t.String(),
                        conditions: t.Optional(t.Any()),
                    })
                })

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
                            attributes: (progress as any).attributes ?? progress.skills ?? {},
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

                    // Strict session validation (required)
                    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
                    const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';
                    const commitNonce = typeof body.commitNonce === 'string' ? body.commitNonce.trim() : '';

                    if (!sessionId || !sessionToken || !commitNonce) {
                        return { error: "sessionId, sessionToken, and commitNonce are required", status: 400 };
                    }

                    if (!isSafeId(sessionId) || !isSafeId(commitNonce)) {
                        return { error: "Invalid sessionId or commitNonce", status: 400 };
                    }

                    // Lookup session
                    const session = await db.query.vnSessions.findFirst({
                        where: eq(vnSessions.id, sessionId)
                    });

                    if (!session) {
                        return { error: "Session not found", status: 404 };
                    }

                    if (session.playerId !== player.id) {
                        return { error: "Session does not belong to player", status: 403 };
                    }

                    if (session.expiresAt < now) {
                        return { error: "Session expired", status: 410 };
                    }

                    if (session.committedAt) {
                        return { error: "Session already committed", status: 409 };
                    }

                    // Verify HMAC signature
                    const tokenPayload: SessionTokenPayload = {
                        sessionId: session.id,
                        seed: session.seed,
                        snapshotHash: session.snapshotHash,
                        stateVersion: session.stateVersion,
                        expiresAt: session.expiresAt,
                        allowedOps: (session.allowedOps as string[]) ?? [],
                    };

                    if (!verifySessionToken(tokenPayload, sessionToken)) {
                        return { error: "Invalid session token", status: 403 };
                    }

                    const sceneId = typeof body.sceneId === 'string' ? body.sceneId.trim() : '';
                    if (!sceneId || !isSafeId(sceneId)) {
                        return { error: "Invalid sceneId", status: 400 };
                    }

                    const addFlags = sanitizeStringArray(body.payload.addFlags, {
                        max: MAX_FLAGS_PER_COMMIT,
                        pattern: SAFE_FLAG_RE,
                        maxLen: 64,
                    });
                    const removeFlags = sanitizeStringArray(body.payload.removeFlags, {
                        max: MAX_FLAGS_PER_COMMIT,
                        pattern: SAFE_FLAG_RE,
                        maxLen: 64,
                    });

                    const reputationDelta = sanitizeReputation(body.payload.reputation);
                    const questIdsFromPayload = sanitizeStringArray(body.payload.quests, { max: 50, pattern: SAFE_ID_RE, maxLen: 128 });

                    const xpGain = clampInt(body.payload.xpDelta ?? 0, 0, MAX_XP_DELTA);
                    const xpResult = awardXPAndLevelUp(progress.level, progress.xp, progress.skillPoints, xpGain);

                    const currentPhase = progress.phase ?? 1;
                    const requestedPhase = body.payload.advancePhaseTo === undefined
                        ? undefined
                        : clampInt(body.payload.advancePhaseTo, currentPhase, currentPhase + 1);
                    const nextPhase = requestedPhase ?? currentPhase;

                    const startedAt = typeof body.payload.startedAt === 'number' && Number.isFinite(body.payload.startedAt)
                        ? body.payload.startedAt
                        : now;
                    const finishedAt = typeof body.payload.finishedAt === 'number' && Number.isFinite(body.payload.finishedAt)
                        ? body.payload.finishedAt
                        : now;

                    const visited = new Set<string>(progress.visitedScenes ?? []);
                    visited.add(sceneId);

                    const flags = mergeFlags(progress.flags, addFlags, removeFlags);
                    const reputation = mergeReputation((progress as any).reputation, reputationDelta);

                    const choices = Array.isArray(body.payload.choices)
                        ? body.payload.choices.slice(0, 200).map((choice) => ({
                            sceneId: typeof (choice as any)?.sceneId === 'string' ? (choice as any).sceneId : sceneId,
                            lineId: typeof (choice as any)?.lineId === 'string' ? (choice as any).lineId : undefined,
                            choiceId: typeof (choice as any)?.choiceId === 'string' ? (choice as any).choiceId : 'unknown',
                            effects: (choice as any)?.effects,
                        }))
                        : [];

                    const itemAwards = sanitizeItemAwards(body.payload.items);
                    const questCommands = sanitizeQuestCommands(body.payload.questCommands);
                    const decisionLog = Array.isArray(body.payload.decisionLog)
                        ? body.payload.decisionLog.slice(0, MAX_DECISION_LOG_ENTRIES)
                        : undefined;
                    const awardedItems: Array<{ itemId: string; quantity: number; dbId?: string }> = [];
                    let duplicate = false;

                    const normalizedSkills = normalizeSkills(progress.skills as any);
                    const nextSkills = applySkillDeltasFromChoices(
                        normalizedSkills,
                        choices.map((entry) => ({ effects: entry.effects }))
                    );

                    const maxResources = calculateMaxResources(nextSkills);

                    const hpPatch = applyHpDeltasFromChoices(
                        (progress as any).hp,
                        maxResources.hp,
                        choices.map((entry) => ({ effects: entry.effects }))
                    );
                    const nextStateVersion = session.stateVersion + 1;

                    const progressPatch = {
                        currentScene: sceneId,
                        visitedScenes: Array.from(visited),
                        flags,
                        skills: nextSkills,
                        hp: hpPatch.hp,
                        maxHp: maxResources.hp,
                        maxStamina: maxResources.ap,
                        maxMorale: maxResources.mp,
                        level: xpResult.level,
                        xp: xpResult.xp,
                        skillPoints: xpResult.skillPoints,
                        phase: nextPhase,
                        reputation,
                        stateVersion: nextStateVersion,
                        updatedAt: now,
                    };

                    let commitResult;
                    try {
                        commitResult = await db.transaction(async (tx) => {
                        const [commitRow] = await tx.insert(vnCommits).values({
                            sessionId,
                            commitNonce,
                            createdAt: now,
                        }).onConflictDoNothing().returning({ id: vnCommits.id });

                        if (!commitRow) {
                            const existingCommit = await tx.query.vnCommits.findFirst({
                                where: eq(vnCommits.commitNonce, commitNonce)
                            });
                            if (!existingCommit) {
                                return { error: "Commit already in progress", status: 409 };
                            }
                            if (existingCommit.sessionId !== sessionId) {
                                return { error: "Commit nonce already used", status: 409 };
                            }
                            if (existingCommit.result) {
                                return existingCommit.result;
                            }
                            return { error: "Commit already in progress", status: 409 };
                        }

                        // Idempotency: scene log insert is the gate for legacy duplicates.
                        const [logRow] = await tx.insert(sceneLogs).values({
                            playerId: player.id,
                            userId: user.type === 'clerk' ? user.id : undefined,
                            deviceId: user.type === 'guest' ? user.id : undefined,
                            sceneId,
                            choices,
                            payload: {
                                type: 'scene_commit',
                                addFlags,
                                removeFlags,
                                xpDelta: xpGain,
                                reputation: reputationDelta,
                                quests: questIdsFromPayload,
                                items: itemAwards,
                                questCommands,
                                decisionLog,
                                advancePhaseTo: nextPhase,
                            },
                            startedAt,
                            finishedAt,
                            createdAt: now
                        }).onConflictDoNothing().returning({ id: sceneLogs.id });

                        if (!logRow) {
                            duplicate = true;
                        } else {
                            if (itemAwards.length > 0) {
                                const results = await awardItemsToPlayer(player.id, itemAwards, tx);
                                const failed = results.filter((result) => !result.success);

                                if (failed.length > 0) {
                                    throw new Error(
                                        `Failed to award items: ${failed.map((result) => result.itemId).join(', ')}`
                                    );
                                }

                                results.forEach((result) => {
                                    if (!result.success) return;
                                    awardedItems.push({
                                        itemId: result.itemId,
                                        quantity: result.quantity,
                                        dbId: result.dbId,
                                    });
                                });

                                await tx.update(sceneLogs)
                                    .set({
                                        payload: {
                                            type: 'scene_commit',
                                            addFlags,
                                            removeFlags,
                                            xpDelta: xpGain,
                                            reputation: reputationDelta,
                                            quests: questIdsFromPayload,
                                            items: itemAwards,
                                            questCommands,
                                            decisionLog,
                                            advancePhaseTo: nextPhase,
                                            awardedItems,
                                        },
                                    })
                                    .where(eq(sceneLogs.id, logRow.id));
                            }

                            const questIds = Array.from(new Set(questCommands.map((cmd) => cmd.questId)));
                            const questDefs = questIds.length > 0
                                ? await tx.query.quests.findMany({
                                    where: inArray(quests.id, questIds),
                                })
                                : [];
                            const questDefById = new Map(questDefs.map((def) => [def.id, def]));

                            // Process quest commands
                            for (const cmd of questCommands) {
                                const existingQuest = await tx.query.questProgress.findFirst({
                                    where: and(
                                        eq(questProgress.playerId, player.id),
                                        eq(questProgress.questId, cmd.questId)
                                    )
                                });

                                switch (cmd.op) {
                                    case 'start': {
                                        if (existingQuest) break;
                                        const questDef = questDefById.get(cmd.questId);
                                        if (!questDef || questDef.isActive === false) break;
                                        const firstStep = Array.isArray(questDef.steps)
                                            ? (questDef.steps as Array<{ id?: string }>)[0]?.id
                                            : undefined;
                                        await tx.insert(questProgress).values({
                                            playerId: player.id,
                                            userId: user.id,
                                            questId: cmd.questId,
                                            currentStep: cmd.step || firstStep || 'start',
                                            status: 'active',
                                            startedAt: now,
                                            progress: 0,
                                        }).onConflictDoNothing();
                                        break;
                                    }
                                    case 'progress': {
                                        if (!existingQuest || existingQuest.status !== 'active') break;
                                        const currentProgress = typeof existingQuest.progress === 'number'
                                            ? existingQuest.progress
                                            : 0;
                                        let nextProgress = currentProgress + 1;
                                        if (typeof cmd.progress === 'number') {
                                            nextProgress = cmd.progress;
                                        } else if (typeof cmd.progressDelta === 'number') {
                                            nextProgress = currentProgress + cmd.progressDelta;
                                        }
                                        nextProgress = clampInt(nextProgress, 0, MAX_QUEST_PROGRESS);
                                        await tx.update(questProgress)
                                            .set({
                                                currentStep: cmd.step ?? existingQuest.currentStep,
                                                progress: nextProgress,
                                            })
                                            .where(eq(questProgress.id, existingQuest.id));
                                        break;
                                    }
                                    case 'complete': {
                                        if (!existingQuest || existingQuest.status !== 'active') break;
                                        await tx.update(questProgress)
                                            .set({
                                                status: 'completed',
                                                completedAt: now,
                                            })
                                            .where(eq(questProgress.id, existingQuest.id));
                                        break;
                                    }
                                    case 'fail': {
                                        if (!existingQuest || existingQuest.status !== 'active') break;
                                        await tx.update(questProgress)
                                            .set({
                                                status: 'failed',
                                                failedAt: now,
                                            })
                                            .where(eq(questProgress.id, existingQuest.id));
                                        break;
                                    }
                                    case 'abandon': {
                                        if (!existingQuest || existingQuest.status !== 'active') break;
                                        await tx.update(questProgress)
                                            .set({
                                                status: 'abandoned',
                                                abandonedAt: now,
                                            })
                                            .where(eq(questProgress.id, existingQuest.id));
                                        break;
                                    }
                                }
                            }

                            const [updatedProgress] = await tx.update(gameProgress)
                                .set(progressPatch)
                                .where(and(
                                    eq(gameProgress.id, progress.id),
                                    eq(gameProgress.stateVersion, session.stateVersion)
                                ))
                                .returning();

                            if (!updatedProgress) {
                                throw new Error('STATE_VERSION_CONFLICT');
                            }
                        }

                        if (duplicate) {
                            const existing = await tx.query.sceneLogs.findFirst({
                                where: and(
                                    eq(sceneLogs.playerId, player.id),
                                    eq(sceneLogs.sceneId, sceneId),
                                    sql`(${sceneLogs.payload} ->> 'type') = 'scene_commit'`
                                )
                            });
                            const fromLog = (existing?.payload as any)?.awardedItems;
                            if (Array.isArray(fromLog)) {
                                fromLog.slice(0, MAX_ITEMS_PER_COMMIT).forEach((entry: any) => {
                                    if (!entry || typeof entry !== 'object') return;
                                    if (typeof entry.itemId !== 'string') return;
                                    const itemId = entry.itemId.trim();
                                    if (!itemId) return;
                                    const quantity = clampInt(entry.quantity, 1, MAX_ITEM_QUANTITY);
                                    const dbId = typeof entry.dbId === 'string' ? entry.dbId : undefined;
                                    awardedItems.push({ itemId, quantity, dbId });
                                });
                            }
                        }

                        const latestProgress = await tx.query.gameProgress.findFirst({
                            where: eq(gameProgress.id, progress.id)
                        });

                        if (!latestProgress) {
                            throw new Error('PROGRESS_NOT_FOUND');
                        }

                        const result = {
                            success: true,
                            duplicate: duplicate || undefined,
                            progress: {
                                ...latestProgress,
                                visitedScenes: latestProgress.visitedScenes ?? [],
                                flags: latestProgress.flags ?? {},
                                reputation: (latestProgress as any).reputation ?? {},
                                attributes: (latestProgress as any).attributes ?? latestProgress.skills ?? {},
                                skills: latestProgress.skills ?? {},
                            },
                            awardedItems,
                        };

                        await tx.update(vnCommits)
                            .set({ result })
                            .where(eq(vnCommits.id, commitRow.id));

                        await tx.update(vnSessions)
                            .set({ committedAt: now })
                            .where(eq(vnSessions.id, sessionId));

                        return result;
                        });
                    } catch (error) {
                        if (error instanceof Error && error.message === 'STATE_VERSION_CONFLICT') {
                            return { error: "State version conflict", status: 409 };
                        }
                        if (error instanceof Error && error.message === 'PROGRESS_NOT_FOUND') {
                            return { error: "Progress not found", status: 500 };
                        }
                        console.error('[vn/commit] Transaction failed', error);
                        return { error: "Failed to commit progress", status: 500 };
                    }

                    if ((commitResult as any)?.error) {
                        return commitResult as any;
                    }

                    return commitResult;
                }, {
                    body: t.Object({
                        sceneId: t.String(),
                        sessionId: t.String(),
                        sessionToken: t.String(),
                        commitNonce: t.String(),
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
                            advancePhaseTo: t.Optional(t.Number()),
                            decisionLog: t.Optional(t.Array(t.Any())),
                            questCommands: t.Optional(t.Array(t.Object({
                                op: t.String(),
                                questId: t.String(),
                                step: t.Optional(t.String()),
                                stepId: t.Optional(t.String()),
                                progress: t.Optional(t.Number()),
                                progressDelta: t.Optional(t.Number()),
                                delta: t.Optional(t.Number()),
                                reason: t.Optional(t.String()),
                            }))),
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
