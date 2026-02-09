/**
 * Survival Service - Game Engine
 * Manages survival sessions, player state, events, and real-time updates
 */

import { eventBus } from '../lib/bus'
import { db } from '../db'
import { survivalSessions } from '../db/schema/survivalSessions'
import { sql, eq, and, gt } from 'drizzle-orm'
import {
    type SurvivalState,
    type SurvivalPlayer,
    type BaseResources,
    type PlayerRole,
    type ZoneType,
    type LogEntry,
    type CrisisLevel,
    type SurvivalEvent,
    type EventEffect,
    type SurvivalCyclePhase,
    type DailyEventState,
    type DailyEventType,
    type ZoneActionId,
    type ZoneState,
    DEFAULT_BASE_RESOURCES,
    PLAYER_ROLES,
    DEFAULT_SURVIVAL_TIME_CONFIG,
    ZONE_DEFINITIONS,
    type EventOption,
} from '../shared/types/survival'
import { getEventById, rollRandomEvent } from '../lib/survivalEvents'
import { generateMap, getHexCell, hexToString as serverHexToString } from '../shared/hexmap/mapGenerator'
import { type HexCell } from '../shared/hexmap/types'
import { getRegionById } from '../shared/hexmap/regions'
import { ITEM_TEMPLATES } from '../shared/data/itemTemplates'
import { STAMINA_COST_PER_HEX } from '../shared/data/survivalConfig'

type HexEncounterType = 'enemy' | 'survivor' | 'trap' | 'loot'

function hexKey(hex: { q: number; r: number }): string {
    return `${hex.q},${hex.r}`
}

function hexFlagVisited(key: string): string { return `hex_visited:${key}` }
function hexFlagScouted(key: string): string { return `hex_scouted:${key}` }
function hexFlagCleared(key: string): string { return `hex_cleared:${key}` }
function hexFlagEncounterType(key: string): string { return `hex_encounter:${key}` }

// ============================================================================
// IN-MEMORY SESSION STORAGE (hot-cache, persisted to PostgreSQL)
// ============================================================================

/** Active sessions indexed by sessionId */
const sessions = new Map<string, SurvivalState>()

/** Active events per player (playerId -> event) - DEPRECATED: moved to SurvivalPlayer.activeEvent */
const activeEvents = new Map<number, SurvivalEvent>()

/** Timer intervals per session */
const timerIntervals = new Map<string, NodeJS.Timeout>()

// ============================================================================
// POSTGRESQL PERSISTENCE (Write-through with throttle)
// ============================================================================

const PERSIST_THROTTLE_MS = 5000 // Throttle tick-based persists to every 5 seconds
const MAX_LOG_ENTRIES = 100 // Limit log size to prevent JSONB bloat
const lastPersistAt = new Map<string, number>() // sessionId -> last persist timestamp

/**
 * Persist session state to PostgreSQL (write-through)
 * Called immediately on critical events, throttled on ticks
 */
async function persistSession(state: SurvivalState, force = false): Promise<void> {
    const now = Date.now()
    const lastPersist = lastPersistAt.get(state.sessionId) ?? 0

    // Throttle non-forced persists
    if (!force && now - lastPersist < PERSIST_THROTTLE_MS) {
        return
    }

    // Limit log size to prevent JSONB bloat
    if (state.log.length > MAX_LOG_ENTRIES) {
        state.log = state.log.slice(-MAX_LOG_ENTRIES)
    }

    try {
        await db.insert(survivalSessions)
            .values({
                sessionId: state.sessionId,
                state,
                status: state.status,
                version: 1,
                lastRealTickAt: lastRealTickAt.get(state.sessionId) ?? now,
                expiresAt: sql`now() + interval '24 hours'`,
            })
            .onConflictDoUpdate({
                target: survivalSessions.sessionId,
                set: {
                    state,
                    status: state.status,
                    version: sql`${survivalSessions.version} + 1`,
                    lastRealTickAt: lastRealTickAt.get(state.sessionId) ?? now,
                    updatedAt: sql`now()`,
                    expiresAt: sql`now() + interval '24 hours'`,
                }
            })

        lastPersistAt.set(state.sessionId, now)
    } catch (error) {
        console.error(`[SurvivalService] Failed to persist session ${state.sessionId}:`, error)
    }
}

/**
 * Initialize survival service - recover active sessions from database on server start
 */
export async function initSurvivalService(): Promise<void> {
    console.log('[SurvivalService] Initializing - recovering active sessions from database...')

    try {
        const activeSessions = await db.select().from(survivalSessions)
            .where(and(
                eq(survivalSessions.status, 'active'),
                gt(survivalSessions.expiresAt, sql`now()`)
            ))

        for (const row of activeSessions) {
            const state = row.state as SurvivalState
            sessions.set(row.sessionId, state)
            // FREEZE policy: set lastRealTickAt to now() to prevent worldTime jump
            lastRealTickAt.set(row.sessionId, Date.now())
            // Restart tick interval
            startTickInterval(row.sessionId)
            console.log(`[SurvivalService] Recovered session ${row.sessionId} (day ${state.worldDay})`)
        }

        console.log(`[SurvivalService] Recovered ${activeSessions.length} active sessions`)
    } catch (error) {
        console.error('[SurvivalService] Failed to recover sessions:', error)
    }
}

/**
 * Start tick interval for a session
 */
function startTickInterval(sessionId: string): void {
    // Clear existing interval if any
    const existingInterval = timerIntervals.get(sessionId)
    if (existingInterval) {
        clearInterval(existingInterval)
    }

    const interval = setInterval(() => {
        // For multi-instance: use tickSessionWithLock
        // For MVP (single node): use tickSession directly (faster, no DB roundtrip)
        tickSession(sessionId)
    }, 1000)
    timerIntervals.set(sessionId, interval)
}

/**
 * Hash string to integer for pg_advisory_lock
 */
function hashStringToInt(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
}

/**
 * Tick session with advisory lock (for multi-instance deployments)
 * Uses pg_try_advisory_xact_lock inside transaction for automatic unlock
 * NOTE: For MVP single-node, tickSession() is called directly for performance
 */
async function tickSessionWithLock(sessionId: string): Promise<void> {
    const lockId = hashStringToInt(sessionId)

    try {
        await db.transaction(async (tx) => {
            const result = await tx.execute(sql`SELECT pg_try_advisory_xact_lock(${lockId}) as acquired`)
            const acquired = (result as any)[0]?.acquired

            if (!acquired) {
                // Another instance is already ticking this session
                return
            }

            // Execute tick logic within the transaction
            tickSession(sessionId)
        })
    } catch (error) {
        console.error(`[SurvivalService] tickSessionWithLock error for ${sessionId}:`, error)
    }
}

// ============================================================================
// IN-GAME TIME & PHASES
// ============================================================================

const MINUTES_PER_DAY = 24 * 60
const LORE_DAY_MS = 24 * 60 * 60 * 1000
const DAY_START_MINUTE = DEFAULT_SURVIVAL_TIME_CONFIG.dayStartMinute // 06:00
const DAY_START_MS = DAY_START_MINUTE * 60 * 1000
// Briefing window in lore minutes. With 12 real minutes per day, 120 lore minutes ~= 1 real minute.
const START_PHASE_DURATION_MINUTES = 120
const MONSTERS_START_MINUTE = 18 * 60 // 18:00

// Monster movement tick frequency during monsters phase (lore minutes)
const MONSTER_TICK_INTERVAL_MINUTES = 120
const monsterMinutesAccumulator = new Map<string, number>() // sessionId -> minutes since last monster tick
const staminaMinutesAccumulator = new Map<string, number>() // sessionId -> minutes since last stamina regen tick

// Track last real tick time per session to compute delta reliably
const lastRealTickAt = new Map<string, number>() // sessionId -> Date.now() ms

function formatWorldTime(minutesSinceMidnight: number): string {
    const mins = ((minutesSinceMidnight % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
    const hh = Math.floor(mins / 60)
    const mm = mins % 60
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
}

function getCyclePhase(minutesSinceMidnight: number): SurvivalCyclePhase {
    const m = ((minutesSinceMidnight % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY

    if (m >= DAY_START_MINUTE && m < DAY_START_MINUTE + START_PHASE_DURATION_MINUTES) return 'start'
    if (m >= DAY_START_MINUTE + START_PHASE_DURATION_MINUTES && m < MONSTERS_START_MINUTE) return 'day'
    return 'monsters'
}

function getTimeOfDayMinutesFromWorldTimeMs(worldTimeMs: number): number {
    const timeOfDayMs = ((worldTimeMs % LORE_DAY_MS) + LORE_DAY_MS) % LORE_DAY_MS
    return Math.floor(timeOfDayMs / 60000)
}

function getWorldDayFromWorldTimeMs(worldTimeMs: number): number {
    // Day 1 starts at DAY_START_MS (06:00). Crossing 06:00 increments the day.
    const daysSinceStart = Math.floor((worldTimeMs - DAY_START_MS) / LORE_DAY_MS)
    return Math.max(1, daysSinceStart + 1)
}

function getNextDayStartWorldTimeMs(worldTimeMs: number): number {
    const dayIndex = Math.floor((worldTimeMs - DAY_START_MS) / LORE_DAY_MS)
    return DAY_START_MS + (dayIndex + 1) * LORE_DAY_MS
}

function computeRealSecondsUntil(nextWorldTimeMs: number, worldTimeMs: number, timeScale: number): number {
    const remainingLoreMs = Math.max(0, nextWorldTimeMs - worldTimeMs)
    const remainingRealMs = remainingLoreMs / timeScale
    return Math.ceil(remainingRealMs / 1000)
}

function advanceWorldTimeMs(sessionId: string, state: SurvivalState, nowRealMs: number): { minutesAdvanced: number; dayIndexChanged: boolean } {
    const cfg = state.timeConfig ?? DEFAULT_SURVIVAL_TIME_CONFIG
    const prevWorldTimeMs = state.worldTimeMs
    const prevMinutes = state.worldTimeMinutes
    const prevDayIndex = Math.floor((prevWorldTimeMs - DAY_START_MS) / LORE_DAY_MS)

    const last = lastRealTickAt.get(sessionId) ?? nowRealMs
    const deltaRealMs = Math.max(0, nowRealMs - last)
    lastRealTickAt.set(sessionId, nowRealMs)

    state.worldTimeMs = prevWorldTimeMs + deltaRealMs * cfg.timeScale
    state.worldTimeMinutes = getTimeOfDayMinutesFromWorldTimeMs(state.worldTimeMs)
    state.worldDay = getWorldDayFromWorldTimeMs(state.worldTimeMs)

    const nextDayIndex = Math.floor((state.worldTimeMs - DAY_START_MS) / LORE_DAY_MS)
    const dayIndexChanged = nextDayIndex !== prevDayIndex

    // Approx minutes advanced (for monster tick accumulator). Wrap is at midnight, not at 06:00 day-start.
    let minutesAdvanced = state.worldTimeMinutes - prevMinutes
    if (minutesAdvanced < 0) minutesAdvanced += MINUTES_PER_DAY

    return { minutesAdvanced, dayIndexChanged }
}

function shouldPlayerBeSafeFromMonsters(player: SurvivalPlayer): boolean {
    // Treat base zone as safe. Players without a zone are assumed at base.
    return player.currentZone === null || player.currentZone === 'living_room'
}

function tickMonsters(state: SurvivalState): boolean {
    // Return true if state was changed (wounds/resources/log)
    let changed = false

    // Example: players outside base risk wounds during monster phase
    for (const player of Object.values(state.players)) {
        if (player.isWounded) continue
        if (shouldPlayerBeSafeFromMonsters(player)) continue

        // Base danger chance; defense reduces it a bit
        const defense = state.resources.defense
        const baseChance = 0.08
        const mitigation = Math.min(0.06, defense * 0.01)
        const chance = Math.max(0.02, baseChance - mitigation)

        if (Math.random() < chance) {
            player.isWounded = true
            state.log.push(createLogEntry(player.playerId, player.playerName, 'Попал под атаку монстров ночью и получил ранение!', 'combat'))
            changed = true
        }
    }

    // Example: low defense causes nightly base damage
    if (state.resources.defense < 2 && Math.random() < 0.15) {
        state.resources.morale = Math.max(0, state.resources.morale - 5)
        state.log.push(createLogEntry(null, null, 'Монстры прорвались к периметру базы. Мораль падает.', 'crisis'))
        changed = true
    }

    return changed
}

// ============================================================================
// DAILY EVENTS & ZONE INTERACTIONS (SERVER AUTHORITATIVE)
// ============================================================================

const ALL_ZONES: ZoneType[] = ['kitchen', 'bathroom', 'bedroom', 'corridor', 'living_room']

function generateDailyEventId(type: DailyEventType): string {
    return `daily_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getZoneNameRu(zoneId: ZoneType): string {
    return ZONE_DEFINITIONS[zoneId]?.nameRu ?? zoneId
}

function ensureZonesInitialized(state: SurvivalState): void {
    const zones = (state.zones ??= {} as Record<ZoneType, ZoneState>)

    for (const z of ALL_ZONES) {
        if (!zones[z]) {
            zones[z] = {
                actions: {
                    scavenge: {
                        chargesPerDay: 1,
                        chargesRemaining: 1,
                        lock: { lockedByPlayerId: null, lockExpiresAtWorldTimeMs: null },
                        inProgress: null,
                    },
                },
                lastDailyResetWorldTimeMs: null,
            }
        }
    }
}

function resetZonesForNewDay(state: SurvivalState): void {
    ensureZonesInitialized(state)
    const nowWorld = state.worldTimeMs

    for (const z of ALL_ZONES) {
        const zone = state.zones![z]
        // Reset daily charges; keep simple for MVP (tune later per biome/threat/visits)
        zone.actions.scavenge.chargesPerDay = z === 'living_room' ? 0 : 1
        zone.actions.scavenge.chargesRemaining = zone.actions.scavenge.chargesPerDay

        // Release locks at day start; also clear in-progress (lease safety)
        zone.actions.scavenge.lock.lockedByPlayerId = null
        zone.actions.scavenge.lock.lockExpiresAtWorldTimeMs = null
        zone.actions.scavenge.inProgress = null

        zone.lastDailyResetWorldTimeMs = nowWorld
    }
}

function rollDailyGlobalEvent(state: SurvivalState): DailyEventState | null {
    // Check for forecasted event override
    const forecastedType = state.flags['next_day_event_type'] as DailyEventType | undefined
    if (forecastedType) {
        // Clear the flag so it doesn't persist forever
        delete state.flags['next_day_event_type']

        // Reset the forecast visualization
        state.forecastedEventId = null
        state.forecastedEventRevealedAt = null

        return createDailyEvent(forecastedType, state.worldTimeMs)
    }

    // MVP: simple weighted roll. Tune later based on resources/crisis history.
    const r = Math.random()
    let type: DailyEventType | null = null
    if (r < 0.2) type = 'traders_arrived'
    else if (r < 0.3) type = 'crisis'

    if (!type) return null
    return createDailyEvent(type, state.worldTimeMs)
}

function createDailyEvent(type: DailyEventType, nowWorldTimeMs: number): DailyEventState {
    const endsAtWorldTimeMs = getNextDayStartWorldTimeMs(nowWorldTimeMs)
    if (type === 'traders_arrived') {
        return {
            id: generateDailyEventId(type),
            type,
            title: 'Торговцы у бункера',
            description: 'У входа в бункер появились торговцы. Можно обменять ресурсы и редкие предметы.',
            startedAtWorldTimeMs: nowWorldTimeMs,
            endsAtWorldTimeMs,
        }
    }

    return {
        id: generateDailyEventId(type),
        type,
        title: 'Кризис дня',
        description: 'Новый кризис обрушился на базу. Придётся выбирать, чем пожертвовать.',
        startedAtWorldTimeMs: nowWorldTimeMs,
        endsAtWorldTimeMs,
    }
}

// Deprecated old roll function signature match, replaced by above logic
function _unused_old_rollDailyGlobalEvent_stub(state: SurvivalState): DailyEventState | null {
    // This function is deprecated and its body was accidentally pasted with an error.
    // The actual logic for rolling daily events is in rollDailyGlobalEvent(state) above.
    return null
}

function onDayStart(state: SurvivalState): void {
    // Reset interactions first (so players standing in zones immediately see refreshed options)
    resetZonesForNewDay(state)

    function applyDailyEventSideEffects(state: SurvivalState): void {
        const ev = state.dailyEvent
        if (!ev) {
            state.crisisLevel = 'calm'
            return
        }

        if (ev.type === 'crisis') {
            state.crisisLevel = 'crisis'
            state.resources.morale = Math.max(0, state.resources.morale - 10)
        } else {
            state.crisisLevel = 'calm'
        }
    }

    // Roll global daily event and apply its baseline effects
    state.dailyEvent = rollDailyGlobalEvent(state)
    applyDailyEventSideEffects(state)

    const time = formatWorldTime(state.worldTimeMinutes)
    if (state.dailyEvent) {
        state.log.push(createLogEntry(null, null, `ДЕНЬ ${state.worldDay} — ${time}. ${state.dailyEvent.title}.`, 'system'))
    } else {
        state.log.push(createLogEntry(null, null, `ДЕНЬ ${state.worldDay} — ${time}. Начало дня.`, 'system'))
    }

    // Activate interactions in zones where players are currently located
    for (const player of Object.values(state.players)) {
        if (!player.currentZone) continue
        const z = player.currentZone
        const zoneState = state.zones?.[z]
        const scavenge = zoneState?.actions.scavenge
        if (!scavenge) continue

        if (scavenge.chargesRemaining > 0) {
            state.log.push(createLogEntry(player.playerId, player.playerName, `В ${getZoneNameRu(z)} доступно взаимодействие: ОБЫСК (${scavenge.chargesRemaining}x)`, 'system'))
        }
    }

    // Also keep the existing “morning briefing” flavor + possible zone events
    runMorningBriefing(state)
}

function processZoneActions(state: SurvivalState): boolean {
    if (!state.zones) return false
    let changed = false

    for (const z of ALL_ZONES) {
        const zone = state.zones[z]
        if (!zone) continue

        const action = zone.actions.scavenge
        if (!action?.inProgress) continue

        if (state.worldTimeMs >= action.inProgress.completesAtWorldTimeMs) {
            const player = state.players[action.inProgress.startedByPlayerId]
            if (player) {
                // MVP loot: based on zone primaryLoot.
                const loot = ZONE_DEFINITIONS[z]?.primaryLoot ?? []
                const templateId =
                    loot.includes('food') ? 'canned_food'
                        : loot.includes('fuel') ? 'fuel'
                            : loot.includes('medicine') ? 'bandage'
                                : 'scrap'

                const qty = 1 + Math.floor(Math.random() * 2)
                const existing = player.inventory.items.find(i => i.templateId === templateId)
                if (existing) existing.quantity += qty
                else player.inventory.items.push({ templateId, quantity: qty })

                player.activeZoneActionId = null
                state.log.push(createLogEntry(player.playerId, player.playerName, `Завершил ОБЫСК в ${getZoneNameRu(z)} и нашёл ${qty}x ${templateId}`, 'loot'))
                changed = true
            }

            // Release lock and clear progress
            action.inProgress = null
            action.lock.lockedByPlayerId = null
            action.lock.lockExpiresAtWorldTimeMs = null
            changed = true
        }
    }

    return changed
}

const STAMINA_REGEN_INTERVAL_MINUTES = 60
const STAMINA_REGEN_PER_TICK = 1
const STAMINA_REGEN_BUNKER_MULTIPLIER = 3
const STAMINA_REGEN_FOOD_RESTORE = 10
const STAMINA_REGEN_WATER_RESTORE = 10
const STAMINA_REGEN_MIN_MISSING = 10

function ensurePlayerStamina(player: SurvivalPlayer): boolean {
    let changed = false
    if (player.stamina === undefined || !Number.isFinite(player.stamina)) {
        player.stamina = DEFAULT_STAMINA
        changed = true
    }
    if (player.maxStamina === undefined || !Number.isFinite(player.maxStamina)) {
        player.maxStamina = DEFAULT_STAMINA
        changed = true
    }
    if (player.stamina < 0) {
        player.stamina = 0
        changed = true
    }
    if (player.maxStamina < 1) {
        player.maxStamina = DEFAULT_STAMINA
        changed = true
    }
    if (player.stamina > player.maxStamina) {
        player.stamina = player.maxStamina
        changed = true
    }
    return changed
}

function ensurePlayerHexPos(player: SurvivalPlayer): { q: number; r: number } {
    if (!player.hexPos) {
        player.hexPos = { q: 0, r: 0 }
    }
    return player.hexPos
}

function isBunkerHex(pos: { q: number; r: number }): boolean {
    return pos.q === 0 && pos.r === 0
}

function consumeInventoryItemByTag(player: SurvivalPlayer, tag: string): boolean {
    const items = player.inventory.items
    for (let i = 0; i < items.length; i += 1) {
        const entry = items[i]
        if (!entry || entry.quantity <= 0) continue
        const template = ITEM_TEMPLATES[entry.templateId]
        if (!template?.tags?.includes(tag)) continue
        entry.quantity -= 1
        if (entry.quantity <= 0) {
            items.splice(i, 1)
        }
        return true
    }
    return false
}

function applyStaminaRegen(state: SurvivalState, ticks: number): boolean {
    let changed = false
    if (ticks <= 0) return false

    for (const player of Object.values(state.players)) {
        if (ensurePlayerStamina(player)) changed = true
        const pos = ensurePlayerHexPos(player)

        let stamina = player.stamina ?? DEFAULT_STAMINA
        const maxStamina = player.maxStamina ?? DEFAULT_STAMINA

        const baseRegen = STAMINA_REGEN_PER_TICK * ticks
        const regen = isBunkerHex(pos) ? baseRegen * STAMINA_REGEN_BUNKER_MULTIPLIER : baseRegen
        if (regen > 0 && stamina < maxStamina) {
            stamina = Math.min(maxStamina, stamina + regen)
            player.stamina = stamina
            changed = true
        }

        if (stamina >= maxStamina) continue
        if (maxStamina - stamina < STAMINA_REGEN_MIN_MISSING) continue

        for (let i = 0; i < ticks; i += 1) {
            if (stamina >= maxStamina) break
            if (consumeInventoryItemByTag(player, 'sustenance')) {
                stamina = Math.min(maxStamina, stamina + STAMINA_REGEN_FOOD_RESTORE)
                player.stamina = stamina
                changed = true
            }
            if (stamina >= maxStamina) break
            if (consumeInventoryItemByTag(player, 'water')) {
                stamina = Math.min(maxStamina, stamina + STAMINA_REGEN_WATER_RESTORE)
                player.stamina = stamina
                changed = true
            }
        }
    }

    return changed
}

function processStaminaRegen(state: SurvivalState, sessionId: string, minutesAdvanced: number): boolean {
    if (minutesAdvanced <= 0) return false

    const prevMinutes = staminaMinutesAccumulator.get(sessionId) ?? 0
    const accumulated = prevMinutes + minutesAdvanced

    if (accumulated < STAMINA_REGEN_INTERVAL_MINUTES) {
        staminaMinutesAccumulator.set(sessionId, accumulated)
        return false
    }

    const ticks = Math.floor(accumulated / STAMINA_REGEN_INTERVAL_MINUTES)
    staminaMinutesAccumulator.set(sessionId, accumulated % STAMINA_REGEN_INTERVAL_MINUTES)

    return applyStaminaRegen(state, ticks)
}

/**
 * Process player movement arrivals - called from tickSession
 */
function processPlayerArrivals(state: SurvivalState): boolean {
    let changed = false

    for (const player of Object.values(state.players)) {
        if (!player.movementState) continue
        ensurePlayerHexPos(player)
        const movement = player.movementState
        const path = movement.path
        if (!path || path.length < 2) {
            player.movementState = null
            changed = true
            continue
        }

        const msPerHex =
            (typeof movement.msPerHex === 'number' && Number.isFinite(movement.msPerHex))
                ? movement.msPerHex
                : MOVEMENT_MS_PER_HEX

        const totalSteps = path.length - 1
        const startedAtWorldTimeMs =
            (typeof movement.startedAtWorldTimeMs === 'number' && Number.isFinite(movement.startedAtWorldTimeMs))
                ? movement.startedAtWorldTimeMs
                : Math.max(0, movement.arriveAtWorldTimeMs - totalSteps * msPerHex)

        const progressedLoreMs = Math.max(0, state.worldTimeMs - startedAtWorldTimeMs)
        const stepIndex = Math.min(totalSteps, Math.max(0, Math.floor(progressedLoreMs / msPerHex)))

        const currentPos = player.hexPos ?? { q: 0, r: 0 }
        let currentIndex = path.findIndex((h) => h.q === currentPos.q && h.r === currentPos.r)
        if (currentIndex < 0) currentIndex = 0

        if (stepIndex > currentIndex) {
            for (let i = currentIndex + 1; i <= stepIndex; i += 1) {
                const step = path[i]
                state.flags[hexFlagVisited(hexKey(step))] = true
            }
            player.hexPos = path[stepIndex]
            changed = true
        }

        // Check if player has arrived
        if (state.worldTimeMs >= movement.arriveAtWorldTimeMs) {
            // #region agent log

            // #endregion
            // Update position to destination (last element in path)
            const destination = path[path.length - 1]
            if (!player.hexPos || player.hexPos.q !== destination.q || player.hexPos.r !== destination.r) {
                player.hexPos = destination
                state.flags[hexFlagVisited(hexKey(destination))] = true
                changed = true
            }
            const key = hexKey(destination)

            state.log.push(createLogEntry(
                player.playerId,
                player.playerName,
                `Arrived at (${destination.q}, ${destination.r})`,
                'action'
            ))

            // Clear movement state
            player.movementState = null

            // Hex interaction: on arrival, offer scouting unless cleared already
            if (!player.activeEventId) {
                const cleared = state.flags[hexFlagCleared(key)] === true
                if (!cleared) {
                    const { hexSeed, hexRadius, regionId } = getHexMapConfigFromFlags(state.flags)
                    const cell = getHexCell(hexRadius, hexSeed, destination)
                    if (cell) {
                        const intro = generateHexEncounterEvent(cell, regionId)
                        player.activeEventId = intro.id
                        player.activeEvent = intro
                        // #region agent log

                        // #endregion
                        state.log.push(createLogEntry(
                            player.playerId,
                            player.playerName,
                            `Arrived at encounter (${destination.q}, ${destination.r}) - awaiting action`,
                            'action'
                        ))
                    }
                }
            }

            changed = true
        }
    }

    return changed
}

function getHexMapConfigFromFlags(flags: Record<string, unknown> | undefined): { hexSeed: number; hexRadius: number; regionId?: string } {
    const seedRaw = flags?.hexMapSeed
    const radiusRaw = flags?.hexMapRadius
    const regionIdRaw = flags?.hexMapRegionId

    const hexSeed = (typeof seedRaw === 'number' && Number.isFinite(seedRaw)) ? Math.floor(seedRaw) : 1_337
    const hexRadius = (typeof radiusRaw === 'number' && Number.isFinite(radiusRaw)) ? Math.max(1, Math.floor(radiusRaw)) : 14
    const regionId = typeof regionIdRaw === 'string' ? regionIdRaw : undefined

    return { hexSeed, hexRadius, regionId }
}

function mapHexToZone(cell: HexCell): ZoneType {
    switch (cell.resource) {
        case 'FOOD':
        case 'WATER':
            return 'kitchen'
        case 'SCRAP':
            return 'bedroom'
        case 'FUEL':
            return 'corridor'
        case 'TECH':
            return 'corridor'
        default:
            // fallback by threat
            return cell.threatLevel === 'SAFE' ? 'living_room' : 'corridor'
    }
}

function threatToSuccessChance(threat: HexCell['threatLevel']): number {
    switch (threat) {
        case 'SAFE': return 85
        case 'LOW': return 75
        case 'MEDIUM': return 60
        case 'HIGH': return 45
        case 'EXTREME': return 30
        default: return 60
    }
}

function randomLootForHex(cell: HexCell): Array<{ templateId: string; quantity: number }> {
    // Keep item ids aligned with ITEM_TEMPLATES
    switch (cell.resource) {
        case 'FOOD':
            return [{ templateId: 'canned_food', quantity: 1 + Math.floor(Math.random() * 2) }]
        case 'WATER':
            return [{ templateId: 'canteen', quantity: 1 }]
        case 'SCRAP':
            return [{ templateId: 'scrap', quantity: 1 + Math.floor(Math.random() * 3) }]
        case 'TECH':
            return Math.random() < 0.5
                ? [{ templateId: 'repair_kit_small', quantity: 1 }]
                : [{ templateId: 'radio', quantity: 1 }]
        case 'FUEL':
            // No unified "fuel item" in templates; model as base resource for now via EventEffect.resourceDelta elsewhere.
            return [{ templateId: 'scrap', quantity: 1 }]
        default:
            return [{ templateId: 'scrap', quantity: 1 }]
    }
}

function generateKarlsruheAdminEvent(cell: HexCell, id: string): SurvivalEvent {
    return {
        id,
        title: 'Университетский Сервер',
        text: 'Вы нашли уцелевший терминал в руинах административного корпуса KIT. Питание еще есть, жесткие диски вращаются.',
        zone: 'bathroom', // Mapping to "Lab" vibe
        hex: { q: cell.q, r: cell.r },
        imageUrl: '/images/events/server_terminal.jpg',
        tags: ['story', 'tech'],
        options: [
            {
                id: 'download_protocols',
                text: '[TECH] Скачать протоколы защиты',
                requiredRole: 'techie',
                effect: {
                    grantItems: [{ templateId: 'defense_protocol', quantity: 1 }],
                    logMessage: 'извлек Протоколы Защиты из терминала',
                    triggerEventId: undefined
                }
            },
            {
                id: 'scan_network',
                text: '[INT] Сканировать сеть на угрозы',
                cost: { energy: 5 } as any,
                effect: {
                    setFlags: { next_day_event_type: 'crisis', forecast_revealed: true },
                    logMessage: 'провел сканирование сети: ОБНАРУЖЕНА УГРОЗА ВТОРЖЕНИЯ',
                    statusEffect: { id: 'forecast_revealed', duration: 1440 }
                }
            },
            {
                id: 'leave',
                text: 'Уйти',
                effect: { logMessage: 'оставил терминал в покое' }
            }
        ]
    }
}

function generateHexEncounterEvent(cell: HexCell, regionId?: string): SurvivalEvent {
    const id = `hex_${cell.q}_${cell.r}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const zone = mapHexToZone(cell)

    // Karlsruhe ADMIN/TECH Special Logic
    if (regionId === 'karlsruhe' && (cell.resource === 'TECH' || zone === 'bathroom')) { // bathroom maps to Bio-Labs (closest to Admin/Science vibe in zones)
        return generateKarlsruheAdminEvent(cell, id)
    }

    const baseChance = threatToSuccessChance(cell.threatLevel)
    const loot = randomLootForHex(cell)

    const isDanger = cell.threatLevel === 'HIGH' || cell.threatLevel === 'EXTREME'
    const combatScenario = cell.threatLevel === 'EXTREME' ? 'boss_train_prologue' : 'scorpion_nest'

    const fuelDelta = cell.resource === 'FUEL' ? 1 : 0
    const baseEffect: EventEffect = {
        grantItems: loot,
        resourceDelta: fuelDelta > 0 ? { fuel: fuelDelta } : undefined,
        logMessage: `обыскал сектор (${cell.q}, ${cell.r})`,
        successChance: baseChance,
        failureEffect: isDanger
            ? {
                // Combat transition on failure
                battleScenarioId: combatScenario,
                logMessage: `наткнулся на врагов при обыске (${cell.q}, ${cell.r})`,
                // Success rewards
                grantItems: loot,

                failureEffect: {
                    woundPlayer: true,
                    logMessage: `еле унёс ноги с сектора (${cell.q}, ${cell.r})`
                }
            }
            : { resourceDelta: { morale: -5 }, logMessage: `ничего не нашёл и потерял уверенность` },
    }

    const options: EventOption[] = [
        {
            id: 'search_hex',
            text: '[ОБЫСКАТЬ СЕКТОР]',
            effect: baseEffect
        },
        {
            id: 'scout_hex',
            text: '[РАЗВЕДАТЬ] (Разведчик)',
            requiredRole: 'scout',
            effect: {
                logMessage: `разведал сектор (${cell.q}, ${cell.r})`,
                successChance: 100,
                resourceDelta: { morale: 1 },
                setFlags: { [hexFlagScouted(hexKey(cell))]: true }
            }
        },
        {
            id: 'leave',
            text: '[ОТСТУПИТЬ]',
            effect: { logMessage: `решил не рисковать в секторе (${cell.q}, ${cell.r})` }
        }
    ]

    // Direct combat option for high threat
    if (isDanger) {
        options.push({
            id: 'clear_threat',
            text: '[ЗАЧИСТИТЬ УГРОЗУ]',
            effect: {
                battleScenarioId: combatScenario,
                logMessage: `начал зачистку сектора (${cell.q}, ${cell.r})`,
                // Success rewards
                resourceDelta: { morale: 5, defense: 1 },
                grantItems: [{ templateId: 'ammo', quantity: 5 }],
                setFlags: { [hexFlagCleared(hexKey(cell))]: true },

                failureEffect: {
                    woundPlayer: true,
                    resourceDelta: { morale: -10 },
                    logMessage: `провалил зачистку сектора`
                }
            }
        })
    }

    return {
        id,
        zone,
        hex: { q: cell.q, r: cell.r },
        title: `${cell.biome} • ${cell.threatLevel}${cell.resource !== 'NONE' ? ` • ${cell.resource}` : ''}`,
        text:
            `Вы добрались до нового сектора (${cell.q}, ${cell.r}).\n` +
            `Биом: ${cell.biome}. Угроза: ${cell.threatLevel}.` +
            (cell.resource !== 'NONE' ? ` Здесь можно найти: ${cell.resource}.` : ''),
        options,
        tags: isDanger ? ['combat', 'loot'] : ['loot'],
        weight: 100,
    }
}

function pickHexEncounterType(state: SurvivalState, cell: HexCell): HexEncounterType {
    const key = hexKey({ q: cell.q, r: cell.r })
    const stored = state.flags[hexFlagEncounterType(key)]
    if (stored === 'enemy' || stored === 'survivor' || stored === 'trap' || stored === 'loot') {
        return stored
    }

    // Weighted by threat/resource (simple MVP tuning)
    const r = Math.random()
    let t: HexEncounterType = 'loot'

    if (cell.threatLevel === 'EXTREME') {
        t = r < 0.65 ? 'enemy' : r < 0.85 ? 'trap' : 'loot'
    } else if (cell.threatLevel === 'HIGH') {
        t = r < 0.45 ? 'enemy' : r < 0.70 ? 'trap' : r < 0.85 ? 'survivor' : 'loot'
    } else if (cell.threatLevel === 'MEDIUM') {
        t = r < 0.25 ? 'enemy' : r < 0.45 ? 'trap' : r < 0.70 ? 'survivor' : 'loot'
    } else {
        t = r < 0.10 ? 'enemy' : r < 0.20 ? 'trap' : r < 0.50 ? 'survivor' : 'loot'
    }

    // Nudge by resource
    if (cell.resource === 'TECH' && t === 'loot' && Math.random() < 0.4) t = 'trap'
    if (cell.resource === 'FOOD' && t === 'enemy' && Math.random() < 0.3) t = 'loot'

    // Karlsruhe recruitment bonus: highly populated area -> more survivors
    if (state.flags['hexMapRegionId'] === 'karlsruhe' && t === 'loot' && Math.random() < 0.15) {
        t = 'survivor'
    }

    state.flags[hexFlagEncounterType(key)] = t
    return t
}

function generateHexEncounterFollowUp(state: SurvivalState, cell: HexCell): SurvivalEvent {
    const key = hexKey({ q: cell.q, r: cell.r })
    const zone = mapHexToZone(cell)
    const baseChance = threatToSuccessChance(cell.threatLevel)
    const t = pickHexEncounterType(state, cell)

    const commonHex = { q: cell.q, r: cell.r }
    const clearFlags = {
        [hexFlagCleared(key)]: true,
    } as Record<string, unknown>

    if (t === 'enemy') {
        return {
            id: `hex_enemy_${cell.q}_${cell.r}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            zone,
            hex: commonHex,
            title: `ВРАГ • ${cell.threatLevel}`,
            text: `В секторе (${cell.q}, ${cell.r}) слышны шаги и шёпот. Кто-то рядом.`,
            options: [
                {
                    id: 'fight',
                    text: '[АТАКОВАТЬ]',
                    effect: {
                        successChance: Math.max(20, baseChance - 10),
                        grantItems: randomLootForHex(cell),
                        logMessage: 'устранил угрозу и забрал добычу',
                        setFlags: clearFlags,
                        failureEffect: { woundPlayer: true, resourceDelta: { morale: -10 }, logMessage: 'получил ранение в стычке' },
                    },
                },
                {
                    id: 'sneak',
                    text: '[ПРОКРАСТЬСЯ] (Разведчик)',
                    requiredRole: 'scout',
                    effect: {
                        successChance: Math.min(95, baseChance + 20),
                        logMessage: 'обошёл врага и тихо ушёл',
                        // Not cleared if you sneak away
                        setFlags: { [hexFlagVisited(key)]: true },
                        failureEffect: { woundPlayer: true, logMessage: 'враг заметил — пришлось драться и получил ранение' },
                    },
                },
                {
                    id: 'retreat',
                    text: '[ОТСТУПИТЬ]',
                    effect: { logMessage: 'отступил, не вступая в бой' },
                },
            ],
            tags: ['combat'],
        }
    }

    if (t === 'survivor') {
        return {
            id: `hex_survivor_${cell.q}_${cell.r}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            zone,
            hex: commonHex,
            title: 'ВЫЖИВШИЙ',
            text: `Вы встречаете выжившего в секторе (${cell.q}, ${cell.r}). Он напуган, но готов говорить.`,
            options: [
                {
                    id: 'recruit',
                    text: '[ПРИГЛАСИТЬ НА БАЗУ] (-1 Еда)',
                    cost: { food: 1 },
                    effect: {
                        recruitNpc: {
                            id: `hex_survivor_${key}`,
                            name: 'Выживший',
                            dailyCost: 1,
                            passiveBonus: { morale: 2 },
                        },
                        logMessage: 'привёл выжившего на базу',
                        setFlags: clearFlags,
                    },
                },
                {
                    id: 'trade',
                    text: '[ОБМЕНЯТЬСЯ]',
                    effect: {
                        grantItems: [{ templateId: 'radio', quantity: 1 }],
                        logMessage: 'обменялся с выжившим',
                        setFlags: clearFlags,
                    },
                },
                {
                    id: 'leave',
                    text: '[УЙТИ]',
                    effect: { logMessage: 'не стал вмешиваться' },
                },
            ],
            tags: ['npc'],
        }
    }

    if (t === 'trap') {
        return {
            id: `hex_trap_${cell.q}_${cell.r}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            zone,
            hex: commonHex,
            title: `ЛОВУШКА • ${cell.threatLevel}`,
            text: `Сектор (${cell.q}, ${cell.r}) выглядит подозрительно: провода, растяжки, следы капкана.`,
            options: [
                {
                    id: 'disarm',
                    text: '[ОБЕЗВРЕДИТЬ] (Техник)',
                    requiredRole: 'techie',
                    effect: {
                        successChance: Math.min(95, baseChance + 25),
                        grantItems: [{ templateId: 'scrap', quantity: 3 }],
                        logMessage: 'обезвредил ловушку и собрал детали',
                        setFlags: clearFlags,
                        failureEffect: { woundPlayer: true, resourceDelta: { morale: -10 }, logMessage: 'сработала ловушка' },
                    },
                },
                {
                    id: 'risk',
                    text: '[РИСКНУТЬ]',
                    effect: {
                        successChance: Math.max(20, baseChance - 20),
                        grantItems: [{ templateId: 'scrap', quantity: 2 }],
                        logMessage: 'проскочил через ловушки и что-то нашёл',
                        setFlags: clearFlags,
                        failureEffect: { woundPlayer: true, logMessage: 'попал в ловушку' },
                    },
                },
                { id: 'retreat', text: '[ОТСТУПИТЬ]', effect: { logMessage: 'отступил' } },
            ],
            tags: ['hazard'],
        }
    }

    // loot
    const fuelDelta = cell.resource === 'FUEL' ? 1 : 0
    return {
        id: `hex_loot_${cell.q}_${cell.r}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        zone,
        hex: commonHex,
        title: 'НАХОДКА',
        text: `После разведки вы нашли точку для обыска в секторе (${cell.q}, ${cell.r}).`,
        options: [
            {
                id: 'scavenge',
                text: '[ОБЫСКАТЬ]',
                effect: {
                    successChance: Math.min(95, baseChance + 5),
                    grantItems: randomLootForHex(cell),
                    resourceDelta: fuelDelta > 0 ? { fuel: fuelDelta } : undefined,
                    logMessage: 'собрал полезное и ушёл',
                    setFlags: clearFlags,
                    failureEffect: { resourceDelta: { morale: -5 }, logMessage: 'ничего ценного не нашёл' },
                },
            },
            { id: 'leave', text: '[УЙТИ]', effect: { logMessage: 'решил не тратить время' } },
        ],
        tags: ['loot'],
    }
}

function runMorningBriefing(state: SurvivalState): void {
    const time = formatWorldTime(state.worldTimeMinutes)
    state.log.push(createLogEntry(null, null, `Сводка: ${time}.`, 'system'))

    // Example: Cataclysm/crisis announcement & objectives
    if (state.crisisLevel === 'crisis') {
        state.log.push(createLogEntry(null, null, '⚠️ КАТАКЛИЗМ: ситуация критическая. Укрепите базу и обеспечьте ресурсы.', 'crisis'))
        state.log.push(createLogEntry(null, null, 'ЗАДАЧИ: +еда/+мораль, усилить защиту, вернуть раненых в базу.', 'system'))
    } else if (state.crisisLevel === 'warning') {
        state.log.push(createLogEntry(null, null, '⚠️ ПРЕДУПРЕЖДЕНИЕ: признаки надвигающегося катаклизма. Подготовьтесь.', 'system'))
    }

    // Location-linked morning events: if players stayed in zones, they may get a zone event
    for (const player of Object.values(state.players)) {
        if (!player.currentZone) continue
        if (player.activeEventId) continue
        if (player.currentZone === 'living_room') continue

        const event = rollRandomEvent(player.currentZone, state.flags, state.zoneVisits[player.currentZone] ?? 0)
        if (!event) continue

        player.activeEventId = event.id
        player.activeEvent = event // Store full event for persistence
        state.log.push(createLogEntry(player.playerId, player.playerName, `Утреннее событие в ${player.currentZone}: ${event.title}`, 'action'))
    }

}

function onPhaseChanged(state: SurvivalState, prevPhase: SurvivalCyclePhase, nextPhase: SurvivalCyclePhase): void {
    const time = formatWorldTime(state.worldTimeMinutes)

    if (nextPhase === 'start') {
        // New day start at 06:00
        onDayStart(state)
        return
    }

    if (prevPhase !== nextPhase) {
        const label =
            nextPhase === 'day'
                ? 'Дневная фаза'
                : nextPhase === 'monsters'
                    ? 'Ночная фаза: монстры активны'
                    : 'Начало дня'

        state.log.push(createLogEntry(null, null, `${time}. ${label}.`, 'system'))
    }

    // Tick loop will broadcast the updated state
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateSessionId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

function generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function createLogEntry(
    playerId: number | null,
    playerName: string | null,
    message: string,
    type: LogEntry['type'] = 'action'
): LogEntry {
    return {
        id: generateLogId(),
        timestamp: Date.now(),
        playerId,
        playerName,
        message,
        type,
    }
}

function broadcastUpdate(sessionId: string, state: SurvivalState) {
    eventBus.emit('survival_update', { sessionId, state })
}

function broadcastLogEntry(sessionId: string, entry: LogEntry) {
    eventBus.emit('survival_log', { sessionId, entry })
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new survival session
 */
export async function createSession(
    hostPlayerId: number,
    hostName: string = 'Host',
    regionId?: string
): Promise<SurvivalState> {
    const sessionId = generateSessionId()
    const now = Date.now()
    // Hex map config (used by both server encounter generation and client rendering)
    const hexMapSeed = Math.floor(Math.random() * 2_000_000_000)
    const hexMapRadius = 14

    // Region config
    const region = getRegionById(regionId)
    const hexMapRegionId = region.id
    const hexMapCenterLngLat = region.geoCenterLngLat

    const hostPlayer: SurvivalPlayer = {
        playerId: hostPlayerId,
        playerName: hostName,
        role: null,
        inventory: { items: [] },
        isWounded: false,
        currentZone: null,
        activeEventId: null,
        joinedAt: now,
        hexPos: { q: 0, r: 0 },
        stamina: DEFAULT_STAMINA,
        maxStamina: DEFAULT_STAMINA,
    }

    const state: SurvivalState = {
        sessionId,
        hostPlayerId,
        status: 'lobby',

        // Canonical server time (lore ms). Start aligned to 06:00.
        worldTimeMs: DAY_START_MS,
        worldDay: 1,
        worldTimeMinutes: DAY_START_MINUTE,
        phase: 'start',
        phaseStartedAt: now,

        // Countdown shown in UI: real seconds until next 06:00 day-start (full day = 12 real minutes)
        timerSeconds: Math.ceil(DEFAULT_SURVIVAL_TIME_CONFIG.realDayDurationMs / 1000),
        timerStartedAt: null,
        crisisLevel: 'calm',
        crisisEventId: null,
        resources: { ...DEFAULT_BASE_RESOURCES },
        npcs: [],
        players: { [hostPlayerId]: hostPlayer },
        log: [createLogEntry(null, null, 'Сессия создана', 'system')],
        flags: {
            hexMapSeed,
            hexMapRadius,
            hexMapRegionId,
            hexMapCenterLngLat,
        },
        timeConfig: { ...DEFAULT_SURVIVAL_TIME_CONFIG },
        dailyEvent: null,
        zones: undefined,
        zoneVisits: {
            kitchen: 0,
            bathroom: 0,
            bedroom: 0,
            corridor: 0,
            living_room: 0,
        },
        createdAt: now,
        updatedAt: now,
    }

    sessions.set(sessionId, state)

    // Persist immediately (critical event)
    await persistSession(state, true)

    return state
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): SurvivalState | undefined {
    const state = sessions.get(sessionId)
    if (!state) return undefined

    let changed = false
    for (const player of Object.values(state.players)) {
        if (ensurePlayerStamina(player)) changed = true
        const hadHexPos = Boolean(player.hexPos)
        ensurePlayerHexPos(player)
        if (!hadHexPos) changed = true
    }
    if (changed) {
        state.updatedAt = Date.now()
    }

    return state
}

/**
 * Join an existing session
 */
export async function joinSession(
    sessionId: string,
    playerId: number,
    playerName: string,
    role?: PlayerRole
): Promise<SurvivalState> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')

    // Validate role if provided
    if (role && !PLAYER_ROLES[role]) {
        role = undefined
    }

    // Idempotent join: if player already exists, allow updating name/role (safe for lobby and reconnects)
    const existingPlayer = state.players[playerId]
    if (existingPlayer) {
        let changed = false

        if (playerName && existingPlayer.playerName !== playerName) {
            existingPlayer.playerName = playerName
            changed = true
        }

        if (ensurePlayerStamina(existingPlayer)) {
            changed = true
        }
        const hadHexPos = Boolean(existingPlayer.hexPos)
        ensurePlayerHexPos(existingPlayer)
        if (!hadHexPos) {
            changed = true
        }

        const canUpdateRole = state.status === 'lobby' || existingPlayer.role === null
        if (role && canUpdateRole && existingPlayer.role !== role) {
            existingPlayer.role = role
            changed = true

            // Grant enforcer starting item (idempotent)
            if (role === 'enforcer') {
                const hasPistol = existingPlayer.inventory.items.some(i => i.templateId === 'pistol')
                if (!hasPistol) {
                    existingPlayer.inventory.items.push({ templateId: 'pistol', quantity: 1 })
                }
            }
        }

        if (changed) {
            state.updatedAt = Date.now()
            broadcastUpdate(sessionId, state)
        }

        return state
    }

    // New player join is only allowed while lobby is open
    if (state.status !== 'lobby') throw new Error('Session already started')

    const player: SurvivalPlayer = {
        playerId,
        playerName,
        role: role ?? null,
        inventory: { items: [] },
        isWounded: false,
        currentZone: null,
        activeEventId: null,
        joinedAt: Date.now(),
        hexPos: { q: 0, r: 0 },
        stamina: DEFAULT_STAMINA,
        maxStamina: DEFAULT_STAMINA,
    }

    // If enforcer, grant starting pistol
    if (role === 'enforcer') {
        player.inventory.items.push({ templateId: 'pistol', quantity: 1 })
    }

    state.players[playerId] = player
    state.log.push(createLogEntry(playerId, playerName, `присоединился к сессии`, 'system'))
    state.updatedAt = Date.now()

    // Persist immediately (critical event)
    await persistSession(state, true)

    broadcastUpdate(sessionId, state)
    return state
}

/**
 * Select or change role
 */
export async function selectRole(
    sessionId: string,
    playerId: number,
    role: PlayerRole
): Promise<SurvivalState> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')

    const player = state.players[playerId]
    if (!player) throw new Error('Player not in session')

    if (!PLAYER_ROLES[role]) throw new Error('Invalid role')

    player.role = role

    // Grant enforcer starting item
    if (role === 'enforcer') {
        const hasPistol = player.inventory.items.some(i => i.templateId === 'pistol')
        if (!hasPistol) {
            player.inventory.items.push({ templateId: 'pistol', quantity: 1 })
        }
    }

    state.log.push(createLogEntry(playerId, player.playerName, `выбрал роль ${PLAYER_ROLES[role].nameRu}`, 'system'))
    state.updatedAt = Date.now()

    broadcastUpdate(sessionId, state)
    return state
}

/**
 * Start the session (begin timer)
 */
export async function startSession(sessionId: string, playerId: number): Promise<SurvivalState> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')
    if (state.hostPlayerId !== playerId) throw new Error('Only host can start')
    if (state.status !== 'lobby') throw new Error('Session already started')

    state.status = 'active'
    const startedAt = Date.now()
    state.timerStartedAt = startedAt

    // Initialize time config and canonical lore time (aligned to 06:00).
    state.timeConfig = { ...(state.timeConfig ?? DEFAULT_SURVIVAL_TIME_CONFIG) }
    state.worldTimeMs = DAY_START_MS
    state.worldDay = 1
    state.worldTimeMinutes = DAY_START_MINUTE
    state.phase = 'start'
    state.phaseStartedAt = startedAt

    // Store last real tick for delta-based advancement.
    lastRealTickAt.set(sessionId, startedAt)

    // Countdown to next day-start in real seconds
    state.timerSeconds = Math.ceil((state.timeConfig.realDayDurationMs ?? DEFAULT_SURVIVAL_TIME_CONFIG.realDayDurationMs) / 1000)
    monsterMinutesAccumulator.set(sessionId, 0)
    onDayStart(state)
    state.log.push(createLogEntry(null, null, 'СЕССИЯ НАЧАЛАСЬ! Таймер запущен.', 'system'))
    state.updatedAt = Date.now()

    // Start server-side timer tick (use helper function)
    startTickInterval(sessionId)

    // Persist immediately (critical event - session started)
    await persistSession(state, true)

    broadcastUpdate(sessionId, state)
    return state
}

/**
 * Timer tick - called every second while session is active
 */
function tickSession(sessionId: string) {
    const state = sessions.get(sessionId)
    if (!state || state.status !== 'active') {
        // Clear interval if session ended
        const interval = timerIntervals.get(sessionId)
        if (interval) {
            clearInterval(interval)
            timerIntervals.delete(sessionId)
        }
        lastRealTickAt.delete(sessionId)
        monsterMinutesAccumulator.delete(sessionId)
        staminaMinutesAccumulator.delete(sessionId)
        return
    }

    // Backward-compatible defaults (in case of older in-memory state)
    if (typeof state.worldDay !== 'number') state.worldDay = 1
    if (typeof state.worldTimeMinutes !== 'number') state.worldTimeMinutes = DAY_START_MINUTE
    if (typeof (state as any).worldTimeMs !== 'number') (state as any).worldTimeMs = DAY_START_MS
    if (!state.timeConfig) state.timeConfig = { ...DEFAULT_SURVIVAL_TIME_CONFIG }
    if (!state.phase) state.phase = getCyclePhase(state.worldTimeMinutes)
    if (!state.phaseStartedAt) state.phaseStartedAt = Date.now()
    ensureZonesInitialized(state)

    let shouldBroadcast = false
    const prevPhase = state.phase

    const nowRealMs = Date.now()

    // Advance canonical lore time using real delta + timeScale
    const { minutesAdvanced, dayIndexChanged } = advanceWorldTimeMs(sessionId, state, nowRealMs)

    // Update countdown: real seconds until next 06:00 day-start
    const nextDayStartWorldMs = getNextDayStartWorldTimeMs(state.worldTimeMs)
    state.timerSeconds = computeRealSecondsUntil(nextDayStartWorldMs, state.worldTimeMs, state.timeConfig.timeScale)

    // Handle phase transitions based on new time-of-day
    const nextPhase = getCyclePhase(state.worldTimeMinutes)
    if (nextPhase !== prevPhase) {
        state.phase = nextPhase
        state.phaseStartedAt = nowRealMs
        onPhaseChanged(state, prevPhase, nextPhase)
        shouldBroadcast = true
    } else if (dayIndexChanged && nextPhase === 'start') {
        // Safety: if time jumps but phase didn't change, still trigger day-start.
        onDayStart(state)
        shouldBroadcast = true
    }

    // Process completion of exclusive zone actions (scavenge, etc.)
    if (processZoneActions(state)) {
        shouldBroadcast = true
    }

    // Stamina regeneration (bunker + consumables)
    if (processStaminaRegen(state, sessionId, minutesAdvanced)) {
        shouldBroadcast = true
    }

    // Process player arrivals (hex movement)
    if (processPlayerArrivals(state)) {
        shouldBroadcast = true
    }
    // Phase 3: monsters move (tracked in minutes to avoid relying on exact modulo hits)
    if (state.phase === 'monsters') {
        const prevMonsterMinutes = monsterMinutesAccumulator.get(sessionId) ?? 0
        const accumulated = prevMonsterMinutes + minutesAdvanced

        if (accumulated >= MONSTER_TICK_INTERVAL_MINUTES) {
            const ticks = Math.floor(accumulated / MONSTER_TICK_INTERVAL_MINUTES)
            for (let i = 0; i < ticks; i += 1) {
                if (tickMonsters(state)) shouldBroadcast = true
            }
            monsterMinutesAccumulator.set(sessionId, accumulated % MONSTER_TICK_INTERVAL_MINUTES)
        } else {
            monsterMinutesAccumulator.set(sessionId, accumulated)
        }
    } else {
        monsterMinutesAccumulator.set(sessionId, 0)
    }

    state.updatedAt = Date.now()

    if (shouldBroadcast) {
        broadcastUpdate(sessionId, state)
    }

    // Broadcast timer sync periodically (every 5 seconds to reduce traffic)
    if (state.timerSeconds % 5 === 0) {
        eventBus.emit('survival_timer', {
            sessionId,
            timerSeconds: state.timerSeconds,
            worldDay: state.worldDay,
            worldTimeMinutes: state.worldTimeMinutes,
            phase: state.phase,
        })
    }

    // Throttled persist (every 5 seconds, not forced)
    persistSession(state, false).catch(err => {
        console.error(`[SurvivalService] Tick persist error for ${sessionId}:`, err)
    })
}

/**
 * Trigger a crisis event when timer reaches zero
 */
function triggerCrisisEvent(sessionId: string) {
    const state = sessions.get(sessionId)
    if (!state) return

    // Consume resources during crisis
    state.resources.food = Math.max(0, state.resources.food - 2)
    state.resources.morale = Math.max(0, state.resources.morale - 20)

    // If defense is low, things get worse
    if (state.resources.defense < 3) {
        state.resources.food = Math.max(0, state.resources.food - 3)
        state.log.push(createLogEntry(null, null, 'Слабая защита! Потеряно больше ресурсов!', 'crisis'))
    }

    broadcastUpdate(sessionId, state)
}

// ============================================================================
// ZONE & EVENT HANDLING
// ============================================================================

/**
 * Enter a zone (via QR scan)
 */
export async function enterZone(
    sessionId: string,
    playerId: number,
    zoneId: ZoneType
): Promise<{ event: SurvivalEvent | null; zoneInfo?: { threatLevel: string; lootQuality: string } }> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')
    if (state.status !== 'active') throw new Error('Session not active')

    const player = state.players[playerId]
    if (!player) throw new Error('Player not in session')

    // Update zone visits
    state.zoneVisits[zoneId] = (state.zoneVisits[zoneId] || 0) + 1
    player.currentZone = zoneId

    // Ensure zone interactions exist; entering a zone may expose available interactions immediately.
    ensureZonesInitialized(state)
    const scavengeState = state.zones?.[zoneId]?.actions.scavenge
    if (scavengeState && scavengeState.chargesRemaining > 0) {
        state.log.push(createLogEntry(playerId, player.playerName, `В ${getZoneNameRu(zoneId)} доступно: ОБЫСК (${scavengeState.chargesRemaining}x)`, 'system'))
    }

    // Scout preview for zone info
    let zoneInfo: { threatLevel: string; lootQuality: string } | undefined
    if (player.role === 'scout') {
        const visits = state.zoneVisits[zoneId]
        zoneInfo = {
            threatLevel: visits >= 3 ? 'high' : visits >= 2 ? 'medium' : 'low',
            lootQuality: visits >= 3 ? 'poor' : visits >= 2 ? 'normal' : 'rich',
        }
    }

    // Roll for event
    const event = rollRandomEvent(zoneId, state.flags, state.zoneVisits[zoneId])

    if (event) {
        player.activeEventId = event.id
        player.activeEvent = event // Store full event for persistence
        state.log.push(createLogEntry(playerId, player.playerName, `вошёл в ${zoneId}`, 'action'))
    } else {
        state.log.push(createLogEntry(playerId, player.playerName, `обыскал ${zoneId}, но ничего не нашёл`, 'action'))
    }

    state.updatedAt = Date.now()
    broadcastUpdate(sessionId, state)

    return { event, zoneInfo }
}

/**
 * Start an exclusive zone action (e.g. Scavenge) with server lock + ETA.
 */
export async function startZoneAction(
    sessionId: string,
    playerId: number,
    zoneId: ZoneType,
    actionId: ZoneActionId
): Promise<{ success: boolean; message: string; state: SurvivalState }> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')
    if (state.status !== 'active') throw new Error('Session not active')

    const player = state.players[playerId]
    if (!player) throw new Error('Player not in session')
    if (player.currentZone !== zoneId) throw new Error('Player not in the requested zone')
    if (player.activeEventId) throw new Error('Player is busy with an event')
    if (player.activeZoneActionId) throw new Error('Player is already performing an action')

    ensureZonesInitialized(state)
    const zone = state.zones![zoneId]
    const action = zone.actions[actionId]

    // Validate charges
    if (action.chargesRemaining <= 0) {
        return { success: false, message: 'Действие недоступно: лимит исчерпан', state }
    }

    // Validate & acquire lock (lease)
    const nowWorld = state.worldTimeMs
    const leaseMs = 10 * 60 * 1000 // 10 lore minutes
    const lockExpired = action.lock.lockExpiresAtWorldTimeMs !== null && action.lock.lockExpiresAtWorldTimeMs <= nowWorld

    if (action.lock.lockedByPlayerId !== null && !lockExpired && action.lock.lockedByPlayerId !== playerId) {
        return { success: false, message: 'Действие занято другим игроком', state }
    }

    // If there was a stale lock/progress, clear it
    if (lockExpired) {
        action.lock.lockedByPlayerId = null
        action.lock.lockExpiresAtWorldTimeMs = null
        action.inProgress = null
    }

    if (action.inProgress) {
        return { success: false, message: 'Действие уже выполняется', state }
    }

    action.lock.lockedByPlayerId = playerId
    action.lock.lockExpiresAtWorldTimeMs = nowWorld + leaseMs

    // Reserve charge and schedule completion
    action.chargesRemaining -= 1
    const durationMs = actionId === 'scavenge' ? 60 * 60 * 1000 : 30 * 60 * 1000 // 60 lore minutes default
    action.inProgress = {
        actionId,
        startedByPlayerId: playerId,
        completesAtWorldTimeMs: nowWorld + durationMs,
    }

    player.activeZoneActionId = actionId
    state.log.push(createLogEntry(playerId, player.playerName, `Начал ОБЫСК в ${getZoneNameRu(zoneId)} (ETA: ${Math.round(durationMs / 60000)} мин)`, 'action'))

    state.updatedAt = Date.now()

    // Persist immediately (critical event - zone action started)
    await persistSession(state, true)

    broadcastUpdate(sessionId, state)

    return { success: true, message: 'Действие начато', state }
}

/**
 * Get the active event for a player (from session state, not in-memory Map)
 */
export function getActiveEvent(sessionId: string, playerId: number): SurvivalEvent | undefined {
    const state = sessions.get(sessionId)
    if (!state) return undefined
    const player = state.players[playerId]
    return player?.activeEvent ?? undefined
}

/**
 * Resolve an event option
 */
export async function resolveOption(
    sessionId: string,
    playerId: number,
    eventId: string,
    optionId: string
): Promise<{ success: boolean; effect: EventEffect; message: string }> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')

    const player = state.players[playerId]
    if (!player) throw new Error('Player not in session')

    const event = player.activeEvent
    if (!event || event.id !== eventId) throw new Error('Event not active')

    const option = event.options.find(o => o.id === optionId)
    if (!option) throw new Error('Invalid option')

    // Validate role requirement
    if (option.requiredRole && player.role !== option.requiredRole) {
        throw new Error(`Requires ${option.requiredRole} role`)
    }

    // Validate item requirement
    if (option.requiredItem) {
        const hasItem = player.inventory.items.some(i => i.templateId === option.requiredItem)
        if (!hasItem) throw new Error(`Requires ${option.requiredItem}`)
    }

    // Apply cost
    if (option.cost) {
        for (const [resource, amount] of Object.entries(option.cost)) {
            if (amount && state.resources[resource as keyof BaseResources] < amount) {
                throw new Error(`Not enough ${resource}`)
            }
        }
        for (const [resource, amount] of Object.entries(option.cost)) {
            if (amount) {
                state.resources[resource as keyof BaseResources] -= amount
            }
        }
    }

    // Determine success if chance-based
    let effectToApply = option.effect
    let success = true

    if (option.effect.successChance !== undefined) {
        const roll = Math.random() * 100
        success = roll <= option.effect.successChance

        if (!success && option.effect.failureEffect) {
            effectToApply = option.effect.failureEffect
        }
    }

    // Apply effect
    applyEffect(state, player, effectToApply)

    // Log the action
    const logMessage = effectToApply.logMessage || `выбрал "${option.text}"`
    state.log.push(createLogEntry(playerId, player.playerName, logMessage, 'action'))

    // Follow-up event chain (optional)
    const followUp = effectToApply.triggerEventId
        ? getNextEventFromTrigger(state, player, effectToApply.triggerEventId)
        : null

    if (followUp) {
        player.activeEventId = followUp.id
        player.activeEvent = followUp
        // Keep currentZone as-is (hex events use currentZone=null anyway)
    } else {
        // Clear active event
        player.activeEventId = null
        player.activeEvent = null // Clear persisted event
        player.currentZone = null
    }

    // #region agent log

    // #endregion

    state.updatedAt = Date.now()

    // Persist immediately (critical event - option resolved)
    await persistSession(state, true)

    broadcastUpdate(sessionId, state)

    return {
        success,
        effect: effectToApply,
        message: effectToApply.logMessage || (success ? 'Успех!' : 'Неудача...'),
    }
}

function getNextEventFromTrigger(state: SurvivalState, player: SurvivalPlayer, triggerEventId: string): SurvivalEvent | null {
    // Special dynamic chain for hex encounters
    if (triggerEventId === '__HEX_ENCOUNTER__') {
        const hex = player.activeEvent?.hex
        if (!hex) return null
        const { hexSeed, hexRadius } = getHexMapConfigFromFlags(state.flags)
        const cell = getHexCell(hexRadius, hexSeed, hex)
        if (!cell) return null
        return generateHexEncounterFollowUp(state, cell)
    }

    // Static events from registry
    const ev = getEventById(triggerEventId)
    return ev ?? null
}

/**
 * Apply an event effect to state and player
 */
function applyEffect(state: SurvivalState, player: SurvivalPlayer, effect: EventEffect) {
    if (effect.resourceDelta) {
        for (const [res, amount] of Object.entries(effect.resourceDelta)) {
            if (amount && state.resources[res as keyof BaseResources] !== undefined) {
                state.resources[res as keyof BaseResources] += amount
            }
        }
    }
    if (effect.grantItems) {
        for (const item of effect.grantItems) {
            const existing = player.inventory.items.find(i => i.templateId === item.templateId)
            if (existing) existing.quantity += item.quantity
            else player.inventory.items.push({ templateId: item.templateId, quantity: item.quantity })
        }
    }
    if (effect.woundPlayer) {
        player.isWounded = true
        state.resources.morale = Math.max(0, state.resources.morale - 10)
    }
    if (effect.setFlags) {
        for (const [k, v] of Object.entries(effect.setFlags)) {
            if (v === null) {
                delete (state.flags as any)[k]
            } else {
                state.flags[k] = v
            }
        }
    }

    // Combat Transition (DEFERRED)
    if (effect.battleScenarioId) {
        syncCombatResources(player)
        player.pendingBattle = {
            scenarioId: effect.battleScenarioId,
            successEffect: {
                ...effect,
                battleScenarioId: undefined, // Avoid recursion
                failureEffect: undefined
            },
            failureEffect: effect.failureEffect
        }
    }

    // VN Transition (DEFERRED)
    if (effect.vnSceneId) {
        player.pendingVN = { sceneId: effect.vnSceneId }
    }

    // Recruit NPC
    if (effect.recruitNpc) {
        state.npcs.push({
            ...effect.recruitNpc,
            recruitedAt: Date.now(),
        })
    }
}

/**
 * Helper to ensure player has initial combat resources based on survival stats
 */
export function syncCombatResources(player: SurvivalPlayer) {
    const maxHp = 100
    const currentHp = player.isWounded ? 60 : 100
    const stamina = player.stamina || 100
    const maxAp = 3
    const currentAp = Math.max(1, Math.min(3, Math.floor(stamina / 33)))

    player.combatResources = {
        hp: currentHp,
        maxHp: maxHp,
        ap: currentAp,
        maxAp: maxAp,
        mp: 50,
        maxMp: 50,
        wp: 40,
        maxWp: 40,
    }
}

/**
 * Complete a pending battle and apply results
 */
export async function completeBattle(
    sessionId: string,
    playerId: number,
    result: 'victory' | 'defeat' | 'flee',
    finalCombatHp?: number
): Promise<{ success: boolean; message: string; state: SurvivalState }> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')

    const player = state.players[playerId]
    if (!player) throw new Error('Player not in session')

    const pending = player.pendingBattle
    if (!pending) {
        return { success: false, message: 'No battle pending', state }
    }

    // Clear pending state
    player.pendingBattle = null

    // Apply outcome effects
    if (result === 'victory') {
        applyEffect(state, player, pending.successEffect)
        state.log.push(createLogEntry(playerId, player.playerName, `одержал победу в бою (${pending.scenarioId})`, 'combat'))
    } else {
        const failEffect = pending.failureEffect || { woundPlayer: true }
        applyEffect(state, player, failEffect)
        state.log.push(createLogEntry(playerId, player.playerName, `отступил или проиграл в бою (${pending.scenarioId})`, 'combat'))
    }

    // Update survival health based on final combat HP
    if (typeof finalCombatHp === 'number') {
        if (finalCombatHp <= 0) {
            player.isWounded = true
            state.resources.morale = Math.max(0, state.resources.morale - 20)
        } else if (finalCombatHp < 40) {
            player.isWounded = true
        }
    }

    state.updatedAt = Date.now()
    await persistSession(state, true)
    broadcastUpdate(sessionId, state)

    return { success: true, message: 'Battle result applied', state }
}

/**
 * Clear any pending transition flags (after navigation started)
 */
export async function consumeTransition(
    sessionId: string,
    playerId: number
): Promise<{ success: boolean; state: SurvivalState }> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')

    const player = state.players[playerId]
    if (!player) throw new Error('Player not in session')

    player.pendingVN = null
    // pendingBattle is cleared in completeBattle, but let's be safe if needed
    // player.pendingBattle = null 

    state.updatedAt = Date.now()
    await persistSession(state, false) // No need for heavy log if just flag clear
    broadcastUpdate(sessionId, state)

    return { success: true, state }
}

// ============================================================================
// INVENTORY & TRANSFER
// ============================================================================

/**
 * Transfer items from player inventory to base resources
 */
export async function transferToBase(
    sessionId: string,
    playerId: number,
    items: Array<{ templateId: string; quantity: number }>
): Promise<SurvivalState> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')

    const player = state.players[playerId]
    if (!player) throw new Error('Player not in session')

    for (const transfer of items) {
        const inventoryItem = player.inventory.items.find(i => i.templateId === transfer.templateId)
        if (!inventoryItem || inventoryItem.quantity < transfer.quantity) {
            throw new Error(`Not enough ${transfer.templateId}`)
        }

        // Remove from player inventory
        inventoryItem.quantity -= transfer.quantity
        if (inventoryItem.quantity <= 0) {
            player.inventory.items = player.inventory.items.filter(i => i.templateId !== transfer.templateId)
        }

        // Add to base resources (map common items to resources)
        const resourceMapping: Record<string, keyof BaseResources> = {
            food: 'food',
            canned_food: 'food',
            rat_meat: 'food',
            fuel: 'fuel',
            chemical_canister: 'fuel',
            medicine: 'medicine',
            bandage: 'medicine',
        }

        const resourceKey = resourceMapping[transfer.templateId]
        if (resourceKey) {
            state.resources[resourceKey] += transfer.quantity
        }

        state.log.push(createLogEntry(playerId, player.playerName, `сдал ${transfer.quantity}x ${transfer.templateId} на склад`, 'action'))
    }

    state.updatedAt = Date.now()
    // Persist immediately (critical event - items transferred)
    await persistSession(state, true)

    broadcastUpdate(sessionId, state)
    return state
}

// ============================================================================
// MAP MOVEMENT (SERVER-AUTHORITATIVE)
// ============================================================================

const DEFAULT_STAMINA = 100
const MOVEMENT_MS_PER_HEX = 30 * 60 * 1000 // 30 lore minutes per hex

function findPathBfs(
    map: Map<string, HexCell>,
    start: { q: number; r: number },
    end: { q: number; r: number }
): Array<{ q: number; r: number }> {
    const startKey = serverHexToString(start)
    const endKey = serverHexToString(end)
    if (!map.has(startKey) || !map.has(endKey)) return []
    if (startKey === endKey) return [start]

    const queue: Array<{ q: number; r: number }> = [start]
    const cameFrom = new Map<string, string | null>()
    cameFrom.set(startKey, null)

    const neighbors = (h: { q: number; r: number }) => ([
        { q: h.q + 1, r: h.r },
        { q: h.q + 1, r: h.r - 1 },
        { q: h.q, r: h.r - 1 },
        { q: h.q - 1, r: h.r },
        { q: h.q - 1, r: h.r + 1 },
        { q: h.q, r: h.r + 1 },
    ])

    while (queue.length > 0) {
        const current = queue.shift()!
        const currentKey = serverHexToString(current)
        if (currentKey === endKey) break

        for (const nxt of neighbors(current)) {
            const k = serverHexToString(nxt)
            if (cameFrom.has(k)) continue
            const cell = map.get(k)
            if (!cell) continue
            if (cell.isObstacle) continue
            cameFrom.set(k, currentKey)
            queue.push(nxt)
        }
    }

    if (!cameFrom.has(endKey)) return []

    const path: Array<{ q: number; r: number }> = []
    let cur: string | null = endKey
    while (cur) {
        const [qStr, rStr] = cur.split(',')
        path.push({ q: Number(qStr), r: Number(rStr) })
        cur = cameFrom.get(cur) ?? null
    }
    path.reverse()
    return path
}

/**
 * Move player to target hex (server-authoritative)
 */
export async function movePlayer(
    sessionId: string,
    playerId: number,
    targetHex: { q: number; r: number }
): Promise<{ success: boolean; message: string; arriveAtWorldTimeMs?: number }> {
    const state = sessions.get(sessionId)
    if (!state) throw new Error('Session not found')
    if (state.status !== 'active') throw new Error('Session not active')

    const player = state.players[playerId]
    if (!player) throw new Error('Player not in session')

    // Initialize defaults if missing
    ensurePlayerStamina(player)
    ensurePlayerHexPos(player)
    const stamina = player.stamina ?? DEFAULT_STAMINA

    // #region agent log

    // #endregion

    // Can't move while already moving
    if (player.movementState) {
        return { success: false, message: 'Already moving' }
    }

    // Can't move while in active event
    if (player.activeEventId) {
        return { success: false, message: 'Resolve current event first' }
    }

    const currentPos = player.hexPos ?? { q: 0, r: 0 }
    if (currentPos.q === targetHex.q && currentPos.r === targetHex.r) {
        return { success: false, message: 'Already at destination' }
    }

    const { hexSeed, hexRadius, regionId } = getHexMapConfigFromFlags(state.flags)
    const mapCells = generateMap(hexRadius, hexSeed, { region: regionId })
    const map = new Map<string, HexCell>(mapCells.map(c => [serverHexToString(c), c]))
    const path = findPathBfs(map, currentPos, targetHex)
    if (path.length < 2) {
        return { success: false, message: 'No valid path to destination' }
    }
    const distance = Math.max(0, path.length - 1)

    // Check stamina
    const staminaCost = distance * STAMINA_COST_PER_HEX
    if (stamina < staminaCost) {
        return { success: false, message: `Insufficient stamina (need ${staminaCost}, have ${stamina})` }
    }

    // Calculate ETA
    const travelTimeMs = distance * MOVEMENT_MS_PER_HEX
    const arriveAtWorldTimeMs = state.worldTimeMs + travelTimeMs

    // Deduct stamina and set movement state
    player.stamina = stamina - staminaCost
    player.movementState = {
        path,
        startedAtWorldTimeMs: state.worldTimeMs,
        msPerHex: MOVEMENT_MS_PER_HEX,
        arriveAtWorldTimeMs,
    }

    state.log.push(createLogEntry(
        playerId,
        player.playerName,
        `начал движение к (${targetHex.q}, ${targetHex.r}) — ETA: ${Math.round(travelTimeMs / 60000)} мин`,
        'action'
    ))
    state.updatedAt = Date.now()

    // Persist immediately (critical event - movement started)
    await persistSession(state, true)

    broadcastUpdate(sessionId, state)

    return { success: true, message: 'Movement started', arriveAtWorldTimeMs }
}

/**
 * Hex distance utility (imported from shared types)
 */
function hexDistance(a: { q: number; r: number }, b: { q: number; r: number }): number {
    const dq = Math.abs(a.q - b.q)
    const dr = Math.abs(a.r - b.r)
    const ds = Math.abs((a.q + a.r) - (b.q + b.r))
    return Math.max(dq, dr, ds)
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

export const survivalService = {
    initSurvivalService,
    createSession,
    getSession,
    joinSession,
    selectRole,
    startSession,
    enterZone,
    startZoneAction,
    getActiveEvent,
    resolveOption,
    completeBattle,
    consumeTransition,
    transferToBase,
    movePlayer,
}
