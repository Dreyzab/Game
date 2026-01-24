import type { BattleSession } from '@/entities/dreyzab-combat-simulator/model/types'
import {
    handleAdvanceTurn,
    handleEnemyAction,
    handlePlayCard,
    handleScriptedEventPrologueKill,
} from './actions'
import type {
    AdvanceTurnAction,
    EnemyActionAction,
    PlayCardAction,
    ScriptedEventPrologueKillAction,
} from './actions'

export interface BattleContext {
    rng: () => number
}

export type BattleAction =
    | { type: 'SET_SESSION'; session: BattleSession }
    | AdvanceTurnAction
    | EnemyActionAction
    | PlayCardAction
    | ScriptedEventPrologueKillAction

export const createBattleReducer = (ctx: BattleContext = { rng: Math.random }) => {
    return (state: BattleSession, action: BattleAction): BattleSession => {
        switch (action.type) {
            case 'SET_SESSION':
                return action.session
            case 'ADVANCE_TURN':
                return handleAdvanceTurn(state, action)
            case 'ENEMY_ACTION':
                return handleEnemyAction(state, action, ctx)
            case 'PLAY_CARD':
                return handlePlayCard(state, action, ctx)
            case 'SCRIPTED_EVENT_PROLOGUE_KILL':
                return handleScriptedEventPrologueKill(state, action)
            default:
                return state
        }
    }
}
