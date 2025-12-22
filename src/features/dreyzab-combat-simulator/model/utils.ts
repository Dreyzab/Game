import type { BattleSession, CombatCard, Combatant } from './types'
import { Side } from './types'

export const canPlayCard = ({ session, card }: { session: BattleSession; card: CombatCard }) => {
    if (session.phase !== 'PLAYER_TURN') return false
    const activePlayer = session.players.find((p) => p.id === session.activeUnitId)
    if (!activePlayer) return false
    return activePlayer.resources.ap >= card.apCost && activePlayer.resources.wp >= card.staminaCost
}

export const calculateInitiative = (unit: Combatant) => unit.resources.wp / 10 + (unit.side === Side.PLAYER ? 5 : 0)

export const sortTurnQueue = (players: Combatant[], enemies: Combatant[]) => {
    const all = [...players, ...enemies].filter((u) => !u.isDead)
    return all.sort((a, b) => calculateInitiative(b) - calculateInitiative(a)).map((u) => u.id)
}


