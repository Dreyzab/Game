import { Side } from './types'
import type { BattleSession, CombatCard, Combatant } from './types'
import { ENEMY_TEMPLATES } from './constants'
import { generateDeckForCombatant } from './cardGenerator'
import { sortTurnQueue } from './utils'

export type ScenarioId = 'default' | 'prologue_tutorial_1' | 'boss_train_prologue' | 'scorpion_nest'

export const SCENARIOS: Record<ScenarioId, (config?: { playerEquipment?: string[] }) => BattleSession> = {
    default: (config) => createDefaultSession(config?.playerEquipment),

    // Tutorial 1: Player + Lena + Conductor vs Small Monsters
    prologue_tutorial_1: (config) => {
        const players = [
            createPlayer('p1', 'Player', 1, config?.playerEquipment ?? ['glock_19', 'knife']),
            createNPC('npc_lena', 'Lena Richter', 2, ['pistol_pm', 'knife']),
            createNPC('npc_cond', 'Conductor', 3, ['rifle_ak74_scoped']),
        ]

        const enemies = [
            createEnemy('e1', 1, 1),
            createEnemy('e2', 1, 1),
            createEnemy('e3', 2, 2),
        ]

        return finalizeSession(players, enemies)
    },

    // Tutorial 2: Boss Fight
    boss_train_prologue: (config) => {
        const players = [
            createPlayer('p1', 'Player', 1, config?.playerEquipment ?? ['glock_19', 'knife']),
            createNPC('npc_lena', 'Lena Richter', 2, ['knife', 'field_medkit']),
            createNPC('npc_otto', 'Otto Klein', 3, ['knife', 'grenade']),
            createNPC('npc_cond', 'Conductor', 4, ['rifle_ak74_scoped']), // Will die
        ]

        const enemies = [createBoss('boss', 'The Executioner', 1, 300)]

        return finalizeSession(players, enemies)
    },

    scorpion_nest: (config) => {
        const players = [
            createPlayer('p1', 'Dreyzab Operator', 2, config?.playerEquipment ?? ['glock_19', 'knife']),
            createPlayer('p2', 'Vorschlag', 3, ['pistol_pm', 'knife']),
            createPlayer('p3', 'Ghost', 4, ['rifle_ak74_scoped', 'knife']),
            createPlayer('p4', 'Watcher', 1, ['sawed_off_shotgun', 'knife']),
        ]

        const enemies = [
            createEnemy('e_small_1', 1, 2),
            createEnemy('e_small_2', 2, 2),
            createEnemy('e_medium', 3, 3),
        ]

        return finalizeSession(players, enemies)
    },
}

export function createNPC(id: string, name: string, rank: number, equipment: string[] = []): Combatant {
    return {
        id,
        name,
        side: Side.PLAYER,
        rank,
        resources: { hp: 100, maxHp: 100, ap: 3, maxAp: 3, mp: 50, maxMp: 50, stamina: 100, maxStamina: 100, stagger: 0, maxStagger: 100, pp: 0, maxPp: 100 },
        equipment,
        bonusAp: 0,
        initiative: 0,
        armor: 3,
        isDead: false,
        effects: [],
        weaponHeat: 0,
        isJammed: false,
        ammo: 100,
    }
}

function createPlayer(id: string, name: string, rank: number, equipment: string[] = []): Combatant {
    return {
        id,
        name,
        side: Side.PLAYER,
        rank,
        resources: { hp: 110, maxHp: 110, ap: 3, maxAp: 3, mp: 57, maxMp: 57, stamina: 100, maxStamina: 100, stagger: 0, maxStagger: 100, pp: 0, maxPp: 100 },
        equipment,
        bonusAp: 0,
        initiative: 0,
        armor: 5,
        isDead: false,
        effects: [],
        weaponHeat: 0,
        isJammed: false,
        ammo: 100,
    }
}

function createEnemy(id: string, rank: number, templateIdx: number): Combatant {
    const template = ENEMY_TEMPLATES[Math.min(templateIdx, ENEMY_TEMPLATES.length - 1)]
    return {
        id,
        name: template.name,
        side: Side.ENEMY,
        rank,
        resources: { hp: template.hp, maxHp: template.hp, ap: 1, maxAp: 1, mp: 0, maxMp: 0, stamina: 100, maxStamina: 100, stagger: 0, maxStagger: 100, pp: 0, maxPp: 100 },
        equipment: [],
        bonusAp: 0,
        initiative: template.initBase,
        armor: template.armor,
        isDead: false,
        effects: [],
        weaponHeat: 0,
        isJammed: false,
        ammo: 0,
    }
}

function createBoss(id: string, name: string, rank: number, hp: number): Combatant {
    return {
        id,
        name,
        side: Side.ENEMY,
        rank,
        resources: { hp, maxHp: hp, ap: 2, maxAp: 2, mp: 0, maxMp: 0, stamina: 100, maxStamina: 100, stagger: 0, maxStagger: 100, pp: 0, maxPp: 100 },
        equipment: [],
        bonusAp: 0,
        initiative: 20,
        armor: 5,
        isDead: false,
        effects: [],
        weaponHeat: 0,
        isJammed: false,
        ammo: 0,
    }
}

function createDefaultSession(equipment?: string[]): BattleSession {
    return finalizeSession([createPlayer('p1', 'Player', 1, equipment ?? ['knife'])], [createEnemy('e1', 1, 0)])
}

function finalizeSession(players: Combatant[], enemies: Combatant[]): BattleSession {
    const turnQueue = sortTurnQueue(players, enemies)
    const playerHand: CombatCard[] = players.filter((p) => p.side === Side.PLAYER).flatMap((p) => generateDeckForCombatant(p))

    return {
        turnCount: 1,
        phase: 'PLAYER_TURN',
        logs: ['Combat initiated.'],
        players,
        enemies,
        playerHand,
        stats: { damageTaken: 0, attacksInOneTurn: 0, turnCount: 1 },
        activeUnitId: turnQueue[0] ?? null,
        turnQueue,
        teamSP: 50,
        maxTeamSP: 100,
    }
}

