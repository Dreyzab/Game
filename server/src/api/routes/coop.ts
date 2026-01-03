import { Elysia, t } from "elysia";
import { auth } from "../auth";
import { coopService } from "../../services/coopService";
import { db } from "../../db";
import { players } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { CoopRoleId } from "../../shared/types/coop";
import { coopGraph } from "../../lib/coopGraph";

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
                        const room = await coopService.castVote(params.code, playerId, body.choiceId, body.asPlayerId, body.nodeId);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({
                        choiceId: t.String(),
                        asPlayerId: t.Optional(t.Number()),
                        nodeId: t.Optional(t.String()),
                    })
                })

                .post("/rooms/:code/battle/resolve", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.resolveCoopBattle({
                            code: params.code,
                            playerId,
                            result: (body as any).result,
                            players: (body as any).players,
                        });
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({
                        result: t.Union([t.Literal('victory'), t.Literal('defeat')]),
                        players: t.Array(t.Object({
                            playerId: t.Number(),
                            hp: t.Number(),
                            morale: t.Optional(t.Number()),
                            stamina: t.Optional(t.Number()),
                        })),
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
                    const node = coopGraph.getNode(params.id);
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

                .post("/rooms/:code/advance_sequential", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.advanceSequential(params.code, playerId);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                })

                .post("/rooms/:code/camp/upgrade", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.upgradeBase(params.code, playerId, body.upgradeId);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({ upgradeId: t.String() })
                })

                .post("/rooms/:code/camp/mission/start", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.startMission(params.code, playerId, body.missionNodeId);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({ missionNodeId: t.String() })
                })

                .post("/rooms/:code/camp/contribute", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.contributeItem(
                            params.code,
                            playerId,
                            body.templateId,
                            body.quantity
                        );
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({
                        templateId: t.String(),
                        quantity: t.Number()
                    })
                })

                .get("/rooms/:code/camp/shop", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const shop = await coopService.getCampShop(params.code, playerId);
                        return { shop };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                })

                .post("/rooms/:code/camp/reinforce", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.callReinforcements(params.code, playerId, body.count ?? 1);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({
                        count: t.Optional(t.Number()),
                    })
                })

                .post("/rooms/:code/camp/purchase", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.purchaseCampItem(params.code, playerId, body.templateId, body.quantity ?? 1);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({
                        templateId: t.String(),
                        quantity: t.Optional(t.Number()),
                    })
                })

                .post("/rooms/:code/camp/inventory/withdraw", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const playerId = await getPlayerId(user as any);
                    if (!playerId) return { error: "Player profile not found", status: 404 };

                    try {
                        const room = await coopService.withdrawFromCamp(params.code, playerId, body.templateId, body.quantity ?? 1);
                        return { room };
                    } catch (e: any) {
                        return { error: e.message, status: 400 };
                    }
                }, {
                    body: t.Object({
                        templateId: t.String(),
                        quantity: t.Optional(t.Number()),
                    })
                })
        );
