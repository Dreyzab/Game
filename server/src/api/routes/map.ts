import { Elysia, t } from "elysia";
import { db } from "../../db";
import { mapPoints, pointDiscoveries, safeZones, dangerZones, players, gameProgress, questProgress, worldRifts } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "../auth";
import { awardXPAndLevelUp, mergeFlags, mergeReputation, needsSkillsNormalization, normalizeSkills, STARTING_SKILLS } from "../../lib/gameProgress";
import { awardItemsToPlayer } from "../../lib/itemAward";
import { getQrBonus, pickBonusOutcome, type QrAction } from "../../lib/qrBonuses";
import { SEED_NPCS } from "../../seeds/npcs";
import type { MapPointMetadata } from "../../shared/types/map";

// Haversine Helper
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const isUnlockRequirements = (value: unknown): value is { flags?: string[], phase?: number } =>
    typeof value === 'object' && value !== null;

function safeParseJson(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

type AuthUser = { id: string; type: 'clerk' | 'guest' };

const DEFAULT_SCENE_ID = 'prologue_coupe_start';
const SAFE_ID_RE = /^[a-z0-9_-]+$/i;

const CITY_REGISTERED_FLAG = 'city_registered';
const NICKNAME_FLAG = 'nickname_set';
const TOWNHALL_POINT_ID = 'rathaus_square';
const LEGACY_TOWNHALL_POINT_ID = 'mayor_aurelia_fox';
const SDG_DROP_ZONE_ID = 'sdg_drop_zone';
const SYNTHESIS_CAMPUS_POINT_ID = 'synthesis_campus';
const ONBOARDING_POLICE_SCENE_ID = 'onboarding_police_intro';
const ONBOARDING_POLICE_DIRECT_SCENE_ID = 'onboarding_police_direct';
const ONBOARDING_TOWNHALL_SCENE_ID = 'onboarding_townhall_registration';

function isSafeId(value: string): boolean {
    return SAFE_ID_RE.test(value);
}

async function ensurePlayer(user: AuthUser) {
    const existing = await db.query.players.findFirst({
        where: user.type === 'clerk'
            ? eq(players.userId, user.id)
            : eq(players.deviceId, user.id)
    });

    if (existing) return existing;

    const now = Date.now();
    const [created] = await db.insert(players).values({
        userId: user.type === 'clerk' ? user.id : undefined,
        deviceId: user.type === 'guest' ? user.id : undefined,
        name: user.type === 'guest' ? `Guest-${user.id.slice(0, 4)}` : 'Wanderer',
        createdAt: now,
        updatedAt: now
    }).returning();

    await db.insert(gameProgress).values({
        playerId: created.id,
        currentScene: DEFAULT_SCENE_ID,
        visitedScenes: [],
        flags: {},
        skills: STARTING_SKILLS,
        level: 1,
        xp: 0,
        skillPoints: 0,
        phase: 1,
        reputation: {},
        updatedAt: now
    });

    return created;
}

async function ensureProgress(playerId: number) {
    const existing = await db.query.gameProgress.findFirst({
        where: eq(gameProgress.playerId, playerId)
    });
    if (existing) {
        const patch: Partial<typeof existing> = {};
        if (!existing.visitedScenes) patch.visitedScenes = [];
        if (!existing.flags) patch.flags = {};
        if (!existing.skills || needsSkillsNormalization(existing.skills)) {
            patch.skills = normalizeSkills(existing.skills);
        }
        if ((existing as any).reputation === null || (existing as any).reputation === undefined) {
            (patch as any).reputation = {};
        }
        if (existing.phase === null || existing.phase === undefined) patch.phase = 1;

        if (Object.keys(patch).length > 0) {
            const [updated] = await db.update(gameProgress)
                .set({ ...patch, updatedAt: Date.now() })
                .where(eq(gameProgress.id, existing.id))
                .returning();
            return updated ?? { ...existing, ...patch };
        }
        return existing;
    }

    const now = Date.now();
    const [created] = await db.insert(gameProgress).values({
        playerId,
        currentScene: DEFAULT_SCENE_ID,
        visitedScenes: [],
        flags: {},
        skills: STARTING_SKILLS,
        level: 1,
        xp: 0,
        skillPoints: 0,
        phase: 1,
        reputation: {},
        updatedAt: now
    }).returning();

    return created;
}

type QrTrigger =
    | { kind: 'point'; pointId: string }
    | { kind: 'bonus'; bonusId: string };

function extractQrTriggerFromQrData(qrDataRaw: string): QrTrigger | null {
    const qrData = qrDataRaw.trim();
    if (!qrData) return null;

    // JSON payload support: {"pointId":"old_terminal"} or {"bonusId":"cache_medical_01"}
    if (qrData.startsWith('{') && qrData.endsWith('}')) {
        const parsed = safeParseJson(qrData) as any;
        const kindRaw = typeof parsed?.kind === 'string' ? parsed.kind : undefined;
        const kind = typeof kindRaw === 'string' ? kindRaw.toLowerCase() : undefined;

        const pointId = typeof parsed?.pointId === 'string' ? parsed.pointId : null;
        const bonusId = typeof parsed?.bonusId === 'string' ? parsed.bonusId : null;

        if ((kind === 'bonus' || kind === 'qr_bonus') && bonusId && isSafeId(bonusId)) {
            return { kind: 'bonus', bonusId };
        }
        if ((kind === 'point' || kind === 'map_point') && pointId && isSafeId(pointId)) {
            return { kind: 'point', pointId };
        }
        if (bonusId && isSafeId(bonusId)) return { kind: 'bonus', bonusId };
        if (pointId && isSafeId(pointId)) return { kind: 'point', pointId };
    }

    // URI patterns: gw3:point:<id>, gw3:bonus:<id>, echo://point/<id>, echo://bonus/<id>, etc.
    const patterns: Array<{ kind: QrTrigger['kind']; re: RegExp }> = [
        { kind: 'point', re: /^gw3:point:([a-z0-9_-]+)$/i },
        { kind: 'point', re: /^point:([a-z0-9_-]+)$/i },
        { kind: 'point', re: /^map_point:([a-z0-9_-]+)$/i },
        { kind: 'point', re: /^echo:\/\/point\/([a-z0-9_-]+)$/i },
        { kind: 'bonus', re: /^gw3:bonus:([a-z0-9_-]+)$/i },
        { kind: 'bonus', re: /^bonus:([a-z0-9_-]+)$/i },
        { kind: 'bonus', re: /^qr_bonus:([a-z0-9_-]+)$/i },
        { kind: 'bonus', re: /^echo:\/\/bonus\/([a-z0-9_-]+)$/i },
    ];

    for (const { kind, re } of patterns) {
        const match = qrData.match(re);
        if (match?.[1]) {
            return kind === 'point'
                ? { kind: 'point', pointId: match[1] }
                : { kind: 'bonus', bonusId: match[1] };
        }
    }

    // URL payload support:
    // - https://.../point/<id>, https://.../bonus/<id>
    // - https://.../qr/point/<id>, https://.../qr/bonus/<id>
    // - ?pointId=<id>, ?bonusId=<id>
    try {
        const url = new URL(qrData);
        const qpBonus = url.searchParams.get('bonusId') ?? url.searchParams.get('bonus');
        if (qpBonus && isSafeId(qpBonus)) return { kind: 'bonus', bonusId: qpBonus };

        const qpPoint = url.searchParams.get('pointId') ?? url.searchParams.get('point');
        if (qpPoint && isSafeId(qpPoint)) return { kind: 'point', pointId: qpPoint };

        const segments = url.pathname.split('/').filter(Boolean);
        for (let i = 0; i < segments.length - 1; i += 1) {
            const head = segments[i]?.toLowerCase();
            const candidate = segments[i + 1];
            if (!candidate || !isSafeId(candidate)) continue;

            if (head === 'point') return { kind: 'point', pointId: candidate };
            if (head === 'bonus') return { kind: 'bonus', bonusId: candidate };

            if (head === 'qr') {
                const next = candidate.toLowerCase();
                if (next === 'point' || next === 'bonus') {
                    const id = segments[i + 2];
                    if (!id || !isSafeId(id)) continue;
                    if (next === 'point') return { kind: 'point', pointId: id };
                    return { kind: 'bonus', bonusId: id };
                }

                // Legacy: /qr/<id> -> point
                return { kind: 'point', pointId: candidate };
            }
        }
    } catch {
        // Not a URL
    }

    // Bare id fallback (MVP): treat as point id
    if (isSafeId(qrData)) return { kind: 'point', pointId: qrData };

    return null;
}

async function unlockMapPointForUser(user: AuthUser, pointId: string) {
    const now = Date.now();

    const existing = await db.query.pointDiscoveries.findFirst({
        where: and(
            eq(pointDiscoveries.pointKey, pointId),
            user.type === 'clerk' ? eq(pointDiscoveries.userId, user.id) : eq(pointDiscoveries.deviceId, user.id)
        )
    });

    if (!existing) {
        await db.insert(pointDiscoveries).values({
            userId: user.type === 'clerk' ? user.id : undefined,
            deviceId: user.type === 'clerk' ? undefined : user.id,
            pointKey: pointId,
            discoveredAt: now,
            researchedAt: now,
            updatedAt: now,
        });
        return { status: 'researched' as const };
    }

    if (!existing.researchedAt) {
        await db.update(pointDiscoveries)
            .set({
                discoveredAt: existing.discoveredAt ?? now,
                researchedAt: now,
                updatedAt: now,
            })
            .where(eq(pointDiscoveries.id, existing.id));
        return { status: 'researched' as const };
    }

    return { status: 'already_researched' as const };
}

export const mapRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/map", (app) =>
            app
                // GET /map/points - Get visible points
                .get("/points", async ({ user, query }) => {
                    try {
                        const limit = Number(query.limit) || 100;
                        const bbox = query.minLat && query.maxLat && query.minLng && query.maxLng ? {
                            minLat: Number(query.minLat),
                            maxLat: Number(query.maxLat),
                            minLng: Number(query.minLng),
                            maxLng: Number(query.maxLng),
                        } : undefined;

                        let playerFlags: Record<string, any> = {};
                        let playerPhase: number | undefined = undefined;
                        let activeQuestIds = new Set<string>();
                        let isCityRegistered = true;

                        if (user) {
                            const player = await ensurePlayer(user as AuthUser);
                            const prog = await ensureProgress(player.id);
                            playerFlags = (prog.flags as Record<string, any>) || {};
                            isCityRegistered = playerFlags[CITY_REGISTERED_FLAG] === true;

                            // playerPhase logic if we had it in gameProgress, currently not in schema but inferred or passed

                            // Quests
                            const qProgs = await db.query.questProgress.findMany({
                                where: eq(questProgress.playerId, player.id)
                            });
                            for (const q of qProgs) {
                                if (q.status === 'active') activeQuestIds.add(q.questId);
                            }
                        }

                        // Load point discoveries
                        const myDiscoveries = user ? await db.query.pointDiscoveries.findMany({
                            where: user.type === 'clerk' ? eq(pointDiscoveries.userId, user.id) : eq(pointDiscoveries.deviceId, user.id)
                        }) : [];
                        const discoveredPointIds = new Set(myDiscoveries.map(d => d.pointKey));

                        // Onboarding Logic
                        if (user && !isCityRegistered) {
                            const hasArrivalFlag =
                                playerFlags['arrived_at_freiburg'] === true ||
                                playerFlags['need_info_bureau'] === true ||
                                playerFlags['prologue_complete'] === true;

                            if (hasArrivalFlag) {
                                activeQuestIds.add('delivery_for_dieter');
                                activeQuestIds.add('delivery_for_professor');
                                activeQuestIds.add('city_registration');
                            }

                            // Special handling for pre-registration flow:
                            // 1. SDG (Start) is always visible.
                            // 2. Rathaus (Registration) is visible only after arrival.
                            const visibleOnboardingIds = new Set<string>();
                            visibleOnboardingIds.add(SDG_DROP_ZONE_ID);

                            if (hasArrivalFlag) {
                                visibleOnboardingIds.add(TOWNHALL_POINT_ID);
                                visibleOnboardingIds.add(LEGACY_TOWNHALL_POINT_ID);
                                visibleOnboardingIds.add(SYNTHESIS_CAMPUS_POINT_ID);
                            }

                            // Fetch strictly relevant points
                            const onboardingPoints = await db.query.mapPoints.findMany({
                                where: eq(mapPoints.isActive, true)
                            });

                            const visiblePoints = onboardingPoints.filter(p => visibleOnboardingIds.has(p.id));

                            // ... (keep existing mapping/enrichment logic, simplified for this scope)
                            const results = await Promise.all(visiblePoints.map(async (point) => {
                                const meta = (point.metadata as any) || {};

                                // Discovery Status
                                let status = 'not_found';
                                let discoveredAt: number | undefined;
                                let researchedAt: number | undefined;

                                const discovery = myDiscoveries.find(d => d.pointKey === point.id); // In-memory find
                                if (discovery) {
                                    if (discovery.researchedAt) status = 'researched';
                                    else if (discovery.discoveredAt) status = 'discovered';
                                    discoveredAt = discovery.discoveredAt || undefined;
                                    researchedAt = discovery.researchedAt || undefined;
                                }

                                // Auto-discover SDG if not discovered
                                if (point.id === SDG_DROP_ZONE_ID && !discovery && status === 'not_found') {
                                    status = 'discovered'; // Treat as discovered for UI
                                }

                                const questBindings = Array.isArray(meta.questBindings) ? meta.questBindings : [];
                                const isQuestTarget = questBindings.some((id: string) => activeQuestIds.has(id));

                                let finalMeta = { ...meta };

                                // Ensure SDG onboarding scene exists even if DB seed is outdated.
                                if (point.id === SDG_DROP_ZONE_ID) {
                                    const bindings = (finalMeta as any).sceneBindings;
                                    const hasSdgArrival =
                                        Array.isArray(bindings) &&
                                        bindings.some((b: any) => b?.sceneId === 'onboarding_sdg_arrival');

                                    if (!hasSdgArrival) {
                                        finalMeta = {
                                            ...finalMeta,
                                            sceneBindings: [
                                                ...(Array.isArray(bindings) ? bindings : []),
                                                {
                                                    sceneId: 'onboarding_sdg_arrival',
                                                    triggerType: 'click',
                                                    conditions: { notFlags: ['arrived_at_freiburg'] },
                                                    priority: 100,
                                                },
                                            ],
                                        };
                                    }
                                }

                                if (point.id === TOWNHALL_POINT_ID || point.id === LEGACY_TOWNHALL_POINT_ID) {
                                    finalMeta = { ...finalMeta, isGlobalObjective: true };
                                    // Ensure registration scene
                                    if (!Array.isArray((finalMeta as any).sceneBindings)) {
                                        finalMeta = {
                                            ...finalMeta,
                                            sceneBindings: [
                                                {
                                                    sceneId: ONBOARDING_TOWNHALL_SCENE_ID,
                                                    triggerType: 'click',
                                                    conditions: { notFlags: [CITY_REGISTERED_FLAG] },
                                                    priority: 100,
                                                },
                                            ],
                                        };
                                    }
                                }

                                if (isQuestTarget) {
                                    finalMeta = { ...finalMeta, isActiveQuestTarget: true };
                                }

                                // Synthesis campus default bindings
                                if (point.id === SYNTHESIS_CAMPUS_POINT_ID) {
                                    const bindings = (finalMeta as any).sceneBindings || [];
                                    const hasCampusScenes = bindings.some((b: any) => b?.sceneId === 'university_gate_denial');
                                    if (!hasCampusScenes) {
                                        finalMeta = {
                                            ...finalMeta,
                                            sceneBindings: [
                                                { sceneId: 'university_wait_evening', triggerType: 'click', conditions: { flags: ['waiting_for_kruger'] }, priority: 100 },
                                                { sceneId: 'university_gate_denial', triggerType: 'click', conditions: { notFlags: ['visited_synthesis_campus'] }, priority: 90 },
                                            ]
                                        };
                                    }
                                }

                                if (finalMeta.qrRequired === true) {
                                    finalMeta = { ...finalMeta, isUnlocked: Boolean(researchedAt) };
                                }

                                // Don't leak qrCode
                                return {
                                    id: point.id,
                                    title: point.title,
                                    description: point.description,
                                    lat: point.lat,
                                    lng: point.lng,
                                    type: point.type,
                                    phase: point.phase,
                                    isActive: point.isActive,
                                    metadata: finalMeta,
                                    status,
                                    discoveredAt,
                                    researchedAt,
                                };
                            }));

                            return { points: results };
                        }

                        // --- FULL GAME LOGIC ---

                        // 1. Derived Quest Flags (keep existing logic)
                        const hasArrivalFlag = playerFlags['arrived_at_freiburg'] === true || playerFlags['need_info_bureau'] === true;
                        if (hasArrivalFlag) {
                            activeQuestIds.add('delivery_for_dieter');
                            activeQuestIds.add('delivery_for_professor');
                        }
                        const needsCityRegistration = playerFlags['city_registered'] !== true;
                        if (hasArrivalFlag && needsCityRegistration) activeQuestIds.add('city_registration');
                        if (playerFlags['chance_for_newbie_active'] === true) activeQuestIds.add('chance_for_a_newbie');
                        if (playerFlags['whispers_quest_active'] === true) activeQuestIds.add('whispers_of_rift');
                        if (playerFlags['shopkeeper_truant_active'] === true) activeQuestIds.add('shopkeeper_truant');

                        // 2. Fetch All Active Points
                        const allPoints = await db.query.mapPoints.findMany({
                            where: eq(mapPoints.isActive, true),
                            limit: 1000 // Increase limit to filter in memory
                        });

                        // 3. Rifts Injection
                        const activeRifts = await db.query.worldRifts.findMany();
                        const dangerZonesList = await db.query.dangerZones.findMany();

                        const riftPoints = activeRifts.map(rift => {
                            const zone = dangerZonesList.find(z => z.key === rift.zoneKey);
                            if (!zone || !zone.spawnPoints || !Array.isArray(zone.spawnPoints)) return null;

                            // Use spawnPointIdx or fallback to 0
                            const spawnPoint = zone.spawnPoints[rift.spawnPointIdx || 0] as { lat: number, lng: number };
                            if (!spawnPoint) return null;

                            // Map Rift State to visual
                            // TBD: Add logic to check lastTickAt here (Lazy Tick) and update if needed?
                            // For now just display.

                            return {
                                id: `rift_${rift.id}`,
                                title: `Разлом: ${zone.title || 'Unknown'}`,
                                description: 'Аномальная активность. Пространство искажено.',
                                lat: spawnPoint.lat,
                                lng: spawnPoint.lng,
                                type: 'anomaly',
                                phase: 1,
                                isActive: true,
                                metadata: {
                                    category: 'rift',
                                    state: rift.state,
                                    intensity: rift.intensity,
                                    danger_level: 'high',
                                    isDynamic: true
                                },
                                // Treat as discovered immediately if active
                                status: 'discovered',
                                discoveredAt: Date.now(),
                                researchedAt: undefined
                            };
                        }).filter(Boolean) as any[];

                        // 4. NPC Generation (keep existing)
                        const npcPoints = SEED_NPCS.map(npc => {
                            const locationId = npc.defaultLocationId;
                            const locationPoint = allPoints.find(p => p.id === locationId);
                            if (!locationPoint) return null;

                            // Check visibility requirements for NPCS? 
                            // Currently we assume if location is visible, NPC might be too, OR we filter later.

                            return {
                                id: `npc_${npc.name}`,
                                title: npc.characterName,
                                description: npc.description,
                                lat: locationPoint.lat,
                                lng: locationPoint.lng,
                                type: 'npc',
                                phase: 1,
                                isActive: true,
                                metadata: {
                                    characterName: npc.characterName,
                                    npcId: npc.id,
                                    archetype: npc.archetype,
                                    faction: npc.faction,
                                    philosophy: npc.philosophy,
                                    ethel_affinity: npc.ethel_affinity,
                                    perk: npc.perk,
                                    services: npc.services,
                                    dialogues: npc.dialogues,
                                    questBindings: npc.questBindings,
                                    atmosphere: npc.atmosphere,
                                    sceneBindings: npc.sceneBindings,
                                    unlockRequirements: npc.unlockRequirements,
                                    danger_level: npc.danger_level
                                },
                                createdAt: Date.now()
                            };
                        }).filter(Boolean) as any[];

                        // 5. Combine & Filter
                        let combinedPoints = [...allPoints, ...npcPoints, ...riftPoints];

                        if (bbox) {
                            combinedPoints = combinedPoints.filter(p =>
                                p.lat >= bbox.minLat && p.lat <= bbox.maxLat &&
                                p.lng >= bbox.minLng && p.lng <= bbox.maxLng
                            );
                        }

                        const results = await Promise.all(combinedPoints.slice(0, limit).map(async (point: any) => {
                            const meta = (point.metadata as any) || {};

                            // Skip Hidden Points NOT discovered
                            if (meta.visibility?.initiallyHidden === true) {
                                // Dynamic points (Rifts/NPCs) usually don't have this set, or we handle it above.
                                // DB Points check:
                                if (!discoveredPointIds.has(point.id)) {
                                    return null;
                                }
                            }

                            // ... (Standard Discovery/Unlock Logic similar to Onboarding block)
                            let status = 'not_found';
                            let discoveredAt: number | undefined;
                            let researchedAt: number | undefined;

                            if (point.type === 'anomaly') {
                                // Rifts are always discovered if active
                                status = 'discovered';
                            } else {
                                const discovery = myDiscoveries.find(d => d.pointKey === point.id);
                                if (discovery) {
                                    if (discovery.researchedAt) status = 'researched';
                                    else if (discovery.discoveredAt) status = 'discovered';
                                    discoveredAt = discovery.discoveredAt || undefined;
                                    researchedAt = discovery.researchedAt || undefined;
                                }
                            }

                            // Unlock filter
                            const unlockReqs = isUnlockRequirements(meta?.unlockRequirements) ? meta?.unlockRequirements : undefined;
                            if (unlockReqs) {
                                if (Array.isArray(unlockReqs.flags)) {
                                    if (!unlockReqs.flags.every((f: string) => playerFlags[f] === true)) return null;
                                }
                                if (unlockReqs.phase !== undefined && playerPhase !== undefined) {
                                    if (playerPhase < unlockReqs.phase) return null;
                                }
                            }

                            // Quest Bindings
                            const questBindings = Array.isArray(meta.questBindings) ? meta.questBindings : [];
                            const isQuestTarget = questBindings.some((id: string) => activeQuestIds.has(id));
                            let finalMeta = isQuestTarget ? { ...meta, isActiveQuestTarget: true } : meta;

                            // Inject default scenes for stability
                            if (point.id === SYNTHESIS_CAMPUS_POINT_ID) {
                                const bindings = (finalMeta as any).sceneBindings || [];
                                const hasCampusScenes = bindings.some((b: any) => b?.sceneId === 'university_gate_denial');
                                if (!hasCampusScenes) {
                                    finalMeta = {
                                        ...finalMeta,
                                        sceneBindings: [
                                            { sceneId: 'university_wait_evening', triggerType: 'click', conditions: { flags: ['waiting_for_kruger'] }, priority: 100 },
                                            { sceneId: 'university_gate_denial', triggerType: 'click', conditions: { notFlags: ['visited_synthesis_campus'] }, priority: 90 },
                                        ]
                                    };
                                }
                            }

                            if (finalMeta.qrRequired === true) {
                                finalMeta = { ...finalMeta, isUnlocked: Boolean(researchedAt) };
                            }

                            return {
                                id: point.id,
                                title: point.title,
                                description: point.description,
                                lat: point.lat,
                                lng: point.lng,
                                type: point.type,
                                phase: point.phase,
                                isActive: point.isActive,
                                metadata: finalMeta,
                                status,
                                discoveredAt,
                                researchedAt,
                            };
                        }));

                        return { points: results.filter(Boolean) };
                    } catch (e: any) {
                        // #region agent log (debug)

                        // #endregion agent log (debug)
                        throw e;
                    }
                })

                // POST /map/discover
                .post("/discover", async ({ user, body }) => {
                    const { lat, lng } = body;
                    if (!user) return { success: false }; // Allow silent fail if no user?

                    // Find nearby points
                    const radiusKm = 0.015; // 15m - player visibility radius
                    const allPoints = await db.query.mapPoints.findMany({ where: eq(mapPoints.isActive, true) });

                    const discoveredIds = [];
                    const now = Date.now();

                    for (const p of allPoints) {
                        const dist = calculateDistance(lat, lng, p.lat, p.lng);
                        if (dist <= radiusKm) {
                            // Check visibility rules
                            const meta = (p.metadata as any) || {};
                            if (meta.visibility?.initiallyHidden === true) {
                                // If specifically marked as NOT discoverable by proximity (e.g. quest only), skip.
                                // Default to true if not specified.
                                if (meta.visibility?.discoverableByProximity === false) {
                                    continue;
                                }
                            }

                            // Upsert Discovery
                            const existing = await db.query.pointDiscoveries.findFirst({
                                where: and(
                                    eq(pointDiscoveries.pointKey, p.id),
                                    user.type === 'clerk' ? eq(pointDiscoveries.userId, user.id) : eq(pointDiscoveries.deviceId, user.id)
                                )
                            });

                            if (!existing) {
                                await db.insert(pointDiscoveries).values({
                                    userId: user.type === 'clerk' ? user.id : undefined,
                                    deviceId: user.type === 'clerk' ? undefined : user.id,
                                    pointKey: p.id,
                                    discoveredAt: now,
                                    updatedAt: now
                                });
                                discoveredIds.push(p.id);
                            } else if (!existing.discoveredAt) {
                                await db.update(pointDiscoveries)
                                    .set({ discoveredAt: now, updatedAt: now })
                                    .where(eq(pointDiscoveries.id, existing.id));
                                discoveredIds.push(p.id);
                            }
                        }
                    }
                    return { success: true, discoveredIds };
                }, {
                    body: t.Object({ lat: t.Number(), lng: t.Number() })
                })

                // POST /map/activate-qr
                // MVP: QR unlock marks point as researched (and thus interactable)
                .post("/activate-qr", async ({ user, body }) => {
                    if (!user) return { success: false, error: "Unauthorized", status: 401 };

                    const qrData = body.qrData.trim();
                    if (!qrData) return { success: false, error: "Invalid qrData", status: 400 };

                    const trigger = extractQrTriggerFromQrData(qrData);
                    const bodyPointId = body.pointId?.trim() || undefined;

                    const player = await ensurePlayer(user as AuthUser);
                    const progress = await ensureProgress(player.id);
                    const currentFlags = (progress.flags as Record<string, any>) || {};
                    const isCityRegistered = currentFlags[CITY_REGISTERED_FLAG] === true;
                    const hasNickname = currentFlags[NICKNAME_FLAG] === true;

                    // Onboarding gate: any QR scanned before city registration routes into onboarding flow.
                    // We intentionally do not execute the QR's actual functionality until the player is registered.
                    if (!isCityRegistered) {
                        const requestedPointId =
                            bodyPointId ?? (trigger?.kind === 'point' ? trigger.pointId : undefined);
                        const isTownhallQr =
                            requestedPointId === TOWNHALL_POINT_ID || requestedPointId === LEGACY_TOWNHALL_POINT_ID;

                        const actions: QrAction[] = !hasNickname
                            ? [{ type: 'start_vn', sceneId: ONBOARDING_POLICE_SCENE_ID }]
                            : isTownhallQr
                                ? [{ type: 'start_vn', sceneId: ONBOARDING_TOWNHALL_SCENE_ID }]
                                : [{ type: 'start_vn', sceneId: ONBOARDING_POLICE_DIRECT_SCENE_ID }];

                        // Special case: we still "research" the Town Hall point on scan so the map UI can
                        // treat it as unlocked, even though the player isn't registered yet.
                        if (hasNickname && isTownhallQr) {
                            const townhallPointIdForUnlock =
                                requestedPointId === LEGACY_TOWNHALL_POINT_ID
                                    ? LEGACY_TOWNHALL_POINT_ID
                                    : TOWNHALL_POINT_ID;
                            await unlockMapPointForUser(user as AuthUser, townhallPointIdForUnlock);
                        }

                        return {
                            success: true,
                            kind: 'onboarding',
                            gated: true,
                            actions,
                        };
                    }

                    // BONUS QR (only when caller isn't explicitly targeting a point)
                    if (!bodyPointId && trigger?.kind === 'bonus') {
                        const bonus = getQrBonus(trigger.bonusId);
                        if (!bonus) return { success: false, error: "Bonus not found", status: 404 };

                        const oneTime = bonus.oneTime !== false;
                        const claimFlag = `qr_bonus_${bonus.id}_claimed`;

                        const currentFlags = (progress.flags as Record<string, any>) || {};
                        if (oneTime && currentFlags[claimFlag] === true) {
                            const actions: QrAction[] = [
                                { type: 'notice', message: 'Этот QR уже активирован.' }
                            ];
                            return {
                                success: true,
                                kind: 'bonus',
                                bonusId: bonus.id,
                                title: bonus.title,
                                alreadyClaimed: true,
                                actions,
                                awardedItems: [],
                            };
                        }

                        const outcome = pickBonusOutcome(bonus);
                        const actions = (outcome.actions ?? []) as QrAction[];

                        const returnedActions: QrAction[] = [];
                        const awardedItems: Array<{ itemId: string; quantity: number; dbId?: string }> = [];

                        let nextFlags: Record<string, unknown> = (progress.flags as any) || {};
                        let nextGold = progress.gold ?? 0;
                        let nextLevel = progress.level ?? 1;
                        let nextXP = progress.xp ?? 0;
                        let nextSkillPoints = progress.skillPoints ?? 0;
                        let nextReputation: Record<string, number> = ((progress as any).reputation as any) || {};

                        let progressDirty = false;
                        const addNotice = (message: string) => returnedActions.push({ type: 'notice', message });

                        for (const action of actions) {
                            switch (action.type) {
                                case 'notice':
                                case 'start_vn':
                                case 'start_tutorial_battle':
                                    returnedActions.push(action);
                                    break;

                                case 'unlock_point': {
                                    const point = await db.query.mapPoints.findFirst({
                                        where: eq(mapPoints.id, action.pointId),
                                    });
                                    if (!point) {
                                        addNotice(`Точка не найдена: ${action.pointId}`);
                                        break;
                                    }
                                    await unlockMapPointForUser(user as AuthUser, point.id);
                                    returnedActions.push(action);
                                    break;
                                }

                                case 'grant_items': {
                                    const results = await awardItemsToPlayer(player.id, action.items);
                                    const failures: string[] = [];
                                    for (const result of results) {
                                        if (result.success) {
                                            awardedItems.push({
                                                itemId: result.itemId,
                                                quantity: result.quantity,
                                                dbId: result.dbId,
                                            });
                                        } else {
                                            failures.push(result.itemId);
                                        }
                                    }
                                    if (failures.length > 0) {
                                        addNotice(`Не удалось выдать предметы: ${failures.join(', ')}`);
                                    }
                                    returnedActions.push(action);
                                    break;
                                }

                                case 'grant_gold':
                                    nextGold += action.amount;
                                    progressDirty = true;
                                    returnedActions.push(action);
                                    break;

                                case 'grant_xp': {
                                    const xpResult = awardXPAndLevelUp(nextLevel, nextXP, nextSkillPoints, action.amount);
                                    nextLevel = xpResult.level;
                                    nextXP = xpResult.xp;
                                    nextSkillPoints = xpResult.skillPoints;
                                    progressDirty = true;
                                    returnedActions.push(action);
                                    break;
                                }

                                case 'add_flags':
                                    nextFlags = mergeFlags(nextFlags, action.flags, undefined);
                                    progressDirty = true;
                                    returnedActions.push(action);
                                    break;

                                case 'remove_flags':
                                    nextFlags = mergeFlags(nextFlags, undefined, action.flags);
                                    progressDirty = true;
                                    returnedActions.push(action);
                                    break;

                                case 'grant_reputation':
                                    nextReputation = mergeReputation(nextReputation, action.reputation);
                                    progressDirty = true;
                                    returnedActions.push(action);
                                    break;
                            }
                        }

                        if (oneTime && (nextFlags as any)[claimFlag] !== true) {
                            nextFlags = mergeFlags(nextFlags, [claimFlag], undefined);
                            progressDirty = true;
                        }

                        if (progressDirty) {
                            await db.update(gameProgress)
                                .set({
                                    flags: nextFlags as any,
                                    gold: nextGold,
                                    level: nextLevel,
                                    xp: nextXP,
                                    skillPoints: nextSkillPoints,
                                    reputation: nextReputation as any,
                                    updatedAt: Date.now(),
                                })
                                .where(eq(gameProgress.id, progress.id));
                        }

                        return {
                            success: true,
                            kind: 'bonus',
                            bonusId: bonus.id,
                            title: bonus.title,
                            alreadyClaimed: false,
                            actions: returnedActions,
                            awardedItems,
                        };
                    }

                    // POINT QR
                    const extractedPointId = trigger?.kind === 'point' ? trigger.pointId : null;
                    const requestedPointId = bodyPointId ?? extractedPointId;

                    let point = requestedPointId
                        ? await db.query.mapPoints.findFirst({ where: eq(mapPoints.id, requestedPointId) })
                        : null;

                    if (!point) {
                        // Allow secret QR stored in map_points.qr_code (when payload doesn't encode point id)
                        point = await db.query.mapPoints.findFirst({ where: eq(mapPoints.qrCode, qrData) });
                    }

                    if (!point) return { success: false, error: "Point not found", status: 404 };

                    const meta = (point.metadata as any) || {};
                    const expectedQr = point.qrCode ?? meta.qrCode ?? meta?.activation?.qrCodeId;
                    const isQrRequired = meta.qrRequired === true;

                    // QR-gated points must have a secret payload configured.
                    // Never allow "point id" fallback for qrRequired points, otherwise the QR can be bypassed.
                    if (isQrRequired && !expectedQr) {
                        return { success: false, error: "QR is required for this point but is not configured", status: 500 };
                    }

                    if (expectedQr) {
                        if (qrData !== expectedQr) {
                            return { success: false, error: "QR does not match this point", status: 400 };
                        }
                    } else {
                        if (!extractedPointId || extractedPointId !== point.id) {
                            return { success: false, error: "QR does not match this point", status: 400 };
                        }
                    }

                    const unlockResult = await unlockMapPointForUser(user as AuthUser, point.id);

                    return {
                        success: true,
                        kind: 'point',
                        pointId: point.id,
                        status: 'researched',
                        unlockStatus: unlockResult.status,
                        actions: [{ type: 'unlock_point', pointId: point.id }] as QrAction[],
                    };
                }, {
                    body: t.Object({
                        qrData: t.String(),
                        pointId: t.Optional(t.String()),
                    })
                })

                // GET /map/zones
                .get("/zones", async () => {
                    const allZones = await db.query.zones.findMany();
                    const allSafe = await db.query.safeZones.findMany({ where: eq(safeZones.isActive, true) });
                    const allDanger = await db.query.dangerZones.findMany({ where: eq(dangerZones.isActive, true) });

                    // Fetch active rifts to calculate effective danger
                    const activeRifts = await db.query.worldRifts.findMany({
                        where: eq(worldRifts.state, 'breach') // Only breaches increase zone danger? Or unstable too?
                    });

                    const effectiveDangerZones = allDanger.map(zone => {
                        const rift = activeRifts.find(r => r.zoneKey === zone.key);
                        if (rift) {
                            // Simple modifier logic: if rift is active, upgrade danger level
                            // low -> medium -> high -> critical?
                            // For now just marking it as enhanced
                            return {
                                ...zone,
                                hasActiveRift: true,
                                riftIntensity: rift.intensity,
                                // logic to upgrade dangerLevel string if needed, e.g.:
                                // dangerLevel: upgradeDangerLevel(zone.dangerLevel, rift.intensity)
                            };
                        }
                        return zone;
                    });

                    return {
                        zones: allZones,
                        safeZones: allSafe,
                        dangerZones: effectiveDangerZones
                    };
                })
        );
