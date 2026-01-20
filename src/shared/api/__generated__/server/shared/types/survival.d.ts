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
    /** Triggers a combat encounter */
    battleScenarioId?: string;
    /** Triggers a visual novel scene */
    vnSceneId?: string;
    /** Patch session flags (server applies this to state.flags) */
    setFlags?: Record<string, unknown>;
    /** Log message to broadcast */
    logMessage?: string;
    /** Success chance (0-100, undefined = guaranteed) */
    successChance?: number;
    /** Effect on failure (if successChance is set) */
    failureEffect?: EventEffect;
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
export type EventTag = 'trader' | 'combat' | 'loot' | 'npc' | 'hazard' | 'minigame' | 'story' | 'tech';
/** A survival event triggered when entering a zone */
export interface SurvivalEvent {
    id: string;
    zone: ZoneType;
    /** If set, this event is tied to a hex on the tactical map */
    hex?: {
        q: number;
        r: number;
    };
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
/**
 * High-level day cycle phase (drives rules like monster movement).
 * - `start`: Morning briefing (06:00 game time)
 * - `day`: Main gameplay (daytime)
 * - `monsters`: Main gameplay + monster movement (night)
 */
export type SurvivalCyclePhase = 'start' | 'day' | 'monsters';
/**
 * Canonical world time is stored as lore milliseconds on the server.
 * The server advances it using a timeScale factor (lore_ms per real_ms).
 *
 * Day cycle rules (design):
 * - A full lore day (24h) passes in 12 real minutes.
 * - "Day start" is at 06:00 lore time (used for daily events/reset).
 */
export interface SurvivalWorldTimeConfig {
    /** Lore time scale factor: lore_ms per real_ms (default 120). */
    timeScale: number;
    /** Real duration of one full lore day, in milliseconds (default 12 minutes). */
    realDayDurationMs: number;
    /** Lore minute-of-day that marks the start of a new day (default 06:00). */
    dayStartMinute: number;
}
export declare const DEFAULT_SURVIVAL_TIME_CONFIG: SurvivalWorldTimeConfig;
/**
 * Calculate deterministic GameDayID from world time
 * Used on both client and server to check "is it the same day?"
 * @param worldTimeMs - World time in lore milliseconds
 * @param dayStartMinute - Minute of day when day starts (default 6:00 = 360)
 * @returns Integer day ID (1-based)
 */
export declare function getGameDayId(worldTimeMs: number, dayStartMinute?: number): number;
/**
 * Calculate distance between two hex positions (axial coordinates)
 * Standard formula: max(|Δq|, |Δr|, |Δq+Δr|)
 */
export declare function hexDistance(a: {
    q: number;
    r: number;
}, b: {
    q: number;
    r: number;
}): number;
export type DailyEventType = 'traders_arrived' | 'crisis';
export interface DailyEventState {
    id: string;
    type: DailyEventType;
    title: string;
    description: string;
    /** Lore timestamp when the event became active. */
    startedAtWorldTimeMs: number;
    /** Lore timestamp when the event expires (typically next day start). */
    endsAtWorldTimeMs: number;
    /** Optional choices for interactive events */
    options?: EventOption[];
    /** Whether the event has been resolved */
    resolved?: boolean;
    /** Which option was chosen (if any) */
    chosenOptionId?: string;
}
export type ZoneActionId = 'scavenge';
export interface ZoneActionLock {
    lockedByPlayerId: number | null;
    /** Lore timestamp when the lock lease expires (to recover from disconnects). */
    lockExpiresAtWorldTimeMs: number | null;
}
export interface ZoneActionInProgress {
    actionId: ZoneActionId;
    startedByPlayerId: number;
    /** Lore timestamp when the action completes. */
    completesAtWorldTimeMs: number;
}
export interface ZoneActionState {
    chargesPerDay: number;
    chargesRemaining: number;
    lock: ZoneActionLock;
    inProgress: ZoneActionInProgress | null;
}
export interface ZoneState {
    actions: Record<ZoneActionId, ZoneActionState>;
    /** Lore timestamp of last daily reset applied to this zone. */
    lastDailyResetWorldTimeMs: number | null;
}
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
    /** Combat-specific resources (mapped from survival stats or persistent) */
    combatResources?: {
        hp: number;
        maxHp: number;
        ap: number;
        maxAp: number;
        mp: number;
        maxMp: number;
        wp: number;
        maxWp: number;
    };
    currentZone: ZoneType | null;
    activeEventId: string | null;
    /** Full event object for persistence (replaces in-memory Map) */
    activeEvent?: SurvivalEvent | null;
    /** If present, player is performing an exclusive zone action. */
    activeZoneActionId?: ZoneActionId | null;
    joinedAt: number;
    /** Current hex position on the map (axial coordinates) */
    hexPos?: {
        q: number;
        r: number;
    } | null;
    /** Current stamina for movement */
    stamina?: number;
    /** Maximum stamina */
    maxStamina?: number;
    /** Movement in progress (null if stationary) */
    movementState?: {
        /** Path to walk through */
        path: Array<{
            q: number;
            r: number;
        }>;
        /** Lore timestamp when movement started (server-authoritative). */
        startedAtWorldTimeMs?: number;
        /** Lore duration per hex step (server-authoritative). */
        msPerHex?: number;
        /** Lore timestamp when player arrives at destination */
        arriveAtWorldTimeMs: number;
    } | null;
    /** If present, player has an unresolved battle result pending */
    pendingBattle?: {
        scenarioId: string;
        /** The effect to apply if the player wins */
        successEffect: EventEffect;
        /** The effect to apply if the player loses or flees */
        failureEffect?: EventEffect;
    } | null;
    /** If present, player is transitioning to a visual novel scene */
    pendingVN?: {
        sceneId: string;
    } | null;
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
    /** Canonical lore time (server authoritative). */
    worldTimeMs: number;
    worldDay: number;
    /** Minutes since midnight (0..1439) */
    worldTimeMinutes: number;
    phase: SurvivalCyclePhase;
    phaseStartedAt: number;
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
    timeConfig?: SurvivalWorldTimeConfig;
    dailyEvent?: DailyEventState | null;
    forecastedEventId?: string | null;
    forecastedEventRevealedAt?: number | null;
    zones?: Record<ZoneType, ZoneState>;
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
        worldDay?: number;
        worldTimeMinutes?: number;
        phase?: SurvivalCyclePhase;
    };
}
