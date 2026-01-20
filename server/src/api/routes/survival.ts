/**
 * Survival Mode REST API Routes
 * Endpoints for session management, zone entry, and event resolution
 */

import { Elysia, t } from "elysia"
import { auth } from "../auth"
import { survivalService } from "../../services/survivalService"
import { traderService } from "../../services/traderService"
import { db } from "../../db"
import { players } from "../../db/schema"
import { eq } from "drizzle-orm"
import type { PlayerRole, ZoneType, ZoneActionId } from "../../shared/types/survival"

// Helper to get internal player ID from auth user
async function getPlayerId(user: { id: string; type: 'clerk' | 'guest' }): Promise<number | null> {
    const player = await db.query.players.findFirst({
        where: user.type === 'clerk' ? eq(players.userId, user.id) : eq(players.deviceId, user.id),
        columns: { id: true, name: true }
    })
    return player?.id ?? null
}

async function getPlayerInfo(user: { id: string; type: 'clerk' | 'guest' }): Promise<{ id: number; name: string } | null> {
    const player = await db.query.players.findFirst({
        where: user.type === 'clerk' ? eq(players.userId, user.id) : eq(players.deviceId, user.id),
        columns: { id: true, name: true }
    })
    if (!player) return null
    return { id: player.id, name: player.name || 'Unknown' }
}

function normalizeRole(role?: string): PlayerRole | undefined {
    if (!role) return undefined
    if (['scout', 'enforcer', 'techie', 'face'].includes(role)) return role as PlayerRole
    return undefined
}

function normalizeZone(zone?: string): ZoneType | undefined {
    if (!zone) return undefined
    if (['kitchen', 'bathroom', 'bedroom', 'corridor', 'living_room'].includes(zone)) return zone as ZoneType
    return undefined
}

function normalizeZoneAction(action?: string): ZoneActionId | undefined {
    if (!action) return undefined
    if (['scavenge'].includes(action)) return action as ZoneActionId
    return undefined
}

export const survivalRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/survival", (app) =>
            app
                // Create a new session
                .post("/sessions", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerInfo = await getPlayerInfo(user as any)
                    if (!playerInfo) return { error: "Player profile not found", status: 404 }

                    try {
                        const session = await survivalService.createSession(
                            playerInfo.id,
                            playerInfo.name,
                            body?.regionId ?? undefined
                        )
                        return { session }
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                }, {
                    body: t.Optional(t.Object({
                        regionId: t.Optional(t.String()),
                    }))
                })

                // Get session state
                .get("/sessions/:id", async ({ params }) => {
                    const session = survivalService.getSession(params.id)
                    if (!session) return { error: "Session not found", status: 404 }
                    return { session }
                })

                // Join a session
                .post("/sessions/:id/join", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerInfo = await getPlayerInfo(user as any)
                    if (!playerInfo) return { error: "Player profile not found", status: 404 }

                    // Use provided playerName or fallback to DB name
                    const displayName = body.playerName || playerInfo.name

                    try {
                        const session = await survivalService.joinSession(
                            params.id,
                            playerInfo.id,
                            displayName,
                            normalizeRole(body.role)
                        )
                        // Return the joined player object
                        const player = session.players[playerInfo.id]
                        return { session, player }
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                }, {
                    body: t.Object({
                        role: t.Optional(t.String()),
                        playerName: t.Optional(t.String()),
                    })
                })

                // Select role
                .post("/sessions/:id/role", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    const role = normalizeRole(body.role)
                    if (!role) return { error: "Invalid role", status: 400 }

                    try {
                        const session = await survivalService.selectRole(params.id, playerId, role)
                        return { session }
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                }, {
                    body: t.Object({
                        role: t.String(),
                    })
                })

                // Start session
                .post("/sessions/:id/start", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    try {
                        const session = await survivalService.startSession(params.id, playerId)
                        return { session }
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                })

                // Enter a zone (via QR scan)
                .post("/sessions/:id/enter", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    const zone = normalizeZone(body.zoneId)
                    if (!zone) return { error: "Invalid zone", status: 400 }

                    try {
                        const result = await survivalService.enterZone(params.id, playerId, zone)
                        return result
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                }, {
                    body: t.Object({
                        zoneId: t.String(),
                    })
                })

                // Start an exclusive zone action (e.g. scavenge) with server lock + ETA
                .post("/sessions/:id/zone-action", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    const zone = normalizeZone(body.zoneId)
                    if (!zone) return { error: "Invalid zone", status: 400 }
                    const actionId = normalizeZoneAction(body.actionId)
                    if (!actionId) return { error: "Invalid action", status: 400 }

                    try {
                        const result = await survivalService.startZoneAction(params.id, playerId, zone, actionId)
                        return result
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                }, {
                    body: t.Object({
                        zoneId: t.String(),
                        actionId: t.String(),
                    })
                })

                // Resolve event option
                .post("/sessions/:id/resolve", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    try {
                        const result = await survivalService.resolveOption(
                            params.id,
                            playerId,
                            body.eventId,
                            body.optionId
                        )
                        return result
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                }, {
                    body: t.Object({
                        eventId: t.String(),
                        optionId: t.String(),
                    })
                })

                // Complete battle and apply results
                .post("/sessions/:id/complete-battle", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    try {
                        const result = await survivalService.completeBattle(
                            params.id,
                            playerId,
                            body.result as any,
                            body.hp
                        )
                        return result
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                }, {
                    body: t.Object({
                        result: t.String(), // 'victory' | 'defeat' | 'flee'
                        hp: t.Optional(t.Number()),
                    })
                })

                // Consume transition flag (clear it after navigation)
                .post("/sessions/:id/consume-transition", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    try {
                        const result = await survivalService.consumeTransition(params.id, playerId)
                        return result
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                })

                // Transfer items to base
                .post("/sessions/:id/transfer", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    try {
                        const session = await survivalService.transferToBase(
                            params.id,
                            playerId,
                            body.items
                        )
                        return { session }
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                }, {
                    body: t.Object({
                        items: t.Array(t.Object({
                            templateId: t.String(),
                            quantity: t.Number(),
                        })),
                    })
                })

                // Move player to target hex
                .post("/sessions/:id/move", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    try {
                        const result = await survivalService.movePlayer(
                            params.id,
                            playerId,
                            body.targetHex
                        )
                        return result
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
                }, {
                    body: t.Object({
                        targetHex: t.Object({
                            q: t.Number(),
                            r: t.Number(),
                        })
                    })
                })

                // Get trader inventory (only when traders_arrived event is active)
                .get("/sessions/:id/trader", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    const session = survivalService.getSession(params.id)
                    if (!session) return { error: "Session not found", status: 404 }

                    // Check if traders are here
                    if (session.dailyEvent?.type !== 'traders_arrived') {
                        return { error: "Traders not available today", status: 400 }
                    }

                    const player = session.players[playerId]
                    const inventory = traderService.getTraderInventory(params.id, player)

                    if (!inventory) {
                        // Generate inventory on first access
                        const newInventory = traderService.generateTraderInventory(params.id)
                        return {
                            inventory: player?.role === 'face'
                                ? newInventory.map(i => ({ ...i, price: Math.floor(i.price * 0.5) }))
                                : newInventory
                        }
                    }

                    return { inventory }
                })

                // Buy item from trader
                .post("/sessions/:id/trader/buy", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    const session = survivalService.getSession(params.id)
                    if (!session) return { error: "Session not found", status: 404 }

                    if (session.dailyEvent?.type !== 'traders_arrived') {
                        return { error: "Traders not available", status: 400 }
                    }

                    const player = session.players[playerId]
                    if (!player) return { error: "Player not in session", status: 404 }

                    const result = traderService.buyFromTrader(session, player, body.templateId, body.quantity)
                    return result
                }, {
                    body: t.Object({
                        templateId: t.String(),
                        quantity: t.Number({ minimum: 1, multipleOf: 1 }),
                    })
                })

                // Sell item to trader
                .post("/sessions/:id/trader/sell", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerId = await getPlayerId(user as any)
                    if (!playerId) return { error: "Player profile not found", status: 404 }

                    const session = survivalService.getSession(params.id)
                    if (!session) return { error: "Session not found", status: 404 }

                    if (session.dailyEvent?.type !== 'traders_arrived') {
                        return { error: "Traders not available", status: 400 }
                    }

                    const player = session.players[playerId]
                    if (!player) return { error: "Player not in session", status: 404 }

                    const result = traderService.sellToTrader(session, player, body.templateId, body.quantity)
                    return result
                }, {
                    body: t.Object({
                        templateId: t.String(),
                        quantity: t.Number({ minimum: 1, multipleOf: 1 }),
                    })
                })
        )
