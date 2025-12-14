import { Elysia, t } from "elysia";
import { auth } from "../auth";
import { createPvpMatch, getPvpMatch, joinPvpMatch } from "../../lib/roomStore";

type AuthedUser = { id: string; type: 'clerk' | 'guest' };

export const pvpRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/pvp", (app) =>
            app
                .post("/queue", async ({ user }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const match = createPvpMatch((user as AuthedUser).id);
                    return { match };
                })

                .post("/match/:id/join", async ({ user, params }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const match = joinPvpMatch(params.id, (user as AuthedUser).id);
                    if (!match) return { error: "Match not found", status: 404 };
                    return { match };
                })

                .get("/match/:id", async ({ params }) => {
                    const match = getPvpMatch(params.id);
                    if (!match) return { error: "Match not found", status: 404 };
                    return { match };
                })
        );








