import { Elysia, t } from "elysia";
import { auth } from "../api/auth";

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
                console.log("WS Connected", ws.id);
                // We can attach user info from ws.data (derived from auth)
                // const user = ws.data.user;
            },
            message(ws, message) {
                const { type, payload } = message;
                // Handle events
                if (type === "join_room") {
                    const roomId = payload.roomId;
                    ws.subscribe(roomId);
                    console.log(`Socket ${ws.id} joined room ${roomId}`);
                    ws.publish(roomId, { type: "player_joined", sender: ws.id });
                }

                if (type === "move") {
                    // Broadcast move to room
                    // Expect payload: { roomId: "...", x: 10, y: 20 }
                    const { roomId, ...data } = payload;
                    ws.publish(roomId, { type: "player_moved", sender: ws.id, data });
                }

                if (type === "chat") {
                    const { roomId, text } = payload;
                    ws.publish(roomId, { type: "chat_message", sender: ws.id, text });
                }
            },
            close(ws) {
                console.log("WS Closed", ws.id);
            }
        });
