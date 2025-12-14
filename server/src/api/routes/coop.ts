import { Elysia, t } from "elysia";
import { auth } from "../auth";
import type { CoopRoom } from "../../lib/roomStore";
import {
    getCoopRoom,
    createCoopRoom,
    joinCoopRoom,
    leaveCoopRoom,
    setCoopReady,
    startCoop,
    getCoopQuest,
    applyCoopQuestChoice,
    COOP_QUEST_NODES,
} from "../../lib/roomStore";

type AuthedUser = { id: string; type: 'clerk' | 'guest' };

// Helper to coerce incoming role strings into known room roles
function normalizeRole(role?: string) {
    if (!role) return undefined;
    if (role === 'body' || role === 'mind' || role === 'social') return role;
    return undefined;
}

const serializeRoom = (room: CoopRoom) => ({
    ...room,
    players: room.players.map((p) => ({
        id: p.id,
        role: p.role,
        ready: p.ready,
    })),
    quest: room.quest ?? null,
});

export const coopRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/coop", (app) =>
            app
                .post("/rooms", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const room = createCoopRoom((user as AuthedUser).id, normalizeRole(body.role));
                    return { room: serializeRoom(room) };
                }, {
                    body: t.Object({
                        role: t.Optional(t.String())
                    })
                })

                .get("/rooms/:code", async ({ params }) => {
                    const room = getCoopRoom(params.code);
                    if (!room) return { error: "Room not found", status: 404 };
                    return { room: serializeRoom(room) };
                })

                .post("/rooms/:code/join", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const room = joinCoopRoom(params.code, (user as AuthedUser).id, normalizeRole(body.role));
                    if (!room) return { error: "Room not found", status: 404 };
                    return { room: serializeRoom(room) };
                }, {
                    body: t.Object({
                        role: t.Optional(t.String())
                    })
                })

                .post("/rooms/:code/leave", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const room = leaveCoopRoom(params.code, (user as AuthedUser).id);
                    if (!room) return { ok: true, removed: true };
                    return { room: serializeRoom(room) };
                })

                .post("/rooms/:code/ready", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const room = setCoopReady(params.code, (user as AuthedUser).id, body.ready);
                    if (!room) return { error: "Room not found", status: 404 };
                    return { room: serializeRoom(room) };
                }, {
                    body: t.Object({ ready: t.Boolean() })
                })

                .post("/rooms/:code/start", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const room = startCoop(params.code, (user as AuthedUser).id);
                    if (!room) return { error: "Room not found", status: 404 };
                    return { room: serializeRoom(room) };
                })

                // GET /coop/rooms/:code/quest - current cooperative quest state for the room
                .get("/rooms/:code/quest", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const room = getCoopRoom(params.code);
                    if (!room) return { error: "Room not found", status: 404 };
                    const quest = getCoopQuest(params.code);
                    if (!quest) return { error: "Quest not initialized", status: 404 };
                    const node = COOP_QUEST_NODES[quest.nodeId];
                    return { quest, node };
                })

                // POST /coop/rooms/:code/quest - apply a quest choice for the current node
                .post("/rooms/:code/quest", async ({ user, params, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const result = applyCoopQuestChoice(params.code, (user as AuthedUser).id, body.choiceId);
                    if (!result.quest && result.error) {
                        return { error: result.error, status: 400 };
                    }
                    if (!result.quest) {
                        return { error: "Quest not found", status: 404 };
                    }
                    const node = COOP_QUEST_NODES[result.quest.nodeId];
                    return { quest: result.quest, node, error: result.error };
                }, {
                    body: t.Object({
                        choiceId: t.String(),
                    })
                })
        );








