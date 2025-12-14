export type ResonanceArchetype = 'skeptic' | 'empath' | 'guardian' | 'visionary';
export type ResonanceRank = 1 | 2 | 3 | 4;
export type ResonanceStatus = 'disoriented' | 'panic' | 'marked' | 'focus' | 'calm' | 'unity';
export type ResonancePlayer = {
    id: string;
    name: string;
    archetype: ResonanceArchetype;
    rank: ResonanceRank;
    conviction: number;
    isHost: boolean;
    deviceId?: string;
    statuses?: ResonanceStatus[];
    items?: Array<{
        id: string;
        charges?: number;
        data?: Record<string, any>;
    }>;
};
export type VoteOption = {
    id: string;
    text: string;
    nextScene?: string;
    weightMultipliers?: Partial<Record<ResonanceArchetype, number>>;
    checks?: SceneCheck[];
    rewards?: SceneRewards;
};
export type SceneKind = 'narrative' | 'vote' | 'qte' | 'combat';
export type SceneNode = {
    id: string;
    kind: SceneKind;
    title: string;
    shared: string;
    injections?: Partial<Record<ResonanceArchetype, string>>;
    options?: VoteOption[];
    timerMs?: number;
    allowKudos?: boolean;
    allowBrake?: boolean;
    allowInterrupt?: boolean;
    tags?: string[];
    next?: string;
    checks?: SceneCheck[];
    rewards?: SceneRewards;
};
export type Episode = {
    id: string;
    scenes: Record<string, SceneNode>;
    entry: string;
};
export type VoteState = {
    optionId: string;
    weight: number;
    at: number;
};
export type InterruptState = {
    type: 'rebellion' | 'brake' | 'force_next';
    playerId: string;
    cost: number;
    at: number;
    payload?: any;
};
export type SceneCheck = {
    skill: string;
    dc: number;
    positionOptimum?: ResonanceRank;
    onSuccess?: SceneDelta;
    onFail?: SceneDelta;
};
export type SceneDelta = {
    trustDelta?: number;
    strainDelta?: number;
    alertDelta?: number;
    grantFlag?: string;
    statusAdd?: ResonanceStatus[];
};
export type SceneRewards = {
    items?: {
        id: string;
        qty: number;
    }[];
    flagsAdd?: string[];
    flagsRemove?: string[];
    trustDelta?: number;
    strainDelta?: number;
    alertDelta?: number;
    cooldownReset?: boolean;
};
export type ResonanceItem = {
    id: string;
    name: string;
    slot: 'main' | 'support' | 'util' | 'rare';
    charges?: number;
    cooldownScenes?: number;
    data?: Record<string, any>;
};
export type ItemUsePayload = {
    itemId: string;
    targetPlayerId?: string;
    context?: string;
};
export type ResonanceSession = {
    dbId?: number;
    code: string;
    episodeId: string;
    sceneId: string;
    status: 'lobby' | 'active' | 'paused' | 'finished';
    strain: number;
    trust: number;
    alert?: number;
    players: ResonancePlayer[];
    votes: Record<string, VoteState>;
    interrupts: InterruptState[];
    createdAt: number;
    updatedAt: number;
};
