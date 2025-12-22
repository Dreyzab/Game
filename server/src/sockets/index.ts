import { Elysia, t } from "elysia";
import { auth } from "../api/auth";
import { eventBus } from "../lib/bus";

// Simple in-memory room manager
// In prod, this should sync with Redis for horizontal scaling
const rooms = new Map<string, Set<any>>(); // room_id -> Set<WebSocket>

export const wsRoutes = (app: Elysia) =>
    app
        .use(auth)
        .ws("/ws", {
            body: t.Object({
                type: t.String(),
                payload: t.Any()
            }),
            open(ws) {
                // console.log("WS Connected", ws.id);
            },
            message(ws, message) {
                const { type, payload } = message;
                // Handle events
                if (type === "join_room") {
                    const roomId = payload.roomId;
                    ws.subscribe(roomId);
                    // console.log(`Socket ${ws.id} joined room ${roomId}`);
                    ws.publish(roomId, { type: "player_joined", sender: ws.id });
                }

                if (type === "coop_join") {
                    const { code } = payload;
                    ws.subscribe(`coop:${code}`);
                    // console.log(`Socket ${ws.id} subscribed to coop:${code}`);
                }
            },
        })
        .onStart(() => {
            eventBus.on('coop_update', ({ roomId, data }) => {
                app.server?.publish(`coop:${roomId}`, JSON.stringify({
                    type: 'coop_update',
                    data
                }));
            });
        });
