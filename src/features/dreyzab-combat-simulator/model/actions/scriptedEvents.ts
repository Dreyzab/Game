import type { BattleSession, Combatant } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'
import { generateDeckForCombatant } from '@/entities/dreyzab-combat-simulator/model/cardGenerator'
import { sortTurnQueue } from '@/entities/dreyzab-combat-simulator/model/utils'

export type ScriptedEventPrologueKillAction = {
    type: 'SCRIPTED_EVENT_PROLOGUE_KILL'
    onEvent: (unitId: string, text: string, type: 'damage') => void
}

export const handleScriptedEventPrologueKill = (
    state: BattleSession,
    action: ScriptedEventPrologueKillAction
): BattleSession => {
    const { onEvent } = action
    const condIdx = state.players.findIndex(p => p.id === 'npc_cond' && !p.isDead)
    if (condIdx < 0) return state

    const newLogs = [...state.logs, `!!! ÑðÑsÑ-ÑÑsÑœÑ½ÑzÑÿ ÑÿÑ?Ñ-ÑÿÑ®Ñ'Ñ?ÑÑ½ ÑYÑÿÑzÑ'ÑzÑ"Ñ?Ñ~ÑsÑ? !!!`, `Ñ'¥?¥ŸÑ«Ñó: ¶®Ñ>ÑóÑýÑ÷ Ñ¨ÑóÑïÑø¥?Ñó¥ÎÑæÑ§, ¥'ÑýÑø¥?¥O!¶¯`]
    const players = [...state.players]

    const cond = players[condIdx]
    players[condIdx] = { ...cond, isDead: true, resources: { ...cond.resources, hp: 0 } }

    const bruno: Combatant = {
        id: 'npc_bruno',
        name: `Ñ'¥?¥ŸÑ«Ñó Ñ'ÑæÑñÑæ¥?`,
        side: Side.PLAYER,
        rank: cond.rank,
        resources: { hp: 100, maxHp: 100, ap: 3, maxAp: 3, mp: 0, maxMp: 0, stamina: 50, maxStamina: 50, stagger: 50, maxStagger: 50, pp: 0, maxPp: 100 },
        equipment: ['hand_cannon'],
        bonusAp: 0,
        initiative: 15,
        armor: 4,
        isDead: false,
        effects: [],
        weaponHeat: 0,
        isJammed: false,
        ammo: 5,
        voices: {
            coordination: 5,
            force: 6,
            reaction: 6,
            perception: 5,
            endurance: 6,
            resilience: 6,
            knowledge: 4,
            azart: 8
        }
    }

    const brunoCards = generateDeckForCombatant(bruno)
    const newHand = [...state.playerHand, ...brunoCards]

    const newPlayers = [...players, bruno]
    const newQueue = sortTurnQueue(newPlayers, state.enemies)

    if (onEvent) onEvent('npc_cond', 'FATAL', 'damage')

    return {
        ...state,
        players: newPlayers,
        turnQueue: newQueue,
        playerHand: newHand,
        logs: newLogs,
    }
}
