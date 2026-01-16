import { Elysia, t } from "elysia";
import { auth } from "../api/auth";
import { eventBus } from "../lib/bus";
import { getSession } from "../services/survivalService";

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

                // Survival mode socket handlers
                if (type === "survival:join") {
                    const { sessionId } = payload;
                    ws.subscribe(`survival:${sessionId}`);
                    // console.log(`Socket ${ws.id} subscribed to survival:${sessionId}`);
                }

                // Time sync (NTP-style) for survival mode
                if (type === "survival:time_ping") {
                    const serverT1 = Date.now(); // receive time
                    const { sessionId, clientT0 } = payload;

                    // Get worldTimeMs from session
                    const state = getSession(sessionId);
                    const worldTimeMs = state?.worldTimeMs ?? 0;

                    const serverT2 = Date.now(); // send time
                    ws.send(JSON.stringify({
                        type: "survival:time_pong",
                        data: {
                            clientT0,
                            serverT1,
                            serverT2,
                            worldTimeMs,
                            worldDay: state?.worldDay ?? 1,
                            worldTimeMinutes: state?.worldTimeMinutes ?? 360,
                            phase: state?.phase ?? 'start',
                        }
                    }));
                }
            },
        })
        .onStart(() => {
            // Coop event bus listener
            eventBus.on('coop_update', ({ roomId, data }) => {
                app.server?.publish(`coop:${roomId}`, JSON.stringify({
                    type: 'coop_update',
                    data
                }));
            });

            // Survival event bus listeners
            eventBus.on('survival_update', ({ sessionId, state }) => {
                app.server?.publish(`survival:${sessionId}`, JSON.stringify({
                    type: 'survival:state_update',
                    data: state
                }));
            });

            eventBus.on('survival_log', ({ sessionId, entry }) => {
                app.server?.publish(`survival:${sessionId}`, JSON.stringify({
                    type: 'survival:log_entry',
                    data: entry
                }));
            });

            eventBus.on('survival_timer', ({ sessionId, timerSeconds, worldDay, worldTimeMinutes, phase }) => {
                app.server?.publish(`survival:${sessionId}`, JSON.stringify({
                    type: 'survival:timer_sync',
                    data: { timerSeconds, worldDay, worldTimeMinutes, phase }
                }));
            });
        });
