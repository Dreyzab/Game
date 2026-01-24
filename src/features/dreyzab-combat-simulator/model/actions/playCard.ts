import type { BattleSession, Combatant, CombatCard, CardPlayTarget } from '@/entities/dreyzab-combat-simulator/model/types'
import { CardType } from '@/entities/dreyzab-combat-simulator/model/types'
import { rollAttack } from '@/entities/dreyzab-combat-simulator/model/utils'
import { fillEmptyRanks } from '../battleCore'
import type { BattleContext } from '../createBattleReducer'

export type PlayCardAction = {
    type: 'PLAY_CARD'
    card: CombatCard
    target?: CardPlayTarget
    selectedTargetId?: string | null
    onLog: (msg: string) => void
    onEvent: (unitId: string, text: string, type: 'damage' | 'heal' | 'miss' | 'debuff' | 'buff') => void
    onUnlockObj: (id: string) => void
}

export const handlePlayCard = (
    state: BattleSession,
    action: PlayCardAction,
    ctx: BattleContext
): BattleSession => {
    const { card, target, selectedTargetId, onEvent, onUnlockObj } = action
    if (state.phase !== 'PLAYER_TURN') return state

    const resolveTargetUnit = (): Combatant | null => {
        if (target?.type === 'unit') {
            return [...state.players, ...state.enemies].find(u => u.id === target.unitId) ?? null
        }
        if (target?.type === 'enemy') {
            return state.enemies.find(e => e.id === target.enemyId) ?? null
        }
        if (card.type === CardType.ATTACK && selectedTargetId) {
            return state.enemies.find(e => e.id === selectedTargetId) ?? null
        }
        return null
    }

    const targetUnit = resolveTargetUnit()

    const playerIndex = state.players.findIndex((p) => p.id === state.activeUnitId)
    if (playerIndex < 0) return state

    const players = state.players.map((p) => ({ ...p }))
    const enemies = state.enemies.map((e) => ({ ...e }))
    const nextLogs = [...state.logs]

    const actingPlayer = players[playerIndex]
    if (actingPlayer.resources.ap < card.apCost || actingPlayer.resources.stamina < card.staminaCost) return state

    const isAllyTargeting = card.targetAllies || card.id === 'use_medkit'

    if (isAllyTargeting) {
        if (targetUnit) {
            const isAlly = state.players.some(p => p.id === targetUnit.id)
            if (!isAlly) {
                nextLogs.push('Invalid target! Must target an ally.')
                return { ...state, logs: nextLogs }
            }
        } else if (!target?.type && !card.targetSelf) {
            // Allow fallthrough to self when target is omitted.
        }
    }

    const spendCosts = (unit: Combatant) => ({
        ...unit,
        resources: {
            ...unit.resources,
            ap: unit.resources.ap - card.apCost,
            stamina: unit.resources.stamina - card.staminaCost,
        },
        ammo: unit.ammo - (card.ammoCost ?? 0),
    })

    let nextAttacksInTurn = state.stats.attacksInOneTurn

    if (card.type === CardType.ATTACK) {
        const enemyId = target?.type === 'enemy' ? target.enemyId : selectedTargetId
        const targetIndex = enemies.findIndex((e) => e.id === enemyId)
        const enemy = targetIndex >= 0 ? enemies[targetIndex] : null

        if (!enemy || enemy.isDead) {
            nextLogs.push('No valid target.')
            return { ...state, logs: nextLogs }
        }

        const dist = Math.abs(enemy.rank + actingPlayer.rank - 1)
        const inRange = card.optimalRange.length === 0 || card.optimalRange.includes(dist)

        if (!inRange) {
            nextLogs.push(`${actingPlayer.name} cannot reach ${enemy.name} with ${card.name}.`)
            return { ...state, logs: nextLogs }
        }

        const nextPlayer = spendCosts(actingPlayer)

        // Check Ammo (Skip for Melee/Move/Voicelines)
        const needsAmmo = (card.ammoCost ?? 0) > 0

        if (needsAmmo && actingPlayer.ammo < (card.ammoCost ?? 0)) {
            // ... also check WeaponInstance if possible ...
            // For now, simple check
            nextLogs.push(`${actingPlayer.name} pulls the trigger... CLICK! (No Ammo)`)
            if (onEvent) onEvent(actingPlayer.id, 'CLICK!', 'debuff')

            players[playerIndex] = {
                ...actingPlayer,
                resources: { ...actingPlayer.resources, ap: Math.max(0, actingPlayer.resources.ap - 1) },
            }
            return { ...state, players: [...players], logs: nextLogs }
        }

        players[playerIndex] = nextPlayer
        nextAttacksInTurn++

        const applyAttack = (targetEnemy: Combatant, isMainTarget: boolean) => {
            const idx = enemies.findIndex(e => e.id === targetEnemy.id)
            if (idx < 0 || enemies[idx].isDead) return

            const attackResult = rollAttack(nextPlayer, targetEnemy, 75, ctx.rng)

            if (attackResult.hit) {
                // --- V3 ARMOR LOGIC ---
                // 1. Perception reduces Effective Armor
                const perception = nextPlayer.voices?.perception ?? 0
                // Reduce armor effectiveness by 2% per Perception point
                const armorPenetration = Math.min(1, perception * 0.02)
                const effectiveArmor = Math.max(0, targetEnemy.armor * (1 - armorPenetration))

                // 2. Block Chance based on Armor
                // Simplified: 10% Chance per Armor Point (AC 4 = 40%)
                const blockChance = Math.min(0.9, effectiveArmor * 0.1)

                // 3. Roll for Block
                const isBlocked = ctx.rng() < blockChance

                // 4. Calculate Damage
                // Card damage already includes Scaling (from cardGenerator)
                let finalDamage = card.damage

                if (isBlocked) {
                    // Blocked: Reduce damage by 50% (Standard Mitigation)
                    finalDamage = Math.floor(finalDamage * 0.5)
                    nextLogs.push(`${targetEnemy.name}'s Armor BLOCKS! (Reduced DMG)`)
                    if (onEvent) onEvent(targetEnemy.id, 'BLOCKED', 'debuff')
                } else {
                    // Penetration: Full Damage
                    // Optional: Flat reduction from remaining armor? Design says "Mitigation Gate".
                    // If not blocked, full damage hits.
                }

                finalDamage = Math.max(1, finalDamage)

                let nextStagger = targetEnemy.resources.stagger - card.impact
                if (nextStagger <= 0) {
                    nextStagger = 0
                    nextLogs.push(`${targetEnemy.name} is STAGGERED!`)
                    if (onEvent) onEvent(targetEnemy.id, 'STAGGERED!', 'debuff')
                }

                const nextHp = Math.max(0, targetEnemy.resources.hp - finalDamage)
                enemies[idx] = {
                    ...targetEnemy,
                    resources: { ...targetEnemy.resources, hp: nextHp, stagger: nextStagger },
                    isDead: nextHp <= 0,
                }

                if (nextHp <= 0 && targetEnemy.name === 'Rail Scorpion') onUnlockObj('scorpion_slayer')

                const logMsg = isMainTarget
                    ? `${nextPlayer.name} uses ${card.name}: ${finalDamage} DMG to ${targetEnemy.name}!`
                    : `...Splash hits ${targetEnemy.name} for ${finalDamage} DMG!`

                nextLogs.push(logMsg)
                if (onEvent) onEvent(targetEnemy.id, `-${finalDamage}`, 'damage')
            } else if (isMainTarget) {
                nextLogs.push(`${targetEnemy.name} dodges ${nextPlayer.name}'s ${card.name}!`)
                if (onEvent) onEvent(targetEnemy.id, 'DODGE!', 'miss')
            }
        }

        const aoeRankEffect = card.effects?.find((e) => e.type === 'aoe_rank')
        const aoeAllEffect = card.effects?.find((e) => e.type === 'aoe_all')

        if (aoeAllEffect) {
            const living = enemies.filter(e => !e.isDead)
            living.forEach((e, idx) => applyAttack(e, idx === 0))
        } else if (aoeRankEffect) {
            const sameRank = enemies.filter(e => !e.isDead && e.rank === enemy.rank)
            sameRank.forEach((e, idx) => applyAttack(e, idx === 0))
        } else {
            applyAttack(enemy, true)
        }
    } else if (card.type === CardType.MOVEMENT) {
        const desiredRank = target?.type === 'player-rank' ? target.rank : actingPlayer.rank - 1
        if (desiredRank < 1 || desiredRank > 4) return state

        const nextPlayer = spendCosts(actingPlayer)

        const occupantIndex = players.findIndex(
            (p) => p.id !== nextPlayer.id && !p.isDead && p.rank === desiredRank
        )

        if (occupantIndex >= 0) {
            players[occupantIndex] = { ...players[occupantIndex], rank: nextPlayer.rank }
        }

        players[playerIndex] = { ...nextPlayer, rank: desiredRank }
        nextLogs.push(`${nextPlayer.name} repositions to rank ${desiredRank}.`)
    } else if (card.type === CardType.VOICE) {
        const nextPlayer = spendCosts(actingPlayer)

        const healEffect = card.effects?.find((e) => e.type === 'heal')

        if (healEffect && typeof healEffect.value === 'number') {
            const amount = healEffect.value

            let recipientId = actingPlayer.id
            let recipientIndex = playerIndex

            if (card.targetAllies && targetUnit) {
                const potentialIdx = players.findIndex(p => p.id === targetUnit.id)
                if (potentialIdx >= 0) {
                    recipientId = targetUnit.id
                    recipientIndex = potentialIdx
                }
            }

            players[playerIndex] = nextPlayer

            const finalRecipient = players[recipientIndex]
            const newHp = Math.min(finalRecipient.resources.maxHp, finalRecipient.resources.hp + amount)

            players[recipientIndex] = {
                ...finalRecipient,
                resources: { ...finalRecipient.resources, hp: newHp },
            }

            nextLogs.push(`${nextPlayer.name} uses ${card.name} on ${finalRecipient.name}: Heals ${amount} HP.`)
            if (onEvent) onEvent(recipientId, `+${amount}`, 'heal')
        } else {
            players[playerIndex] = {
                ...nextPlayer,
                resources: {
                    ...nextPlayer.resources,
                    stamina: Math.min(nextPlayer.resources.maxStamina, nextPlayer.resources.stamina + 30),
                },
            }
            nextLogs.push(`${players[playerIndex].name} stabilizes vitals.`)
            if (onEvent) onEvent(actingPlayer.id, '+30 STM', 'heal')
        }
    } else if (card.type === CardType.ITEM) {
        const nextPlayer = spendCosts(actingPlayer)
        const healEffect = card.effects?.find((e) => e.type === 'heal')

        if (healEffect && typeof healEffect.value === 'number') {
            const amount = healEffect.value
            let recipientId = actingPlayer.id
            let recipientIndex = playerIndex
            const canTargetAllies = card.targetAllies || card.id === 'use_medkit'

            if (canTargetAllies && targetUnit) {
                const potentialIdx = players.findIndex(p => p.id === targetUnit.id)
                if (potentialIdx >= 0) {
                    recipientId = targetUnit.id
                    recipientIndex = potentialIdx
                }
            }

            players[playerIndex] = nextPlayer
            const finalRecipient = players[recipientIndex]
            const newHp = Math.min(finalRecipient.resources.maxHp, finalRecipient.resources.hp + amount)

            players[recipientIndex] = {
                ...finalRecipient,
                resources: { ...finalRecipient.resources, hp: newHp },
            }
            nextLogs.push(`${nextPlayer.name} uses ${card.name} on ${finalRecipient.name}: Heals ${amount} HP.`)
            if (onEvent) onEvent(recipientId, `+${amount}`, 'heal')
        } else {
            nextLogs.push(`${nextPlayer.name} uses ${card.name}.`)
            players[playerIndex] = nextPlayer
        }
    } else if (card.type === CardType.ANALYSIS) {
        const enemyId = target?.type === 'enemy' ? target.enemyId : selectedTargetId
        const targetIndex = enemies.findIndex((e) => e.id === enemyId)
        const enemy = targetIndex >= 0 ? enemies[targetIndex] : null

        if (!enemy || enemy.isDead) {
            nextLogs.push('No valid target for analysis.')
            return { ...state, logs: nextLogs }
        }

        const nextPlayer = spendCosts(actingPlayer)
        players[playerIndex] = nextPlayer

        const currentScan = enemy.scannedLevel || 0
        const nextScan = Math.min(2, currentScan + 1)

        enemies[targetIndex] = {
            ...enemy,
            scannedLevel: nextScan,
        }

        let info = ''
        if (nextScan >= 1) info += `HP: ${enemy.resources.hp}/${enemy.resources.maxHp} | ARM: ${enemy.armor}`
        if (nextScan >= 2) info += ` | AP: ${enemy.resources.ap} | THR: ${enemy.threatLevel || 'Unknown'}`

        nextLogs.push(`${nextPlayer.name} scans ${enemy.name}. Analysis: [${info}]`)
        if (onEvent) onEvent(enemy.id, 'SCANNED', 'debuff')
    } else if (card.type === CardType.DEFENSE) {
        nextLogs.push('Defense protocols unavailable.')
        return { ...state, logs: nextLogs }
    } else if (card.type === CardType.RELOAD) {
        // --- RELOAD LOGIC ---
        // Restore ammo to weapon
        const nextPlayer = spendCosts(actingPlayer) // Consumes AP
        // Find weapon mag size. For now assume fixed amount or lookup
        // Simplified: Restore 10 ammo or Full Mag if we had tracking
        const restoredAmount = 15 // Default mag size

        players[playerIndex] = {
            ...nextPlayer,
            ammo: nextPlayer.ammo + restoredAmount,
            // Logic to cap ammo would go here if we tracked MaxAmmo on Combatant
        }
        nextLogs.push(`${nextPlayer.name} reloads.`)
        if (onEvent) onEvent(actingPlayer.id, 'RELOAD', 'buff')
    }

    const nextPlayers = fillEmptyRanks(players)
    const nextEnemies = fillEmptyRanks(enemies)
    const allDead = nextEnemies.every((e) => e.isDead)

    if (allDead) {
        onUnlockObj('first_win')
        if (state.stats.damageTaken === 0) onUnlockObj('no_damage')
    }

    return {
        ...state,
        players: nextPlayers,
        enemies: nextEnemies,
        logs: nextLogs,
        phase: allDead ? 'VICTORY' : state.phase,
        stats: { ...state.stats, attacksInOneTurn: nextAttacksInTurn },
    }
}
