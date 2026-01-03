import { db } from '../db';
import { coopSessions, coopParticipants, coopVotes, players, items, gameProgress, voiceAttributes } from '../db/schema';
import { eq, and, inArray, ne, sql } from 'drizzle-orm';
import { coopGraph } from '../lib/coopGraph';
import type { CoopExpeditionDeadlineEvent, CoopExpeditionDeadlineEventKind, CoopRoleId } from '../shared/types/coop';
import { broadcastCoopUpdate } from '../lib/bus';
import { getItemTemplate, hasItemTemplate } from '../lib/itemTemplates';
import { COOP_STATUSES } from '../shared/data/coopScoreConfig';
import { BASE_UPGRADES, ITEM_CONTRIBUTION_VALUES } from '../shared/data/campConfig';
import { resolveExpeditionEvent } from '../lib/coopExpeditionEvents';
import { generateExpeditionStageState, getExpeditionStagePool } from '../lib/coopExpeditionStagePools';
import {
    calculateContributionScore,
    computeAutoStagesFromGraph,
    computeBuffMultiplier,
    computeStatusMultiplier,
    computeTargetTotal,
    getClassMultiplier,
    getSideQuestMeta,
    tryConsumeInventory,
} from '../lib/coopScore';
import { awardItemsToPlayer } from '../lib/itemAward';
import { getVendorStock, getVendorSellPrice } from '../lib/vendorStock';

const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();
const COOP_ROLE_IDS: CoopRoleId[] = ['valkyrie', 'vorschlag', 'ghost', 'shustrya'];

type CoopCampState = {
    security: number;
    operatives: number;
    inventory: Record<string, number>; // templateId -> quantity
    baseLevel?: number;
    upgrades?: Record<string, number>;
    credits?: number;
};

const DEFAULT_CAMP_STATE: CoopCampState = {
    security: 0,
    operatives: 0,
    inventory: { scrap: 0 },
};

function toFiniteNumber(value: unknown, fallback: number) {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function normalizeInventory(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object') return {};
    const inv: Record<string, number> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
        const qty = toFiniteNumber(v, 0);
        if (typeof k === 'string' && k.length > 0 && qty > 0) inv[k] = Math.floor(qty);
    }
    return inv;
}

function normalizeCampState(value: unknown): CoopCampState {
    const raw = (value && typeof value === 'object') ? (value as any) : {};
    const inventory = normalizeInventory(raw.inventory);
    const upgrades = normalizeInventory(raw.upgrades); // Re-use normalizeInventory since it's just string->number map
    return {
        security: Math.max(0, Math.floor(toFiniteNumber(raw.security, DEFAULT_CAMP_STATE.security))),
        operatives: Math.max(0, Math.floor(toFiniteNumber(raw.operatives, DEFAULT_CAMP_STATE.operatives))),
        inventory: { ...DEFAULT_CAMP_STATE.inventory, ...inventory },
        baseLevel: Math.max(1, Math.floor(toFiniteNumber(raw.baseLevel, 1))),
        upgrades: upgrades,
        credits: Math.max(0, Math.floor(toFiniteNumber(raw.credits, 0))),
    };
}

function getCampStateFromFlags(flags: Record<string, any>): CoopCampState | null {
    if (!flags || typeof flags !== 'object') return null;
    if (!('__camp' in flags)) return null;
    return normalizeCampState((flags as any).__camp);
}

type CoopExpeditionState = {
    turnCount: number;
    maxTurns: number;
    researchPoints: number;
    waveNodeId?: string;
    wavePending?: boolean;
    deadlineEvents?: CoopExpeditionDeadlineEvent[];
    pendingNodeId?: string;
    pendingKind?: CoopExpeditionDeadlineEventKind;
    poolId?: string;
    stageIndex?: number;
    stageId?: string;
    hubNodeId?: string;
    missions?: Record<
        string,
        {
            kind: 'sidequest' | 'node';
            title: string;
            timeCost: number;
            threatLevel: number;
            modifierId: string;
            modifierLabel: string;
            isUnique?: boolean;
            questId?: string;
            entryNodeId?: string;
            nodeId?: string;
            scoreModifiers?: Record<string, number>;
            applyStatuses?: Record<string, number>;
        }
    >;
    playerTraits?: Record<string, string[]>;
    injury?: { targetPlayerId: number; needsTreatment: boolean };
    lastEvent?: {
        id: string;
        at: number;
        success: boolean;
        summary: string;
        perPlayer: Record<string, { pass: boolean; traitsAdded: string[] }>;
        targetPlayerId?: number;
        actorPlayerId?: number;
    };
};

function normalizeExpeditionState(value: unknown): CoopExpeditionState | null {
    if (!value || typeof value !== 'object') return null;
    const raw = value as any;

    const maxTurns = Math.max(0, Math.floor(toFiniteNumber(raw.maxTurns, 0)));
    const waveNodeId = typeof raw.waveNodeId === 'string' && raw.waveNodeId.trim().length > 0 ? raw.waveNodeId.trim() : undefined;

    const deadlineEvents: CoopExpeditionDeadlineEvent[] | undefined = Array.isArray(raw.deadlineEvents)
        ? (raw.deadlineEvents as any[])
            .map((entry) => {
                if (!entry || typeof entry !== 'object') return null;
                const nodeId = typeof (entry as any).nodeId === 'string' ? String((entry as any).nodeId).trim() : '';
                if (!nodeId) return null;
                const kindRaw = typeof (entry as any).kind === 'string' ? String((entry as any).kind).trim() : '';
                const kind =
                    kindRaw === 'enemy' || kindRaw === 'check' ? (kindRaw as CoopExpeditionDeadlineEventKind) : undefined;
                const weightRaw = toFiniteNumber((entry as any).weight, 0);
                const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : undefined;
                return { nodeId, kind, weight } satisfies CoopExpeditionDeadlineEvent;
            })
            .filter(Boolean) as CoopExpeditionDeadlineEvent[]
        : undefined;

    // Not started / no config
    if (maxTurns <= 0 && !waveNodeId && (!deadlineEvents || deadlineEvents.length === 0)) return null;

    const turnCount = Math.max(0, Math.floor(toFiniteNumber(raw.turnCount, 0)));
    const researchPoints = Math.max(0, Math.floor(toFiniteNumber(raw.researchPoints, 0)));
    const wavePending = Boolean(raw.wavePending);

    const pendingNodeId = typeof raw.pendingNodeId === 'string' && raw.pendingNodeId.trim().length > 0 ? raw.pendingNodeId.trim() : undefined;
    const pendingKindRaw = typeof raw.pendingKind === 'string' ? raw.pendingKind.trim() : '';
    const pendingKind =
        pendingKindRaw === 'enemy' || pendingKindRaw === 'check' ? (pendingKindRaw as CoopExpeditionDeadlineEventKind) : undefined;

    const poolId = typeof raw.poolId === 'string' && raw.poolId.trim().length > 0 ? raw.poolId.trim() : undefined;
    const stageIndexRaw = toFiniteNumber(raw.stageIndex, 0);
    const stageIndex = Number.isFinite(stageIndexRaw) ? Math.max(0, Math.floor(stageIndexRaw)) : undefined;
    const stageId = typeof raw.stageId === 'string' && raw.stageId.trim().length > 0 ? raw.stageId.trim() : undefined;
    const hubNodeId = typeof raw.hubNodeId === 'string' && raw.hubNodeId.trim().length > 0 ? raw.hubNodeId.trim() : undefined;

    const missions = (() => {
        if (!raw.missions || typeof raw.missions !== 'object') return undefined;
        const out: Record<string, any> = {};
        for (const [choiceId, rawMission] of Object.entries(raw.missions as Record<string, any>)) {
            if (!choiceId || !rawMission || typeof rawMission !== 'object') continue;
            const kindRaw = typeof (rawMission as any).kind === 'string' ? String((rawMission as any).kind).trim() : '';
            const kind = kindRaw === 'sidequest' || kindRaw === 'node' ? (kindRaw as 'sidequest' | 'node') : null;
            if (!kind) continue;
            const title = typeof (rawMission as any).title === 'string' ? String((rawMission as any).title) : '';
            if (!title) continue;
            const timeCost = Math.max(0, Math.floor(toFiniteNumber((rawMission as any).timeCost, 0)));
            const threatLevel = Math.max(1, Math.floor(toFiniteNumber((rawMission as any).threatLevel, 1)));
            const modifierId = typeof (rawMission as any).modifierId === 'string' ? String((rawMission as any).modifierId).trim() : '';
            const modifierLabel = typeof (rawMission as any).modifierLabel === 'string' ? String((rawMission as any).modifierLabel).trim() : '';

            const base: any = {
                kind,
                title,
                timeCost,
                threatLevel,
                modifierId,
                modifierLabel,
                isUnique: Boolean((rawMission as any).isUnique),
            };

            if (kind === 'sidequest') {
                const questId = typeof (rawMission as any).questId === 'string' ? String((rawMission as any).questId).trim() : '';
                const entryNodeId =
                    typeof (rawMission as any).entryNodeId === 'string' ? String((rawMission as any).entryNodeId).trim() : '';
                if (!questId || !entryNodeId) continue;
                base.questId = questId;
                base.entryNodeId = entryNodeId;
            } else {
                const nodeId = typeof (rawMission as any).nodeId === 'string' ? String((rawMission as any).nodeId).trim() : '';
                if (!nodeId) continue;
                base.nodeId = nodeId;
            }

            if ((rawMission as any).scoreModifiers && typeof (rawMission as any).scoreModifiers === 'object') {
                base.scoreModifiers = normalizeScoreModifiers((rawMission as any).scoreModifiers);
            }
            if ((rawMission as any).applyStatuses && typeof (rawMission as any).applyStatuses === 'object') {
                base.applyStatuses = normalizeStatusTurns((rawMission as any).applyStatuses);
            }

            out[choiceId] = base;
        }
        return Object.keys(out).length > 0 ? (out as CoopExpeditionState['missions']) : undefined;
    })();

    const playerTraits = (() => {
        if (!raw.playerTraits || typeof raw.playerTraits !== 'object') return undefined;
        const out: Record<string, string[]> = {};
        for (const [playerKey, rawTraits] of Object.entries(raw.playerTraits as Record<string, any>)) {
            if (!playerKey) continue;
            if (!Array.isArray(rawTraits)) continue;
            const traits = rawTraits
                .map((t) => (typeof t === 'string' ? t.trim() : ''))
                .filter(Boolean);
            if (traits.length === 0) continue;
            out[playerKey] = Array.from(new Set(traits));
        }
        return Object.keys(out).length > 0 ? out : undefined;
    })();

    const injury = (() => {
        if (!raw.injury || typeof raw.injury !== 'object') return undefined;
        const targetPlayerId = Math.max(0, Math.floor(toFiniteNumber((raw.injury as any).targetPlayerId, 0)));
        if (targetPlayerId <= 0) return undefined;
        const needsTreatment = Boolean((raw.injury as any).needsTreatment);
        return { targetPlayerId, needsTreatment };
    })();

    const lastEvent = (() => {
        if (!raw.lastEvent || typeof raw.lastEvent !== 'object') return undefined;
        const id = typeof (raw.lastEvent as any).id === 'string' ? (raw.lastEvent as any).id.trim() : '';
        if (!id) return undefined;
        const at = Math.max(0, Math.floor(toFiniteNumber((raw.lastEvent as any).at, 0)));
        const success = Boolean((raw.lastEvent as any).success);
        const summary = typeof (raw.lastEvent as any).summary === 'string' ? (raw.lastEvent as any).summary : '';
        const perPlayerRaw = (raw.lastEvent as any).perPlayer;
        const perPlayer: Record<string, { pass: boolean; traitsAdded: string[] }> = {};
        if (perPlayerRaw && typeof perPlayerRaw === 'object') {
            for (const [playerKey, rawEntry] of Object.entries(perPlayerRaw as Record<string, any>)) {
                if (!playerKey || !rawEntry || typeof rawEntry !== 'object') continue;
                const pass = Boolean((rawEntry as any).pass);
                const traitsAdded = Array.isArray((rawEntry as any).traitsAdded)
                    ? (rawEntry as any).traitsAdded
                        .map((t: any) => (typeof t === 'string' ? t.trim() : ''))
                        .filter(Boolean)
                    : [];
                perPlayer[playerKey] = { pass, traitsAdded };
            }
        }
        const targetPlayerId = Math.max(0, Math.floor(toFiniteNumber((raw.lastEvent as any).targetPlayerId, 0)));
        const actorPlayerId = Math.max(0, Math.floor(toFiniteNumber((raw.lastEvent as any).actorPlayerId, 0)));
        return {
            id,
            at,
            success,
            summary,
            perPlayer,
            targetPlayerId: targetPlayerId > 0 ? targetPlayerId : undefined,
            actorPlayerId: actorPlayerId > 0 ? actorPlayerId : undefined,
        };
    })();

    return {
        turnCount,
        maxTurns,
        researchPoints,
        waveNodeId,
        wavePending,
        deadlineEvents,
        pendingNodeId,
        pendingKind,
        poolId,
        stageIndex,
        stageId,
        hubNodeId,
        missions,
        playerTraits,
        injury,
        lastEvent,
    };
}

function getExpeditionStateFromFlags(flags: Record<string, any>): CoopExpeditionState | null {
    const graph = (flags?.__graph ?? null) as any;
    return normalizeExpeditionState(graph?.expedition);
}

type CoopQuestScoreState = {
    questId: string;
    current: number;
    target: number;
    history: number[];
    modifiers: Record<string, number>;
    playerModifiers?: Record<string, Record<string, number>>;
    statuses?: Record<string, number>;
    playerStatuses?: Record<string, Record<string, number>>;
    stages?: number;
    lastStageTotal?: number;
    lastStageByPlayer?: Record<string, number>;
    lastScoredSceneId?: string;
};

type CoopEncounterOutcome = 'victory' | 'defeat';

type CoopEncounterStatus = 'active' | 'resolved';

type CoopEncounterPlayerSnapshot = {
    playerId: number;
    role: CoopRoleId | null;
    hp: number;
    maxHp: number;
    morale: number;
    maxMorale: number;
    stamina: number;
    maxStamina: number;
    traits: string[];
};

type CoopEncounterState = {
    id: string;
    startedAt: number;
    status: CoopEncounterStatus;
    sceneId: string;
    choiceId: string;
    scenarioId?: string;
    threatLevel: number;
    returnNodeId: string;
    defeatNodeId?: string;
    rewardRp?: number;
    players: CoopEncounterPlayerSnapshot[];
    result?: { outcome: CoopEncounterOutcome; resolvedAt: number };
};

function normalizeScoreModifiers(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object') return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
        const n = toFiniteNumber(v, 1);
        if (typeof k === 'string' && k.length > 0 && Number.isFinite(n)) out[k] = n;
    }
    return out;
}

function normalizeNumberMap(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object') return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
        const n = toFiniteNumber(v, 0);
        if (typeof k === 'string' && k.length > 0 && Number.isFinite(n)) out[k] = n;
    }
    return out;
}

function normalizeStatusTurns(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object') return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
        const turns = Math.max(0, Math.floor(toFiniteNumber(v, 0)));
        if (typeof k === 'string' && k.length > 0 && turns > 0) out[k] = turns;
    }
    return out;
}

function normalizePerPlayerMultipliers(value: unknown): Record<string, Record<string, number>> {
    if (!value || typeof value !== 'object') return {};
    const out: Record<string, Record<string, number>> = {};
    for (const [playerId, mods] of Object.entries(value as Record<string, any>)) {
        const normalized = normalizeScoreModifiers(mods);
        if (Object.keys(normalized).length > 0) out[String(playerId)] = normalized;
    }
    return out;
}

function normalizePerPlayerStatuses(value: unknown): Record<string, Record<string, number>> {
    if (!value || typeof value !== 'object') return {};
    const out: Record<string, Record<string, number>> = {};
    for (const [playerId, statuses] of Object.entries(value as Record<string, any>)) {
        const normalized = normalizeStatusTurns(statuses);
        if (Object.keys(normalized).length > 0) out[String(playerId)] = normalized;
    }
    return out;
}

function normalizeScoreState(value: unknown): CoopQuestScoreState | null {
    if (!value || typeof value !== 'object') return null;
    const raw = value as any;
    const questId = typeof raw.questId === 'string' ? raw.questId : '';
    if (!questId) return null;

    const current = toFiniteNumber(raw.current, 0);
    const target = toFiniteNumber(raw.target, 0);
    const history = Array.isArray(raw.history) ? raw.history.map((v: any) => toFiniteNumber(v, 0)) : [];
    const modifiers = normalizeScoreModifiers(raw.modifiers);
    const playerModifiers = normalizePerPlayerMultipliers(raw.playerModifiers);
    const statuses = normalizeStatusTurns(raw.statuses);
    const playerStatuses = normalizePerPlayerStatuses(raw.playerStatuses);
    const stages = Math.max(0, Math.floor(toFiniteNumber(raw.stages, 0)));
    const lastStageTotal = toFiniteNumber(raw.lastStageTotal, 0);
    const lastStageByPlayer = normalizeNumberMap(raw.lastStageByPlayer);
    const lastScoredSceneId = typeof raw.lastScoredSceneId === 'string' ? raw.lastScoredSceneId : undefined;

    return {
        questId,
        current,
        target,
        history,
        modifiers,
        playerModifiers,
        statuses,
        playerStatuses,
        stages,
        lastStageTotal,
        lastStageByPlayer,
        lastScoredSceneId,
    };
}

function getActiveScoreStateFromFlags(flags: Record<string, any>): CoopQuestScoreState | null {
    const graph = (flags?.__graph ?? null) as any;
    return normalizeScoreState(graph?.activeScore);
}

function normalizeEncounterState(value: unknown): CoopEncounterState | null {
    if (!value || typeof value !== 'object') return null;
    const raw = value as any;

    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    if (!id) return null;

    const startedAt = Math.max(0, Math.floor(toFiniteNumber(raw.startedAt, 0)));
    const statusRaw = typeof raw.status === 'string' ? raw.status.trim() : '';
    const status: CoopEncounterStatus = statusRaw === 'resolved' ? 'resolved' : 'active';

    const sceneId = typeof raw.sceneId === 'string' ? raw.sceneId.trim() : '';
    const choiceId = typeof raw.choiceId === 'string' ? raw.choiceId.trim() : '';
    const returnNodeId = typeof raw.returnNodeId === 'string' ? raw.returnNodeId.trim() : '';
    if (!sceneId || !choiceId || !returnNodeId) return null;

    const defeatNodeId =
        typeof raw.defeatNodeId === 'string' && raw.defeatNodeId.trim().length > 0 ? raw.defeatNodeId.trim() : undefined;

    const scenarioId =
        typeof raw.scenarioId === 'string' && raw.scenarioId.trim().length > 0 ? raw.scenarioId.trim() : undefined;

    const threatLevel = Math.max(1, Math.floor(toFiniteNumber(raw.threatLevel, 1)));
    const rewardRpRaw = toFiniteNumber(raw.rewardRp, 0);
    const rewardRp = Number.isFinite(rewardRpRaw) && rewardRpRaw > 0 ? Math.floor(rewardRpRaw) : undefined;

    const playersRaw = Array.isArray(raw.players) ? raw.players : [];
    const players: CoopEncounterPlayerSnapshot[] = [];
    for (const entry of playersRaw) {
        if (!entry || typeof entry !== 'object') continue;
        const playerId = Math.max(0, Math.floor(toFiniteNumber((entry as any).playerId, 0)));
        if (playerId <= 0) continue;

        const roleRaw = typeof (entry as any).role === 'string' ? String((entry as any).role).trim() : '';
        const role = COOP_ROLE_IDS.includes(roleRaw as CoopRoleId) ? (roleRaw as CoopRoleId) : null;

        const maxHp = Math.max(1, Math.floor(toFiniteNumber((entry as any).maxHp, 100)));
        const maxMorale = Math.max(1, Math.floor(toFiniteNumber((entry as any).maxMorale, 100)));
        const maxStamina = Math.max(1, Math.floor(toFiniteNumber((entry as any).maxStamina, 100)));

        const hp = Math.max(0, Math.min(maxHp, Math.floor(toFiniteNumber((entry as any).hp, maxHp))));
        const morale = Math.max(0, Math.min(maxMorale, Math.floor(toFiniteNumber((entry as any).morale, maxMorale))));
        const stamina = Math.max(0, Math.min(maxStamina, Math.floor(toFiniteNumber((entry as any).stamina, maxStamina))));

        const traitsRaw = Array.isArray((entry as any).traits) ? (entry as any).traits : [];
        const traits = traitsRaw
            .map((t: any) => (typeof t === 'string' ? t.trim() : ''))
            .filter(Boolean);

        players.push({
            playerId,
            role,
            hp,
            maxHp,
            morale,
            maxMorale,
            stamina,
            maxStamina,
            traits: Array.from(new Set(traits)),
        });
    }

    if (players.length === 0) return null;

    const resultRaw = raw.result;
    const result = (() => {
        if (!resultRaw || typeof resultRaw !== 'object') return undefined;
        const outcomeRaw = typeof (resultRaw as any).outcome === 'string' ? (resultRaw as any).outcome.trim() : '';
        const outcome: CoopEncounterOutcome | null = outcomeRaw === 'victory' || outcomeRaw === 'defeat' ? outcomeRaw : null;
        if (!outcome) return undefined;
        const resolvedAt = Math.max(0, Math.floor(toFiniteNumber((resultRaw as any).resolvedAt, 0)));
        return { outcome, resolvedAt };
    })();

    return {
        id,
        startedAt,
        status,
        sceneId,
        choiceId,
        scenarioId,
        threatLevel,
        returnNodeId,
        defeatNodeId,
        rewardRp,
        players,
        result,
    };
}

function getEncounterStateFromFlags(flags: Record<string, any>): CoopEncounterState | null {
    const graph = (flags?.__graph ?? null) as any;
    return normalizeEncounterState(graph?.encounter);
}

export interface SequentialBroadcastReaction {
    playerId: number;
    playerName: string;
    playerRole: string | null;
    choiceId: string;
    choiceText: string;
    effectText: string;
    timestamp: number;
}

export interface SequentialBroadcastState {
    activePlayerId: number | null;
    completedPlayerIds: number[];
    playerOrder: number[];
    reactions: SequentialBroadcastReaction[];
    showingReactionIndex: number | null;
}

function normalizeSequentialBroadcastState(value: unknown): SequentialBroadcastState | null {
    if (!value || typeof value !== 'object') return null;
    const raw = value as any;

    const activePlayerId = typeof raw.activePlayerId === 'number' ? raw.activePlayerId : null;
    const completedPlayerIds = Array.isArray(raw.completedPlayerIds)
        ? raw.completedPlayerIds.filter((id: any) => typeof id === 'number')
        : [];
    const playerOrder = Array.isArray(raw.playerOrder)
        ? raw.playerOrder.filter((id: any) => typeof id === 'number')
        : [];
    const reactions: SequentialBroadcastReaction[] = Array.isArray(raw.reactions)
        ? raw.reactions.filter((r: any) =>
            r && typeof r === 'object' && typeof r.playerId === 'number' && typeof r.choiceId === 'string'
        ).map((r: any) => ({
            playerId: r.playerId,
            playerName: typeof r.playerName === 'string' ? r.playerName : '',
            playerRole: typeof r.playerRole === 'string' ? r.playerRole : null,
            choiceId: r.choiceId,
            choiceText: typeof r.choiceText === 'string' ? r.choiceText : '',
            effectText: typeof r.effectText === 'string' ? r.effectText : '',
            timestamp: typeof r.timestamp === 'number' ? r.timestamp : Date.now(),
        }))
        : [];
    const showingReactionIndex = typeof raw.showingReactionIndex === 'number' ? raw.showingReactionIndex : null;

    return { activePlayerId, completedPlayerIds, playerOrder, reactions, showingReactionIndex };
}

function getSequentialBroadcastFromFlags(flags: Record<string, any>): SequentialBroadcastState | null {
    const graph = (flags?.__graph ?? null) as any;
    return normalizeSequentialBroadcastState(graph?.sequentialBroadcast);
}

const COOP_ARTIFACT_SCORE_BONUSES: Record<string, { bonus: number; tags?: string[] }> = {
    artifact_tech_scanner: { bonus: 5, tags: ['analysis'] },
    artifact_moon_fungus_lantern: { bonus: 5, tags: ['visual'] },
};

function computeArtifactBonusFromFlags(flags: Record<string, any>, choiceTags: string[] | undefined): number {
    const tags = new Set((choiceTags ?? []).filter((t) => typeof t === 'string' && t.length > 0));
    let total = 0;

    for (const [flagId, cfg] of Object.entries(COOP_ARTIFACT_SCORE_BONUSES)) {
        const count = toFiniteNumber(flags?.[flagId], 0);
        if (count <= 0) continue;
        if (cfg.tags && cfg.tags.length > 0) {
            const matches = cfg.tags.some((t) => tags.has(t));
            if (!matches) continue;
        }
        total += cfg.bonus;
    }

    return total;
}

export const coopService = {
    async createRoom(hostId: number, role?: CoopRoleId) {
        const code = generateCode();

        // Create session
        const [session] = await db.insert(coopSessions).values({
            hostId,
            inviteCode: code,
            status: 'waiting',
            currentScene: 'prologue_start',
            createdAt: Date.now(),
        }).returning();

        // Add host as participant
        const initialRole = role ?? null;
        await db.insert(coopParticipants).values({
            sessionId: session.id,
            playerId: hostId,
            role: initialRole,
            isReady: Boolean(initialRole),
            currentScene: session.currentScene ?? 'prologue_start',
            joinedAt: Date.now(),
        });

        const updatedState = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, updatedState);
        return updatedState;
    },

    async getRoomState(code: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: {
                participants: {
                    with: {
                        player: true,
                    }
                },
                votes: true,
            }
        });

        if (!session) return null;

        const currentQuestNode = coopGraph.getNode(session.currentScene || 'prologue_start') ?? null;
        const participantIds = new Set(session.participants.map((p) => p.playerId));
        const flags = (session.flags ?? {}) as Record<string, any>;
        const camp = getCampStateFromFlags(flags);
        const questScore = getActiveScoreStateFromFlags(flags);
        const expedition = getExpeditionStateFromFlags(flags);
        const encounter = getEncounterStateFromFlags(flags);
        const sequentialBroadcast = getSequentialBroadcastFromFlags(flags);

        let questNode = currentQuestNode;
        if (questNode && expedition?.poolId && expedition.missions) {
            const pool = getExpeditionStagePool(expedition.poolId);
            const stageIndex = Math.max(0, Math.floor(toFiniteNumber(expedition.stageIndex, 0)));
            const stage = pool?.stages?.[Math.min(stageIndex, Math.max(0, (pool?.stages?.length ?? 1) - 1))];

            if (pool && stage && questNode.id === stage.hubNodeId) {
                const missionSlotIds = new Set(stage.missionChoiceIds);
                const missions = expedition.missions;
                questNode = {
                    ...questNode,
                    title: `${questNode.title} (Stage ${stageIndex + 1})`,
                    choices: (questNode.choices ?? [])
                        .filter((choice) => {
                            if (!missionSlotIds.has(choice.id)) return true;
                            return Boolean(missions?.[choice.id]);
                        })
                        .map((choice) => {
                            const mission = missions?.[choice.id];
                            if (!mission) return choice;
                            return {
                                ...choice,
                                text: mission.title,
                            };
                        }),
                };
            }
        }

        return {
            code: session.inviteCode,
            status: session.status,
            hostId: session.hostId,
            sceneId: session.currentScene,
            questNode,
            camp,
            expedition,
            encounter,
            sequentialBroadcast,
            questScore: questScore ? {
                questId: questScore.questId,
                current: questScore.current,
                target: questScore.target,
                history: questScore.history,
                modifiers: questScore.modifiers,
                playerModifiers: questScore.playerModifiers ?? {},
                statuses: questScore.statuses ?? {},
                playerStatuses: questScore.playerStatuses ?? {},
                stages: questScore.stages ?? 0,
                lastStageTotal: questScore.lastStageTotal ?? 0,
                lastStageByPlayer: questScore.lastStageByPlayer ?? {},
            } : null,
            participants: session.participants.map(p => ({
                id: p.playerId,
                name: p.player.name,
                role: p.role,
                ready: p.isReady,
            })),
            votes: session.votes.filter((v) => v.sceneId === session.currentScene && participantIds.has(v.voterId)),
        };
    },

    async joinRoom(code: string, playerId: number, role?: CoopRoleId) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });

        if (!session) throw new Error('Room not found');
        if (session.status !== 'waiting') throw new Error('Game already started');

        const desiredRole = role ?? null;

        const existing = await db.query.coopParticipants.findFirst({
            where: and(
                eq(coopParticipants.sessionId, session.id),
                eq(coopParticipants.playerId, playerId)
            )
        });

        if (existing) {
            if (role && existing.role !== role) {
                const roleTaken = session.participants.some((p) => p.playerId !== playerId && p.role === role);
                if (roleTaken) throw new Error('Role already taken');

                await db
                    .update(coopParticipants)
                    .set({ role, isReady: true })
                    .where(and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.playerId, playerId)));
            }
            // Keep cursor in sync with current session scene if it was never set.
            if (!(existing as any).currentScene) {
                await db
                    .update(coopParticipants)
                    .set({ currentScene: session.currentScene ?? 'prologue_start' })
                    .where(and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.playerId, playerId)));
            }
            const state = await coopService.getRoomState(code);
            broadcastCoopUpdate(code, state);
            return state;
        }

        if (session.participants.length >= (session.maxPlayers ?? 4)) throw new Error('Room is full');
        if (desiredRole && session.participants.some((p) => p.role === desiredRole)) throw new Error('Role already taken');

        await db.insert(coopParticipants).values({
            sessionId: session.id,
            playerId,
            role: desiredRole,
            isReady: Boolean(desiredRole),
            currentScene: session.currentScene ?? 'prologue_start',
            joinedAt: Date.now(),
        });

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async setReady(code: string, playerId: number, isReady: boolean) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
        });
        if (!session) return null;

        await db.update(coopParticipants)
            .set({ isReady })
            .where(and(
                eq(coopParticipants.sessionId, session.id),
                eq(coopParticipants.playerId, playerId)
            ));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async startSession(code: string, hostId: number) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.hostId !== hostId) throw new Error('Only host can start');
        if (session.participants.length < 2) throw new Error('Need at least 2 players');
        if (session.participants.some((p) => !p.isReady)) throw new Error('All players must be ready');
        if (session.participants.some((p) => !p.role)) throw new Error('All players must select a character');

        const pickedRoles = session.participants.map((p) => p.role).filter(Boolean) as string[];
        const uniqueRoles = new Set(pickedRoles);
        if (uniqueRoles.size !== pickedRoles.length) throw new Error('Each character can only be picked once');

        await db.update(coopSessions)
            .set({ status: 'active', startedAt: Date.now() })
            .where(eq(coopSessions.id, session.id));

        // Initialize per-player cursors to the starting scene for async reading.
        const startScene = session.currentScene ?? 'prologue_start';
        const participantIds = session.participants.map((p) => p.playerId);
        if (participantIds.length > 0) {
            await db
                .update(coopParticipants)
                .set({ currentScene: startScene })
                .where(and(eq(coopParticipants.sessionId, session.id), inArray(coopParticipants.playerId, participantIds)));
        }

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async markReached(code: string, playerId: number, nodeId: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');

        const participant = session.participants.find((p) => p.playerId === playerId);
        if (!participant) throw new Error('Not a participant');

        await db.update(coopParticipants)
            .set({ currentScene: nodeId })
            .where(and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.playerId, playerId)));

        // If majority reached this node, promote it to the shared checkpoint.
        const threshold = Math.floor(session.participants.length / 2) + 1;
        const reached = await db.query.coopParticipants.findMany({
            where: and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.currentScene, nodeId)),
            columns: { id: true },
        });

        if (reached.length >= threshold && session.currentScene !== nodeId) {
            await db.update(coopSessions)
                .set({ currentScene: nodeId })
                .where(eq(coopSessions.id, session.id));
        }

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async castVote(code: string, requesterPlayerId: number, choiceId: string, asPlayerId?: number, nodeId?: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: { with: { player: true } } }
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.currentScene) throw new Error('Invalid scene');

        const flagsAtStart = (session.flags ?? {}) as Record<string, any>;
        const encounterAtStart = getEncounterStateFromFlags(flagsAtStart);
        if (encounterAtStart?.status === 'active') {
            throw new Error('Battle in progress');
        }

        const actorPlayerId = typeof asPlayerId === 'number' ? asPlayerId : requesterPlayerId;

        if (actorPlayerId !== requesterPlayerId) {
            if (session.hostId !== requesterPlayerId) {
                throw new Error('Only host can act for bots');
            }
            const target = session.participants.find((p) => p.playerId === actorPlayerId);
            const targetName = target?.player?.name ?? '';
            if (!target || !targetName.startsWith('Bot-')) {
                throw new Error('Can only act for bots');
            }
        }

        const normalizedNodeId = typeof nodeId === 'string' && nodeId.trim().length > 0 ? nodeId.trim() : undefined;

        let voteSceneId = session.currentScene;
        let currentNode = coopGraph.getNode(session.currentScene);
        if (!currentNode) throw new Error('Invalid scene');

        // Allow voting on "individual" nodes even if the shared session scene is elsewhere.
        // This supports async reading between checkpoints while still recording per-role decisions.
        if (normalizedNodeId && normalizedNodeId !== session.currentScene) {
            const requestedNode = coopGraph.getNode(normalizedNodeId);
            if (!requestedNode) throw new Error('Invalid node');
            if (requestedNode.interactionType !== 'individual') {
                throw new Error('nodeId override only allowed for individual scenes');
            }
            voteSceneId = normalizedNodeId;
            currentNode = requestedNode;
        }

        // --- FLAG / EFFECT HELPERS ---
        const getChoiceFlags = (cId: string): Record<string, any> => {
            // Hardcoded effects for the Crossroads scenario to demonstrate modernization
            // In a full implementation, these would come from c.flags in content
            const deltas: Record<string, number> = {
                // Opening
                opening_diplomacy: 0,
                opening_pragmatism: 0,
                opening_honor: 0,
                // Actions
                action_valkyrie_care: 10,
                action_valkyrie_threat: -10,
                action_valkyrie_observe: 0,
                action_vorschlag_open_hand: 10,
                action_vorschlag_hold_shield: -5,
                action_ghost_deescalate: 10,
                action_ghost_aim: -15,
                action_shustrya_visible_hands: 5,
                action_shustrya_fuse: -15,
                action_generic_still: 0,
                // Final
                final_trust: 20,
                final_neutral: -10,
                final_aggression: -50,
            };

            const nodeChoice = currentNode.choices.find(c => c.id === cId);
            const contentFlags = nodeChoice?.flags ?? {};

            if (cId in deltas) {
                return { ...contentFlags, trust_delta: deltas[cId] };
            }
            return contentFlags;
        };

        const applyFlags = async (flagsToApply: Record<string, any>) => {
            if (Object.keys(flagsToApply).length === 0) return;
            // Fetch latest flags to be safe
            const currentSession = await db.query.coopSessions.findFirst({
                where: eq(coopSessions.id, session.id),
                columns: { flags: true }
            });
            const currentFlags = (currentSession?.flags ?? {}) as Record<string, any>;
            const nextFlags = { ...currentFlags };

            for (const [k, v] of Object.entries(flagsToApply)) {
                if (typeof v === 'number') {
                    nextFlags[k] = (typeof nextFlags[k] === 'number' ? nextFlags[k] : 0) + v;
                } else {
                    nextFlags[k] = v;
                }
            }
            await db.update(coopSessions).set({ flags: nextFlags }).where(eq(coopSessions.id, session.id));
        };

        const updateGraphState = async (
            updater: (graphState: {
                stack: string[];
                sideQuests: Record<string, { startedAt?: number; completedAt?: number; score?: { current: number; target: number; success?: boolean } }>;
                activeQuestId?: string;
                activeScore?: CoopQuestScoreState | null;
                expedition?: CoopExpeditionState | null;
                encounter?: CoopEncounterState | null;
                sequentialBroadcast?: SequentialBroadcastState | null;
            }) => void
        ) => {
            const currentSession = await db.query.coopSessions.findFirst({
                where: eq(coopSessions.id, session.id),
                columns: { flags: true }
            });

            const flags = (currentSession?.flags ?? {}) as Record<string, any>;
            const rawGraphState = (flags.__graph ?? {}) as any;
            const graphState: {
                stack: string[];
                sideQuests: Record<string, any>;
                activeQuestId?: string;
                activeScore?: CoopQuestScoreState | null;
                expedition?: CoopExpeditionState | null;
                encounter?: CoopEncounterState | null;
                sequentialBroadcast?: SequentialBroadcastState | null;
            } = {
                ...(rawGraphState && typeof rawGraphState === 'object' ? rawGraphState : {}),
                stack: Array.isArray(rawGraphState.stack) ? rawGraphState.stack.filter((v: any) => typeof v === 'string') : [],
                sideQuests: typeof rawGraphState.sideQuests === 'object' && rawGraphState.sideQuests ? rawGraphState.sideQuests : {},
                activeQuestId: typeof rawGraphState.activeQuestId === 'string' ? rawGraphState.activeQuestId : undefined,
                activeScore: normalizeScoreState(rawGraphState.activeScore),
                expedition: normalizeExpeditionState(rawGraphState.expedition),
                encounter: normalizeEncounterState(rawGraphState.encounter),
                sequentialBroadcast: normalizeSequentialBroadcastState(rawGraphState.sequentialBroadcast),
            };

            updater(graphState);

            flags.__graph = graphState;
            await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));
        };

        const revertFlags = async (flagsToRevert: Record<string, any>) => {
            if (Object.keys(flagsToRevert).length === 0) return;
            const currentSession = await db.query.coopSessions.findFirst({
                where: eq(coopSessions.id, session.id),
                columns: { flags: true }
            });
            const currentFlags = (currentSession?.flags ?? {}) as Record<string, any>;
            const nextFlags = { ...currentFlags };

            for (const [k, v] of Object.entries(flagsToRevert)) {
                if (typeof v === 'number') {
                    nextFlags[k] = (typeof nextFlags[k] === 'number' ? nextFlags[k] : 0) - v;
                } else {
                    // For non-numeric, we can't easily revert without history, so we ignore or reset
                    // For this implementation, we focus on numeric deltas (Trust)
                }
            }
            await db.update(coopSessions).set({ flags: nextFlags }).where(eq(coopSessions.id, session.id));
        };

        const applyQuestScoring = async (scoreSceneId: string, votesToScore: Array<{ voterId: number; choiceId: string }>) => {
            const currentSession = await db.query.coopSessions.findFirst({
                where: eq(coopSessions.id, session.id),
                columns: { flags: true }
            });
            const flags = (currentSession?.flags ?? {}) as Record<string, any>;
            const rawGraph = (flags.__graph ?? {}) as any;
            const activeScore = normalizeScoreState(rawGraph.activeScore);

            if (!activeScore) return;
            if (activeScore.lastScoredSceneId === scoreSceneId) return;
            if (coopGraph.getGraphId(scoreSceneId) !== 'sidequests') return;

            const camp = getCampStateFromFlags(flags);
            const campInventory = camp?.inventory ?? {};

            const roleByPlayerId = new Map<number, CoopRoleId | null>();
            for (const p of session.participants) {
                roleByPlayerId.set(p.playerId, (p.role ?? null) as CoopRoleId | null);
            }

            const mergeStatusTurns = (
                base: Record<string, number> | undefined,
                extra: Record<string, number> | undefined
            ): Record<string, number> => {
                const out: Record<string, number> = { ...(base ?? {}) };
                for (const [statusId, rawTurns] of Object.entries(extra ?? {})) {
                    const turns = Math.max(0, Math.floor(toFiniteNumber(rawTurns, 0)));
                    if (!statusId || turns <= 0) continue;
                    out[statusId] = Math.max(out[statusId] ?? 0, turns);
                }
                return out;
            };

            const tickStatusTurns = (turnsByStatus: Record<string, number>): Record<string, number> => {
                const out: Record<string, number> = {};
                for (const [statusId, rawTurns] of Object.entries(turnsByStatus)) {
                    const turns = Math.max(0, Math.floor(toFiniteNumber(rawTurns, 0)));
                    const next = turns - 1;
                    if (!statusId || next <= 0) continue;
                    out[statusId] = next;
                }
                return out;
            };

            const stageModifierDeltas: Record<string, number> = {};
            const stageGlobalStatusAdds: Record<string, number> = {};
            const stagePlayerStatusAdds: Record<string, Record<string, number>> = {};

            const upsertModifierDelta = (id: string, mult: number) => {
                if (!id) return;
                if (!Number.isFinite(mult)) return;
                stageModifierDeltas[id] = toFiniteNumber(stageModifierDeltas[id], 1) * mult;
            };

            const upsertStatusMax = (map: Record<string, number>, statusId: string, turns: number) => {
                const safeTurns = Math.max(1, Math.floor(toFiniteNumber(turns, 1)));
                if (!statusId) return;
                map[statusId] = Math.max(map[statusId] ?? 0, safeTurns);
            };

            const upsertPlayerStatus = (playerKey: string, statusId: string, turns: number) => {
                if (!playerKey) return;
                stagePlayerStatusAdds[playerKey] = stagePlayerStatusAdds[playerKey] ?? {};
                upsertStatusMax(stagePlayerStatusAdds[playerKey], statusId, turns);
            };

            // Pre-collect score effects so they can influence scoring inside the same stage.
            for (const vote of votesToScore) {
                const votedChoice = currentNode.choices.find((c) => c.id === vote.choiceId);
                if (!votedChoice) continue;

                const mods = (votedChoice as any).applyScoreModifiers as Record<string, number> | undefined;
                if (mods && typeof mods === 'object') {
                    for (const [id, raw] of Object.entries(mods)) {
                        const mult = toFiniteNumber(raw, 1);
                        if (!id || !Number.isFinite(mult)) continue;
                        upsertModifierDelta(id, mult);
                    }
                }

                const applyStatus = (votedChoice as any).applyStatus as
                    | { target?: string; statusId?: string; turns?: number }
                    | undefined;
                if (applyStatus && typeof applyStatus === 'object') {
                    const statusId = typeof applyStatus.statusId === 'string' ? applyStatus.statusId : '';
                    if (!statusId) continue;

                    const defaultTurnsRaw = (COOP_STATUSES as any)?.[statusId]?.defaultTurns as number | undefined;
                    const defaultTurns = Math.max(1, Math.floor(toFiniteNumber(defaultTurnsRaw, 1)));
                    const turns = Math.max(1, Math.floor(toFiniteNumber(applyStatus.turns, defaultTurns)));

                    const voterKey = String(vote.voterId);
                    const target = typeof applyStatus.target === 'string' ? applyStatus.target : 'all';

                    if (target === 'self') {
                        upsertPlayerStatus(voterKey, statusId, turns);
                    } else if (target === 'others') {
                        for (const p of session.participants) {
                            const key = String(p.playerId);
                            if (key === voterKey) continue;
                            upsertPlayerStatus(key, statusId, turns);
                        }
                    } else {
                        upsertStatusMax(stageGlobalStatusAdds, statusId, turns);
                    }
                }
            }

            const effectiveGlobalStatuses = mergeStatusTurns(activeScore.statuses, stageGlobalStatusAdds);

            let stageDelta = 0;
            const lastStageByPlayer: Record<string, number> = {};

            for (const vote of votesToScore) {
                const votedChoice = currentNode.choices.find((c) => c.id === vote.choiceId);
                if (!votedChoice) continue;

                const baseScore = toFiniteNumber(votedChoice.baseScore, 0);
                const voterKey = String(vote.voterId);
                const role = roleByPlayerId.get(vote.voterId) ?? null;
                const classMult = getClassMultiplier(votedChoice, role);
                const buffMult =
                    computeBuffMultiplier(activeScore.modifiers, votedChoice.scoreTags) *
                    computeBuffMultiplier(stageModifierDeltas, votedChoice.scoreTags) *
                    computeBuffMultiplier(activeScore.playerModifiers?.[voterKey], votedChoice.scoreTags);
                const effectiveSelfStatuses = mergeStatusTurns(
                    mergeStatusTurns(activeScore.playerStatuses?.[voterKey], stagePlayerStatusAdds[voterKey]),
                    effectiveGlobalStatuses
                );
                const statusMult = computeStatusMultiplier(effectiveSelfStatuses, votedChoice.scoreTags);

                let itemBonus = 0;
                if (votedChoice.consumableCost) {
                    const templateId = votedChoice.consumableCost.templateId;
                    const amount = Math.max(1, Math.floor(toFiniteNumber(votedChoice.consumableCost.amount, 1)));
                    if (tryConsumeInventory(campInventory, templateId, amount)) {
                        itemBonus = toFiniteNumber(votedChoice.itemBonus, 0);
                    }
                }

                const artifactBonus = computeArtifactBonusFromFlags(flags, votedChoice.scoreTags);
                const { finalScore } = calculateContributionScore({
                    baseScore,
                    classMult,
                    buffMult,
                    statusMult,
                    itemBonus,
                    artifactBonus,
                });

                stageDelta += finalScore;
                lastStageByPlayer[voterKey] = (lastStageByPlayer[voterKey] ?? 0) + finalScore;
            }

            // Persist score effects into the active accumulator for future stages.
            for (const [id, raw] of Object.entries(stageModifierDeltas)) {
                const mult = toFiniteNumber(raw, 1);
                if (!id || !Number.isFinite(mult)) continue;
                activeScore.modifiers[id] = toFiniteNumber(activeScore.modifiers[id], 1) * mult;
            }

            activeScore.statuses = tickStatusTurns(effectiveGlobalStatuses);

            const nextPlayerStatuses: Record<string, Record<string, number>> = {};
            const existingPlayerStatuses = activeScore.playerStatuses ?? {};
            const allPlayerKeys = new Set<string>([
                ...Object.keys(existingPlayerStatuses),
                ...Object.keys(stagePlayerStatusAdds),
                ...session.participants.map((p) => String(p.playerId)),
            ]);

            for (const playerKey of allPlayerKeys) {
                const merged = mergeStatusTurns(existingPlayerStatuses[playerKey], stagePlayerStatusAdds[playerKey]);
                const ticked = tickStatusTurns(merged);
                if (Object.keys(ticked).length > 0) nextPlayerStatuses[playerKey] = ticked;
            }
            activeScore.playerStatuses = nextPlayerStatuses;

            activeScore.current = toFiniteNumber(activeScore.current, 0) + stageDelta;
            activeScore.history = [...activeScore.history, stageDelta].slice(-100);
            activeScore.lastStageTotal = stageDelta;
            activeScore.lastStageByPlayer = lastStageByPlayer;
            activeScore.lastScoredSceneId = scoreSceneId;

            rawGraph.activeScore = activeScore;
            flags.__graph = rawGraph;
            if (camp) flags.__camp = camp;

            await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));
        };

        const participant = session.participants.find((p) => p.playerId === actorPlayerId);
        if (!participant) throw new Error('Not a participant');

        // Validate choice exists
        const choice = currentNode.choices.find(c => c.id === choiceId);
        if (!choice) throw new Error('Invalid choice');

        // Validate role restrictions (server-side)
        if (choice.requiredRole && participant.role !== choice.requiredRole) {
            throw new Error('Choice locked to role');
        }

        // Validate item requirements/costs (camp inventory; optional feature)
        if (choice.requiredItem || choice.consumableCost) {
            const flagsSnapshot = (session.flags ?? {}) as Record<string, any>;
            const campSnapshot = getCampStateFromFlags(flagsSnapshot);
            const inv = campSnapshot?.inventory ?? {};

            if (choice.requiredItem) {
                const have = toFiniteNumber(inv[choice.requiredItem], 0);
                if (have < 1) throw new Error('Missing required item');
            }

            if (choice.consumableCost) {
                const templateId = choice.consumableCost.templateId;
                const amount = Math.max(1, Math.floor(toFiniteNumber(choice.consumableCost.amount, 1)));
                const have = toFiniteNumber(inv[templateId], 0);
                if (have < amount) throw new Error('Not enough consumables');
            }
        }

        // Validate stats, attributes, and traits
        if (choice.requiredStats || choice.requiredAttributes || choice.requiredTraits) {
            const progress = await db.query.gameProgress.findFirst({
                where: eq(gameProgress.playerId, actorPlayerId)
            });
            const attributes = await db.query.voiceAttributes.findFirst({
                where: eq(voiceAttributes.playerId, actorPlayerId)
            });

            // Check Stats
            if (choice.requiredStats) {
                if (!progress) throw new Error('Player stats not found');
                const { hp, morale, stamina } = choice.requiredStats;
                if (hp !== undefined && (progress.hp ?? 0) < hp) throw new Error('Not enough HP');
                if (morale !== undefined && (progress.morale ?? 0) < morale) throw new Error('Not enough Morale');
                if (stamina !== undefined && (progress.stamina ?? 0) < stamina) throw new Error('Not enough Stamina');
            }

            // Check Attributes
            if (choice.requiredAttributes) {
                if (!attributes) throw new Error('Player attributes not found');
                for (const [attrId, minVal] of Object.entries(choice.requiredAttributes)) {
                    const currentVal = (attributes as any)[attrId];
                    if (typeof currentVal !== 'number' || currentVal < minVal) {
                        throw new Error(`Attribute ${attrId} too low`);
                    }
                }
            }

            // Check Traits
            if (choice.requiredTraits) {
                const flagsSnapshot = (session.flags ?? {}) as Record<string, any>;
                const expeditionSnapshot = getExpeditionStateFromFlags(flagsSnapshot);
                const playerTraits = expeditionSnapshot?.playerTraits?.[String(actorPlayerId)] ?? [];

                for (const trait of choice.requiredTraits) {
                    if (!playerTraits.includes(trait)) throw new Error(`Missing trait: ${trait}`);
                }
            }
        }

        // Validate expedition currency costs (optional; stored in flags.__graph.expedition).
        if ((choice as any).cost?.rp) {
            const flagsSnapshot = (session.flags ?? {}) as Record<string, any>;
            const expeditionSnapshot = getExpeditionStateFromFlags(flagsSnapshot);
            if (!expeditionSnapshot) throw new Error('Expedition not started');

            const need = Math.max(1, Math.floor(toFiniteNumber((choice as any).cost?.rp, 1)));
            const have = Math.max(0, Math.floor(toFiniteNumber(expeditionSnapshot.researchPoints, 0)));
            if (have < need) throw new Error('Not enough research points');
        }

        // Check for existing vote to revert flags if needed (for individual nodes)
        const existingVote = await db.query.coopVotes.findFirst({
            where: and(
                eq(coopVotes.sessionId, session.id),
                eq(coopVotes.sceneId, voteSceneId),
                eq(coopVotes.voterId, actorPlayerId),
            )
        });

        if (existingVote) {
            if (currentNode.interactionType === 'individual') {
                const oldFlags = getChoiceFlags(existingVote.choiceId);
                await revertFlags(oldFlags);
            }
            await db.delete(coopVotes).where(eq(coopVotes.id, existingVote.id));
        }

        // Record vote/choice
        await db.insert(coopVotes).values({
            sessionId: session.id,
            sceneId: voteSceneId,
            choiceId,
            voterId: actorPlayerId,
            createdAt: Date.now(),
        });

        const newFlags = getChoiceFlags(choiceId);

        const awardLoot = async (c: any) => {
            if (!c.itemRewards || !Array.isArray(c.itemRewards) || c.itemRewards.length === 0) return;

            // Fetch latest session state to ensure atomicity on inventory
            const s = await db.query.coopSessions.findFirst({
                where: eq(coopSessions.id, session.id),
                columns: { flags: true }
            });
            const f = (s?.flags ?? {}) as Record<string, any>;
            const campState = getCampStateFromFlags(f);

            // If no camp state, maybe we should init it? Or just ignore?
            // For now, if we are in a mission finding loot, we probably "Send it to Base".
            // If Base doesn't exist yet (Prologue?), we might lose it or need a persistent stash.
            // Assumption: Camp exists if we are doing missions. If not, create default.
            const nextCamp = campState ?? { ...DEFAULT_CAMP_STATE, inventory: {} };

            const nextInv = { ...nextCamp.inventory };

            for (const reward of c.itemRewards) {
                const qty = Math.max(0, Math.floor(toFiniteNumber(reward.quantity, 0)));
                if (qty > 0 && reward.templateId) {
                    nextInv[reward.templateId] = (nextInv[reward.templateId] ?? 0) + qty;
                }
            }

            nextCamp.inventory = nextInv;
            const nextFlags = { ...f, __camp: nextCamp };
            await db.update(coopSessions).set({ flags: nextFlags }).where(eq(coopSessions.id, session.id));
        };

        // Individual choices are personal: they should not block others and should not advance the shared checkpoint.
        if (currentNode.interactionType === 'individual') {
            await applyFlags(newFlags);
            await awardLoot(choice);
            const state = await coopService.getRoomState(code);
            broadcastCoopUpdate(code, state);
            return state;
        }

        // Sequential broadcast: each player chooses in order, reactions are shown to everyone
        if (currentNode.interactionType === 'sequential_broadcast') {
            // Get current sequential state
            const currentFlags = (await db.query.coopSessions.findFirst({
                where: eq(coopSessions.id, session.id),
                columns: { flags: true }
            }))?.flags as Record<string, any> ?? {};

            const rawGraph = (currentFlags.__graph ?? {}) as any;
            let seqState = normalizeSequentialBroadcastState(rawGraph.sequentialBroadcast) ?? {
                activePlayerId: null,
                completedPlayerIds: [],
                playerOrder: [],
                reactions: [],
                // showingReactionIndex is deprecated in favor of ephemeral client-side handling
                // but we keep it in state matching the type definition
                showingReactionIndex: null,
            };

            // Initialize player order if empty (first player to arrive starts, rest random)
            if (seqState.playerOrder.length === 0) {
                const allPlayerIds = session.participants.map(p => p.playerId);
                // First player to vote goes first
                const remaining = allPlayerIds.filter(id => id !== actorPlayerId);
                // Shuffle remaining
                for (let i = remaining.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
                }
                seqState.playerOrder = [actorPlayerId, ...remaining];
                seqState.activePlayerId = actorPlayerId;
            }

            // Check if it's this player's turn
            if (seqState.activePlayerId !== actorPlayerId) {
                throw new Error('Not your turn to choose');
            }

            // Get player info for reaction
            const actingParticipant = session.participants.find(p => p.playerId === actorPlayerId);
            const playerName = actingParticipant?.player?.name ?? `Player ${actorPlayerId}`;
            const playerRole = (actingParticipant?.role ?? null) as string | null;

            // Record the reaction
            seqState.reactions.push({
                playerId: actorPlayerId,
                playerName,
                playerRole,
                choiceId,
                choiceText: choice.text ?? '',
                effectText: choice.effectText ?? '',
                timestamp: Date.now(),
            });
            seqState.completedPlayerIds.push(actorPlayerId);
            seqState.showingReactionIndex = seqState.reactions.length - 1;

            // Find next player
            const nextPlayerIndex = seqState.playerOrder.findIndex(id =>
                !seqState.completedPlayerIds.includes(id)
            );

            if (nextPlayerIndex >= 0) {
                seqState.activePlayerId = seqState.playerOrder[nextPlayerIndex];
            } else {
                seqState.activePlayerId = null; // All done
            }

            // Apply choice flags
            await applyFlags(newFlags);

            // Check if all players have chosen
            const allChosen = seqState.completedPlayerIds.length >= session.participants.length;

            if (allChosen) {
                // Everyone chose. We do NOT advance immediately to allow the final reaction to be shown.
                // The client will see activePlayerId: null and show a "Continue" button.
                seqState.activePlayerId = null;
            }

            // Update sequential state in graph
            await updateGraphState((graph) => {
                graph.sequentialBroadcast = seqState;
            });


            const state = await coopService.getRoomState(code);
            broadcastCoopUpdate(code, state);
            return state;
        }

        // Check if we should advance
        const allVotes = await db.query.coopVotes.findMany({
            where: and(
                eq(coopVotes.sessionId, session.id),
                eq(coopVotes.sceneId, session.currentScene)
            )
        });

        const activeParticipantIds = new Set(session.participants.map((p) => p.playerId));
        const relevantVotes = allVotes.filter((vote) => activeParticipantIds.has(vote.voterId));
        const activeParticipants = session.participants.length;

        const flagsSnapshot = (session.flags ?? {}) as Record<string, any>;
        const activeScoreSnapshot = getActiveScoreStateFromFlags(flagsSnapshot);
        const expeditionBefore = getExpeditionStateFromFlags(flagsSnapshot);

        const isSideQuestWithActiveScore = Boolean(
            activeScoreSnapshot && coopGraph.getGraphId(session.currentScene) === 'sidequests'
        );

        const hasScorableChoices = currentNode.choices.some((c) => {
            const base = toFiniteNumber((c as any).baseScore, 0);
            if (base !== 0) return true;
            const hasConsumable = Boolean((c as any).consumableCost);
            const itemBonus = toFiniteNumber((c as any).itemBonus, 0);
            return hasConsumable && itemBonus !== 0;
        });

        const isScoredStage = Boolean(
            isSideQuestWithActiveScore && (currentNode.interactionType === 'contribute' || hasScorableChoices)
        );

        const requiresAllVotes = Boolean(
            currentNode.requiresAllVotesForProgress || currentNode.interactionType === 'contribute' || isScoredStage
        );

        const threshold = requiresAllVotes ? activeParticipants : (Math.floor(activeParticipants / 2) + 1);
        if (relevantVotes.length >= threshold) {
            // Tally votes
            const counts: Record<string, number> = {};
            for (const v of relevantVotes) {
                counts[v.choiceId] = (counts[v.choiceId] || 0) + 1;
            }

            // Tie breaking: Find max votes, pick random among leaders
            const maxVotes = Math.max(...Object.values(counts));
            const leaders = Object.entries(counts).filter(([_, c]) => c === maxVotes).map(([id]) => id);
            const winnerId = leaders[Math.floor(Math.random() * leaders.length)];
            const winningChoice = currentNode.choices.find(c => c.id === winnerId);

            if (isScoredStage) {
                await applyQuestScoring(session.currentScene, relevantVotes);
            }

            // Apply winner flags
            if (winningChoice) {
                const winnerFlags = getChoiceFlags(winningChoice.id);
                await applyFlags(winnerFlags);
                await awardLoot(winningChoice);
            }

            let nextNodeId: string | undefined;
            let actionHandled = false;
            let expeditionExtraTimeCost = 0;
            let missionScoreModifiers: Record<string, number> | undefined;
            let missionApplyStatuses: Record<string, number> | undefined;
            let missionThreatLevel: number | undefined;
            let missionChosenSlotId: string | undefined;

            // Side-quest graph actions (start/return) are resolved server-side.
            const baseWinningAction = (winningChoice as any)?.action as string | undefined;
            const baseWinningQuestId = (winningChoice as any)?.questId as string | undefined;

            let winningAction = baseWinningAction;
            let winningQuestId = baseWinningQuestId;
            let winningEntryNodeId = (winningChoice as any)?.nextNodeId as string | undefined;

            // Dynamic expedition missions (stage pools): hub choice ids map to runtime missions in flags.__graph.expedition.missions.
            // This allows per-stage random missions + unique side quests without baking them into coopGraph.
            const mission = expeditionBefore?.missions?.[winnerId as string];
            if (mission && coopGraph.getGraphId(session.currentScene) === 'main') {
                missionChosenSlotId = winnerId as string;
                expeditionExtraTimeCost = Math.max(0, Math.floor(toFiniteNumber(mission.timeCost, 0)));
                missionThreatLevel = Math.max(1, Math.floor(toFiniteNumber(mission.threatLevel, 1)));
                missionScoreModifiers = mission.scoreModifiers ?? undefined;
                missionApplyStatuses = mission.applyStatuses ?? undefined;

                if (mission.kind === 'sidequest') {
                    winningAction = 'start_side_quest';
                    winningQuestId = mission.questId;
                    winningEntryNodeId = mission.entryNodeId;
                } else if (mission.kind === 'node') {
                    nextNodeId = mission.nodeId;
                    actionHandled = Boolean(nextNodeId);
                }
            }

            if (winningChoice && winningAction === 'start_side_quest') {
                const entryNodeId = winningEntryNodeId;
                if (!entryNodeId) throw new Error('Side quest entry node is missing nextNodeId');
                if (!winningQuestId) throw new Error('Side quest is missing questId');

                const meta = getSideQuestMeta(winningQuestId);
                const threatFactor =
                    typeof missionThreatLevel === 'number' && Number.isFinite(missionThreatLevel)
                        ? 1 + Math.max(0, missionThreatLevel - 1) * 0.25
                        : 1.0;
                const stages = computeAutoStagesFromGraph({
                    entryNodeId,
                    getNode: (nodeId) => coopGraph.getNode(nodeId),
                    getGraphId: (nodeId) => coopGraph.getGraphId(nodeId),
                });
                const target = computeTargetTotal({
                    baseStageAvg: meta.baseStageAvg,
                    stages,
                    players: activeParticipants,
                    difficultyFactor: toFiniteNumber(meta.difficultyFactor, 1.0) * threatFactor,
                });

                await updateGraphState((graph) => {
                    graph.stack.push(session.currentScene as string);
                    if (winningQuestId) {
                        const existing = graph.sideQuests[winningQuestId] ?? {};
                        graph.sideQuests[winningQuestId] = {
                            ...existing,
                            startedAt: existing.startedAt ?? Date.now(),
                        };

                        graph.activeQuestId = winningQuestId;
                        graph.activeScore = {
                            questId: winningQuestId,
                            current: 0,
                            target,
                            history: [],
                            modifiers: missionScoreModifiers ? { ...missionScoreModifiers } : {},
                            playerModifiers: {},
                            statuses: missionApplyStatuses ? { ...missionApplyStatuses } : {},
                            playerStatuses: {},
                            stages,
                            lastStageTotal: 0,
                            lastStageByPlayer: {},
                        };
                    }

                    if (missionChosenSlotId) {
                        const expedition = normalizeExpeditionState(graph.expedition);
                        if (expedition?.missions && missionChosenSlotId in expedition.missions) {
                            const next = { ...expedition.missions };
                            delete next[missionChosenSlotId];
                            expedition.missions = Object.keys(next).length > 0 ? next : undefined;
                            graph.expedition = expedition;
                        }
                    }
                });

                nextNodeId = entryNodeId;
                actionHandled = true;
            } else if (winningChoice && winningAction === 'return') {
                let returnNodeId: string | undefined;

                await updateGraphState((graph) => {
                    returnNodeId = graph.stack.pop();
                    if (winningQuestId) {
                        const existing = graph.sideQuests[winningQuestId] ?? {};
                        const activeScore = normalizeScoreState(graph.activeScore);
                        const success = Boolean(activeScore && activeScore.current >= activeScore.target);
                        graph.sideQuests[winningQuestId] = {
                            ...existing,
                            completedAt: existing.completedAt ?? Date.now(),
                            score: activeScore ? {
                                current: activeScore.current,
                                target: activeScore.target,
                                success,
                            } : existing.score,
                        };
                    }

                    // Leaving the side quest: clear runtime score accumulator.
                    graph.activeQuestId = undefined;
                    graph.activeScore = null;
                });

                nextNodeId = returnNodeId ?? winningChoice.nextNodeId;
                actionHandled = Boolean(nextNodeId);
            } else if (winningChoice && winningAction === 'start_coop_battle') {
                const payload = (winningChoice as any).battle as any;
                const scenarioId =
                    typeof payload?.scenarioId === 'string' && payload.scenarioId.trim().length > 0 ? payload.scenarioId.trim() : undefined;
                const threatDelta = toFiniteNumber(payload?.threatDelta, 0);

                const victoryNextNodeId =
                    typeof payload?.victoryNextNodeId === 'string' && payload.victoryNextNodeId.trim().length > 0
                        ? payload.victoryNextNodeId.trim()
                        : undefined;
                const defeatNextNodeId =
                    typeof payload?.defeatNextNodeId === 'string' && payload.defeatNextNodeId.trim().length > 0
                        ? payload.defeatNextNodeId.trim()
                        : undefined;

                const returnNodeId = victoryNextNodeId ?? winningChoice.nextNodeId;
                if (!returnNodeId) throw new Error('Battle choice missing nextNodeId');
                const defeatNodeId = defeatNextNodeId ?? returnNodeId;

                const participantIds = session.participants.map((p) => p.playerId);
                const progressRows = await db.query.gameProgress.findMany({
                    where: inArray(gameProgress.playerId, participantIds),
                    columns: {
                        playerId: true,
                        hp: true,
                        maxHp: true,
                        morale: true,
                        maxMorale: true,
                        stamina: true,
                        maxStamina: true,
                    },
                });
                const progressByPlayerId = new Map<number, any>();
                for (const row of progressRows) progressByPlayerId.set(row.playerId, row);

                const currentFlags = (session.flags ?? {}) as Record<string, any>;
                const expeditionCtx = getExpeditionStateFromFlags(currentFlags);
                const traitsByPlayerKey = expeditionCtx?.playerTraits ?? {};

                const baseThreat = typeof expeditionCtx?.stageIndex === 'number' && Number.isFinite(expeditionCtx.stageIndex)
                    ? Math.max(1, Math.floor(expeditionCtx.stageIndex) + 1)
                    : 1;
                const threatLevel = Math.max(1, Math.min(4, Math.floor(baseThreat + toFiniteNumber(threatDelta, 0))));

                const playersSnapshot: CoopEncounterPlayerSnapshot[] = session.participants.map((p) => {
                    const progress = progressByPlayerId.get(p.playerId);

                    const maxHp = Math.max(1, Math.floor(toFiniteNumber(progress?.maxHp, 100)));
                    const maxMorale = Math.max(1, Math.floor(toFiniteNumber(progress?.maxMorale, 100)));
                    const maxStamina = Math.max(1, Math.floor(toFiniteNumber(progress?.maxStamina, 100)));

                    const hp = Math.max(0, Math.min(maxHp, Math.floor(toFiniteNumber(progress?.hp, maxHp))));
                    const morale = Math.max(0, Math.min(maxMorale, Math.floor(toFiniteNumber(progress?.morale, maxMorale))));
                    const stamina = Math.max(0, Math.min(maxStamina, Math.floor(toFiniteNumber(progress?.stamina, maxStamina))));

                    const traitsRaw = traitsByPlayerKey[String(p.playerId)] ?? [];
                    const traits = Array.isArray(traitsRaw)
                        ? traitsRaw.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean)
                        : [];

                    return {
                        playerId: p.playerId,
                        role: (p.role ?? null) as CoopRoleId | null,
                        hp,
                        maxHp,
                        morale,
                        maxMorale,
                        stamina,
                        maxStamina,
                        traits: Array.from(new Set(traits)),
                    };
                });

                const rewardRpRaw = toFiniteNumber((winningChoice as any)?.reward?.rp, 0);
                const rewardRp = Number.isFinite(rewardRpRaw) && rewardRpRaw > 0 ? Math.floor(rewardRpRaw) : undefined;

                const now = Date.now();
                const encounterId = `enc_${now}_${Math.random().toString(36).slice(2, 8)}`;

                await updateGraphState((graph) => {
                    const existing = normalizeEncounterState(graph.encounter);
                    if (existing?.status === 'active') return;
                    graph.encounter = {
                        id: encounterId,
                        startedAt: now,
                        status: 'active',
                        sceneId: session.currentScene as string,
                        choiceId: winningChoice.id,
                        scenarioId,
                        threatLevel,
                        returnNodeId,
                        defeatNodeId,
                        rewardRp,
                        players: playersSnapshot,
                    };
                });

                nextNodeId = session.currentScene;
                actionHandled = true;
            } else if (winningChoice && winningAction === 'resolve_expedition_event') {
                const payload = (winningChoice as any).expeditionEvent as any;
                const rawEventId = typeof payload?.id === 'string' ? payload.id.trim() : '';
                if (!rawEventId) throw new Error('Expedition event is missing id');

                if (rawEventId !== 'psi_wave' && rawEventId !== 'injury_roll' && rawEventId !== 'injury_treat') {
                    throw new Error(`Unknown expedition event: ${rawEventId}`);
                }
                const eventId = rawEventId as 'psi_wave' | 'injury_roll' | 'injury_treat';

                const rawActorRole = typeof payload?.actorRole === 'string' ? payload.actorRole.trim() : '';
                const actorRole = COOP_ROLE_IDS.includes(rawActorRole as CoopRoleId) ? (rawActorRole as CoopRoleId) : undefined;

                const successNextNodeId =
                    typeof payload?.successNextNodeId === 'string' && payload.successNextNodeId.trim().length > 0
                        ? payload.successNextNodeId.trim()
                        : undefined;
                const failureNextNodeId =
                    typeof payload?.failureNextNodeId === 'string' && payload.failureNextNodeId.trim().length > 0
                        ? payload.failureNextNodeId.trim()
                        : undefined;

                const currentSessionCtx = await db.query.coopSessions.findFirst({
                    where: eq(coopSessions.id, session.id),
                    columns: { flags: true }
                });
                const currentFlags = (currentSessionCtx?.flags ?? {}) as Record<string, any>;
                const expeditionCtx = getExpeditionStateFromFlags(currentFlags);
                if (!expeditionCtx) throw new Error('Expedition not started');

                const participantIds = session.participants.map((p) => p.playerId);
                const progressRows = await db.query.gameProgress.findMany({
                    where: inArray(gameProgress.playerId, participantIds),
                    columns: {
                        playerId: true,
                        hp: true,
                        maxHp: true,
                        morale: true,
                        maxMorale: true,
                        stamina: true,
                        maxStamina: true,
                        skills: true,
                    },
                });
                const progressByPlayerId = new Map<number, any>();
                for (const row of progressRows) {
                    progressByPlayerId.set(row.playerId, row);
                }

                const playerSnapshots = session.participants.map((p) => {
                    const progress = progressByPlayerId.get(p.playerId);
                    return {
                        playerId: p.playerId,
                        role: (p.role ?? null) as CoopRoleId | null,
                        hp: progress?.hp ?? null,
                        maxHp: progress?.maxHp ?? null,
                        morale: progress?.morale ?? null,
                        maxMorale: progress?.maxMorale ?? null,
                        stamina: progress?.stamina ?? null,
                        maxStamina: progress?.maxStamina ?? null,
                        skills: (progress?.skills ?? {}) as Record<string, number>,
                    };
                });

                const resolution = resolveExpeditionEvent({
                    id: eventId,
                    players: playerSnapshots,
                    actorRole,
                    injury: expeditionCtx.injury,
                });

                const perPlayerResults = resolution.perPlayer ?? {};
                const now = Date.now();
                const updatesByPlayerId = new Map<number, { hp?: number; morale?: number; stamina?: number }>();

                const getCurrent = (playerId: number) => {
                    const progress = progressByPlayerId.get(playerId);
                    const maxHp = Math.max(1, Math.floor(toFiniteNumber(progress?.maxHp, 100)));
                    const maxMorale = Math.max(1, Math.floor(toFiniteNumber(progress?.maxMorale, 100)));
                    const maxStamina = Math.max(1, Math.floor(toFiniteNumber(progress?.maxStamina, 100)));
                    const hp = Math.max(0, Math.min(maxHp, Math.floor(toFiniteNumber(progress?.hp, maxHp))));
                    const morale = Math.max(0, Math.min(maxMorale, Math.floor(toFiniteNumber(progress?.morale, maxMorale))));
                    const stamina = Math.max(0, Math.min(maxStamina, Math.floor(toFiniteNumber(progress?.stamina, maxStamina))));
                    return { hp, maxHp, morale, maxMorale, stamina, maxStamina };
                };

                if (resolution.id === 'psi_wave') {
                    for (const p of playerSnapshots) {
                        const playerId = p.playerId;
                        const entry = perPlayerResults[String(playerId)];
                        if (!entry || entry.pass) continue;

                        const current = getCurrent(playerId);
                        const moraleLoss = Math.max(5, Math.floor(current.maxMorale * 0.08));
                        updatesByPlayerId.set(playerId, { morale: Math.max(0, current.morale - moraleLoss) });
                    }
                } else if (resolution.id === 'injury_roll') {
                    const targetPlayerId = resolution.targetPlayerId;
                    if (targetPlayerId) {
                        const entry = perPlayerResults[String(targetPlayerId)];
                        if (entry && !entry.pass) {
                            const current = getCurrent(targetPlayerId);
                            const hpLoss = Math.max(4, Math.floor(current.maxHp * 0.05));
                            updatesByPlayerId.set(targetPlayerId, { hp: Math.max(0, current.hp - hpLoss) });
                        }
                    }
                } else if (resolution.id === 'injury_treat') {
                    const targetPlayerId = resolution.targetPlayerId;
                    if (targetPlayerId) {
                        const current = getCurrent(targetPlayerId);
                        if (resolution.success) {
                            const heal = Math.max(6, Math.floor(current.maxHp * 0.06));
                            updatesByPlayerId.set(targetPlayerId, { hp: Math.min(current.maxHp, current.hp + heal) });
                        } else {
                            const hpLoss = Math.max(3, Math.floor(current.maxHp * 0.03));
                            updatesByPlayerId.set(targetPlayerId, { hp: Math.max(0, current.hp - hpLoss) });
                        }
                    }
                }

                for (const [playerId, patch] of updatesByPlayerId) {
                    await db.update(gameProgress).set({
                        ...(typeof patch.hp === 'number' ? { hp: patch.hp } : {}),
                        ...(typeof patch.morale === 'number' ? { morale: patch.morale } : {}),
                        ...(typeof patch.stamina === 'number' ? { stamina: patch.stamina } : {}),
                        updatedAt: now,
                    }).where(eq(gameProgress.playerId, playerId));
                }

                await updateGraphState((graph) => {
                    const expedition = normalizeExpeditionState(graph.expedition);
                    if (!expedition) return;

                    const nextTraits: Record<string, string[]> = { ...(expedition.playerTraits ?? {}) };
                    for (const [playerKey, entry] of Object.entries(resolution.perPlayer ?? {})) {
                        const added = (entry?.traitsAdded ?? []).filter((t) => typeof t === 'string' && t.length > 0);
                        if (added.length === 0) continue;
                        const current = new Set(nextTraits[playerKey] ?? []);
                        for (const traitId of added) current.add(traitId);
                        nextTraits[playerKey] = Array.from(current);
                    }
                    expedition.playerTraits = Object.keys(nextTraits).length > 0 ? nextTraits : undefined;

                    if (resolution.id === 'injury_roll') {
                        expedition.injury = resolution.injury?.needsTreatment ? resolution.injury : undefined;
                    } else if (resolution.id === 'injury_treat') {
                        expedition.injury = resolution.success ? undefined : expedition.injury ?? undefined;
                    }

                    expedition.lastEvent = {
                        id: resolution.id,
                        at: Date.now(),
                        success: resolution.success,
                        summary: resolution.summary,
                        perPlayer: resolution.perPlayer,
                        targetPlayerId: resolution.targetPlayerId,
                        actorPlayerId: resolution.actorPlayerId,
                    };

                    graph.expedition = expedition;
                });

                const overrideNextNodeId = resolution.success ? successNextNodeId : failureNextNodeId;
                nextNodeId = overrideNextNodeId ?? winningChoice.nextNodeId;
                actionHandled = Boolean(nextNodeId);
            }

            // Special-case branching: in the briefing scene, Ghost can reveal an eavesdropper.
            if (!actionHandled && session.currentScene === 'outpost_tent') {
                const hasIntruderReveal = relevantVotes.some((vote) => vote.choiceId === 'ghost_intruder');
                if (hasIntruderReveal) {
                    nextNodeId = 'briefing_intruder';
                }
            }

            // Special-case branching: negotiation trust meter at the dwarven encounter.
            if (!actionHandled && session.currentScene === 'crossroads_vote') {
                // Fetch updated flags locally to check trust
                const currentSessionCtx = await db.query.coopSessions.findFirst({
                    where: eq(coopSessions.id, session.id),
                    columns: { flags: true }
                });
                const flags = (currentSessionCtx?.flags ?? {}) as Record<string, any>;
                // Base trust 50 + accumulated deltas
                const trustScore = 50 + (Number(flags.trust_delta) || 0);

                if (trustScore > 75) nextNodeId = 'crossroads_peace';
                else if (trustScore < 25) nextNodeId = 'crossroads_massacre';
                else nextNodeId = 'crossroads_coerce';
            }

            if (nextNodeId) {
                // Skip generic resolution below
            } else if (
                (currentNode.interactionType === 'vote' ||
                    currentNode.interactionType === 'sync' ||
                    currentNode.interactionType === 'contribute') &&
                !actionHandled
            ) {
                if (winningChoice?.nextNodeId) {
                    nextNodeId = winningChoice.nextNodeId;
                }
            }

            // Expedition loop (turn timer + research points + waves). Stored in flags.__graph.expedition.
            if (winningChoice) {
                const choiceAny = winningChoice as any;

                const extraTimeCost = Math.max(0, Math.floor(toFiniteNumber(expeditionExtraTimeCost, 0)));

                const isBattleStart = choiceAny.action === 'start_coop_battle';
                const shouldTouchExpedition = Boolean(
                    choiceAny.action === 'start_expedition' ||
                    choiceAny.action === 'advance_expedition_stage' ||
                    (!isBattleStart && (choiceAny.cost?.time || choiceAny.cost?.rp || choiceAny.reward?.rp)) ||
                    extraTimeCost > 0
                );

                const expeditionSnapshot = getExpeditionStateFromFlags(flagsSnapshot);
                const shouldCheckDeadline = Boolean(
                    expeditionSnapshot &&
                    nextNodeId &&
                    coopGraph.getGraphId(nextNodeId) === 'main' &&
                    (Boolean(expeditionSnapshot.pendingNodeId) ||
                        Boolean(expeditionSnapshot.wavePending && expeditionSnapshot.waveNodeId))
                );

                if (shouldTouchExpedition || shouldCheckDeadline) {
                    let redirectedNodeId: string | undefined;
                    let expeditionAfter: CoopExpeditionState | null = null;
                    const ensureCamp = choiceAny.action === 'start_expedition';

                    await updateGraphState((graph) => {
                        let expedition = normalizeExpeditionState(graph.expedition);

                        if (choiceAny.action === 'start_expedition') {
                            const cfg = (choiceAny.expedition ?? {}) as any;
                            const maxTurns = Math.max(1, Math.floor(toFiniteNumber(cfg.maxTurns, 3)));
                            const waveNodeId =
                                typeof cfg.waveNodeId === 'string' && cfg.waveNodeId.trim().length > 0
                                    ? cfg.waveNodeId.trim()
                                    : undefined;
                            const stagePoolId =
                                typeof cfg.stagePoolId === 'string' && cfg.stagePoolId.trim().length > 0 ? cfg.stagePoolId.trim() : undefined;
                            const startStageIndex = Math.max(0, Math.floor(toFiniteNumber(cfg.startStageIndex, 0)));
                            const deadlineEvents: CoopExpeditionDeadlineEvent[] | undefined = Array.isArray(cfg.deadlineEvents)
                                ? (cfg.deadlineEvents as any[])
                                    .map((entry) => {
                                        if (!entry || typeof entry !== 'object') return null;
                                        const nodeId = typeof (entry as any).nodeId === 'string' ? String((entry as any).nodeId).trim() : '';
                                        if (!nodeId) return null;
                                        const kindRaw = typeof (entry as any).kind === 'string' ? String((entry as any).kind).trim() : '';
                                        const kind =
                                            kindRaw === 'enemy' || kindRaw === 'check'
                                                ? (kindRaw as CoopExpeditionDeadlineEventKind)
                                                : undefined;
                                        const weightRaw = toFiniteNumber((entry as any).weight, 0);
                                        const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : undefined;
                                        return { nodeId, kind, weight } satisfies CoopExpeditionDeadlineEvent;
                                    })
                                    .filter(Boolean) as CoopExpeditionDeadlineEvent[]
                                : undefined;

                            expedition = {
                                turnCount: 0,
                                maxTurns,
                                researchPoints: 0,
                                waveNodeId,
                                wavePending: false,
                                deadlineEvents,
                                pendingNodeId: undefined,
                                pendingKind: undefined,
                                poolId: undefined,
                                stageIndex: undefined,
                                stageId: undefined,
                                hubNodeId: undefined,
                                missions: undefined,
                            };

                            // Optional: stage-based pools (missions + deadline events).
                            const pool = getExpeditionStagePool(stagePoolId);
                            if (pool) {
                                const takenQuestIds = new Set<string>();
                                for (const [questId, entry] of Object.entries(graph.sideQuests ?? {})) {
                                    if (!questId) continue;
                                    if (entry && typeof entry === 'object' && (entry as any).startedAt) takenQuestIds.add(questId);
                                }

                                const stageState = generateExpeditionStageState({
                                    poolId: pool.id,
                                    stageIndex: startStageIndex,
                                    takenQuestIds,
                                });

                                expedition.poolId = pool.id;
                                expedition.stageIndex = stageState.stageIndex;
                                expedition.stageId = stageState.stageId;
                                expedition.hubNodeId = stageState.hubNodeId;
                                expedition.missions = stageState.missionsByChoiceId;
                                expedition.deadlineEvents = stageState.deadlineEvents;

                                if (!expedition.waveNodeId) {
                                    const fallbackWave = stageState.deadlineEvents.find((e) => e.kind === 'enemy')?.nodeId;
                                    if (fallbackWave) expedition.waveNodeId = fallbackWave;
                                }
                            }
                        }

                        if (!expedition) return;

                        if (choiceAny.action === 'advance_expedition_stage') {
                            const pool = getExpeditionStagePool(expedition.poolId);
                            if (pool) {
                                const takenQuestIds = new Set<string>();
                                for (const [questId, entry] of Object.entries(graph.sideQuests ?? {})) {
                                    if (!questId) continue;
                                    if (entry && typeof entry === 'object' && (entry as any).startedAt) takenQuestIds.add(questId);
                                }

                                const nextStageIndex = Math.max(0, Math.floor(toFiniteNumber(expedition.stageIndex, 0))) + 1;
                                const stageState = generateExpeditionStageState({
                                    poolId: pool.id,
                                    stageIndex: nextStageIndex,
                                    takenQuestIds,
                                });

                                expedition.poolId = pool.id;
                                expedition.stageIndex = stageState.stageIndex;
                                expedition.stageId = stageState.stageId;
                                expedition.hubNodeId = stageState.hubNodeId;
                                expedition.missions = stageState.missionsByChoiceId;
                                expedition.deadlineEvents = stageState.deadlineEvents;
                                expedition.pendingNodeId = undefined;
                                expedition.pendingKind = undefined;
                                expedition.wavePending = false;
                                expedition.turnCount = 0;

                                if (!expedition.waveNodeId) {
                                    const fallbackWave = stageState.deadlineEvents.find((e) => e.kind === 'enemy')?.nodeId;
                                    if (fallbackWave) expedition.waveNodeId = fallbackWave;
                                }
                            }
                        }

                        if (missionChosenSlotId && expedition.missions && missionChosenSlotId in expedition.missions) {
                            const next = { ...expedition.missions };
                            delete next[missionChosenSlotId];
                            expedition.missions = Object.keys(next).length > 0 ? next : undefined;
                        }

                        const timeCost = Math.max(0, Math.floor(toFiniteNumber(choiceAny.cost?.time, 0))) + extraTimeCost;
                        const rpCost = Math.max(0, Math.floor(toFiniteNumber(choiceAny.cost?.rp, 0)));
                        const rpReward = Math.max(0, Math.floor(toFiniteNumber(choiceAny.reward?.rp, 0)));

                        if (timeCost || rpCost || rpReward) {
                            expedition.turnCount = Math.max(0, expedition.turnCount + timeCost);
                            expedition.researchPoints = Math.max(
                                0,
                                expedition.researchPoints + rpReward - rpCost
                            );
                        }

                        if (expedition.maxTurns > 0 && expedition.turnCount >= expedition.maxTurns) {
                            const hasPending = Boolean(expedition.pendingNodeId) || Boolean(expedition.wavePending && expedition.waveNodeId);
                            if (!hasPending) {
                                const pool: CoopExpeditionDeadlineEvent[] =
                                    expedition.deadlineEvents && expedition.deadlineEvents.length > 0
                                        ? expedition.deadlineEvents
                                        : expedition.waveNodeId
                                            ? [{ nodeId: expedition.waveNodeId, kind: 'enemy', weight: 1 }]
                                            : [];

                                let picked: { nodeId: string; kind?: CoopExpeditionDeadlineEventKind } | null = null;
                                if (pool.length > 0) {
                                    const weighted = pool
                                        .map((e) => {
                                            const weightRaw = typeof e.weight === 'number' && Number.isFinite(e.weight) ? e.weight : 1;
                                            const weight = weightRaw > 0 ? weightRaw : 1;
                                            return { nodeId: e.nodeId, kind: e.kind, weight };
                                        })
                                        .filter((e) => typeof e.nodeId === 'string' && e.nodeId.trim().length > 0);

                                    const total = weighted.reduce((sum, e) => sum + e.weight, 0);
                                    if (total > 0) {
                                        const r = Math.random() * total;
                                        let acc = 0;
                                        for (const e of weighted) {
                                            acc += e.weight;
                                            if (r <= acc) {
                                                picked = { nodeId: e.nodeId, kind: e.kind };
                                                break;
                                            }
                                        }
                                    }
                                }

                                if (picked) {
                                    expedition.pendingNodeId = picked.nodeId;
                                    expedition.pendingKind = picked.kind;
                                    expedition.wavePending = Boolean(expedition.waveNodeId && picked.nodeId === expedition.waveNodeId);
                                } else if (expedition.waveNodeId) {
                                    expedition.pendingNodeId = expedition.waveNodeId;
                                    expedition.pendingKind = 'enemy';
                                    expedition.wavePending = true;
                                }
                            }
                        }

                        const nextGraphId = nextNodeId ? coopGraph.getGraphId(nextNodeId) : undefined;
                        const pendingNodeId =
                            expedition.pendingNodeId ?? (expedition.wavePending && expedition.waveNodeId ? expedition.waveNodeId : undefined);

                        if (pendingNodeId && nextGraphId === 'main') {
                            if (nextNodeId !== pendingNodeId) {
                                redirectedNodeId = pendingNodeId;
                            }
                            expedition.pendingNodeId = undefined;
                            expedition.pendingKind = undefined;
                            expedition.wavePending = false;
                            expedition.turnCount = 0;
                        }

                        graph.expedition = expedition;
                        expeditionAfter = expedition;
                    });

                    if (redirectedNodeId) nextNodeId = redirectedNodeId;

                    if (expeditionAfter) {
                        const currentSessionCtx = await db.query.coopSessions.findFirst({
                            where: eq(coopSessions.id, session.id),
                            columns: { flags: true }
                        });
                        const flags = (currentSessionCtx?.flags ?? {}) as Record<string, any>;
                        const expedition = getExpeditionStateFromFlags(flags);
                        if (expedition) {
                            const camp = getCampStateFromFlags(flags);
                            if (!camp && ensureCamp) {
                                flags.__camp = {
                                    ...DEFAULT_CAMP_STATE,
                                    inventory: { ...DEFAULT_CAMP_STATE.inventory, scrap: expedition.researchPoints },
                                };
                                await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));
                            } else if (camp) {
                                const currentScrap = Math.max(0, Math.floor(toFiniteNumber(camp.inventory.scrap, 0)));
                                if (currentScrap !== expedition.researchPoints) {
                                    flags.__camp = {
                                        ...camp,
                                        inventory: { ...camp.inventory, scrap: expedition.researchPoints },
                                    };
                                    await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));
                                }
                            }
                        }
                    }
                }
            }

            if (nextNodeId && nextNodeId !== session.currentScene) {
                await db.update(coopSessions)
                    .set({ currentScene: nextNodeId })
                    .where(eq(coopSessions.id, session.id));

                // Cleanup votes from previous scenes to keep the table size manageable
                // We keep votes for the NEW currentScene (if any, though usually none yet)
                await db.delete(coopVotes).where(and(
                    eq(coopVotes.sessionId, session.id),
                    ne(coopVotes.sceneId, nextNodeId)
                ));
            }
        }

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async resolveCoopBattle(params: {
        code: string;
        playerId: number;
        result: CoopEncounterOutcome;
        players: Array<{ playerId: number; hp: number; morale?: number; stamina?: number }>;
    }) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, params.code),
            with: { participants: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (session.hostId !== params.playerId) throw new Error('Only host can resolve battle');

        const flags = (session.flags ?? {}) as Record<string, any>;
        const encounter = getEncounterStateFromFlags(flags);
        if (!encounter || encounter.status !== 'active') throw new Error('No active battle');

        const outcome: CoopEncounterOutcome = params.result === 'defeat' ? 'defeat' : 'victory';
        const nextNodeId = outcome === 'victory' ? encounter.returnNodeId : (encounter.defeatNodeId ?? encounter.returnNodeId);
        if (!nextNodeId) throw new Error('Battle return node is missing');

        const reportedByPlayerId = new Map<number, { hp: number; morale?: number; stamina?: number }>();
        for (const entry of params.players ?? []) {
            const pid = Math.max(0, Math.floor(toFiniteNumber((entry as any)?.playerId, 0)));
            if (pid <= 0) continue;
            const hp = Math.floor(toFiniteNumber((entry as any)?.hp, 0));
            const morale = (entry as any)?.morale;
            const stamina = (entry as any)?.stamina;
            reportedByPlayerId.set(pid, {
                hp,
                morale: typeof morale === 'number' && Number.isFinite(morale) ? morale : undefined,
                stamina: typeof stamina === 'number' && Number.isFinite(stamina) ? stamina : undefined,
            });
        }

        const participantIds = encounter.players.map((p) => p.playerId);
        const progressRows = await db.query.gameProgress.findMany({
            where: inArray(gameProgress.playerId, participantIds),
            columns: {
                playerId: true,
                hp: true,
                maxHp: true,
                morale: true,
                maxMorale: true,
                stamina: true,
                maxStamina: true,
            },
        });
        const progressByPlayerId = new Map<number, any>();
        for (const row of progressRows) progressByPlayerId.set(row.playerId, row);

        const now = Date.now();
        for (const snapshot of encounter.players) {
            const row = progressByPlayerId.get(snapshot.playerId);
            const reported = reportedByPlayerId.get(snapshot.playerId);

            const maxHp = Math.max(1, Math.floor(toFiniteNumber(row?.maxHp, snapshot.maxHp)));
            const maxMorale = Math.max(1, Math.floor(toFiniteNumber(row?.maxMorale, snapshot.maxMorale)));
            const maxStamina = Math.max(1, Math.floor(toFiniteNumber(row?.maxStamina, snapshot.maxStamina)));

            const hpBase = typeof reported?.hp === 'number' && Number.isFinite(reported.hp) ? reported.hp : toFiniteNumber(row?.hp, snapshot.hp);
            const moraleBase =
                typeof reported?.morale === 'number' && Number.isFinite(reported.morale)
                    ? reported.morale
                    : toFiniteNumber(row?.morale, snapshot.morale);
            const staminaBase =
                typeof reported?.stamina === 'number' && Number.isFinite(reported.stamina)
                    ? reported.stamina
                    : toFiniteNumber(row?.stamina, snapshot.stamina);

            const hp = Math.max(0, Math.min(maxHp, Math.floor(toFiniteNumber(hpBase, maxHp))));
            const morale = Math.max(0, Math.min(maxMorale, Math.floor(toFiniteNumber(moraleBase, maxMorale))));
            const stamina = Math.max(0, Math.min(maxStamina, Math.floor(toFiniteNumber(staminaBase, maxStamina))));

            await db.update(gameProgress).set({
                hp,
                morale,
                stamina,
                updatedAt: now,
            }).where(eq(gameProgress.playerId, snapshot.playerId));
        }

        const rawGraph = (flags.__graph ?? {}) as any;
        const expedition = normalizeExpeditionState(rawGraph.expedition);
        const rewardRp = outcome === 'victory' ? Math.max(0, Math.floor(toFiniteNumber(encounter.rewardRp, 0))) : 0;
        if (expedition && rewardRp > 0) {
            expedition.researchPoints = Math.max(0, Math.floor(toFiniteNumber(expedition.researchPoints, 0)) + rewardRp);
            rawGraph.expedition = expedition;

            const camp = getCampStateFromFlags(flags);
            if (camp) {
                flags.__camp = {
                    ...camp,
                    inventory: { ...camp.inventory, scrap: expedition.researchPoints },
                };
            }
        }

        rawGraph.encounter = { ...encounter, status: 'resolved', result: { outcome, resolvedAt: now } };
        flags.__graph = rawGraph;

        await db.update(coopSessions).set({ currentScene: nextNodeId, flags }).where(eq(coopSessions.id, session.id));
        await db.delete(coopVotes).where(and(eq(coopVotes.sessionId, session.id), ne(coopVotes.sceneId, nextNodeId)));

        const state = await coopService.getRoomState(params.code);
        broadcastCoopUpdate(params.code, state);
        return state;
    },

    async getCamp(code: string, playerId: number) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.participants.some((p) => p.playerId === playerId)) throw new Error('Not a participant');

        const flags = (session.flags ?? {}) as Record<string, any>;
        const camp = getCampStateFromFlags(flags);
        if (!camp) throw new Error('Camp not established');
        return camp;
    },

    async getCampShop(code: string, playerId: number) {
        const camp = await this.getCamp(code, playerId);
        const stock = getVendorStock('camp');
        return {
            currencyTemplateId: 'scrap',
            currencyAmount: camp.inventory.scrap ?? 0,
            stock,
        };
    },

    async contributeItem(code: string, playerId: number, templateId: string, quantity = 1) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
            columns: { id: true, flags: true, status: true, inviteCode: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.participants.some((p) => p.playerId === playerId)) throw new Error('Not a participant');

        const normalizedTemplateId = String(templateId ?? '').trim();
        if (!normalizedTemplateId) throw new Error('Invalid templateId');
        if (!hasItemTemplate(normalizedTemplateId)) throw new Error('Unknown template');

        const requestedQty = Math.max(1, Math.floor(quantity));

        const flags = (session.flags ?? {}) as Record<string, any>;
        const camp: CoopCampState =
            getCampStateFromFlags(flags) ?? { ...DEFAULT_CAMP_STATE, baseLevel: 1, upgrades: {}, credits: 0 };

        const prevQty = Math.max(0, Math.floor(toFiniteNumber(camp.inventory[normalizedTemplateId], 0)));
        const nextInventory = { ...camp.inventory, [normalizedTemplateId]: prevQty + requestedQty };

        const unitCredits = toFiniteNumber(ITEM_CONTRIBUTION_VALUES[normalizedTemplateId], 0);
        const prevCredits = Math.max(0, Math.floor(toFiniteNumber(camp.credits, 0)));
        const creditDelta = unitCredits > 0 ? unitCredits * requestedQty : 0;

        const nextCamp: CoopCampState = {
            ...camp,
            inventory: nextInventory,
            credits: prevCredits + creditDelta,
        };

        flags.__camp = nextCamp;
        await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async upgradeBase(code: string, playerId: number, upgradeId: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
            columns: { id: true, flags: true, status: true, inviteCode: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.participants.some((p) => p.playerId === playerId)) throw new Error('Not a participant');

        const normalizedUpgradeId = String(upgradeId ?? '').trim();
        if (!normalizedUpgradeId) throw new Error('Invalid upgradeId');
        const upgrade = BASE_UPGRADES.find((u) => u.id === normalizedUpgradeId);
        if (!upgrade) throw new Error('Unknown upgrade');

        const flags = (session.flags ?? {}) as Record<string, any>;
        const camp: CoopCampState =
            getCampStateFromFlags(flags) ?? { ...DEFAULT_CAMP_STATE, baseLevel: 1, upgrades: {}, credits: 0 };

        const currentLevel = Math.max(0, Math.floor(toFiniteNumber(camp.upgrades?.[normalizedUpgradeId], 0)));
        if (currentLevel >= upgrade.maxLevel) throw new Error('Upgrade already at max level');

        const availableCredits = Math.max(0, Math.floor(toFiniteNumber(camp.credits, 0)));
        const upgradeCost = Math.max(1, Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel)));
        if (availableCredits < upgradeCost) throw new Error('Not enough camp credits');

        const nextUpgrades = { ...(camp.upgrades ?? {}) };
        nextUpgrades[normalizedUpgradeId] = currentLevel + 1;

        const nextCamp: CoopCampState = {
            ...camp,
            credits: availableCredits - upgradeCost,
            upgrades: nextUpgrades,
        };

        flags.__camp = nextCamp;
        await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async startMission(code: string, playerId: number, missionNodeId: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
            columns: { id: true, status: true, hostId: true, inviteCode: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (session.hostId !== playerId) throw new Error('Only host can start missions');

        const normalizedNodeId = String(missionNodeId ?? '').trim();
        if (!normalizedNodeId) throw new Error('Invalid missionNodeId');
        if (!coopGraph.getNode(normalizedNodeId)) throw new Error('Node not found');

        await db.update(coopSessions)
            .set({ currentScene: normalizedNodeId })
            .where(eq(coopSessions.id, session.id));

        const participantIds = session.participants.map((p) => p.playerId);
        if (participantIds.length > 0) {
            await db
                .update(coopParticipants)
                .set({ currentScene: normalizedNodeId })
                .where(and(eq(coopParticipants.sessionId, session.id), inArray(coopParticipants.playerId, participantIds)));
        }

        await db.delete(coopVotes).where(eq(coopVotes.sessionId, session.id));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async callReinforcements(code: string, playerId: number, count = 1) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
            columns: { id: true, flags: true, status: true, currentScene: true, hostId: true, inviteCode: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.participants.some((p) => p.playerId === playerId)) throw new Error('Not a participant');

        const requested = Math.max(1, Math.floor(count));
        const COST_PER_OPERATIVE = 25;
        const SECURITY_PER_OPERATIVE = 1;

        const flags = (session.flags ?? {}) as Record<string, any>;
        const camp = getCampStateFromFlags(flags);
        if (!camp) throw new Error('Camp not established');
        const expedition = getExpeditionStateFromFlags(flags);

        const availableScrap = expedition
            ? Math.max(0, Math.floor(toFiniteNumber(expedition.researchPoints, 0)))
            : Math.max(0, Math.floor(toFiniteNumber(camp.inventory.scrap, 0)));
        const totalCost = COST_PER_OPERATIVE * requested;
        if (availableScrap < totalCost) throw new Error('Not enough scrap');

        const nextCamp: CoopCampState = {
            ...camp,
            security: camp.security + SECURITY_PER_OPERATIVE * requested,
            operatives: camp.operatives + requested,
            inventory: {
                ...camp.inventory,
                scrap: availableScrap - totalCost,
            },
        };

        if (expedition) {
            const nextRp = Math.max(0, availableScrap - totalCost);
            nextCamp.inventory.scrap = nextRp;
            const rawGraph = (flags.__graph ?? {}) as any;
            rawGraph.expedition = { ...expedition, researchPoints: nextRp };
            flags.__graph = rawGraph;
        }

        flags.__camp = nextCamp;
        await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async purchaseCampItem(code: string, playerId: number, templateId: string, quantity = 1) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
            columns: { id: true, flags: true, status: true, inviteCode: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.participants.some((p) => p.playerId === playerId)) throw new Error('Not a participant');

        const normalizedTemplateId = String(templateId ?? '').trim();
        if (!normalizedTemplateId) throw new Error('Invalid templateId');
        if (!hasItemTemplate(normalizedTemplateId)) throw new Error('Unknown template');

        const requestedQty = Math.max(1, Math.floor(quantity));
        const stock = getVendorStock('camp');
        const stockItem = stock.find((it) => it.templateId === normalizedTemplateId);
        if (!stockItem) throw new Error('Item not available in camp shop');
        const price = stockItem.price ?? getVendorSellPrice(normalizedTemplateId);
        const totalCost = price * requestedQty;

        const flags = (session.flags ?? {}) as Record<string, any>;
        const camp = getCampStateFromFlags(flags);
        if (!camp) throw new Error('Camp not established');
        const expedition = getExpeditionStateFromFlags(flags);

        const availableScrap = expedition
            ? Math.max(0, Math.floor(toFiniteNumber(expedition.researchPoints, 0)))
            : Math.max(0, Math.floor(toFiniteNumber(camp.inventory.scrap, 0)));
        if (availableScrap < totalCost) throw new Error('Not enough scrap');

        const prevQty = Math.max(0, Math.floor(toFiniteNumber(camp.inventory[normalizedTemplateId], 0)));

        const nextCamp: CoopCampState = {
            ...camp,
            inventory: {
                ...camp.inventory,
                scrap: availableScrap - totalCost,
                [normalizedTemplateId]: prevQty + requestedQty,
            },
        };

        if (expedition) {
            const nextRp = Math.max(0, availableScrap - totalCost);
            nextCamp.inventory.scrap = nextRp;
            const rawGraph = (flags.__graph ?? {}) as any;
            rawGraph.expedition = { ...expedition, researchPoints: nextRp };
            flags.__graph = rawGraph;
        }

        flags.__camp = nextCamp;
        await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async withdrawFromCamp(code: string, playerId: number, templateId: string, quantity = 1) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
            columns: { id: true, flags: true, status: true, inviteCode: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.participants.some((p) => p.playerId === playerId)) throw new Error('Not a participant');

        const normalizedTemplateId = String(templateId ?? '').trim();
        if (!normalizedTemplateId) throw new Error('Invalid templateId');
        if (!hasItemTemplate(normalizedTemplateId)) throw new Error('Unknown template');

        const requestedQty = Math.max(1, Math.floor(quantity));

        const flags = (session.flags ?? {}) as Record<string, any>;
        const camp = getCampStateFromFlags(flags);
        if (!camp) throw new Error('Camp not established');

        const availableQty = Math.max(0, Math.floor(toFiniteNumber(camp.inventory[normalizedTemplateId], 0)));
        if (availableQty < requestedQty) throw new Error('Not enough in camp inventory');

        const template = getItemTemplate(normalizedTemplateId);
        const isStackable = template?.kind === 'consumable' || template?.kind === 'misc';
        const awards = isStackable
            ? [{ itemId: normalizedTemplateId, quantity: requestedQty }]
            : Array.from({ length: requestedQty }, () => ({ itemId: normalizedTemplateId, quantity: 1 }));

        const results = await awardItemsToPlayer(playerId, awards);
        const failed = results.filter((r) => !r.success);
        if (failed.length > 0) {
            throw new Error(`Failed to award items: ${failed.map((f) => f.itemId).join(', ')}`);
        }

        const nextQty = availableQty - requestedQty;
        const nextInventory = { ...camp.inventory };
        if (nextQty > 0) nextInventory[normalizedTemplateId] = nextQty;
        else delete nextInventory[normalizedTemplateId];

        const nextCamp: CoopCampState = { ...camp, inventory: nextInventory };
        flags.__camp = nextCamp;
        await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async depositToCamp(code: string, playerId: number, itemId: string, quantity?: number) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
            columns: { id: true, flags: true, status: true, inviteCode: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.participants.some((p) => p.playerId === playerId)) throw new Error('Not a participant');

        const normalizedItemId = String(itemId ?? '').trim();
        if (!normalizedItemId) throw new Error('Invalid itemId');

        const item = await db.query.items.findFirst({
            where: and(eq(items.id, normalizedItemId as any), eq(items.ownerId, playerId)),
        });
        if (!item) throw new Error('Item not found');
        if (item.slot) throw new Error('Cannot deposit equipped item');
        if (item.containerId) throw new Error('Cannot deposit item from container');

        const templateId = item.templateId;
        if (!hasItemTemplate(templateId)) throw new Error('Unknown template');
        const template = getItemTemplate(templateId);
        const isStackable = template?.kind === 'consumable' || template?.kind === 'misc';

        const itemQty = Math.max(1, Math.floor(toFiniteNumber(item.quantity, 1)));
        const requestedQty = Math.max(1, Math.floor(toFiniteNumber(quantity, itemQty)));
        if (requestedQty > itemQty) throw new Error('Not enough quantity');
        if (!isStackable && requestedQty !== 1) throw new Error('Non-stackable items can only be deposited in quantity 1');

        const flags = (session.flags ?? {}) as Record<string, any>;
        const camp = getCampStateFromFlags(flags);
        if (!camp) throw new Error('Camp not established');

        // Remove from player inventory
        if (isStackable && requestedQty < itemQty) {
            await db.update(items)
                .set({ quantity: itemQty - requestedQty })
                .where(eq(items.id, item.id));
        } else {
            await db.delete(items).where(eq(items.id, item.id));
        }

        const prevQty = Math.max(0, Math.floor(toFiniteNumber(camp.inventory[templateId], 0)));
        const nextCamp: CoopCampState = {
            ...camp,
            inventory: {
                ...camp.inventory,
                [templateId]: prevQty + requestedQty,
            },
        };

        flags.__camp = nextCamp;
        await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async rewardCamp(code: string, playerId: number, kind: 'research' | 'combat', amount?: number) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
            columns: { id: true, flags: true, status: true, inviteCode: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.participants.some((p) => p.playerId === playerId)) throw new Error('Not a participant');

        const normalizedKind = kind === 'combat' ? 'combat' : 'research';
        const delta = Math.max(1, Math.floor(toFiniteNumber(amount, normalizedKind === 'combat' ? 8 : 5)));

        const flags = (session.flags ?? {}) as Record<string, any>;
        const camp = getCampStateFromFlags(flags);
        if (!camp) throw new Error('Camp not established');
        const expedition = getExpeditionStateFromFlags(flags);

        const availableScrap = expedition
            ? Math.max(0, Math.floor(toFiniteNumber(expedition.researchPoints, 0)))
            : Math.max(0, Math.floor(toFiniteNumber(camp.inventory.scrap, 0)));
        const nextCamp: CoopCampState = {
            ...camp,
            inventory: {
                ...camp.inventory,
                scrap: availableScrap + delta,
            },
        };

        if (expedition) {
            const nextRp = Math.max(0, availableScrap + delta);
            nextCamp.inventory.scrap = nextRp;
            const rawGraph = (flags.__graph ?? {}) as any;
            rawGraph.expedition = { ...expedition, researchPoints: nextRp };
            flags.__graph = rawGraph;
        }

        flags.__camp = nextCamp;
        await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async leaveRoom(code: string, playerId: number) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });
        if (!session) return null;

        await db.delete(coopParticipants).where(and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.playerId, playerId)));
        await db.delete(coopVotes).where(and(eq(coopVotes.sessionId, session.id), eq(coopVotes.voterId, playerId)));

        const remaining = await db.query.coopParticipants.findMany({
            where: eq(coopParticipants.sessionId, session.id),
        });

        if (remaining.length === 0) {
            await db.delete(coopSessions).where(eq(coopSessions.id, session.id));
            broadcastCoopUpdate(code, null);
            return null;
        }

        if (session.hostId === playerId) {
            await db.update(coopSessions).set({ hostId: remaining[0].playerId }).where(eq(coopSessions.id, session.id));
        }

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    // Debug/Admin force scene
    async forceScene(code: string, nodeId: string) {
        await db.update(coopSessions)
            .set({ currentScene: nodeId })
            .where(eq(coopSessions.inviteCode, code));

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    }
    ,

    async addBotToRoom(code: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });

        if (!session) throw new Error('Room not found');
        if (session.status !== 'waiting') throw new Error('Game already started');

        if (session.participants.length >= (session.maxPlayers ?? 4)) throw new Error('Room is full');

        const botName = `Bot-${Math.floor(Math.random() * 1000)}`;
        const [dummyPlayer] = await db.insert(players).values({
            name: botName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            deviceId: `bot-${Date.now()}-${Math.random()}`, // Fake device ID
        }).returning();

        // Pick a random available role
        const takenRoles = new Set(session.participants.map(p => p.role).filter(Boolean));
        const availableRoles = COOP_ROLE_IDS.filter(r => !takenRoles.has(r));

        let role: CoopRoleId | null = null;
        if (availableRoles.length > 0) {
            role = availableRoles[Math.floor(Math.random() * availableRoles.length)];
        }

        await db.insert(coopParticipants).values({
            sessionId: session.id,
            playerId: dummyPlayer.id,
            role,
            isReady: true, // Bots are always ready
            joinedAt: Date.now(),
        });

        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    advanceSequential: async (code: string, playerId: number) => {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: { with: { player: true } } }
        });
        if (!session) throw new Error('Session not found');

        // Check if sequential broadcast is active
        const result = getSequentialBroadcastFromFlags(session.flags as any);
        const seqState = result;

        if (!seqState) throw new Error('Not in sequential mode');

        const allChosen = seqState.completedPlayerIds.length >= session.participants.length;
        if (!allChosen) throw new Error('Not all players have finished');

        // Logic to advance
        const currentNodeId = session.currentScene;
        if (!currentNodeId) throw new Error('No current scene');

        const currentNode = coopGraph.getNode(currentNodeId);

        if (currentNode?.interactionType !== 'sequential_broadcast') {
            throw new Error('Not sequential node');
        }

        const firstChoice = currentNode.choices?.[0]; // Optional chain choices just in case
        if (!firstChoice) throw new Error('No choices found');

        const nextNodeId = firstChoice.nextNodeId;

        if (!nextNodeId) throw new Error('No next node');

        // Clear sequential state
        const currentFlags = (session.flags as Record<string, any>) ?? {};
        const rawGraph = (currentFlags.__graph ?? {}) as any;
        const newGraph = { ...rawGraph, sequentialBroadcast: null };
        const newFlags = { ...currentFlags, __graph: newGraph };

        await db.update(coopSessions).set({
            currentScene: nextNodeId,
            flags: newFlags
        }).where(eq(coopSessions.id, session.id));

        // Refetch state to broadcast
        const state = await coopService.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    }
};
