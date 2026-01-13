/**
 * Survival Mode REST API Routes
 * Endpoints for session management, zone entry, and event resolution
 */

import { Elysia, t } from "elysia"
import { auth } from "../auth"
import { survivalService } from "../../services/survivalService"
import { db } from "../../db"
import { players } from "../../db/schema"
import { eq } from "drizzle-orm"
import type { PlayerRole, ZoneType } from "../../shared/types/survival"

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

export const survivalRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/survival", (app) =>
            app
                // Create a new session
                .post("/sessions", async ({ user }) => {
                    if (!user) return { error: "Unauthorized", status: 401 }
                    const playerInfo = await getPlayerInfo(user as any)
                    if (!playerInfo) return { error: "Player profile not found", status: 404 }

                    try {
                        const session = await survivalService.createSession(playerInfo.id, playerInfo.name)
                        return { session }
                    } catch (e: any) {
                        return { error: e.message, status: 400 }
                    }
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
        )
