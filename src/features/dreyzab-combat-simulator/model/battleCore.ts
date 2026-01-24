import type { BattleSession, Combatant } from '@/entities/dreyzab-combat-simulator/model/types'
import { SCENARIOS, type ScenarioId } from '@/entities/dreyzab-combat-simulator/model/scenarios'

export const MAX_RANK = 4
export const END_TURN_STAMINA_RECOVERY = 10

export const fillEmptyRanks = (units: Combatant[]): Combatant[] => {
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

export const createInitialSession = (params: {
    scenarioId: ScenarioId
    initialSession?: BattleSession
}): { session: BattleSession; defaultTargetId: string | null } => {
    const session = params.initialSession ?? (SCENARIOS[params.scenarioId] ?? SCENARIOS['default'])()
    return {
        session,
        defaultTargetId: session.enemies[0]?.id ?? null,
    }
}
