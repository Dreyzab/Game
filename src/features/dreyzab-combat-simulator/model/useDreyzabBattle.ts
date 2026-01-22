
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import type { Achievement, BattleSession, Combatant, CombatCard } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side, CardType } from '@/entities/dreyzab-combat-simulator/model/types'
import { generateDeckForCombatant } from '@/entities/dreyzab-combat-simulator/model/cardGenerator'
import { SCENARIOS, type ScenarioId } from '@/entities/dreyzab-combat-simulator/model/scenarios'
import { sortTurnQueue, canPlayCard, rollAttack } from '@/entities/dreyzab-combat-simulator/model/utils'
import type { FloatingTextEvent } from '../ui/components/FloatingText'

// --- Types ---

export type DreyzabBattleResult = 'victory' | 'defeat'

export type CardPlayTarget =
    | { type: 'enemy'; enemyId: string }
    | { type: 'player-rank'; rank: number }

type CombatEvent = FloatingTextEvent & { unitId: string }
export type VoiceEvent = { id: string; text: string; source?: string; duration?: number }

// --- Constants ---

const MAX_RANK = 4
const END_TURN_STAMINA_RECOVERY = 10
const ACHIEVEMENTS_STORAGE_KEY = 'dreyzab_achievements'

const INITIAL_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_win',
        title: 'First Drop',
        description: 'Complete your first successful mission.',
        icon: 'ÐYZî',
        unlocked: false,
    },
    {
        id: 'no_damage',
        title: 'Untouchable',
        description: 'Win a battle without taking any damage.',
        icon: 'ÐY>­‹÷?',
        unlocked: false,
    },
    {
        id: 'tactical_genius',
        title: 'Tactical Genius',
        description: 'Perform 3 attacks in a single turn.',
        icon: 'ÐYõÿ',
        unlocked: false,
    },
    {
        id: 'survivor',
        title: 'Last Breath',
        description: 'Win a battle with less than 10% HP remaining.',
        icon: 'ÐY¸÷',
        unlocked: false,
    },
    {
        id: 'scorpion_slayer',
        title: 'Scorpion Slayer',
        description: 'Neutralize a Rail Scorpion.',
        icon: "ÐYÝ'",
        unlocked: false,
    },
]

// --- Helpers ---

const fillEmptyRanks = (units: Combatant[]): Combatant[] => {
    const living = [...units]
        .filter((unit) => !unit.isDead)
        .sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id))

    const nextRankById = new Map<string, number>()
    living.forEach((unit, index) => {
        nextRankById.set(unit.id, Math.min(MAX_RANK, index + 1))
    })

    return units.map((unit) => {
        if (unit.isDead) return unit
        const nextRank = nextRankById.get(unit.id)
        if (!nextRank || nextRank === unit.rank) return unit
        return { ...unit, rank: nextRank }
    })
}

const readAchievements = (): Achievement[] => {
    const saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)
    if (!saved) return INITIAL_ACHIEVEMENTS
    try {
        const parsed = JSON.parse(saved) as unknown
        if (!Array.isArray(parsed)) return INITIAL_ACHIEVEMENTS
        return parsed as Achievement[]
    } catch {
        return INITIAL_ACHIEVEMENTS
    }
}

const writeAchievements = (value: Achievement[]) => {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(value))
}

const createInitialSession = (params: {
    scenarioId: ScenarioId
    initialSession?: BattleSession
}): { session: BattleSession; defaultTargetId: string | null } => {
    const session = params.initialSession ?? (SCENARIOS[params.scenarioId] ?? SCENARIOS['default'])()
    return {
        session,
        defaultTargetId: session.enemies[0]?.id ?? null,
    }
}

// --- Reducer Actions ---

type BattleAction =
    | { type: 'SET_SESSION'; session: BattleSession }
    | { type: 'ADVANCE_TURN' }
    | { type: 'ENEMY_ACTION'; enemyId: string; onLog: (msg: string) => void; onEvent: (unitId: string, text: string, type: 'damage' | 'heal' | 'miss' | 'debuff' | 'buff') => void }
    | { type: 'PLAY_CARD'; card: CombatCard; target?: CardPlayTarget; selectedTargetId?: string | null; onLog: (msg: string) => void; onEvent: (unitId: string, text: string, type: 'damage' | 'heal' | 'miss' | 'debuff' | 'buff') => void; onUnlockObj: (id: string) => void }
    | { type: 'SCRIPTED_EVENT_PROLOGUE_KILL'; onEvent: (unitId: string, text: string, type: 'damage') => void }

// --- Reducer Function ---

const battleReducer = (state: BattleSession, action: BattleAction): BattleSession => {
    switch (action.type) {
        case 'SET_SESSION':
            return action.session

        case 'ADVANCE_TURN': {
            if (state.phase === 'VICTORY' || state.phase === 'DEFEAT') return state

            const currentIdx = state.turnQueue.indexOf(state.activeUnitId ?? '')
            const currentUnit = [...state.players, ...state.enemies].find((u) => u.id === state.activeUnitId)

            let nextPlayers = [...state.players]
            let nextEnemies = [...state.enemies]

            const recoverStamina = (unit: Combatant) => {
                if (unit.isDead) return unit
                // Recover Stagger slightly each turn too?
                const nextStagger = Math.min(unit.resources.maxStagger, unit.resources.stagger + 5)
                return {
                    ...unit,
                    resources: {
                        ...unit.resources,
                        stamina: Math.min(unit.resources.maxStamina, unit.resources.stamina + END_TURN_STAMINA_RECOVERY),
                        stagger: nextStagger
                    },
                }
            }

            if (currentUnit?.side === Side.PLAYER) {
                const playerIndex = nextPlayers.findIndex((p) => p.id === currentUnit.id)
                if (playerIndex >= 0) {
                    const carryOver = currentUnit.resources.ap > 0 ? 1 : 0
                    const recoveredUnit = recoverStamina(currentUnit)
                    nextPlayers[playerIndex] = {
                        ...recoveredUnit,
                        bonusAp: carryOver,
                        resources: { ...recoveredUnit.resources, ap: 0 },
                    }
                }
            } else if (currentUnit?.side === Side.ENEMY) {
                const enemyIndex = nextEnemies.findIndex((e) => e.id === currentUnit.id)
                if (enemyIndex >= 0) {
                    nextEnemies[enemyIndex] = recoverStamina(currentUnit)
                }
            }

            let nextIdx = (currentIdx + 1) % state.turnQueue.length
            const isNewRound = nextIdx === 0

            if (isNewRound) {
                nextPlayers = nextPlayers.map((p) => ({
                    ...p,
                    resources: { ...p.resources, ap: p.resources.maxAp + p.bonusAp },
                    bonusAp: 0,
                }))
                nextEnemies = nextEnemies.map((e) => ({
                    ...e,
                    resources: { ...e.resources, ap: e.resources.maxAp },
                }))

                const newQueue = sortTurnQueue(nextPlayers, nextEnemies)
                const nextId = newQueue[0] ?? null
                const nextUnit = [...nextPlayers, ...nextEnemies].find((u) => u.id === nextId)

                return {
                    ...state,
                    players: nextPlayers,
                    enemies: nextEnemies,
                    activeUnitId: nextId,
                    turnQueue: newQueue,
                    phase: nextUnit?.side === Side.PLAYER ? 'PLAYER_TURN' : 'ENEMY_TURN',
                    turnCount: state.turnCount + 1,
                    stats: { ...state.stats, attacksInOneTurn: 0 },
                }
            }

            let safetyCounter = 0
            while (safetyCounter < state.turnQueue.length) {
                const nextIdCandidate = state.turnQueue[nextIdx]
                const unit = [...nextPlayers, ...nextEnemies].find((u) => u.id === nextIdCandidate)
                if (unit && !unit.isDead) break
                nextIdx = (nextIdx + 1) % state.turnQueue.length
                safetyCounter++
            }

            const nextId = state.turnQueue[nextIdx] ?? null
            const nextUnit = [...nextPlayers, ...nextEnemies].find((u) => u.id === nextId)

            return {
                ...state,
                players: nextPlayers,
                enemies: nextEnemies,
                activeUnitId: nextId,
                phase: nextUnit?.side === Side.PLAYER ? 'PLAYER_TURN' : 'ENEMY_TURN',
                stats: { ...state.stats, attacksInOneTurn: 0 },
            }
        }

        case 'ENEMY_ACTION': {
            const { enemyId, onEvent } = action
            if (state.phase !== 'ENEMY_TURN') return state

            const enemyIndex = state.enemies.findIndex((e) => e.id === enemyId)
            if (enemyIndex < 0) return state

            const enemy = state.enemies[enemyIndex]
            if (enemy.isDead) return state

            const players = state.players.map((p) => ({ ...p }))
            const enemies = state.enemies.map((e) => ({ ...e }))
            const nextLogs = [...state.logs]

            const alivePlayers = players.filter((p) => !p.isDead)
            if (alivePlayers.length === 0) return state

            const distanceTo = (player: Combatant) => enemy.rank + player.rank - 1
            const sortedTargets = [...alivePlayers].sort((a, b) => distanceTo(a) - distanceTo(b))
            const target = sortedTargets[0]

            const enemyName = enemy.name.toLowerCase()
            const isSmallScorpion = enemyName.includes('мал') && enemyName.includes('скор')
            const isMediumScorpion = enemyName.includes('сред') && enemyName.includes('скор')
            const isExecutioner = enemyName.includes('executioner') || enemyName.includes('экзекутор') || enemyName.includes('палач')

            const applyDamage = (
                playerId: string,
                opts: { accuracy: number; baseDamage: number; label: string; ignoreArmor?: boolean }
            ) => {
                const targetIndex = players.findIndex((p) => p.id === playerId)
                if (targetIndex < 0) return 0

                const defender = players[targetIndex]
                if (defender.isDead) return 0

                const attackResult = rollAttack(enemy, defender, opts.accuracy)
                if (!attackResult.hit) {
                    nextLogs.push(`${defender.name} dodges ${enemy.name}'s ${opts.label}! (${attackResult.dodgeChance}% dodge from ${defender.resources.ap} unused AP)`)
                    if (onEvent) onEvent(defender.id, 'DODGE!', 'miss')
                    return 0
                }

                const dmg = Math.max(1, opts.ignoreArmor ? opts.baseDamage : opts.baseDamage - defender.armor)
                const nextHp = Math.max(0, defender.resources.hp - dmg)
                players[targetIndex] = {
                    ...defender,
                    resources: { ...defender.resources, hp: nextHp },
                    isDead: nextHp <= 0,
                }
                nextLogs.push(`${enemy.name} uses ${opts.label}: ${dmg} DMG to ${defender.name}! (roll: ${attackResult.roll}/${attackResult.needed})`)
                if (onEvent) onEvent(defender.id, `-${dmg}`, 'damage')

                if (nextHp <= 0) nextLogs.push(`${defender.name} offline.`)
                return dmg
            }

            let damageDealt = 0
            const distance = distanceTo(target)

            if (isExecutioner) {
                if (distance <= 1) {
                    // Massive Melee
                    damageDealt += applyDamage(target.id, { accuracy: 80, baseDamage: 30, label: 'Executioner\'s Axe' })
                } else if (distance <= 2) {
                    // Reach Attack
                    damageDealt += applyDamage(target.id, { accuracy: 70, baseDamage: 20, label: 'Rusty Chain' })
                } else {
                    // Advance
                    enemies[enemyIndex] = { ...enemies[enemyIndex], rank: Math.max(1, enemy.rank - 1) }
                    nextLogs.push(`${enemy.name} charges forward!`)
                }
            } else if (isMediumScorpion && distance <= 3) {
                // ... existing scorpion logic ...
                const inRange = sortedTargets.filter((p) => distanceTo(p) <= 3).slice(0, 2)
                if (inRange.length >= 2) {
                    nextLogs.push(`${enemy.name} lashes out with its tail!`)
                    damageDealt += applyDamage(inRange[0].id, { accuracy: 70, baseDamage: 12, label: 'Tail Sting' })
                    damageDealt += applyDamage(inRange[1].id, { accuracy: 70, baseDamage: 12, label: 'Tail Sting' })
                } else if (distance <= 2) {
                    damageDealt += applyDamage(target.id, { accuracy: 75, baseDamage: 14, label: 'Claw Strike' })
                } else {
                    enemies[enemyIndex] = { ...enemies[enemyIndex], rank: Math.max(1, enemy.rank - 1) }
                    nextLogs.push(`${enemy.name} advances to rank ${enemies[enemyIndex].rank}.`)
                }
            } else if (isSmallScorpion && distance <= 2) {
                damageDealt += applyDamage(target.id, { accuracy: 75, baseDamage: 12, label: 'Claw Strike' })
            } else if (distance > 2) {
                enemies[enemyIndex] = { ...enemies[enemyIndex], rank: Math.max(1, enemy.rank - 1) }
                nextLogs.push(`${enemy.name} advances to rank ${enemies[enemyIndex].rank}.`)
            } else {
                damageDealt += applyDamage(target.id, {
                    accuracy: 70,
                    baseDamage: 10,
                    label: 'Strike',
                    ignoreArmor: enemy.name === 'Mutant Marauder',
                })
            }

            const nextPlayers = fillEmptyRanks(players)
            const nextEnemies = fillEmptyRanks(enemies)

            const allPlayersDead = nextPlayers.every((p) => p.isDead)

            return {
                ...state,
                players: nextPlayers,
                enemies: nextEnemies,
                logs: nextLogs,
                stats: { ...state.stats, damageTaken: state.stats.damageTaken + damageDealt },
                phase: allPlayersDead ? 'DEFEAT' : state.phase,
            }
        }

        case 'PLAY_CARD': {
            const { card, target, selectedTargetId, onEvent, onUnlockObj } = action
            if (state.phase !== 'PLAYER_TURN') return state

            const playerIndex = state.players.findIndex((p) => p.id === state.activeUnitId)
            if (playerIndex < 0) return state

            const players = state.players.map((p) => ({ ...p }))
            const enemies = state.enemies.map((e) => ({ ...e }))
            const nextLogs = [...state.logs]

            const actingPlayer = players[playerIndex]
            if (actingPlayer.resources.ap < card.apCost || actingPlayer.resources.stamina < card.staminaCost) return state

            const spendCosts = (unit: Combatant) => ({
                ...unit,
                resources: {
                    ...unit.resources,
                    ap: unit.resources.ap - card.apCost,
                    stamina: unit.resources.stamina - card.staminaCost,
                },
                ammo: unit.ammo - (card.ammoCost ?? 0)
            })

            let nextAttacksInTurn = state.stats.attacksInOneTurn

            if (card.type === CardType.ATTACK) {
                const enemyId = target?.type === 'enemy' ? target.enemyId : selectedTargetId
                const targetIndex = enemies.findIndex((e) => e.id === enemyId)
                const enemy = targetIndex >= 0 ? enemies[targetIndex] : null

                if (!enemy || enemy.isDead) {
                    nextLogs.push('No valid target.')
                    return { ...state, logs: nextLogs }
                }

                const dist = Math.abs(enemy.rank + actingPlayer.rank - 1)
                const inRange = card.optimalRange.length === 0 || card.optimalRange.includes(dist)

                if (!inRange) {
                    nextLogs.push(`${actingPlayer.name} cannot reach ${enemy.name} with ${card.name}.`)
                    return { ...state, logs: nextLogs }
                }

                const nextPlayer = spendCosts(actingPlayer)

                // AMMO CHECK: The "Click"
                if ((card.ammoCost ?? 0) > 0 && actingPlayer.ammo < (card.ammoCost ?? 0)) {
                    nextLogs.push(`${actingPlayer.name} pulls the trigger... CLICK! (No Ammo)`)
                    if (onEvent) onEvent(actingPlayer.id, 'CLICK!', 'debuff')

                    // Penalty: Spend AP but no effect
                    players[playerIndex] = {
                        ...actingPlayer,
                        resources: { ...actingPlayer.resources, ap: Math.max(0, actingPlayer.resources.ap - 1) }
                    }
                    return { ...state, players: [...players], logs: nextLogs }
                }

                players[playerIndex] = nextPlayer
                nextAttacksInTurn++

                // --- DAMAGE CALCULATION & APPLICATION ---
                const applyAttack = (targetEnemy: Combatant, isMainTarget: boolean) => {
                    const idx = enemies.findIndex(e => e.id === targetEnemy.id)
                    if (idx < 0 || enemies[idx].isDead) return

                    const attackResult = rollAttack(nextPlayer, targetEnemy, 75) // Base ACC

                    if (attackResult.hit) {
                        let damage = Math.floor(card.damage - targetEnemy.armor)
                        // Explosives/Grenades often ignore armor or have piercing? 
                        // For now standard armor reduction, but ensure min 1 damage
                        damage = Math.max(1, damage)

                        // Impact Logic
                        let nextStagger = targetEnemy.resources.stagger - card.impact
                        if (nextStagger <= 0) {
                            nextStagger = 0
                            nextLogs.push(`${targetEnemy.name} is STAGGERED!`)
                            if (onEvent) onEvent(targetEnemy.id, 'STAGGERED!', 'debuff')
                        }

                        const nextHp = Math.max(0, targetEnemy.resources.hp - damage)
                        enemies[idx] = {
                            ...targetEnemy,
                            resources: { ...targetEnemy.resources, hp: nextHp, stagger: nextStagger },
                            isDead: nextHp <= 0,
                        }

                        if (nextHp <= 0 && targetEnemy.name === 'Rail Scorpion') onUnlockObj('scorpion_slayer')

                        const logMsg = isMainTarget
                            ? `${nextPlayer.name} uses ${card.name}: ${damage} DMG to ${targetEnemy.name}!`
                            : `...Splash hits ${targetEnemy.name} for ${damage} DMG!`

                        nextLogs.push(logMsg)
                        if (onEvent) onEvent(targetEnemy.id, `-${damage}`, 'damage')
                    } else {
                        if (isMainTarget) {
                            nextLogs.push(`${targetEnemy.name} dodges ${nextPlayer.name}'s ${card.name}!`)
                            if (onEvent) onEvent(targetEnemy.id, 'DODGE!', 'miss')
                        }
                    }
                }

                // Check for AOE
                const isAoeRank = card.effects?.some((e: any) => e.type === 'aoe_rank')

                if (isAoeRank) {
                    // Hit all enemies in the same rank
                    const enemiesInRank = enemies.filter(e => !e.isDead && e.rank === enemy.rank)
                    nextLogs.push(`${card.name} explodes at Rank ${enemy.rank}!`)
                    enemiesInRank.forEach(e => applyAttack(e, e.id === enemy.id))
                } else {
                    // Single Target
                    applyAttack(enemy, true)
                }

            } else if (card.type === CardType.MOVEMENT) {
                const desiredRank = target?.type === 'player-rank' ? target.rank : actingPlayer.rank - 1
                const isAdjacent = Math.abs(desiredRank - actingPlayer.rank) === 1
                const inBounds = desiredRank >= 1 && desiredRank <= 4

                if (!isAdjacent || !inBounds) {
                    nextLogs.push(`${actingPlayer.name} cannot reposition there.`)
                    return { ...state, logs: nextLogs }
                }

                const nextPlayer = spendCosts(actingPlayer)

                const occupantIndex = players.findIndex(
                    (p) => p.id !== nextPlayer.id && !p.isDead && p.rank === desiredRank
                )

                if (occupantIndex >= 0) {
                    players[occupantIndex] = { ...players[occupantIndex], rank: nextPlayer.rank }
                }

                players[playerIndex] = { ...nextPlayer, rank: desiredRank }
                nextLogs.push(`${nextPlayer.name} repositions to rank ${desiredRank}.`)

            } else if (card.type === CardType.VOICE) {
                const nextPlayer = spendCosts(actingPlayer)

                // CHECK FOR HEAL EFFECT
                const healEffect = card.effects?.find((e: any) => e.type === 'heal')

                if (healEffect && typeof healEffect.value === 'number') {
                    // Heal Self (Since VOICE usually self-targets or team-targets)
                    // For now assume Self-target if no target specified, or support nearby?
                    // Medkit usually implies "First Aid" self or ally.
                    // But CardType.VOICE usually targets SELF in this engine.
                    // We will apply to self (actingPlayer).

                    const amount = healEffect.value
                    const newHp = Math.min(nextPlayer.resources.maxHp, nextPlayer.resources.hp + amount)

                    players[playerIndex] = {
                        ...nextPlayer,
                        resources: { ...nextPlayer.resources, hp: newHp }
                    }

                    nextLogs.push(`${nextPlayer.name} uses ${card.name}: Heals ${amount} HP.`)
                    if (onEvent) onEvent(actingPlayer.id, `+${amount}`, 'heal')

                } else {
                    // Fallback to Stamina Boost (Original Logic)
                    players[playerIndex] = {
                        ...nextPlayer,
                        resources: {
                            ...nextPlayer.resources,
                            stamina: Math.min(nextPlayer.resources.maxStamina, nextPlayer.resources.stamina + 30),
                        },
                    }
                    nextLogs.push(`${players[playerIndex].name} stabilizes vitals.`)
                    if (onEvent) onEvent(actingPlayer.id, '+30 STM', 'heal')
                }
            } else if (card.type === CardType.ANALYSIS) {
                const enemyId = target?.type === 'enemy' ? target.enemyId : selectedTargetId
                const targetIndex = enemies.findIndex((e) => e.id === enemyId)
                const enemy = targetIndex >= 0 ? enemies[targetIndex] : null

                if (!enemy || enemy.isDead) {
                    nextLogs.push('No valid target for analysis.')
                    return { ...state, logs: nextLogs }
                }

                const nextPlayer = spendCosts(actingPlayer)
                players[playerIndex] = nextPlayer

                const currentScan = enemy.scannedLevel || 0
                const nextScan = Math.min(2, currentScan + 1)

                enemies[targetIndex] = {
                    ...enemy,
                    scannedLevel: nextScan
                }

                let info = ''
                if (nextScan >= 1) info += `HP: ${enemy.resources.hp}/${enemy.resources.maxHp} | ARM: ${enemy.armor}`
                if (nextScan >= 2) info += ` | AP: ${enemy.resources.ap} | THR: ${enemy.threatLevel || 'Unknown'}`

                nextLogs.push(`${nextPlayer.name} scans ${enemy.name}. Analysis: [${info}]`)
                if (onEvent) onEvent(enemy.id, 'SCANNED', 'debuff')
            } else if (card.type === CardType.DEFENSE) {
                nextLogs.push('Defense protocols unavailable.')
                return { ...state, logs: nextLogs }
            }

            const nextPlayers = fillEmptyRanks(players)
            const nextEnemies = fillEmptyRanks(enemies)
            const allDead = nextEnemies.every((e) => e.isDead)

            if (allDead) {
                onUnlockObj('first_win')
                if (state.stats.damageTaken === 0) onUnlockObj('no_damage')
            }

            return {
                ...state,
                players: nextPlayers,
                enemies: nextEnemies,
                logs: nextLogs,
                phase: allDead ? 'VICTORY' : state.phase,
                stats: { ...state.stats, attacksInOneTurn: nextAttacksInTurn },
            }
        }

        case 'SCRIPTED_EVENT_PROLOGUE_KILL': {
            const { onEvent } = action
            const condIdx = state.players.findIndex(p => p.id === 'npc_cond' && !p.isDead)
            if (condIdx < 0) return state

            const newLogs = [...state.logs, "!!! ЭКЗЕКУТОР РАЗРЫВАЕТ ПРОВОДНИКА !!!", "Бруно: «Лови подарочек, тварь!»"]
            const players = [...state.players]

            // Kill conductor
            const cond = players[condIdx]
            players[condIdx] = { ...cond, isDead: true, resources: { ...cond.resources, hp: 0 } }

            // Create Bruno
            const bruno: Combatant = {
                id: 'npc_bruno',
                name: 'Бруно Вебер',
                side: Side.PLAYER,
                rank: cond.rank,
                resources: { hp: 100, maxHp: 100, ap: 3, maxAp: 3, mp: 0, maxMp: 0, stamina: 50, maxStamina: 50, stagger: 50, maxStagger: 50, pp: 0, maxPp: 100 },
                equipment: ['hand_cannon'],
                bonusAp: 0, initiative: 15, armor: 4, isDead: false,
                effects: [], weaponHeat: 0, isJammed: false, ammo: 5,
            }

            // Add Bruno cards
            const brunoCards = generateDeckForCombatant(bruno)
            const newHand = [...state.playerHand, ...brunoCards]

            // Ensure turn queue is updated
            const newPlayers = [...players, bruno]
            const newQueue = sortTurnQueue(newPlayers, state.enemies)

            if (onEvent) onEvent('npc_cond', 'FATAL', 'damage')

            return {
                ...state,
                players: newPlayers,
                turnQueue: newQueue,
                playerHand: newHand,
                logs: newLogs
            }
        }

        default:
            return state
    }
}

// --- Hook ---

type UseDreyzabBattleProps = {
    onBattleEnd?: (result: DreyzabBattleResult, finalSession?: BattleSession) => void
    scenarioId?: ScenarioId
    initialSession?: BattleSession
}

export const useDreyzabBattle = ({ onBattleEnd, scenarioId = 'default', initialSession }: UseDreyzabBattleProps) => {
    // 1. Initialize State
    const [initial] = useState(() => createInitialSession({ scenarioId, initialSession }))

    // 2. Reducer
    const [battle, dispatch] = useReducer(battleReducer, initial.session)

    // 3. Local UI State
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(initial.defaultTargetId)
    const [achievements, setAchievements] = useState<Achievement[]>(() => readAchievements())
    const [showAchievements, setShowAchievements] = useState(false)
    const [showEquipment, setShowEquipment] = useState(false)
    const [combatEvents, setCombatEvents] = useState<CombatEvent[]>([])
    const [voiceEvents, setVoiceEvents] = useState<VoiceEvent[]>([])
    const [activeDragCardId, setActiveDragCardId] = useState<string | null>(null)

    // 4. Refs
    const enemyActionTimerRef = useRef<number | null>(null)
    const autoAdvanceTimerRef = useRef<number | null>(null)
    const reportedResultRef = useRef<DreyzabBattleResult | null>(null)
    const scriptedEventTriggeredRef = useRef(false)

    // 5. Actions
    const addCombatEvent = useCallback((unitId: string, text: string, type: 'damage' | 'heal' | 'miss' | 'debuff' | 'buff') => {
        const id = Math.random().toString(36).substr(2, 9)
        const color = type === 'damage' ? '#ef4444' :
            type === 'heal' ? '#10b981' :
                type === 'debuff' ? '#a855f7' :
                    type === 'buff' ? '#3b82f6' :
                        '#fbbf24'
        setCombatEvents((prev) => [...prev, { id, text, color, unitId }])
        setTimeout(() => {
            setCombatEvents((prev) => prev.filter((e) => e.id !== id))
        }, 2000)
    }, [])

    const addVoiceEvent = useCallback((text: string, source: string = 'Unknown') => {
        const id = Math.random().toString(36).substr(2, 9)
        setVoiceEvents(prev => [...prev, { id, text, source }])
        setTimeout(() => {
            setVoiceEvents(prev => prev.filter(e => e.id !== id))
        }, 4000)
    }, [])

    const unlockAchievement = useCallback((id: string) => {
        setAchievements((prev) => {
            const achievement = prev.find((a) => a.id === id)
            if (achievement && !achievement.unlocked) {
                return prev.map((a) => (a.id === id ? { ...a, unlocked: true } : a))
            }
            return prev
        })
    }, [])

    const advanceTurn = useCallback(() => {
        // Clear timers
        if (enemyActionTimerRef.current !== null) {
            window.clearTimeout(enemyActionTimerRef.current)
            enemyActionTimerRef.current = null
        }
        if (autoAdvanceTimerRef.current !== null) {
            window.clearTimeout(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = null
        }
        if (autoAdvanceTimerRef.current !== null) {
            window.clearTimeout(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = null
        }

        // Passive Voice Logic (Turn Start)
        // If stamina is low (<30%), chance for whisper
        const activeUnits = [...battle.players, ...battle.enemies].filter(u => !u.isDead)
        const player = activeUnits.find(u => u.side === Side.PLAYER && u.id === 'p1')
        if (player) {
            if (player.resources.stamina < player.resources.maxStamina * 0.3) {
                if (Math.random() < 0.3) {
                    const whispers = ["Push harder...", "The flesh is weak.", "Ignore the pain.", "They are watching."]
                    addVoiceEvent(whispers[Math.floor(Math.random() * whispers.length)], "Inner Voice")
                }
            }
        }

        dispatch({ type: 'ADVANCE_TURN' })
    }, [battle.players, battle.enemies, addVoiceEvent])

    const playCard = useCallback((card: CombatCard, target?: CardPlayTarget) => {
        if (!canPlayCard({ session: battle, card })) return

        // Optimistic UI check for range/target is done in reducer
        dispatch({
            type: 'PLAY_CARD',
            card,
            target,
            selectedTargetId,
            onLog: (_msg) => console.log(_msg),
            onEvent: addCombatEvent,
            onUnlockObj: unlockAchievement
        })

        // Hook-level side effects (Voice Cards)
        if (card.type === CardType.VOICE) {
            const voiceLines = ["Focus. Breathe.", "The noise... it stops.", "Clarity returns.", "I am in control."]
            const line = voiceLines[Math.floor(Math.random() * voiceLines.length)]
            addVoiceEvent(line, "Inner Voice")
        }
    }, [battle, selectedTargetId, addCombatEvent, unlockAchievement, addVoiceEvent])

    // 6. Effects

    // Scripted Event
    useEffect(() => {
        if (scenarioId !== 'boss_train_prologue') return
        if (scriptedEventTriggeredRef.current) return

        if (battle.turnCount >= 2 && battle.phase === 'ENEMY_TURN') {
            const condIdx = battle.players.findIndex(p => p.id === 'npc_cond' && !p.isDead)
            if (condIdx >= 0) {
                scriptedEventTriggeredRef.current = true
                setTimeout(() => {
                    dispatch({
                        type: 'SCRIPTED_EVENT_PROLOGUE_KILL',
                        onEvent: addCombatEvent
                    })
                }, 1500)
            }
        }
    }, [battle.turnCount, battle.phase, battle.players, scenarioId, addCombatEvent])

    // End Battle & Achievements Persistence
    useEffect(() => {
        if (!onBattleEnd) return

        if (battle.phase === 'VICTORY' && reportedResultRef.current !== 'victory') {
            reportedResultRef.current = 'victory'
            onBattleEnd('victory', battle)
        }

        if (battle.phase === 'DEFEAT' && reportedResultRef.current !== 'defeat') {
            reportedResultRef.current = 'defeat'
            onBattleEnd('defeat', battle)
        }

        if (battle.phase !== 'VICTORY' && battle.phase !== 'DEFEAT') {
            reportedResultRef.current = null
        }
    }, [battle.phase, onBattleEnd, battle])

    useEffect(() => {
        writeAchievements(achievements)
    }, [achievements])

    // Enemy AI Action
    useEffect(() => {
        if (enemyActionTimerRef.current !== null) window.clearTimeout(enemyActionTimerRef.current)

        if (battle.phase !== 'ENEMY_TURN' || !battle.activeUnitId) return
        const activeUnit = [...battle.players, ...battle.enemies].find((u) => u.id === battle.activeUnitId)
        if (!activeUnit || activeUnit.side !== Side.ENEMY || activeUnit.isDead) return

        enemyActionTimerRef.current = window.setTimeout(() => {
            dispatch({
                type: 'ENEMY_ACTION',
                enemyId: activeUnit.id,
                onLog: () => { },
                onEvent: addCombatEvent
            })
            // Auto advance after enemy move
            if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = window.setTimeout(() => {
                advanceTurn()
            }, 500)
        }, 1000)

        return () => {
            if (enemyActionTimerRef.current !== null) window.clearTimeout(enemyActionTimerRef.current)
        }
    }, [battle.activeUnitId, battle.phase, battle.players, battle.enemies, addCombatEvent, advanceTurn])

    // Auto Advance Player Turn
    const activeHandCards = useMemo(
        () => battle.playerHand.filter((card) => card.ownerId === battle.activeUnitId),
        [battle.activeUnitId, battle.playerHand]
    )

    useEffect(() => {
        if (battle.phase !== 'PLAYER_TURN') return

        const activePlayer = battle.players.find((p) => p.id === battle.activeUnitId)
        if (!activePlayer || activePlayer.isDead) return
        if (battle.enemies.every((e) => e.isDead)) return

        const hasPlayableCard = activeHandCards.some((card) => canPlayCard({ session: battle, card }))
        const shouldAutoAdvance = activePlayer.resources.ap <= 0 || !hasPlayableCard
        if (!shouldAutoAdvance) return

        if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current)
        autoAdvanceTimerRef.current = window.setTimeout(() => {
            advanceTurn()
        }, 800)

        return () => {
            if (autoAdvanceTimerRef.current !== null) {
                window.clearTimeout(autoAdvanceTimerRef.current)
                autoAdvanceTimerRef.current = null
            }
        }
    }, [battle, activeHandCards, advanceTurn])

    // 7. Drag Logic Handlers
    const activeDraggedCard = useMemo(() => {
        if (!activeDragCardId) return null
        return battle.playerHand.find((c) => c.id === activeDragCardId) ?? null
    }, [activeDragCardId, battle.playerHand])

    const dragHighlightClassName = useMemo(() => {
        if (!activeDraggedCard) return ''
        switch (activeDraggedCard.type) {
            case CardType.ATTACK: return 'ring-red-500/60 bg-red-950/10'
            case CardType.MOVEMENT: return 'ring-blue-500/60 bg-blue-950/10'
            case CardType.DEFENSE: return 'ring-emerald-500/60 bg-emerald-950/10'
            case CardType.VOICE: return 'ring-amber-500/60 bg-amber-950/10'
            case CardType.ANALYSIS: return 'ring-purple-500/60 bg-purple-950/10'
            default: return ''
        }
    }, [activeDraggedCard])

    const activePlayer = useMemo(() => {
        if (!battle.activeUnitId) return null
        return battle.players.find(p => p.id === battle.activeUnitId) ?? null
    }, [battle.activeUnitId, battle.players])

    const validEnemyDropIds = useMemo(() => {
        const ids = new Set<string>()
        if (!activeDraggedCard || !activePlayer) return ids
        if (activeDraggedCard.type !== CardType.ATTACK && activeDraggedCard.type !== CardType.ANALYSIS) return ids

        for (const enemy of battle.enemies) {
            if (enemy.isDead) continue
            const dist = Math.abs(enemy.rank + activePlayer.rank - 1)
            if (activeDraggedCard.optimalRange.length === 0 || activeDraggedCard.optimalRange.includes(dist)) {
                ids.add(enemy.id)
            }
        }
        return ids
    }, [activeDraggedCard, activePlayer, battle.enemies])

    const validPlayerRankDrops = useMemo(() => {
        const ranks = new Set<number>()
        if (!activeDraggedCard || !activePlayer) return ranks

        if (activeDraggedCard.type === CardType.MOVEMENT) {
            if (activePlayer.rank > 1) ranks.add(activePlayer.rank - 1)
            if (activePlayer.rank < 4) ranks.add(activePlayer.rank + 1)
        } else if (activeDraggedCard.type === CardType.VOICE || activeDraggedCard.type === CardType.DEFENSE) {
            ranks.add(activePlayer.rank)
        }
        return ranks
    }, [activeDraggedCard, activePlayer])

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveDragCardId(event.active.id as string)
    }, [])

    const handleDragCancel = useCallback(() => {
        setActiveDragCardId(null)
    }, [])

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event
            setActiveDragCardId(null)

            if (!over) return
            const card = active.data.current?.card as CombatCard | undefined
            if (!card) return

            if (over.data.current?.type === 'enemy') {
                const enemyId = over.data.current.enemyId as string | undefined
                if (!enemyId) return
                setSelectedTargetId(enemyId)
                playCard(card, { type: 'enemy', enemyId })
                return
            }

            if (over.data.current?.type === 'player-rank') {
                const rank = over.data.current.rank as number | undefined
                if (typeof rank !== 'number') return
                playCard(card, { type: 'player-rank', rank })
            }
        },
        [playCard]
    )

    const resetBattle = useCallback(() => {
        const next = createInitialSession({ scenarioId, initialSession })
        dispatch({ type: 'SET_SESSION', session: next.session })
        setSelectedTargetId(next.defaultTargetId)
        setShowAchievements(false)
        reportedResultRef.current = null
    }, [scenarioId, initialSession])

    // 8. Portrait Logic
    const resolveLocalPortrait = useCallback((unit: Combatant): string | null => {
        const id = unit.id.toLowerCase()
        const name = unit.name.toLowerCase()

        if (unit.side === Side.PLAYER && (id === 'p1' || name === 'player')) return '/images/characters/Player.png'
        if (unit.side === Side.PLAYER && (id === 'npc_cond' || name.includes('conductor') || name.includes('проводник'))) return '/images/npcs/Provodnik.png'
        if (id.includes('bruno') || name.includes('bruno')) return '/images/characters/Bruno.png'
        if (id.includes('lena') || name.includes('lena')) return '/images/characters/Lena.png'
        if (id.includes('otto') || name.includes('otto')) return '/images/characters/Otto.png'
        if (id.includes('adel') || id.includes('adele') || name.includes('adel')) return '/images/characters/Adel.png'
        if (unit.side === Side.ENEMY && name.includes('mutant marauder')) return '/images/enemy/melkiyShuk.png'
        if (unit.side === Side.ENEMY && name.includes('rail scorpion')) return '/images/enemy/БолСкор.png'
        if (unit.side === Side.ENEMY && name.includes('мал') && name.includes('скор')) return '/images/enemy/МалСкор.png'
        if (unit.side === Side.ENEMY && name.includes('сред') && name.includes('скор')) return '/images/enemy/СредСкор.png'
        if (unit.side === Side.ENEMY && (id === 'boss' || name.includes('executioner'))) return '/images/enemy/BossPalach.png'
        return null
    }, [])

    const resolvePortrait = useCallback((unit: Combatant): string => {
        const local = resolveLocalPortrait(unit)
        if (local) return local
        return unit.side === Side.PLAYER
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=operator${unit.id}&backgroundColor=transparent&style=straight`
            : `https://api.dicebear.com/7.x/bottts/svg?seed=enemy${unit.id}&backgroundColor=transparent`
    }, [resolveLocalPortrait])

    return {
        // State
        battle,
        achievements,
        showAchievements,
        setShowAchievements,
        showEquipment,
        setShowEquipment,
        combatEvents,
        voiceEvents,
        selectedTargetId,
        setSelectedTargetId,
        activeDragCardId,
        activeDraggedCard,
        dragHighlightClassName,
        validEnemyDropIds,
        validPlayerRankDrops,
        activeHandCards,
        activePlayer,

        // Actions
        playCard,
        advanceTurn,
        handleDragStart,
        handleDragCancel,
        handleDragEnd,
        resetBattle,
        resolvePortrait,
        activeUnit: [...battle.players, ...battle.enemies].find(u => u.id === battle.activeUnitId) ?? null
    }
}
