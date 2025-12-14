import { Elysia, t } from "elysia";
import { auth } from "../auth";

const lastSeen = new Map<string, number>();

export const presenceRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/presence", (app) =>
            app
                .get("/ping", () => ({ ok: true, timestamp: Date.now() }))

                .post("/heartbeat", ({ user }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    lastSeen.set(user.id, Date.now());
                    return { ok: true };
                })

                .get("/online", () => {
                    const now = Date.now();
                    const windowMs = 60_000;
                    const online = Array.from(lastSeen.entries())
                        .filter(([, ts]) => now - ts < windowMs)
                        .map(([id]) => id);
                    return { online, count: online.length };
                })
        );








