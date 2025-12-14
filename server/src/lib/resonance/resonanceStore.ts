import { RESONANCE_EPISODE } from './scenario';
import type {
    Episode,
    InterruptState,
    ItemUsePayload,
    ResonanceArchetype,
    ResonanceItem,
    ResonancePlayer,
    ResonanceRank,
    ResonanceSession,
    SceneDelta,
    SceneNode,
    SceneRewards,
    SceneCheck,
    VoteState,
} from './types';
import { db } from '../../db';
import {
    resonanceChecksLog,
    resonanceItemUses,
    resonanceItems,
    resonancePlayerItems,
    resonanceSessions,
} from '../../db/schema';

const archetypes: ResonanceArchetype[] = ['guardian', 'skeptic', 'empath', 'visionary'];

function generateCode(length = 5) {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i += 1) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
}

function pickArchetype(used: ResonanceArchetype[]): ResonanceArchetype {
    const available = archetypes.find((a) => !used.includes(a));
    return available ?? archetypes[Math.floor(Math.random() * archetypes.length)];
}

function now() {
    return Date.now();
}

type SessionStore = Map<string, ResonanceSession>;

const sessions: SessionStore = new Map();
const episodes: Record<string, Episode> = {
    [RESONANCE_EPISODE.id]: RESONANCE_EPISODE,
};
const itemsDict: Record<string, ResonanceItem> = {
    insight_lens_t1: { id: 'insight_lens_t1', name: 'Линзы наблюдателя', slot: 'main', charges: 2, cooldownScenes: 1, data: { skillMods: { insight: 2 } } },
    data_copy: { id: 'data_copy', name: 'Шифрованная копия данных', slot: 'rare' },
    bonus_pay: { id: 'bonus_pay', name: 'Бонусный гонорар', slot: 'rare' },
};

function findScene(episodeId: string, sceneId: string): SceneNode | undefined {
    const episode = episodes[episodeId];
    return episode?.scenes[sceneId];
}

export function createResonanceSession(hostId: string, name?: string) {
    let code = generateCode();
    while (sessions.has(code)) {
        code = generateCode();
    }

    const episode = RESONANCE_EPISODE;
    const hostArchetype = pickArchetype([]);
    const session: ResonanceSession = {
        code,
        episodeId: episode.id,
        sceneId: episode.entry,
        status: 'lobby',
        strain: 0,
        trust: 0,
        alert: 0,
        players: [
            {
                id: hostId,
                name: name ?? 'Хост',
                archetype: hostArchetype,
                rank: 2,
                conviction: 3,
                isHost: true,
                statuses: [],
                items: [{ id: 'insight_lens_t1', charges: 2 }],
            },
        ],
        votes: {},
        interrupts: [],
        createdAt: now(),
        updatedAt: now(),
    };
    sessions.set(code, session);
    // persist base session row for reference (best-effort)
    db.insert(resonanceSessions).values({
        code,
        episodeId: episode.id,
        sceneId: episode.entry,
        status: 'lobby',
        strain: 0,
        trust: 0,
        alert: 0,
        createdAt: now(),
        updatedAt: now(),
    }).returning({ id: resonanceSessions.id }).then(async (rows) => {
        const sessionId = rows[0]?.id;
        if (typeof sessionId === 'number') {
            session.dbId = sessionId;
            // best-effort persist host starter items
            const host = session.players[0];
            const hostPlayerDbId = Number.isFinite(Number(host.id)) ? Number(host.id) : null;
            if (host.items && hostPlayerDbId !== null) {
                for (const it of host.items) {
                    await db.insert(resonancePlayerItems).values({
                        sessionId,
                        playerId: hostPlayerDbId,
                        itemId: it.id,
                        state: { charges: it.charges },
                        createdAt: now(),
                    }).onConflictDoUpdate({
                        target: [resonancePlayerItems.sessionId, resonancePlayerItems.playerId, resonancePlayerItems.itemId],
                        set: { state: { charges: it.charges } },
                    }).catch(() => {});
                }
            }
        }
    }).catch(() => {});
    return session;
}

export function getResonanceSession(code: string) {
    return sessions.get(code);
}

export function joinResonanceSession(code: string, player: { id: string; name: string; archetype?: ResonanceArchetype; rank?: ResonanceRank; deviceId?: string }) {
    const session = sessions.get(code);
    if (!session) return null;
    const existing = session.players.find((p) => p.id === player.id || (player.deviceId && p.deviceId === player.deviceId));
    const desiredArchetype = player.archetype ?? pickArchetype(session.players.map((p) => p.archetype));
    const desiredRank = player.rank ?? 3;

    if (existing) {
        existing.name = player.name ?? existing.name;
        existing.archetype = player.archetype ?? existing.archetype;
        existing.rank = desiredRank as ResonanceRank;
        existing.deviceId = player.deviceId ?? existing.deviceId;
        existing.statuses = existing.statuses ?? [];
        existing.items = existing.items ?? [{ id: 'insight_lens_t1', charges: 2 }];
    } else {
        session.players.push({
            id: player.id,
            name: player.name ?? `Игрок ${session.players.length + 1}`,
            archetype: desiredArchetype,
            rank: desiredRank as ResonanceRank,
            conviction: 3,
            isHost: false,
            deviceId: player.deviceId,
            statuses: [],
            items: [{ id: 'insight_lens_t1', charges: 2 }],
        });
    }
    // best-effort persist starter items for the new player if we have dbId
    if (session.dbId) {
        const sessionDbId = session.dbId;
        const target = session.players.find((p) => p.id === player.id || p.deviceId === player.deviceId);
        const playerDbId = target ? (Number.isFinite(Number(target.id)) ? Number(target.id) : null) : null;
        if (target?.items && playerDbId !== null) {
            target.items.forEach((it) => {
                db.insert(resonancePlayerItems).values({
                    sessionId: sessionDbId,
                    playerId: playerDbId,
                    itemId: it.id,
                    state: { charges: it.charges },
                    createdAt: now(),
                }).onConflictDoUpdate({
                    target: [resonancePlayerItems.sessionId, resonancePlayerItems.playerId, resonancePlayerItems.itemId],
                    set: { state: { charges: it.charges } },
                }).catch(() => {});
            });
        }
    }
    session.updatedAt = now();
    if (session.status === 'lobby') {
        session.status = 'active';
    }
    return session;
}

export function setBrake(code: string, active: boolean, playerId: string) {
    const session = sessions.get(code);
    if (!session) return null;
    session.status = active ? 'paused' : 'active';
    session.interrupts.push({
        type: 'brake',
        playerId,
        cost: 0,
        at: now(),
    });
    session.updatedAt = now();
    return session;
}

export function logProxemic(code: string, playerId: string, hint: string) {
    const session = sessions.get(code);
    if (!session) return null;
    session.interrupts.push({
        type: 'force_next',
        playerId,
        cost: 0,
        at: now(),
        payload: { proximity: hint },
    });
    session.updatedAt = now();
    return session;
}

function optionWeight(archetype: ResonanceArchetype, optionId: string, options?: SceneNode['options']) {
    const option = options?.find((o) => o.id === optionId);
    if (!option) return 1;
    return option.weightMultipliers?.[archetype] ?? 1;
}

function updateAlert(session: ResonanceSession, delta?: number) {
    if (typeof delta !== 'number') return;
    const next = Math.max(0, (session.alert ?? 0) + delta);
    session.alert = next;
}

function resetCooldowns(session: ResonanceSession) {
    session.players.forEach((p) => {
        if (!p.items) return;
        p.items.forEach((it) => {
            if (!it.data) it.data = {};
            it.data.cooldown = 0;
        });
    });
}

function resolveVote(session: ResonanceSession, scene: SceneNode) {
    if (scene.kind !== 'vote' || !scene.options) return;
    const totals = new Map<string, number>();

    Object.entries(session.votes).forEach(([playerId, vote]) => {
        const player = session.players.find((p) => p.id === playerId);
        const weight = (vote.weight || 1) * (player ? optionWeight(player.archetype, vote.optionId, scene.options) : 1);
        totals.set(vote.optionId, (totals.get(vote.optionId) ?? 0) + weight);
    });

    if (totals.size === 0) return;

    let winner = scene.options[0];
    let best = -Infinity;
    for (const option of scene.options) {
        const val = totals.get(option.id) ?? 0;
        if (val > best) {
            best = val;
            winner = option;
        }
    }

    session.votes = {};
    processOptionOutcome(session, scene, winner.id);
    advanceScene(session, winner.nextScene ?? scene.next);
}

export function castVote(code: string, playerId: string, optionId: string) {
    const session = sessions.get(code);
    if (!session) return { session: null, error: 'SESSION_NOT_FOUND' as const };
    const scene = findScene(session.episodeId, session.sceneId);
    if (!scene || scene.kind !== 'vote') return { session, error: 'NOT_VOTE_SCENE' as const };
    if (!scene.options?.some((o) => o.id === optionId)) return { session, error: 'OPTION_INVALID' as const };

    const player = session.players.find((p) => p.id === playerId);
    const weight = player ? optionWeight(player.archetype, optionId, scene.options) : 1;
    session.votes[playerId] = { optionId, weight, at: now() };
    session.updatedAt = now();

    const playersCount = session.players.length;
    const votesCount = Object.keys(session.votes).length;
    if (votesCount >= playersCount) {
        resolveVote(session, scene);
    }

    return { session, error: null };
}

export function applyInterrupt(code: string, playerId: string, data: { type: InterruptState['type']; targetOptionId?: string }) {
    const session = sessions.get(code);
    if (!session) return { session: null, error: 'SESSION_NOT_FOUND' as const };
    const player = session.players.find((p) => p.id === playerId);
    if (!player) return { session, error: 'PLAYER_NOT_FOUND' as const };
    const scene = findScene(session.episodeId, session.sceneId);
    if (!scene) return { session, error: 'SCENE_NOT_FOUND' as const };

    let next: string | undefined = undefined;
    let strainDelta = 5;

    if (data.type === 'rebellion' && scene.options && data.targetOptionId) {
        const forced = scene.options.find((o) => o.id === data.targetOptionId);
        if (forced) {
            next = forced.nextScene ?? scene.next;
            strainDelta = 10;
        }
    }

    if (data.type === 'force_next') {
        next = scene.next;
    }

    session.interrupts.push({
        type: data.type,
        playerId,
        cost: 1,
        at: now(),
        payload: data,
    });
    player.conviction = Math.max(0, player.conviction - 1);
    session.strain += strainDelta;
    session.updatedAt = now();

    if (next) {
        session.votes = {};
        advanceScene(session, next);
    }

    return { session, error: null };
}

export function sendKudos(code: string, fromPlayer: string, toPlayer: string, tag: string) {
    const session = sessions.get(code);
    if (!session) return null;
    session.interrupts.push({
        type: 'force_next',
        playerId: fromPlayer,
        cost: 0,
        at: now(),
        payload: { kudos: { toPlayer, tag } },
    });
    session.updatedAt = now();
    return session;
}

export function advanceScene(session: ResonanceSession, sceneId?: string) {
    if (!sceneId) return;
    const episode = episodes[session.episodeId];
    if (!episode.scenes[sceneId]) return;
    session.sceneId = sceneId;
    const scene = episode.scenes[sceneId];
    processSceneRewards(session, scene);
    // Простая логика тревоги: боевые/интенсивные сцены повышают, завершение снижает
    if (scene.kind === 'combat') updateAlert(session, 1);
    if (scene.id === 'complete') updateAlert(session, -1);
    // Tick cooldowns per scene transition
    session.players.forEach((p) => {
        if (!p.items) return;
        p.items.forEach((it) => {
            if (it.data?.cooldown && it.data.cooldown > 0) {
                it.data.cooldown -= 1;
                if (it.data.cooldown < 0) it.data.cooldown = 0;
            }
        });
    });
    session.updatedAt = now();
    if (sceneId === 'complete') {
        session.status = 'finished';
    }
}

export function getScenePayload(session: ResonanceSession, playerId?: string) {
    const scene = findScene(session.episodeId, session.sceneId);
    const player = playerId ? session.players.find((p) => p.id === playerId) : undefined;
    return {
        scene,
        injection: player && scene?.injections ? scene.injections[player.archetype] : undefined,
    };
}

export function resumeIfPaused(code: string) {
    const session = sessions.get(code);
    if (!session) return null;
    if (session.status === 'paused') {
        session.status = 'active';
        session.updatedAt = now();
    }
    return session;
}

function applySceneDelta(session: ResonanceSession, delta?: SceneDelta) {
    if (!delta) return;
    session.trust += delta.trustDelta ?? 0;
    session.strain += delta.strainDelta ?? 0;
    updateAlert(session, delta.alertDelta);
}

export function applyRewards(session: ResonanceSession, rewards?: SceneRewards) {
    if (!rewards) return;
    applySceneDelta(session, {
        trustDelta: rewards.trustDelta,
        strainDelta: rewards.strainDelta,
        alertDelta: rewards.alertDelta,
    });
    if (rewards.cooldownReset) {
        resetCooldowns(session);
    }
    if (rewards.items && rewards.items.length) {
        session.interrupts.push({
            type: 'force_next',
            playerId: 'system',
            cost: 0,
            at: now(),
            payload: { loot: rewards.items },
        });
    }
}

export function processOptionOutcome(session: ResonanceSession, scene: SceneNode, optionId: string) {
    const option = scene.options?.find((o) => o.id === optionId);
    if (!option) return;
    applyRewards(session, option.rewards);
}

export function processSceneRewards(session: ResonanceSession, scene: SceneNode) {
    applyRewards(session, scene.rewards);
}

export function performCheck(session: ResonanceSession, scene: SceneNode, playerId: string, check: SceneCheck) {
    const player = session.players.find((p) => p.id === playerId);
    if (!player) return { success: false, reason: 'PLAYER_NOT_FOUND' as const };
    const roll = Math.floor(Math.random() * 20) + 1;
    const positionBonus = check.positionOptimum ? (check.positionOptimum === player.rank ? 3 : check.positionOptimum - player.rank) : 0;
    const total = roll + positionBonus;
    const success = total >= check.dc;
    if (success) {
        applySceneDelta(session, check.onSuccess);
    } else {
        applySceneDelta(session, check.onFail);
    }
    // best-effort log
    if (session.dbId) {
        const playerDbId = Number.isFinite(Number(playerId)) ? Number(playerId) : null;
        db.insert(resonanceChecksLog).values({
            sessionId: session.dbId,
            sceneKey: scene.id,
            playerId: playerDbId,
            skill: check.skill,
            dc: check.dc,
            result: success ? 'success' : 'fail',
            roll,
            position: player.rank,
            strainDelta: success ? check.onSuccess?.strainDelta ?? 0 : check.onFail?.strainDelta ?? 0,
            trustDelta: success ? check.onSuccess?.trustDelta ?? 0 : check.onFail?.trustDelta ?? 0,
            createdAt: now(),
        }).catch(() => {});
    }
    session.updatedAt = now();
    return { success, roll, total };
}

export function useItem(code: string, playerId: string, payload: ItemUsePayload) {
    const session = sessions.get(code);
    if (!session) return { session: null, error: 'SESSION_NOT_FOUND' as const };
    const player = session.players.find((p) => p.id === playerId);
    if (!player) return { session, error: 'PLAYER_NOT_FOUND' as const };
    const item = itemsDict[payload.itemId];
    if (!item) return { session, error: 'ITEM_NOT_FOUND' as const };

    // decrement charges if present
    if (player.items) {
        const slot = player.items.find((it) => it.id === payload.itemId);
        if (slot?.data?.cooldown && slot.data.cooldown > 0) {
            return { session, error: 'COOLDOWN' as const };
        }
        if (slot && typeof slot.charges === 'number') {
            if (slot.charges <= 0) return { session, error: 'NO_CHARGES' as const };
            slot.charges -= 1;
        }
        // basic cooldown tick; if item has cooldownScenes set, set cooldown counter
        if (slot) {
            if (!slot.data) slot.data = {};
            if (item.cooldownScenes) {
                slot.data.cooldown = item.cooldownScenes;
            }
        }
    }

    session.interrupts.push({
        type: 'force_next',
        playerId,
        cost: 0,
        at: now(),
        payload: { itemUse: { itemId: item.id, targetPlayerId: payload.targetPlayerId, context: payload.context } },
    });
    if (session.dbId) {
        const playerDbId = Number.isFinite(Number(playerId)) ? Number(playerId) : null;
        db.insert(resonanceItemUses).values({
            sessionId: session.dbId,
            playerId: playerDbId,
            itemId: item.id,
            effect: payload as any,
            createdAt: now(),
        }).catch(() => {});
    }

    // Persist player item state if charges changed
    if (player.items) {
        const charges = player.items.find((it) => it.id === payload.itemId)?.charges;
        const playerDbId = Number.isFinite(Number(playerId)) ? Number(playerId) : null;
        if (typeof charges === 'number' && session.dbId && playerDbId !== null) {
            db.insert(resonancePlayerItems).values({
                sessionId: session.dbId,
                playerId: playerDbId,
                itemId: payload.itemId,
                state: { charges },
                createdAt: now(),
            }).onConflictDoUpdate({
                target: [resonancePlayerItems.sessionId, resonancePlayerItems.playerId, resonancePlayerItems.itemId],
                set: { state: { charges } },
            }).catch(() => {});
        }
    }
    session.updatedAt = now();
    return { session, error: null };
}
