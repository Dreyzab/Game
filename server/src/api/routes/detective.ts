import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { detectiveHardlinks, detectiveScans } from '../../db/schema/detective';
import { gameProgress, players } from '../../db/schema/players';
import { eq, and } from 'drizzle-orm';
import { auth } from '../auth';

type AuthUser = { id: string; type: 'clerk' | 'guest' };

const DEFAULT_DETECTIVE_STATE = {
    entries: [],
    evidence: [],
    pointStates: {},
    flags: {},
    detectiveName: null,
    lastSyncedAt: 0,
};

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

    return created;
}

async function ensureProgress(playerId: number) {
    const existing = await db.query.gameProgress.findFirst({
        where: eq(gameProgress.playerId, playerId)
    });

    if (existing) return existing;

    const now = Date.now();
    const [created] = await db.insert(gameProgress).values({
        playerId,
        currentScene: 'prologue_coupe_start',
        visitedScenes: [],
        flags: {},
        skills: {},
        level: 1,
        xp: 0,
        skillPoints: 0,
        phase: 1,
        reputation: {},
        detectiveState: DEFAULT_DETECTIVE_STATE,
        updatedAt: now
    }).returning();

    return created;
}

/**
 * Detective Mode API Routes
 * 
 * Endpoints for server-authoritative hardlink scanning.
 * Provides anti-replay protection and centralized QR management.
 */
export const detectiveRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group('/detective', (app) =>
            app
                /**
                 * POST /detective/scan
                 * 
                 * Scans a detective hardlink QR code and returns game actions.
                 * 
                 * QR Format: "gw3:hardlink:<packId>:<hardlinkId>"
                 * Example: "gw3:hardlink:fbg1905:CASE01_BRIEFING_01"
                 * 
                 * Anti-Replay: Non-repeatable QRs can only be scanned once per user.
                 */
                .post('/scan', async ({ user, body }) => {
                    if (!user) {
                        return {
                            success: false,
                            error: 'Unauthorized',
                            status: 401
                        };
                    }

                    const { qrData } = body;

                    // 1. Parse QR format: "gw3:hardlink:<packId>:<hardlinkId>"
                    const match = qrData.match(/^gw3:hardlink:([^:]+):([^:]+)$/);
                    if (!match) {
                        return {
                            success: false,
                            error: 'Invalid QR format. Expected: gw3:hardlink:<packId>:<hardlinkId>',
                            status: 400,
                        };
                    }

                    const [, packId, hardlinkId] = match;

                    // 2. Fetch hardlink from database
                    const hardlink = await db.query.detectiveHardlinks.findFirst({
                        where: and(
                            eq(detectiveHardlinks.packId, packId),
                            eq(detectiveHardlinks.hardlinkId, hardlinkId)
                        ),
                    });

                    if (!hardlink) {
                        return {
                            success: false,
                            error: 'Hardlink not found',
                            code: 'NOT_FOUND',
                            status: 404,
                        };
                    }

                    // 3. Anti-replay check (skip if repeatable)
                    if (!hardlink.isRepeatable) {
                        const existing = await db.query.detectiveScans.findFirst({
                            where: and(
                                user.type === 'clerk'
                                    ? eq(detectiveScans.userId, user.id)
                                    : eq(detectiveScans.deviceId, user.id),
                                eq(detectiveScans.packId, packId),
                                eq(detectiveScans.hardlinkId, hardlinkId)
                            ),
                        });

                        if (existing) {
                            return {
                                success: false,
                                error: 'This QR has already been scanned',
                                code: 'ALREADY_SCANNED',
                                status: 409,
                                scannedAt: existing.scannedAt,
                            };
                        }
                    }

                    // 4. Record scan in history
                    const now = Date.now();
                    await db.insert(detectiveScans).values({
                        userId: user.type === 'clerk' ? user.id : undefined,
                        deviceId: user.type === 'guest' ? user.id : undefined,
                        packId,
                        hardlinkId,
                        scannedAt: now,
                    });

                    // 5. Return actions for client-side execution
                    return {
                        success: true,
                        packId,
                        hardlinkId,
                        isRepeatable: hardlink.isRepeatable,
                        actions: hardlink.actions,
                        scannedAt: now,
                    };
                }, {
                    body: t.Object({
                        qrData: t.String(),
                    }),
                })

                /**
                 * GET /detective/state
                 * 
                 * Fetch current detective dossier state from server.
                 * Used on login to sync state across devices.
                 */
                .get('/state', async ({ user }) => {
                    if (!user) {
                        return {
                            success: false,
                            error: 'Unauthorized',
                            status: 401
                        };
                    }

                    const player = await ensurePlayer(user as AuthUser);
                    const progress = await ensureProgress(player.id);

                    return {
                        success: true,
                        state: progress.detectiveState || DEFAULT_DETECTIVE_STATE,
                    };
                })

                /**
                 * PUT /detective/state
                 * 
                 * Upload detective dossier state to server.
                 * Includes conflict detection via timestamp comparison.
                 */
                .put('/state', async ({ user, body }) => {
                    if (!user) {
                        return {
                            success: false,
                            error: 'Unauthorized',
                            status: 401
                        };
                    }

                    const { state, clientTimestamp } = body;

                    const player = await ensurePlayer(user as AuthUser);
                    const progress = await ensureProgress(player.id);

                    // Conflict resolution: server wins if db is newer
                    const serverState = progress.detectiveState || DEFAULT_DETECTIVE_STATE;
                    const serverTimestamp = (serverState as any).lastSyncedAt || 0;

                    if (serverTimestamp > clientTimestamp) {
                        return {
                            success: false,
                            code: 'CONFLICT',
                            serverState,
                            serverTimestamp,
                            message: 'Server state is newer. Resolve conflict on client.',
                        };
                    }

                    // Update state with new timestamp
                    const updatedState = {
                        ...state,
                        lastSyncedAt: Date.now(),
                    };

                    await db.update(gameProgress)
                        .set({
                            detectiveState: updatedState,
                            updatedAt: Date.now()
                        })
                        .where(eq(gameProgress.id, progress.id));

                    return {
                        success: true,
                        state: updatedState,
                    };
                }, {
                    body: t.Object({
                        state: t.Any(),
                        clientTimestamp: t.Number(),
                    }),
                })
        );
