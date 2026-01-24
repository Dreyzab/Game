import type { BattleSession, Combatant } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'
import { sortTurnQueue } from '@/entities/dreyzab-combat-simulator/model/utils'
import { END_TURN_STAMINA_RECOVERY } from '../battleCore'

export type AdvanceTurnAction = { type: 'ADVANCE_TURN' }

export const handleAdvanceTurn = (state: BattleSession, action: AdvanceTurnAction): BattleSession => {
    void action
    if (state.phase === 'VICTORY' || state.phase === 'DEFEAT') return state

    const currentIdx = state.turnQueue.indexOf(state.activeUnitId ?? '')
    const currentUnit = [...state.players, ...state.enemies].find((u) => u.id === state.activeUnitId)

    let nextPlayers = [...state.players]
    let nextEnemies = [...state.enemies]

    const recoverStamina = (unit: Combatant) => {
        if (unit.isDead) return unit
        const nextStagger = Math.min(unit.resources.maxStagger, unit.resources.stagger + 5)
        return {
            ...unit,
            resources: {
                ...unit.resources,
                stamina: Math.min(unit.resources.maxStamina, unit.resources.stamina + END_TURN_STAMINA_RECOVERY),
                stagger: nextStagger,
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
