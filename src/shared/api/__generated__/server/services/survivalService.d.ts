/**
 * Survival Service - Game Engine
 * Manages survival sessions, player state, events, and real-time updates
 */
import { type SurvivalState, type PlayerRole, type ZoneType, type SurvivalEvent, type EventEffect } from '../shared/types/survival';
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
 * Get the active event for a player
 */
export declare function getActiveEvent(playerId: number): SurvivalEvent | undefined;
/**
 * Resolve an event option
 */
export declare function resolveOption(sessionId: string, playerId: number, eventId: string, optionId: string): Promise<{
    success: boolean;
    effect: EventEffect;
    message: string;
}>;
/**
 * Transfer items from player inventory to base resources
 */
export declare function transferToBase(sessionId: string, playerId: number, items: Array<{
    templateId: string;
    quantity: number;
}>): Promise<SurvivalState>;
export declare const survivalService: {
    createSession: typeof createSession;
    getSession: typeof getSession;
    joinSession: typeof joinSession;
    selectRole: typeof selectRole;
    startSession: typeof startSession;
    enterZone: typeof enterZone;
    getActiveEvent: typeof getActiveEvent;
    resolveOption: typeof resolveOption;
    transferToBase: typeof transferToBase;
};
