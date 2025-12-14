import { Elysia, t } from "elysia";
import { db } from "../../db";
import { players, gameProgress } from "../../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../auth";

export const SKILL_TREE = {
    "perception": {
        level: 5,
        subclasses: [
            {
                id: "sniper",
                name: "Sniper",
                description: "Master of long-range precision.",
                stats: { accuracy: 15, range: 10 }
            },
            {
                id: "scout",
                name: "Scout",
                description: "Expert in reconnaissance and stealth.",
                stats: { vision: 20, stealth: 10 }
            }
        ]
    },
    "solidarity": {
        level: 5,
        subclasses: [
            {
                id: "field_medic",
                name: "Field Medic",
                description: "Combat healer.",
                stats: { healing: 15, resistance: 5 }
            },
            {
                id: "guardian",
                name: "Guardian",
                description: "Protector of the weak.",
                stats: { defense: 15, aggro: 10 }
            }
        ]
    },
    "force": {
        level: 5,
        subclasses: [
            {
                id: "juggernaut",
                name: "Juggernaut",
                description: "Unstoppable force.",
                stats: { health: 30, speed: -5 }
            },
            {
                id: "breacher",
                name: "Breacher",
                description: "Close-quarters specialist.",
                stats: { melee: 15, destruction: 10 }
            }
        ]
    }
};

export const skillsRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/skills", (app) =>
            // GET /skills/tree
            app.get("/tree", () => SKILL_TREE)

                // GET /skills/subclasses
                .get("/subclasses", async ({ user }) => {
                    if (!user) return [];
                    const player = await db.query.players.findFirst({
                        where: user.type === 'clerk' ? eq(players.userId, user.id) : eq(players.deviceId, user.id)
                    });
                    if (!player) return [];

                    const progress = await db.query.gameProgress.findFirst({
                        where: eq(gameProgress.playerId, player.id)
                    });

                    return progress?.subclasses ?? [];
                })

                // POST /skills/unlock
                .post("/unlock", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const { subclassId, baseSkillId } = body;

                    const player = await db.query.players.findFirst({
                        where: user.type === 'clerk' ? eq(players.userId, user.id) : eq(players.deviceId, user.id)
                    });
                    if (!player) return { error: "Player not found", status: 404 };

                    const progress = await db.query.gameProgress.findFirst({
                        where: eq(gameProgress.playerId, player.id)
                    });
                    if (!progress) return { error: "Progress not found", status: 404 };

                    // Validation
                    const skillsMap = progress.skills as Record<string, number> || {};
                    const skillLevel = skillsMap[baseSkillId] || 0;

                    const requirement = (SKILL_TREE as any)[baseSkillId];
                    if (!requirement) return { error: "Invalid base skill", status: 400 };
                    if (skillLevel < requirement.level) return { error: "Skill level too low", status: 400 };

                    const currentSubclasses = progress.subclasses as string[] || [];
                    if (currentSubclasses.includes(subclassId)) return { error: "Already unlocked", status: 400 };

                    const isValidSubclass = requirement.subclasses.some((s: any) => s.id === subclassId);
                    if (!isValidSubclass) return { error: "Invalid subclass for this skill", status: 400 };

                    // Update
                    const newSubclasses = [...currentSubclasses, subclassId];
                    await db.update(gameProgress)
                        .set({ subclasses: newSubclasses })
                        .where(eq(gameProgress.id, progress.id));

                    return { success: true, subclasses: newSubclasses };

                }, {
                    body: t.Object({
                        subclassId: t.String(),
                        baseSkillId: t.String()
                    })
                })
        );
