/**
 * Survival Mode Types
 * Dual-view system: TV Mode (passive dashboard) + Player Mode (mobile controller)
 */
/** Resources tracked at the Base level (displayed on TV) */
export interface BaseResources {
    food: number;
    fuel: number;
    medicine: number;
    defense: number;
    morale: number;
}
export declare const DEFAULT_BASE_RESOURCES: BaseResources;
/** Player roles with unique passive abilities */
export type PlayerRole = 'scout' | 'enforcer' | 'techie' | 'face';
export interface PlayerRoleDefinition {
    id: PlayerRole;
    label: string;
    nameRu: string;
    description: string;
    passiveAbility: string;
    preferredZone: ZoneType;
}
export declare const PLAYER_ROLES: Record<PlayerRole, PlayerRoleDefinition>;
/** Pre-defined survivor character for selection */
export interface SurvivorCharacter {
    id: string;
    name: string;
    role: PlayerRole;
    portrait: string;
    backstory: string;
    startingItems: Array<{
        templateId: string;
        quantity: number;
    }>;
}
/** 3 characters for selection */
export declare const SURVIVOR_TEMPLATES: SurvivorCharacter[];
/** Zone types mapped to QR codes (physical apartment locations) */
export type ZoneType = 'kitchen' | 'bathroom' | 'bedroom' | 'corridor' | 'living_room';
export interface ZoneDefinition {
    id: ZoneType;
    label: string;
    nameRu: string;
    biome: string;
    description: string;
    primaryLoot: string[];
    threatLevel: 'low' | 'medium' | 'high';
}
export declare const ZONE_DEFINITIONS: Record<ZoneType, ZoneDefinition>;
/** Effect applied when an option is chosen */
export interface EventEffect {
    /** Resources gained (positive) or lost (negative) */
    resourceDelta?: Partial<BaseResources>;
    /** Items granted to player inventory */
    grantItems?: Array<{
        templateId: string;
        quantity: number;
    }>;
    /** Player takes damage (wounds) */
    woundPlayer?: boolean;
    /** Status effect applied */
    statusEffect?: {
        id: string;
        duration: number;
    };
    /** Recruit NPC to base */
    recruitNpc?: {
        id: string;
        name: string;
        dailyCost: number;
        passiveBonus: Partial<BaseResources>;
    };
    /** Triggers a follow-up event */
    triggerEventId?: string;
    /** Log message to broadcast */
    logMessage?: string;
    /** Success chance (0-100, undefined = guaranteed) */
    successChance?: number;
    /** Effect on failure (if successChance is set) */
    failureEffect?: Omit<EventEffect, 'successChance' | 'failureEffect'>;
}
/** A single option within an event */
export interface EventOption {
    id: string;
    text: string;
    /** Role required to see/use this option */
    requiredRole?: PlayerRole;
    /** Item required in player inventory */
    requiredItem?: string;
    /** Resources consumed from player/base */
    cost?: Partial<BaseResources>;
    /** Effect when this option is chosen */
    effect: EventEffect;
}
/** Event type tags for filtering and categorization */
export type EventTag = 'trader' | 'combat' | 'loot' | 'npc' | 'hazard' | 'minigame' | 'story';
/** A survival event triggered when entering a zone */
export interface SurvivalEvent {
    id: string;
    zone: ZoneType;
    title: string;
    text: string;
    imageUrl?: string;
    options: EventOption[];
    tags?: EventTag[];
    /** Weight for random selection (higher = more common) */
    weight?: number;
    /** Condition to show this event (e.g., session flags) */
    condition?: {
        requiredFlags?: string[];
        excludeFlags?: string[];
        minCrisisLevel?: CrisisLevel;
        maxVisits?: number;
    };
}
export type CrisisLevel = 'calm' | 'warning' | 'crisis';
/** Player's personal inventory (on their phone) */
export interface PlayerInventory {
    items: Array<{
        templateId: string;
        quantity: number;
    }>;
}
/** Player profile within a survival session */
export interface SurvivalPlayer {
    playerId: number;
    playerName: string;
    role: PlayerRole | null;
    inventory: PlayerInventory;
    isWounded: boolean;
    currentZone: ZoneType | null;
    activeEventId: string | null;
    joinedAt: number;
}
/** Activity log entry shown on TV */
export interface LogEntry {
    id: string;
    timestamp: number;
    playerId: number | null;
    playerName: string | null;
    message: string;
    type: 'action' | 'system' | 'crisis' | 'loot' | 'combat';
}
/** NPC recruited to the base */
export interface BaseNpc {
    id: string;
    name: string;
    dailyCost: number;
    passiveBonus: Partial<BaseResources>;
    recruitedAt: number;
}
/** Full session state (shared between TV and Players) */
export interface SurvivalState {
    sessionId: string;
    hostPlayerId: number;
    status: 'lobby' | 'active' | 'paused' | 'ended';
    timerSeconds: number;
    timerStartedAt: number | null;
    crisisLevel: CrisisLevel;
    crisisEventId: string | null;
    resources: BaseResources;
    npcs: BaseNpc[];
    players: Record<number, SurvivalPlayer>;
    log: LogEntry[];
    flags: Record<string, unknown>;
    zoneVisits: Record<ZoneType, number>;
    createdAt: number;
    updatedAt: number;
}
/** DTO for entering a zone (request) */
export interface EnterZoneRequest {
    zoneId: ZoneType;
}
/** DTO for entering a zone (response) */
export interface EnterZoneResponse {
    event: SurvivalEvent | null;
    zoneInfo?: {
        threatLevel: 'low' | 'medium' | 'high';
        lootQuality: 'poor' | 'normal' | 'rich';
    };
}
/** DTO for resolving an event option */
export interface ResolveOptionRequest {
    eventId: string;
    optionId: string;
}
/** DTO for transferring items to base */
export interface TransferToBaseRequest {
    items: Array<{
        templateId: string;
        quantity: number;
    }>;
}
/** DTO for player joining a session */
export interface JoinSessionRequest {
    role?: PlayerRole;
    playerName?: string;
}
/** Socket event payloads */
export interface SurvivalSocketEvents {
    'survival:state_update': {
        sessionId: string;
        state: SurvivalState;
    };
    'survival:log_entry': {
        sessionId: string;
        entry: LogEntry;
    };
    'survival:crisis': {
        sessionId: string;
        level: CrisisLevel;
        eventId?: string;
    };
    'survival:timer_sync': {
        sessionId: string;
        timerSeconds: number;
    };
}
