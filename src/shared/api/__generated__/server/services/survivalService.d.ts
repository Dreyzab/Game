/**
 * Survival Service - Game Engine
 * Manages survival sessions, player state, events, and real-time updates
 */
import { type SurvivalState, type SurvivalPlayer, type PlayerRole, type ZoneType, type SurvivalEvent, type EventEffect, type ZoneActionId } from '../shared/types/survival';
/**
 * Initialize survival service - recover active sessions from database on server start
 */
export declare function initSurvivalService(): Promise<void>;
/**
 * Create a new survival session
 */
export declare function createSession(hostPlayerId: number, hostName?: string): Promise<SurvivalState>;
/**
 * Get a session by ID
 */
export declare function getSession(sessionId: string): SurvivalState | undefined;
/**
 * Join an existing session
 */
export declare function joinSession(sessionId: string, playerId: number, playerName: string, role?: PlayerRole): Promise<SurvivalState>;
/**
 * Select or change role
 */
export declare function selectRole(sessionId: string, playerId: number, role: PlayerRole): Promise<SurvivalState>;
/**
 * Start the session (begin timer)
 */
export declare function startSession(sessionId: string, playerId: number): Promise<SurvivalState>;
/**
 * Enter a zone (via QR scan)
 */
export declare function enterZone(sessionId: string, playerId: number, zoneId: ZoneType): Promise<{
    event: SurvivalEvent | null;
    zoneInfo?: {
        threatLevel: string;
        lootQuality: string;
    };
}>;
/**
 * Start an exclusive zone action (e.g. Scavenge) with server lock + ETA.
 */
export declare function startZoneAction(sessionId: string, playerId: number, zoneId: ZoneType, actionId: ZoneActionId): Promise<{
    success: boolean;
    message: string;
    state: SurvivalState;
}>;
/**
 * Get the active event for a player (from session state, not in-memory Map)
 */
export declare function getActiveEvent(sessionId: string, playerId: number): SurvivalEvent | undefined;
/**
 * Resolve an event option
 */
export declare function resolveOption(sessionId: string, playerId: number, eventId: string, optionId: string): Promise<{
    success: boolean;
    effect: EventEffect;
    message: string;
}>;
/**
 * Helper to ensure player has initial combat resources based on survival stats
 */
export declare function syncCombatResources(player: SurvivalPlayer): void;
/**
 * Complete a pending battle and apply results
 */
export declare function completeBattle(sessionId: string, playerId: number, result: 'victory' | 'defeat' | 'flee', finalCombatHp?: number): Promise<{
    success: boolean;
    message: string;
    state: SurvivalState;
}>;
/**
 * Clear any pending transition flags (after navigation started)
 */
export declare function consumeTransition(sessionId: string, playerId: number): Promise<{
    success: boolean;
    state: SurvivalState;
}>;
/**
 * Transfer items from player inventory to base resources
 */
export declare function transferToBase(sessionId: string, playerId: number, items: Array<{
    templateId: string;
    quantity: number;
}>): Promise<SurvivalState>;
/**
 * Move player to target hex (server-authoritative)
 */
export declare function movePlayer(sessionId: string, playerId: number, targetHex: {
    q: number;
    r: number;
}): Promise<{
    success: boolean;
    message: string;
    arriveAtWorldTimeMs?: number;
}>;
export declare const survivalService: {
    initSurvivalService: typeof initSurvivalService;
    createSession: typeof createSession;
    getSession: typeof getSession;
    joinSession: typeof joinSession;
    selectRole: typeof selectRole;
    startSession: typeof startSession;
    enterZone: typeof enterZone;
    startZoneAction: typeof startZoneAction;
    getActiveEvent: typeof getActiveEvent;
    resolveOption: typeof resolveOption;
    completeBattle: typeof completeBattle;
    consumeTransition: typeof consumeTransition;
    transferToBase: typeof transferToBase;
    movePlayer: typeof movePlayer;
};
