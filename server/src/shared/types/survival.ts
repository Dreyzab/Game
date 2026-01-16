/**
 * Survival Mode Types
 * Dual-view system: TV Mode (passive dashboard) + Player Mode (mobile controller)
 */

// ============================================================================
// BASE RESOURCES & ENUMS
// ============================================================================

/** Resources tracked at the Base level (displayed on TV) */
export interface BaseResources {
    food: number
    fuel: number
    medicine: number
    defense: number
    morale: number
}

export const DEFAULT_BASE_RESOURCES: BaseResources = {
    food: 10,
    fuel: 5,
    medicine: 3,
    defense: 2,
    morale: 50,
}

/** Player roles with unique passive abilities */
export type PlayerRole = 'scout' | 'enforcer' | 'techie' | 'face'

export interface PlayerRoleDefinition {
    id: PlayerRole
    label: string
    nameRu: string
    description: string
    passiveAbility: string
    preferredZone: ZoneType
}

export const PLAYER_ROLES: Record<PlayerRole, PlayerRoleDefinition> = {
    scout: {
        id: 'scout',
        label: 'SCOUT',
        nameRu: 'Разведчик',
        description: 'Видит содержимое комнаты до входа',
        passiveAbility: 'Показывает уровень опасности и качество лута перед входом в зону',
        preferredZone: 'corridor',
    },
    enforcer: {
        id: 'enforcer',
        label: 'ENFORCER',
        nameRu: 'Силовик',
        description: 'Мастер запугивания и силового решения',
        passiveAbility: 'Имеет опцию [ЗАПУГАТЬ] в диалогах. Начинает с пистолетом',
        preferredZone: 'living_room',
    },
    techie: {
        id: 'techie',
        label: 'TECHIE',
        nameRu: 'Техник',
        description: 'Автоматический успех во взломе',
        passiveAbility: 'Авто-победа в мини-играх на взлом. Может чинить предметы',
        preferredZone: 'corridor',
    },
    face: {
        id: 'face',
        label: 'FACE',
        nameRu: 'Дипломат',
        description: 'Мастер переговоров и торговли',
        passiveAbility: 'Цены у торговцев на 50% ниже. Видит скрытые мотивы NPC',
        preferredZone: 'kitchen',
    },
}

// ============================================================================
// CHARACTER TEMPLATES (for selection screen)
// ============================================================================

/** Pre-defined survivor character for selection */
export interface SurvivorCharacter {
    id: string
    name: string
    role: PlayerRole
    portrait: string
    backstory: string
    startingItems: Array<{ templateId: string; quantity: number }>
}

/** 3 characters for selection */
export const SURVIVOR_TEMPLATES: SurvivorCharacter[] = [
    {
        id: 'max_scout',
        name: 'Макс',
        role: 'scout',
        portrait: '/images/portraits/max.png',
        backstory: 'Бывший курьер. Знает все закоулки Пустоши как свои пять пальцев.',
        startingItems: [
            { templateId: 'binoculars', quantity: 1 },
            { templateId: 'rat_meat', quantity: 2 },
        ],
    },
    {
        id: 'vera_techie',
        name: 'Вера',
        role: 'techie',
        portrait: '/images/portraits/vera.png',
        backstory: 'Инженер из разрушенного научного комплекса. Умеет чинить что угодно.',
        startingItems: [
            { templateId: 'toolkit', quantity: 1 },
            { templateId: 'scrap', quantity: 3 },
        ],
    },
    {
        id: 'oleg_enforcer',
        name: 'Олег',
        role: 'enforcer',
        portrait: '/images/portraits/oleg.png',
        backstory: 'Бывший охранник. Не любит лишних разговоров — предпочитает действовать.',
        startingItems: [
            { templateId: 'pistol', quantity: 1 },
            { templateId: 'bandage', quantity: 1 },
        ],
    },
]

/** Zone types mapped to QR codes (physical apartment locations) */
export type ZoneType = 'kitchen' | 'bathroom' | 'bedroom' | 'corridor' | 'living_room'

export interface ZoneDefinition {
    id: ZoneType
    label: string
    nameRu: string
    biome: string
    description: string
    primaryLoot: string[]
    threatLevel: 'low' | 'medium' | 'high'
}

export const ZONE_DEFINITIONS: Record<ZoneType, ZoneDefinition> = {
    kitchen: {
        id: 'kitchen',
        label: 'The Strip',
        nameRu: 'Торговый Ряд',
        biome: 'market',
        description: 'Старый рынок, руины супермаркета',
        primaryLoot: ['food'],
        threatLevel: 'medium',
    },
    bathroom: {
        id: 'bathroom',
        label: 'Bio-Labs',
        nameRu: 'Хим-Лаборатория',
        biome: 'laboratory',
        description: 'Заброшенный научный комплекс. Опасно!',
        primaryLoot: ['medicine'],
        threatLevel: 'high',
    },
    bedroom: {
        id: 'bedroom',
        label: 'Residential Blocks',
        nameRu: 'Жилой Сектор',
        biome: 'residential',
        description: 'Разграбленные квартиры',
        primaryLoot: ['scrap', 'gear'],
        threatLevel: 'medium',
    },
    corridor: {
        id: 'corridor',
        label: 'Industrial Zone',
        nameRu: 'Промзона',
        biome: 'industrial',
        description: 'Гаражи, склады, свалка техники',
        primaryLoot: ['fuel', 'scrap'],
        threatLevel: 'high',
    },
    living_room: {
        id: 'living_room',
        label: 'Base Terminal',
        nameRu: 'Терминал Базы',
        biome: 'base',
        description: 'Крафт, Лечение, Распределение пайков',
        primaryLoot: [],
        threatLevel: 'low',
    },
}

// ============================================================================
// EVENTS
// ============================================================================

/** Effect applied when an option is chosen */
export interface EventEffect {
    /** Resources gained (positive) or lost (negative) */
    resourceDelta?: Partial<BaseResources>
    /** Items granted to player inventory */
    grantItems?: Array<{ templateId: string; quantity: number }>
    /** Player takes damage (wounds) */
    woundPlayer?: boolean
    /** Status effect applied */
    statusEffect?: { id: string; duration: number }
    /** Recruit NPC to base */
    recruitNpc?: { id: string; name: string; dailyCost: number; passiveBonus: Partial<BaseResources> }
    /** Triggers a follow-up event */
    triggerEventId?: string
    /** Patch session flags (server applies this to state.flags) */
    setFlags?: Record<string, unknown>
    /** Log message to broadcast */
    logMessage?: string
    /** Success chance (0-100, undefined = guaranteed) */
    successChance?: number
    /** Effect on failure (if successChance is set) */
    failureEffect?: Omit<EventEffect, 'successChance' | 'failureEffect'>
}

/** A single option within an event */
export interface EventOption {
    id: string
    text: string
    /** Role required to see/use this option */
    requiredRole?: PlayerRole
    /** Item required in player inventory */
    requiredItem?: string
    /** Resources consumed from player/base */
    cost?: Partial<BaseResources>
    /** Effect when this option is chosen */
    effect: EventEffect
}

/** Event type tags for filtering and categorization */
export type EventTag = 'trader' | 'combat' | 'loot' | 'npc' | 'hazard' | 'minigame' | 'story'

/** A survival event triggered when entering a zone */
export interface SurvivalEvent {
    id: string
    zone: ZoneType
    /** If set, this event is tied to a hex on the tactical map */
    hex?: { q: number; r: number }
    title: string
    text: string
    imageUrl?: string
    options: EventOption[]
    tags?: EventTag[]
    /** Weight for random selection (higher = more common) */
    weight?: number
    /** Condition to show this event (e.g., session flags) */
    condition?: {
        requiredFlags?: string[]
        excludeFlags?: string[]
        minCrisisLevel?: CrisisLevel
        maxVisits?: number
    }
}

// ============================================================================
// PLAYER & SESSION STATE
// ============================================================================

export type CrisisLevel = 'calm' | 'warning' | 'crisis'

// ============================================================================
// SESSION PHASES (IN-GAME TIME)
// ============================================================================

/**
 * High-level day cycle phase (drives rules like monster movement).
 * - `start`: Morning briefing (06:00 game time)
 * - `day`: Main gameplay (daytime)
 * - `monsters`: Main gameplay + monster movement (night)
 */
export type SurvivalCyclePhase = 'start' | 'day' | 'monsters'

// ============================================================================
// WORLD TIME (SERVER-AUTHORITATIVE, LORE TIME)
// ============================================================================

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
    timeScale: number
    /** Real duration of one full lore day, in milliseconds (default 12 minutes). */
    realDayDurationMs: number
    /** Lore minute-of-day that marks the start of a new day (default 06:00). */
    dayStartMinute: number
}

export const DEFAULT_SURVIVAL_TIME_CONFIG: SurvivalWorldTimeConfig = {
    timeScale: 120,
    realDayDurationMs: 12 * 60 * 1000,
    dayStartMinute: 6 * 60,
}

/**
 * Calculate deterministic GameDayID from world time
 * Used on both client and server to check "is it the same day?"
 * @param worldTimeMs - World time in lore milliseconds
 * @param dayStartMinute - Minute of day when day starts (default 6:00 = 360)
 * @returns Integer day ID (1-based)
 */
export function getGameDayId(worldTimeMs: number, dayStartMinute = 6 * 60): number {
    const dayStartMs = dayStartMinute * 60 * 1000
    const loreDayMs = 24 * 60 * 60 * 1000
    const dayIndex = Math.floor((worldTimeMs - dayStartMs) / loreDayMs)
    return Math.max(1, dayIndex + 1)
}

/**
 * Calculate distance between two hex positions (axial coordinates)
 * Standard formula: max(|Δq|, |Δr|, |Δq+Δr|)
 */
export function hexDistance(a: { q: number; r: number }, b: { q: number; r: number }): number {
    const dq = Math.abs(a.q - b.q)
    const dr = Math.abs(a.r - b.r)
    const ds = Math.abs((a.q + a.r) - (b.q + b.r))
    return Math.max(dq, dr, ds)
}

// ============================================================================
// DAILY EVENTS & ZONE INTERACTIONS
// ============================================================================

export type DailyEventType = 'traders_arrived' | 'crisis'

export interface DailyEventState {
    id: string
    type: DailyEventType
    title: string
    description: string
    /** Lore timestamp when the event became active. */
    startedAtWorldTimeMs: number
    /** Lore timestamp when the event expires (typically next day start). */
    endsAtWorldTimeMs: number
    /** Optional choices for interactive events */
    options?: EventOption[]
    /** Whether the event has been resolved */
    resolved?: boolean
    /** Which option was chosen (if any) */
    chosenOptionId?: string
}

export type ZoneActionId = 'scavenge'

export interface ZoneActionLock {
    lockedByPlayerId: number | null
    /** Lore timestamp when the lock lease expires (to recover from disconnects). */
    lockExpiresAtWorldTimeMs: number | null
}

export interface ZoneActionInProgress {
    actionId: ZoneActionId
    startedByPlayerId: number
    /** Lore timestamp when the action completes. */
    completesAtWorldTimeMs: number
}

export interface ZoneActionState {
    chargesPerDay: number
    chargesRemaining: number
    lock: ZoneActionLock
    inProgress: ZoneActionInProgress | null
}

export interface ZoneState {
    actions: Record<ZoneActionId, ZoneActionState>
    /** Lore timestamp of last daily reset applied to this zone. */
    lastDailyResetWorldTimeMs: number | null
}

/** Player's personal inventory (on their phone) */
export interface PlayerInventory {
    items: Array<{ templateId: string; quantity: number }>
}

/** Player profile within a survival session */
export interface SurvivalPlayer {
    playerId: number
    playerName: string
    role: PlayerRole | null
    inventory: PlayerInventory
    isWounded: boolean
    currentZone: ZoneType | null
    activeEventId: string | null
    /** Full event object for persistence (replaces in-memory Map) */
    activeEvent?: SurvivalEvent | null
    /** If present, player is performing an exclusive zone action. */
    activeZoneActionId?: ZoneActionId | null
    joinedAt: number

    // === Map Movement (server-authoritative) ===
    /** Current hex position on the map (axial coordinates) */
    hexPos?: { q: number; r: number } | null
    /** Current stamina for movement */
    stamina?: number
    /** Maximum stamina */
    maxStamina?: number
    /** Movement in progress (null if stationary) */
    movementState?: {
        /** Path to walk through */
        path: Array<{ q: number; r: number }>
        /** Lore timestamp when movement started (server-authoritative). */
        startedAtWorldTimeMs?: number
        /** Lore duration per hex step (server-authoritative). */
        msPerHex?: number
        /** Lore timestamp when player arrives at destination */
        arriveAtWorldTimeMs: number
    } | null
}

/** Activity log entry shown on TV */
export interface LogEntry {
    id: string
    timestamp: number
    playerId: number | null
    playerName: string | null
    message: string
    type: 'action' | 'system' | 'crisis' | 'loot' | 'combat'
}

/** NPC recruited to the base */
export interface BaseNpc {
    id: string
    name: string
    dailyCost: number
    passiveBonus: Partial<BaseResources>
    recruitedAt: number
}

/** Full session state (shared between TV and Players) */
export interface SurvivalState {
    sessionId: string
    hostPlayerId: number
    status: 'lobby' | 'active' | 'paused' | 'ended'

    // In-game time & phases
    /** Canonical lore time (server authoritative). */
    worldTimeMs: number
    worldDay: number
    /** Minutes since midnight (0..1439) */
    worldTimeMinutes: number
    phase: SurvivalCyclePhase
    phaseStartedAt: number

    // Timer (in seconds, counts down)
    timerSeconds: number
    timerStartedAt: number | null

    // Crisis system
    crisisLevel: CrisisLevel
    crisisEventId: string | null

    // Base resources
    resources: BaseResources

    // NPCs at base
    npcs: BaseNpc[]

    // Players
    players: Record<number, SurvivalPlayer>

    // Activity log
    log: LogEntry[]

    // Session flags (for event conditions, story progression)
    flags: Record<string, unknown>

    // Zone visit counters (for ambush system)
    zoneVisits: Record<ZoneType, number>

    // World time config (server authoritative; clients may display it)
    timeConfig?: SurvivalWorldTimeConfig

    // Daily global event (06:00→06:00 window)
    dailyEvent?: DailyEventState | null

    // Shared zone state (exclusive interactions/locks)
    zones?: Record<ZoneType, ZoneState>

    createdAt: number
    updatedAt: number
}

// ============================================================================
// API TYPES
// ============================================================================

/** DTO for entering a zone (request) */
export interface EnterZoneRequest {
    zoneId: ZoneType
}

/** DTO for entering a zone (response) */
export interface EnterZoneResponse {
    event: SurvivalEvent | null
    zoneInfo?: {
        threatLevel: 'low' | 'medium' | 'high'
        lootQuality: 'poor' | 'normal' | 'rich'
    }
}

/** DTO for resolving an event option */
export interface ResolveOptionRequest {
    eventId: string
    optionId: string
}

/** DTO for transferring items to base */
export interface TransferToBaseRequest {
    items: Array<{ templateId: string; quantity: number }>
}

/** DTO for player joining a session */
export interface JoinSessionRequest {
    role?: PlayerRole
    playerName?: string
}

/** Socket event payloads */
export interface SurvivalSocketEvents {
    'survival:state_update': { sessionId: string; state: SurvivalState }
    'survival:log_entry': { sessionId: string; entry: LogEntry }
    'survival:crisis': { sessionId: string; level: CrisisLevel; eventId?: string }
    'survival:timer_sync': {
        sessionId: string
        timerSeconds: number
        worldDay?: number
        worldTimeMinutes?: number
        phase?: SurvivalCyclePhase
    }
}
