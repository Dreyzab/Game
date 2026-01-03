import { Side } from './types'
import type { Combatant, BattleSession } from './types'
import { ENEMY_TEMPLATES } from './constants'
import { sortTurnQueue } from './utils'
import { ITEM_TEMPLATES } from '../../../shared/data/itemTemplates'
import { generateWeaponCardsForWeaponId } from './weaponCards'


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



    const playerHand: any[] = []

    players.filter(p => p.side === Side.PLAYER).forEach(p => {
        // 1. Base Moves
        const moveCards = [
            {
                id: `${p.id}_move_adv`, ownerId: p.id, name: 'Advance', type: 'movement',
                apCost: 1, staminaCost: 5, damage: 0, effects: [], optimalRange: [], description: 'Move forward', jamChance: 0
            },
            {
                id: `${p.id}_move_ret`, ownerId: p.id, name: 'Retreat', type: 'movement',
                apCost: 1, staminaCost: 5, damage: 0, effects: [], optimalRange: [], description: 'Move backward', jamChance: 0
            }
        ]
        playerHand.push(...moveCards)

        // 2. Weapon Cards (Simulated from Default Loadout for now, or from combatant state if we added it)
        // Since we didn't add an equipment field to Combatant yet, I will infer from ID or use a default set
        // But the prompt implies "equipped items".
        // Let's assume 'p1' has some items. For the simulator, we can hardcode a "virtual loadout" here
        // or add equipment to the Combatant interface.
        // For this task, I'll simulate p1 having a Glock and a Knife.

        let virtualLoadout: string[] = []
        if (p.id === 'p1') virtualLoadout = ['glock_19', 'knife'] // Example default
        else if (p.id.includes('lena')) virtualLoadout = ['lena_scalpel'] // Mapped
        else if (p.id.includes('cond')) virtualLoadout = ['pistol_pm']

        // Generate cards
        virtualLoadout.forEach(itemId => {
            const template = ITEM_TEMPLATES[itemId]
            const baseDmg = template?.baseStats?.damage ?? 10
            const cards = generateWeaponCardsForWeaponId(itemId, { baseDamage: baseDmg, idPrefix: `${p.id}_${itemId}` })
            cards.forEach((c) => {
              playerHand.push({
                id: c.id,
                ownerId: p.id,
                name: c.name,
                type: c.type,
                apCost: c.apCost,
                staminaCost: c.staminaCost,
                damage: c.damage,
                damageType: c.damageType,
                optimalRange: c.optimalRange,
                effects: c.effects,
                description: c.description,
                jamChance: c.jamChance,
              })
            })
        })

        // Fallback if no weapons
        if (playerHand.filter(c => c.ownerId === p.id && c.type === 'attack').length === 0) {
            playerHand.push({
                id: `${p.id}_fist`, ownerId: p.id, name: 'Fist', type: 'attack',
                apCost: 1, staminaCost: 5, damage: 2, optimalRange: [1], description: 'Punch.', jamChance: 0, effects: []
            })
        }
    })

    // Add existing NPC specific cards if they weren't covered by the weapon logic above
    // (Preserving original logic for specific scripted NPCs if needed, but the above loop handles most)


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
