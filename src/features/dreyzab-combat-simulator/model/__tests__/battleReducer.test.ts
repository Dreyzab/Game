import { describe, expect, it } from 'vitest'
import type { BattleSession, CombatCard, Combatant } from '@/entities/dreyzab-combat-simulator/model/types'
import { CardType, Side } from '@/entities/dreyzab-combat-simulator/model/types'
import { createBattleReducer } from '../createBattleReducer'

const createCombatant = (params: Partial<Combatant> & { id: string; side: Side; rank: number }): Combatant => ({
    id: params.id,
    name: params.name ?? params.id,
    side: params.side,
    rank: params.rank,
    resources: params.resources ?? {
        hp: 100,
        maxHp: 100,
        ap: 2,
        maxAp: 2,
        mp: 0,
        maxMp: 0,
        stamina: 100,
        maxStamina: 100,
        stagger: 50,
        maxStagger: 50,
        pp: 0,
        maxPp: 100,
    },
    equipment: params.equipment ?? [],
    bonusAp: params.bonusAp ?? 0,
    initiative: params.initiative ?? 10,
    armor: params.armor ?? 0,
    isDead: params.isDead ?? false,
    effects: params.effects ?? [],
    weaponHeat: params.weaponHeat ?? 0,
    isJammed: params.isJammed ?? false,
    ammo: params.ammo ?? 10,
    threatLevel: params.threatLevel,
    scannedLevel: params.scannedLevel,
    voices: params.voices ?? {
        coordination: 10, force: 10, reaction: 10, perception: 10,
        endurance: 10, resilience: 10, knowledge: 10, azart: 10
    },
    weaponInstances: []
})

const createAttackCard = (overrides: Partial<CombatCard> = {}): CombatCard => ({
    id: 'card_attack',
    name: 'Test Shot',
    type: CardType.ATTACK,
    apCost: 1,
    staminaCost: 0,
    damage: 10,
    impact: 5,
    optimalRange: [1],
    description: 'Test attack',
    jamChance: 0,
    ...overrides,
})

const createSession = (overrides: Partial<BattleSession> = {}): BattleSession => {
    const player = createCombatant({ id: 'p1', side: Side.PLAYER, rank: 1, name: 'Player' })
    const enemy = createCombatant({ id: 'e1', side: Side.ENEMY, rank: 1, name: 'Mutant Marauder', resources: { ...player.resources, hp: 50, maxHp: 50, ap: 1, maxAp: 1 } })
    const hand: CombatCard[] = [createAttackCard({ ownerId: player.id })]

    const base: BattleSession = {
        turnCount: 1,
        phase: 'PLAYER_TURN',
        logs: ['Combat initiated.'],
        players: [player],
        enemies: [enemy],
        playerHand: hand,
        deck: [...hand],
        discard: [],
        stats: { damageTaken: 0, attacksInOneTurn: 0, turnCount: 1 },
        activeUnitId: player.id,
        turnQueue: [player.id, enemy.id],
        teamSP: 50,
        maxTeamSP: 100,
    }

    return {
        ...base,
        ...overrides,
        playerHand: overrides.playerHand ?? base.playerHand,
        deck: overrides.deck ?? base.deck,
        discard: overrides.discard ?? base.discard,
    }
}

describe('createBattleReducer', () => {
    it('advances turn to next unit', () => {
        const reducer = createBattleReducer({ rng: () => 0.5 })
        const session = createSession()

        const next = reducer(session, { type: 'ADVANCE_TURN' })

        expect(next.activeUnitId).toBe('e1')
        expect(next.phase).toBe('ENEMY_TURN')
        expect(next.stats.attacksInOneTurn).toBe(0)
    })

    it('applies attack damage on hit with deterministic rng', () => {
        const reducer = createBattleReducer({ rng: () => 0.5 })
        const session = createSession()
        const card = session.playerHand[0]

        const next = reducer(session, {
            type: 'PLAY_CARD',
            card,
            target: { type: 'enemy', enemyId: 'e1' },
            selectedTargetId: 'e1',
            onLog: () => { },
            onEvent: () => { },
            onUnlockObj: () => { },
        })

        expect(next.enemies[0].resources.hp).toBe(40)
        expect(next.stats.attacksInOneTurn).toBe(1)
    })

    it('perception reduces armor effectiveness', () => {
        // Hit (assuming 75 threshold), no block if blockChance < 0.5
        // V2 Logic: Block Chance = Armor * (1 - Penetration) * 0.1
        // Let's test pure mitigation.
        // Armor 10.
        // Player 1: Perception 0 -> Eff Armor 10 -> Block Chance 1.0 (capped at 0.9). 
        // Player 2: Perception 50 -> Pen 100% -> Eff Armor 0 -> Block Chance 0.

        // High RNG to hit (1-0.95 < 0.75? No, rollAttack logic is roll < threshold(75). 0.95 > 0.75 => Miss?)
        // rollAttack logic in utils: roll <= hitChance. if hitChance=75, rng=0.5 -> hit.
        // Block logic: isBlocked = rng < blockChance. 
        // If we want guaranteed HIT but varying BLOCK, we need controlled RNG or mock.
        // battleReducer accepts ctx with single RNG.
        // If we want Hit (rng <= 0.75) AND Block (rng < blockChance), we need low RNG.
        // But if rng is low, it checks both.
        // This single stream RNG is tricky for complex branching.
        // Let's rely on standard hit (0.3).

        const lowPercPlayer = createCombatant({
            id: 'p_low', side: Side.PLAYER, rank: 1, name: 'Blind',
            voices: { coordination: 10, force: 10, reaction: 10, perception: 0, endurance: 10, resilience: 10, knowledge: 10, azart: 10 }
        })
        const highPercPlayer = createCombatant({
            id: 'p_high', side: Side.PLAYER, rank: 1, name: 'Sniper',
            voices: { coordination: 10, force: 10, reaction: 10, perception: 50, endurance: 10, resilience: 10, knowledge: 10, azart: 10 }
        })

        const armoredEnemy = createCombatant({
            id: 'e_tank', side: Side.ENEMY, rank: 1, name: 'Tank', armor: 10,
            resources: { hp: 100, maxHp: 100, ap: 1, maxAp: 1, mp: 0, maxMp: 0, stamina: 100, maxStamina: 100, stagger: 0, maxStagger: 0, pp: 0, maxPp: 0 }
        })

        const card = createAttackCard({ damage: 20, ownerId: 'p_low' }) // 20 damage

        // Case 1: Low Perception (0) vs Armor 10
        // Penetration = 0. EffArmor 10. BlockChance = 1.0 (capped 0.9).
        // RNG 0.1: Hit (0.1 <= 0.75). Block (0.1 < 0.9).
        // Damage: 20 * 0.5 = 10.
        const session1 = createSession({ players: [lowPercPlayer], enemies: [armoredEnemy], playerHand: [card], activeUnitId: 'p_low' })
        const result1 = createBattleReducer({ rng: () => 0.1 })(session1, {
            type: 'PLAY_CARD', card, target: { type: 'enemy', enemyId: 'e_tank' },
            onLog: () => { }, onEvent: () => { }, onUnlockObj: () => { }
        })
        // Expected dmg 10 (Blocked)
        // Note: reducer logic: finalDamage = card.damage. If blocked, floor(final * 0.5).
        expect(result1.enemies[0].resources.hp).toBe(90) // 100 - 10

        // Case 2: High Perception (50) vs Armor 10
        // Penetration = 50 * 0.02 = 1.0 (100%). EffArmor 0. BlockChance 0.
        // RNG 0.1: Hit (0.1 <= 0.75). Block (0.1 < 0). False.
        // Damage: 20 * 1.0 = 20.
        const session2 = createSession({ players: [highPercPlayer], enemies: [armoredEnemy], playerHand: [card], activeUnitId: 'p_high' })
        const result2 = createBattleReducer({ rng: () => 0.1 })(session2, {
            type: 'PLAY_CARD', card, target: { type: 'enemy', enemyId: 'e_tank' },
            onLog: () => { }, onEvent: () => { }, onUnlockObj: () => { }
        })
        expect(result2.enemies[0].resources.hp).toBe(80) // 100 - 20


    })

    it('enemy action uses rng for hit resolution', () => {
        const reducer = createBattleReducer({ rng: () => 0 })
        const session = createSession({ phase: 'ENEMY_TURN', activeUnitId: 'e1' })

        const next = reducer(session, {
            type: 'ENEMY_ACTION',
            enemyId: 'e1',
            onLog: () => { },
            onEvent: () => { },
        })

        expect(next.players[0].resources.hp).toBeLessThan(100)
        expect(next.stats.damageTaken).toBeGreaterThan(0)
    })
})
