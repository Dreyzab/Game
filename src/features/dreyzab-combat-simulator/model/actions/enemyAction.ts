import type { Combatant, BattleSession } from '@/entities/dreyzab-combat-simulator/model/types'
import { rollAttack } from '@/entities/dreyzab-combat-simulator/model/utils'
import { fillEmptyRanks } from '../battleCore'
import type { BattleContext } from '../createBattleReducer'

export type EnemyActionAction = {
    type: 'ENEMY_ACTION'
    enemyId: string
    onLog: (msg: string) => void
    onEvent: (unitId: string, text: string, type: 'damage' | 'heal' | 'miss' | 'debuff' | 'buff') => void
}

export const handleEnemyAction = (
    state: BattleSession,
    action: EnemyActionAction,
    ctx: BattleContext
): BattleSession => {
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
    const isSmallScorpion = enemyName.includes("Ñ¬ÑøÑ¯") && enemyName.includes("¥?Ñ§Ñó¥?")
    const isMediumScorpion = enemyName.includes("¥?¥?ÑæÑï") && enemyName.includes("¥?Ñ§Ñó¥?")
    const isExecutioner = enemyName.includes('executioner') || enemyName.includes("¥?Ñ§ÑúÑæÑ§¥Ÿ¥'Ñó¥?") || enemyName.includes("Ñ¨ÑøÑ¯Ñø¥Î")

    const applyDamage = (
        playerId: string,
        opts: { accuracy: number; baseDamage: number; label: string; ignoreArmor?: boolean }
    ) => {
        const targetIndex = players.findIndex((p) => p.id === playerId)
        if (targetIndex < 0) return 0

        const defender = players[targetIndex]
        if (defender.isDead) return 0

        const attackResult = rollAttack(enemy, defender, opts.accuracy, ctx.rng)
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
            damageDealt += applyDamage(target.id, { accuracy: 80, baseDamage: 30, label: "Executioner's Axe" })
        } else if (distance <= 2) {
            damageDealt += applyDamage(target.id, { accuracy: 70, baseDamage: 20, label: 'Rusty Chain' })
        } else {
            enemies[enemyIndex] = { ...enemies[enemyIndex], rank: Math.max(1, enemy.rank - 1) }
            nextLogs.push(`${enemy.name} charges forward!`)
        }
    } else if (isMediumScorpion && distance <= 3) {
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
