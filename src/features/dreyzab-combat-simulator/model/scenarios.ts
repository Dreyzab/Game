import { Side } from './types'
import type { Combatant, BattleSession } from './types'
import { INITIAL_PLAYER_HAND, NPC_CARDS, ENEMY_TEMPLATES } from './constants'
import { sortTurnQueue } from './utils'

export type ScenarioId = 'default' | 'prologue_tutorial_1' | 'boss_train_prologue' | 'scorpion_nest'

export const SCENARIOS: Record<ScenarioId, (baseSession?: Partial<BattleSession>) => BattleSession> = {
    default: () => createDefaultSession(),

    // Tutorial 1: Player + Lena + Conductor vs Small Monsters
    prologue_tutorial_1: () => {
        const players = [
            createPlayer('p1', 'Player', 1),
            createNPC('npc_lena', 'Lena Richter', 2),
            createNPC('npc_cond', 'Conductor', 3)
        ]

        const enemies = [
            createEnemy('e1', 1, 1),
            createEnemy('e2', 1, 1),
            createEnemy('e3', 2, 2)
        ]

        return finalizeSession(players, enemies)
    },

    // Tutorial 2: Boss Fight
    boss_train_prologue: () => {
        const players = [
            createPlayer('p1', 'Player', 1),
            createNPC('npc_lena', 'Lena Richter', 2),
            createNPC('npc_otto', 'Otto Klein', 3),
            createNPC('npc_cond', 'Conductor', 4) // Will die
        ]

        const enemies = [
            createBoss('boss', 'The Executioner', 1, 300)
        ]

        return finalizeSession(players, enemies)
    },

    scorpion_nest: () => {
        const players = [
            createPlayer('p1', 'Ева «Валькирия»', 2),
            createPlayer('p2', 'Йоханн «Vorschlag»', 3),
            createPlayer('p3', 'Дитрих «Ghost»', 4),
            createPlayer('p4', 'Агата «Шустрая»', 1),
        ]

        const enemies = [
            createEnemy('e_small_1', 1, 2),
            createEnemy('e_small_2', 2, 2),
            createEnemy('e_medium', 3, 3),
        ]

        return finalizeSession(players, enemies)
    },
}

// Helpers

export function createNPC(id: string, name: string, rank: number): Combatant {
    return {
        id, name, side: Side.PLAYER, rank,
        resources: { hp: 100, maxHp: 100, ap: 3, maxAp: 3, mp: 0, maxMp: 0, wp: 40, maxWp: 40, pp: 0, maxPp: 100 },
        bonusAp: 0, initiative: 0, armor: 3, isDead: false, effects: [], weaponHeat: 0, isJammed: false, ammo: 100,
    }
}

function createPlayer(id: string, name: string, rank: number): Combatant {
    return {
        id, name, side: Side.PLAYER, rank,
        resources: { hp: 120, maxHp: 120, ap: 3, maxAp: 3, mp: 0, maxMp: 0, wp: 50, maxWp: 50, pp: 0, maxPp: 100 },
        bonusAp: 0, initiative: 0, armor: 5, isDead: false, effects: [], weaponHeat: 0, isJammed: false, ammo: 100
    }
}

function createEnemy(id: string, rank: number, templateIdx: number): Combatant {
    const t = ENEMY_TEMPLATES[Math.min(templateIdx, ENEMY_TEMPLATES.length - 1)]
    return {
        id, name: t.name, side: Side.ENEMY, rank,
        resources: { hp: t.hp, maxHp: t.hp, ap: 1, maxAp: 1, mp: 0, maxMp: 0, wp: 10, maxWp: 10, pp: 0, maxPp: 100 },
        bonusAp: 0, initiative: t.initBase, armor: t.armor, isDead: false, effects: [], weaponHeat: 0, isJammed: false, ammo: 0
    }
}

function createBoss(id: string, name: string, rank: number, hp: number): Combatant {
    return {
        id, name, side: Side.ENEMY, rank,
        resources: { hp, maxHp: hp, ap: 2, maxAp: 2, mp: 0, maxMp: 0, wp: 100, maxWp: 100, pp: 0, maxPp: 100 },
        bonusAp: 0, initiative: 20, armor: 5, isDead: false, effects: [], weaponHeat: 0, isJammed: false, ammo: 0
    }
}

function createDefaultSession(): BattleSession {
    return finalizeSession([createPlayer('p1', 'Player', 1)], [createEnemy('e1', 1, 0)])
}

function finalizeSession(players: Combatant[], enemies: Combatant[]): BattleSession {
    const turnQueue = sortTurnQueue(players, enemies)

    const withOwner = (card: (typeof INITIAL_PLAYER_HAND)[number], ownerId: string) => ({
        ...card,
        id: `${ownerId}_${card.id}`,
        ownerId,
    })

    const playerHand = [
        ...players
            .filter((p) => p.id.startsWith('p'))
            .flatMap((p) => INITIAL_PLAYER_HAND.map((card) => withOwner(card, p.id))),
        ...NPC_CARDS.filter((c) =>
            players.some(
                (p) =>
                    (p.id.includes('cond') && c.id.startsWith('cond')) ||
                    (p.id.includes('lena') && c.id.startsWith('lena')) ||
                    (p.id.includes('otto') && c.id.startsWith('otto'))
            )
        ).flatMap((c) => {
            let ownerId = ''
            if (c.id.startsWith('cond')) ownerId = 'npc_cond'
            if (c.id.startsWith('lena')) ownerId = 'npc_lena'
            if (c.id.startsWith('otto')) ownerId = 'npc_otto'
            if (!ownerId) {
                const p = players.find((p) => c.id.startsWith(p.id.replace('npc_', '')))
                if (p) ownerId = p.id
            }
            if (!ownerId) return []
            return [withOwner(c, ownerId)]
        }),
    ]

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
        maxTeamSP: 100
    }
}
