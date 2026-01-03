import { Elysia, t } from "elysia";
import { auth } from "../auth";
import {
    applyInterrupt,
    castVote,
    createResonanceSession,
    getResonanceSession,
    getScenePayload,
    joinResonanceSession,
    performCheck,
    resumeIfPaused,
    sendKudos,
    setBrake,
    useItem,
} from "../../lib/resonance/resonanceStore";
import type { ResonanceArchetype, ResonanceRank } from "../../lib/resonance/types";

type AuthedUser = { id: string; type: 'clerk' | 'guest' };

export const resonanceRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/resonance", (app) =>
            app
                // Create session
                .post("/sessions", ({ user, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const session = createResonanceSession((user as AuthedUser).id, body.hostName);
                    return { session };
                }, {
                    body: t.Object({
                        hostName: t.Optional(t.String()),
                    })
                })

                // Join session
                .post("/sessions/:code/join", ({ user, params, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const name = body.name ?? 'Player';
                    const rank: ResonanceRank | undefined =
                        body.rank === 1 || body.rank === 2 || body.rank === 3 || body.rank === 4
                            ? (body.rank as ResonanceRank)
                            : undefined;
                    const session = joinResonanceSession(params.code, {
                        id: (user as AuthedUser).id,
                        name,
                        archetype: body.archetype as ResonanceArchetype | undefined,
                        rank,
                        deviceId: body.deviceId,
                    });
                    if (!session) return { error: "NOT_FOUND", status: 404 };
                    return { session, scene: getScenePayload(session, (user as AuthedUser).id) };
                }, {
                    body: t.Object({
                        name: t.Optional(t.String()),
                        archetype: t.Optional(t.String()),
                        rank: t.Optional(t.Number()),
                        deviceId: t.Optional(t.String()),
                    })
                })

                // Session state for a player (returns personal injection)
                .get("/sessions/:code/state", ({ user, params }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const session = getResonanceSession(params.code);
                    if (!session) return { error: "NOT_FOUND", status: 404 };
                    return {
                        session,
                        scene: getScenePayload(session, (user as AuthedUser).id),
                    };
                })

                // Vote inside current scene
                .post("/sessions/:code/vote", ({ user, params, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const result = castVote(params.code, (user as AuthedUser).id, body.optionId);
                    if (!result.session) return { error: result.error, status: 404 };
                    return {
                        session: result.session,
                        error: result.error,
                        scene: getScenePayload(result.session, (user as AuthedUser).id),
                    };
                }, {
                    body: t.Object({
                        optionId: t.String(),
                    })
                })

                // Skill check (для опций или сцены)
                .post("/sessions/:code/check", ({ user, params, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const session = getResonanceSession(params.code);
                    if (!session) return { error: "NOT_FOUND", status: 404 };
                    const scene = session ? getScenePayload(session).scene : null;
                    if (!scene) return { error: "SCENE_NOT_FOUND", status: 404 };
                    const check = body;
                    const positionOptimum: ResonanceRank | undefined =
                        check.positionOptimum === 1 || check.positionOptimum === 2 || check.positionOptimum === 3 || check.positionOptimum === 4
                            ? (check.positionOptimum as ResonanceRank)
                            : undefined;
                    const result = performCheck(session, scene, (user as AuthedUser).id, {
                        skill: check.skill,
                        dc: check.dc,
                        positionOptimum,
                        onSuccess: check.onSuccess,
                        onFail: check.onFail,
                    });
                    return { session, result, scene: getScenePayload(session, (user as AuthedUser).id) };
                }, {
                    body: t.Object({
                        skill: t.String(),
                        dc: t.Number(),
                        positionOptimum: t.Optional(t.Number()),
                        onSuccess: t.Optional(t.Any()),
                        onFail: t.Optional(t.Any()),
                    })
                })

                // Item use
                .post("/sessions/:code/item-use", ({ user, params, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const result = useItem(params.code, (user as AuthedUser).id, body);
                    if (!result.session) return { error: result.error, status: 404 };
                    return { session: result.session, scene: getScenePayload(result.session, (user as AuthedUser).id), error: result.error ?? null };
                }, {
                    body: t.Object({
                        itemId: t.String(),
                        targetPlayerId: t.Optional(t.String()),
                        context: t.Optional(t.String()),
                    })
                })

                // Interrupt (rebellion / force_next)
                .post("/sessions/:code/interrupt", ({ user, params, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const result = applyInterrupt(params.code, (user as AuthedUser).id, body);
                    if (!result.session) return { error: result.error, status: 404 };
                    return {
                        session: result.session,
                        error: result.error,
                        scene: getScenePayload(result.session, (user as AuthedUser).id),
                    };
                }, {
                    body: t.Object({
                        type: t.Union([t.Literal('rebellion'), t.Literal('force_next')]),
                        targetOptionId: t.Optional(t.String()),
                    })
                })

                // Brake (pause / resume)
                .post("/sessions/:code/brake", ({ user, params, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const session = body.active ? setBrake(params.code, true, (user as AuthedUser).id) : resumeIfPaused(params.code);
                    if (!session) return { error: "NOT_FOUND", status: 404 };
                    return { session, scene: getScenePayload(session, (user as AuthedUser).id) };
                }, {
                    body: t.Object({
                        active: t.Boolean(),
                    })
                })

                // Kudos after сцены
                .post("/sessions/:code/kudos", ({ user, params, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const session = sendKudos(params.code, (user as AuthedUser).id, body.toPlayerId, body.tag);
                    if (!session) return { error: "NOT_FOUND", status: 404 };
                    return { session };
                }, {
                    body: t.Object({
                        toPlayerId: t.String(),
                        tag: t.String(),
                    })
                })

                // Proxemic stub — принимает подсказки о расстоянии/жестах
                .post("/sessions/:code/proxemic", ({ user, params, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const session = resumeIfPaused(params.code);
                    if (!session) return { error: "NOT_FOUND", status: 404 };
                    // сохраняем как interrupt payload, чтобы не плодить отдельную структуру
                    const at = Date.now();
                    session.interrupts.push({
                        type: 'force_next',
                        playerId: (user as AuthedUser).id,
                        cost: 0,
                        at,
                        payload: { proxemic: { hint: body.hint, at } },
                    });
                    session.updatedAt = at;
                    return { session };
                }, {
                    body: t.Object({
                        hint: t.String(),
                    })
                })

                // Host manual next (for narrative/combat)
                .post("/sessions/:code/advance", ({ user, params, body }) => {
                    if (!user) return { error: "UNAUTHORIZED", status: 401 };
                    const session = getResonanceSession(params.code);
                    if (!session) return { error: "NOT_FOUND", status: 404 };
                    if (!session.players.find((p) => p.id === (user as AuthedUser).id)?.isHost) {
                        return { error: "FORBIDDEN", status: 403 };
                    }
                    session.votes = {};
                    const nextScene = body.nextSceneId;
                    if (nextScene) {
                        session.sceneId = nextScene;
                    }
                    session.updatedAt = Date.now();
                    return { session, scene: getScenePayload(session, (user as AuthedUser).id) };
                }, {
                    body: t.Object({
                        nextSceneId: t.Optional(t.String()),
                    })
                })
        );
