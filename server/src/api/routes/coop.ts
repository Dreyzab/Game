import { Elysia, t } from "elysia";
import { auth } from "../auth";
import { coopService } from "../../services/coopService";
import { db } from "../../db";
import { players } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { CoopRoleId } from "../../shared/types/coop";
import { COOP_PROLOGUE_NODES } from "../../lib/coopContent";

// Helper to get internal player ID from auth user
async function getPlayerId(user: { id: string; type: 'clerk' | 'guest' }): Promise<number | null> {
    const player = await db.query.players.findFirst({
        where: user.type === 'clerk' ? eq(players.userId, user.id) : eq(players.deviceId, user.id),
        columns: { id: true }
    });
    return player?.id ?? null;
}

function normalizeRole(role?: string): CoopRoleId | undefined {
    if (!role) return undefined;
    if (['valkyrie', 'vorschlag', 'ghost', 'shustrya'].includes(role)) return role as CoopRoleId;
    return undefined;
}

export const coopRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/coop", (app) =>
            app
                .post("/rooms", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    const room = await coopService.createRoom(playerId, normalizeRole(body.role));
                    return { room };
                }, {
                    body: t.Object({
                        role: t.Optional(t.String())
                    })
                })

                .get("/rooms/:code", async ({ params }) => {
                    const room = await coopService.getRoomState(params.code);
                    if (!room) return { error: "Room not found", status: 404 };
                    return { room };
                })

                .post("/rooms/:code/join", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.joinRoom(params.code, playerId, normalizeRole(body.role));
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({
                        role: t.Optional(t.String())
                    })
                })

                .post("/rooms/:code/leave", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    const room = await coopService.leaveRoom(params.code, playerId);
                    return { room };
                })

                .post("/rooms/:code/ready", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    const room = await coopService.setReady(params.code, playerId, body.ready);
                    return { room };
                }, {
                    body: t.Object({ ready: t.Boolean() })
                })

                .post("/rooms/:code/start", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.startSession(params.code, playerId);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                })

                .post("/rooms/:code/quest", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.castVote(params.code, playerId, body.choiceId, body.asPlayerId);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({
                        choiceId: t.String(),
                        asPlayerId: t.Optional(t.Number()),
                    })
                })

                .post("/rooms/:code/reach", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.markReached(params.code, playerId, body.nodeId);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({
                        nodeId: t.String(),
                    })
                })

                .get("/nodes/:id", async ({ params }) => {
                    const node = (COOP_PROLOGUE_NODES as any)[params.id];
                    if (!node) return { error: "Node not found", status: 404 };
                    return { node };
                })

                // Debug tool
                .post("/rooms/:code/force", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    // Check admin permissions if needed
                    const room = await coopService.forceScene(params.code, body.nodeId);
                    return { room };
                }, {
                    body: t.Object({ nodeId: t.String() })
                })

                .post("/rooms/:code/debug/add_bot", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    try {
                        const room = await coopService.addBotToRoom(params.code);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                })
        );
