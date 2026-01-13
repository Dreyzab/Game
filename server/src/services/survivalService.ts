/**
 * Survival Service - Game Engine
 * Manages survival sessions, player state, events, and real-time updates
 */

import { eventBus } from '../lib/bus'
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
    type PlayerInventory,
    DEFAULT_BASE_RESOURCES,
    PLAYER_ROLES,
} from '../shared/types/survival'
import { getEventById, rollRandomEvent } from '../lib/survivalEvents'

// ============================================================================
// IN-MEMORY SESSION STORAGE
// ============================================================================

/** Active sessions indexed by sessionId */
const sessions = new Map<string, SurvivalState>()

/** Active events per player (playerId -> event) */
const activeEvents = new Map<number, SurvivalEvent>()

/** Timer intervals per session */
const timerIntervals = new Map<string, NodeJS.Timeout>()

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
export async function createSession(hostPlayerId: number, hostName: string = 'Host'): Promise<SurvivalState> {
    const sessionId = generateSessionId()
    const now = Date.now()

    const hostPlayer: SurvivalPlayer = {
        playerId: hostPlayerId,
        playerName: hostName,
        role: null,
        inventory: { items: [] },
        isWounded: false,
        currentZone: null,
        activeEventId: null,
        joinedAt: now,
    }

    const state: SurvivalState = {
        sessionId,
        hostPlayerId,
        status: 'lobby',
        timerSeconds: 600, // 10 minutes default
        timerStartedAt: null,
        crisisLevel: 'calm',
        crisisEventId: null,
        resources: { ...DEFAULT_BASE_RESOURCES },
        npcs: [],
        players: { [hostPlayerId]: hostPlayer },
        log: [createLogEntry(null, null, 'Сессия создана', 'system')],
        flags: {},
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
    return state
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): SurvivalState | undefined {
    return sessions.get(sessionId)
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
    }

    // If enforcer, grant starting pistol
    if (role === 'enforcer') {
        player.inventory.items.push({ templateId: 'pistol', quantity: 1 })
    }

    state.players[playerId] = player
    state.log.push(createLogEntry(playerId, playerName, `присоединился к сессии`, 'system'))
    state.updatedAt = Date.now()

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
    state.timerStartedAt = Date.now()
    state.log.push(createLogEntry(null, null, 'СЕССИЯ НАЧАЛАСЬ! Таймер запущен.', 'system'))
    state.updatedAt = Date.now()

    // Start server-side timer tick
    const interval = setInterval(() => {
        tickSession(sessionId)
    }, 1000)
    timerIntervals.set(sessionId, interval)

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
        return
    }

    state.timerSeconds = Math.max(0, state.timerSeconds - 1)
    state.updatedAt = Date.now()

    // Check for crisis thresholds
    if (state.timerSeconds <= 0 && state.crisisLevel !== 'crisis') {
        state.crisisLevel = 'crisis'
        state.log.push(createLogEntry(null, null, '⚠️ КРИЗИС! Время вышло!', 'crisis'))
        triggerCrisisEvent(sessionId)
    } else if (state.timerSeconds <= 120 && state.crisisLevel === 'calm') {
        state.crisisLevel = 'warning'
        state.log.push(createLogEntry(null, null, '⚡ ВНИМАНИЕ! Осталось 2 минуты!', 'system'))
    }

    // Broadcast timer sync periodically (every 5 seconds to reduce traffic)
    if (state.timerSeconds % 5 === 0) {
        eventBus.emit('survival_timer', { sessionId, timerSeconds: state.timerSeconds })
    }
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
        activeEvents.set(playerId, event)
        state.log.push(createLogEntry(playerId, player.playerName, `вошёл в ${zoneId}`, 'action'))
    } else {
        state.log.push(createLogEntry(playerId, player.playerName, `обыскал ${zoneId}, но ничего не нашёл`, 'action'))
    }

    state.updatedAt = Date.now()
    broadcastUpdate(sessionId, state)

    return { event, zoneInfo }
}

/**
 * Get the active event for a player
 */
export function getActiveEvent(playerId: number): SurvivalEvent | undefined {
    return activeEvents.get(playerId)
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

    const event = activeEvents.get(playerId)
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

    // Clear active event
    player.activeEventId = null
    player.currentZone = null
    activeEvents.delete(playerId)

    state.updatedAt = Date.now()
    broadcastUpdate(sessionId, state)

    return {
        success,
        effect: effectToApply,
        message: effectToApply.logMessage || (success ? 'Успех!' : 'Неудача...'),
    }
}

/**
 * Apply an event effect to state and player
 */
function applyEffect(state: SurvivalState, player: SurvivalPlayer, effect: EventEffect) {
    // Resource changes
    if (effect.resourceDelta) {
        for (const [resource, delta] of Object.entries(effect.resourceDelta)) {
            if (delta) {
                const key = resource as keyof BaseResources
                state.resources[key] = Math.max(0, (state.resources[key] || 0) + delta)
            }
        }
    }

    // Grant items to player inventory
    if (effect.grantItems) {
        for (const item of effect.grantItems) {
            const existing = player.inventory.items.find(i => i.templateId === item.templateId)
            if (existing) {
                existing.quantity += item.quantity
            } else {
                player.inventory.items.push({ ...item })
            }
        }
    }

    // Wound player
    if (effect.woundPlayer) {
        player.isWounded = true
        state.resources.morale = Math.max(0, state.resources.morale - 10)
    }

    // Recruit NPC
    if (effect.recruitNpc) {
        state.npcs.push({
            ...effect.recruitNpc,
            recruitedAt: Date.now(),
        })
    }
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
    broadcastUpdate(sessionId, state)
    return state
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

export const survivalService = {
    createSession,
    getSession,
    joinSession,
    selectRole,
    startSession,
    enterZone,
    getActiveEvent,
    resolveOption,
    transferToBase,
}
