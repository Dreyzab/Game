import type { InterruptState, ItemUsePayload, ResonanceArchetype, ResonanceRank, ResonanceSession, SceneNode, SceneRewards, SceneCheck } from './types';
export declare function createResonanceSession(hostId: string, name?: string): ResonanceSession;
export declare function getResonanceSession(code: string): ResonanceSession | undefined;
export declare function joinResonanceSession(code: string, player: {
    id: string;
    name: string;
    archetype?: ResonanceArchetype;
    rank?: ResonanceRank;
    deviceId?: string;
}): ResonanceSession | null;
export declare function setBrake(code: string, active: boolean, playerId: string): ResonanceSession | null;
export declare function logProxemic(code: string, playerId: string, hint: string): ResonanceSession | null;
export declare function castVote(code: string, playerId: string, optionId: string): {
    session: null;
    error: "SESSION_NOT_FOUND";
} | {
    session: ResonanceSession;
    error: "NOT_VOTE_SCENE";
} | {
    session: ResonanceSession;
    error: "OPTION_INVALID";
} | {
    session: ResonanceSession;
    error: null;
};
export declare function applyInterrupt(code: string, playerId: string, data: {
    type: InterruptState['type'];
    targetOptionId?: string;
}): {
    session: null;
    error: "SESSION_NOT_FOUND";
} | {
    session: ResonanceSession;
    error: "PLAYER_NOT_FOUND";
} | {
    session: ResonanceSession;
    error: "SCENE_NOT_FOUND";
} | {
    session: ResonanceSession;
    error: null;
};
export declare function sendKudos(code: string, fromPlayer: string, toPlayer: string, tag: string): ResonanceSession | null;
export declare function advanceScene(session: ResonanceSession, sceneId?: string): void;
export declare function getScenePayload(session: ResonanceSession, playerId?: string): {
    scene: SceneNode | undefined;
    injection: string | undefined;
};
export declare function resumeIfPaused(code: string): ResonanceSession | null;
export declare function applyRewards(session: ResonanceSession, rewards?: SceneRewards): void;
export declare function processOptionOutcome(session: ResonanceSession, scene: SceneNode, optionId: string): void;
export declare function processSceneRewards(session: ResonanceSession, scene: SceneNode): void;
export declare function performCheck(session: ResonanceSession, scene: SceneNode, playerId: string, check: SceneCheck): {
    success: boolean;
    reason: "PLAYER_NOT_FOUND";
    roll?: undefined;
    total?: undefined;
} | {
    success: boolean;
    roll: number;
    total: number;
    reason?: undefined;
};
export declare function useItem(code: string, playerId: string, payload: ItemUsePayload): {
    session: null;
    error: "SESSION_NOT_FOUND";
} | {
    session: ResonanceSession;
    error: "PLAYER_NOT_FOUND";
} | {
    session: ResonanceSession;
    error: "ITEM_NOT_FOUND";
} | {
    session: ResonanceSession;
    error: "COOLDOWN";
} | {
    session: ResonanceSession;
    error: "NO_CHARGES";
} | {
    session: ResonanceSession;
    error: null;
};
