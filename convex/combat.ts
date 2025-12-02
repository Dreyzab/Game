/**
 * =====================================================
 * @deprecated УСТАРЕВШИЙ ФАЙЛ - НЕ ИСПОЛЬЗОВАТЬ
 * =====================================================
 * 
 * Этот файл содержит УСТАРЕВШУЮ реализацию боевой системы.
 * Используйте battleSystem.ts для всех новых разработок.
 * 
 * Основные отличия от battleSystem.ts:
 * - Не поддерживает Trinity Protocol (Card = Weapon + Artifact + Voice)
 * - Не интегрирован с системой снаряжения
 * - Упрощённая логика без рангов и стоек
 * - Нет режима Arena
 * 
 * TODO: Мигрировать всех пользователей на battleSystem.ts и удалить этот файл
 * 
 * @see battleSystem.ts - Актуальная реализация Kinetic Layer v0.4
 */

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { STARTING_SKILLS } from './gameProgress'

// --- Types & Constants ---

type PlayerDoc = Doc<'players'>
type GameProgressDoc = Doc<'game_progress'>
type ItemDoc = Doc<'items'>
type EnemyDoc = Doc<'enemy_instances'>

// Base damage values could be moved to a DB table, but constants work for MVP
const BASE_HAND_DAMAGE = 2
const BASE_STAMINA_REGEN = 5

// --- Helpers ---

// Resolve ownerId from auth
async function getOwnerId(ctx: QueryCtx | MutationCtx, args: { deviceId?: string; userId?: string }) {
  if (args.userId) return args.userId
  if (args.deviceId) return args.deviceId
  throw new Error('No owner identification provided')
}

async function getPlayerByDeviceOrUser(
  ctx: QueryCtx | MutationCtx,
  args: { deviceId?: string; userId?: string }
): Promise<PlayerDoc | null> {
  if (!args.deviceId && !args.userId) return null

  if (args.deviceId) {
    const player = await ctx.db
      .query('players')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId!))
      .first()
    return player ?? null
  }

  if (args.userId) {
    const player = await ctx.db
      .query('players')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId!))
      .first()
    return player ?? null
  }

  return null
}

async function getPlayerAndProgress(ctx: MutationCtx, deviceId: string) {
  const player = await getPlayerByDeviceOrUser(ctx, { deviceId })
  if (!player) throw new Error('Player not found')

  const progress = await ctx.db
    .query('game_progress')
    .withIndex('by_deviceId', (q) => q.eq('deviceId', deviceId))
    .first()
    
  if (!progress) throw new Error('Game progress not found')
  
  return { player, progress }
}

// --- Combat Logic ---

export const startCombat = mutation({
  args: {
    deviceId: v.string(),
    enemyIds: v.array(v.id('enemy_instances')),
    environment: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { player, progress } = await getPlayerAndProgress(ctx, args.deviceId)

    // 1. Check if already in combat
    const existingSession = await ctx.db
      .query('combat_sessions')
      .withIndex('by_player', (q) => q.eq('playerId', player._id))
      .filter(q => q.eq(q.field('isActive'), true))
      .first()
      
    if (existingSession) {
      return { success: false, message: 'Already in combat', sessionId: existingSession._id }
    }

    // 2. Initialize Stats if missing (Migration logic)
    if (progress.hp === undefined || progress.stamina === undefined) {
      await ctx.db.patch(progress._id, {
        hp: 100,
        maxHp: 100,
        stamina: 100,
        maxStamina: 100,
        morale: 100,
        maxMorale: 100
      })
    }

    // 3. Build Deck from Equipment
    // Fetch equipment
    const equipment = await ctx.db
      .query('equipment')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.deviceId)) // Assuming deviceId is owner for now
      .first()

    const deck: any[] = []
    
    // Add default "Fist" cards if no melee weapon
    // In a real system, we'd fetch item details and generate cards based on templateId
    // For MVP, we'll just push basic cards
    deck.push({ id: 'punch_basic', type: 'attack', name: 'Удар кулаком', cost: 10, damage: 2 })
    deck.push({ id: 'dodge_basic', type: 'defense', name: 'Уклонение', cost: 15, defense: 5 })
    deck.push({ id: 'shout_basic', type: 'voice', name: 'Крик', cost: 5, effect: 'morale_boost' })

    const enemyDocs = await Promise.all(args.enemyIds.map((enemyId) => ctx.db.get(enemyId)))
    const enemyStates = enemyDocs
      .filter((enemy): enemy is EnemyDoc => enemy !== null)
      .map((enemy) => ({
        id: enemy._id,
        templateId: enemy.id,
        name: enemy.type,
        rank: 1,
        hp: enemy.health,
        maxHp: enemy.maxHealth,
        morale: enemy.health,
        armor: 0,
        activeEffects: []
      }))

    const playerState = {
      hp: progress.hp ?? 100,
      maxHp: progress.maxHp ?? 100,
      morale: progress.morale ?? 100,
      maxMorale: progress.maxMorale ?? 100,
      stamina: progress.stamina ?? 100,
      maxStamina: progress.maxStamina ?? 100,
      exhaustionLevel: 'none' as const,
      currentWeaponId: undefined,
      currentAmmo: 0,
      weaponCondition: 100,
      weaponHeat: 0,
      activeEffects: []
    }

    const turnOrder = ['player', ...enemyStates.map((e) => e.id)]
    const now = Date.now()

    // 4. Create Session
    const sessionId = await ctx.db.insert('combat_sessions', {
      playerId: player._id,
      deviceId: args.deviceId,
      enemyIds: args.enemyIds,
      isActive: true,
      turn: 1,
      phase: 'player_turn',
      turnOrder,
      currentActorIndex: 0,
      playerRank: 1,
      zoneModifierId: undefined,
      environment: args.environment,
      playerState,
      enemyStates,
      hand: [], // Will draw cards next
      deck,
      discard: [],
      exhaustPile: [],
      log: [{
        turn: 1,
        phase: 'initiative',
        actorId: 'system',
        actorName: 'System',
        action: 'start_combat',
        effects: ['Бой начался!'],
        timestamp: now
      }],
      createdAt: now,
      updatedAt: now
    })

    // 5. Draw Initial Hand (3 cards)
    // logic to move cards from deck to hand...
    // For MVP, we just clone the deck to hand
    await ctx.db.patch(sessionId, {
        hand: deck,
        deck: []
    })

    return { success: true, sessionId }
  }
})

export const playCard = mutation({
  args: {
    deviceId: v.string(),
    sessionId: v.id('combat_sessions'),
    cardId: v.string(),
    targetId: v.optional(v.id('enemy_instances'))
  },
  handler: async (ctx, args) => {
    const { progress } = await getPlayerAndProgress(ctx, args.deviceId)
    const session = await ctx.db.get(args.sessionId)
    if (!session || !session.isActive) throw new Error('Invalid session')

    // 1. Find Card
    const cardIndex = session.hand.findIndex((c: any) => c.id === args.cardId)
    if (cardIndex === -1) throw new Error('Card not in hand')
    const card = session.hand[cardIndex]

    // 2. Check Stamina
    const currentStamina = progress.stamina ?? 100
    if (currentStamina < card.cost) {
      return { success: false, message: 'Не хватает выносливости!' }
    }

    // 3. Apply Effects
    let damage = 0
    let logMessage = ''
    
    // Calculate Scaling (Voice integration from inveAndCombs.md)
    const skills = (progress.skills as Record<string, number>) ?? STARTING_SKILLS
    const aggression = skills['aggression'] ?? 0
    const physics = skills['physics'] ?? 0
    
    if (card.type === 'attack') {
        // Formula: Base * (1 + Aggression/10)
        const scaling = 1 + (aggression / 10)
        damage = Math.floor(card.damage * scaling)
        
        if (args.targetId) {
            const enemy = await ctx.db.get(args.targetId)
            if (enemy) {
                const newHealth = Math.max(0, enemy.health - damage)
                await ctx.db.patch(enemy._id, { health: newHealth })
                logMessage = `Вы нанесли ${damage} урона ${enemy.type}!`
                
                // Death check
                if (newHealth <= 0) {
                     logMessage += ' Враг повержен!'
                     // Remove from enemyIds or mark dead
                }
            }
        }
    }

    // 4. Pay Costs
    await ctx.db.patch(progress._id, {
        stamina: currentStamina - card.cost
    })

    // 5. Update Session (Discard card, Add Log)
    const newHand = [...session.hand]
    newHand.splice(cardIndex, 1)
    
    const newLog = [...session.log, {
        turn: session.turn,
        phase: 'player_turn',
        actorId: 'player',
        actorName: 'player',
        action: card.name,
        damage: damage > 0 ? damage : undefined,
        effects: [logMessage || 'Действие выполнено'],
        timestamp: Date.now()
    }]

    await ctx.db.patch(session._id, {
        hand: newHand,
        discard: [...session.discard, card],
        log: newLog,
        updatedAt: Date.now()
    })

    return { success: true, damage, message: logMessage }
  }
})

export const endTurn = mutation({
    args: {
        deviceId: v.string(),
        sessionId: v.id('combat_sessions')
    },
    handler: async (ctx, args) => {
        const { progress } = await getPlayerAndProgress(ctx, args.deviceId)
        const session = await ctx.db.get(args.sessionId)
        if (!session || !session.isActive) throw new Error('Invalid session')

        // 1. Regenerate Stamina (Voice: Volition)
        const skills = (progress.skills as Record<string, number>) ?? STARTING_SKILLS
        const volition = skills['volition'] ?? 0
        
        const regen = BASE_STAMINA_REGEN + volition // Simple formula
        const currentStamina = progress.stamina ?? 0
        const maxStamina = progress.maxStamina ?? 100
        
        await ctx.db.patch(progress._id, {
            stamina: Math.min(maxStamina, currentStamina + regen)
        })

        // 2. Enemy Turn (Simplistic AI)
        const newLog = [...session.log]
        
        for (const enemyId of session.enemyIds) {
            const enemy =
              (await ctx.db.get(enemyId as Id<'enemy_instances'>)) ??
              (await ctx.db
                .query('enemy_instances')
                .withIndex('by_instance_id', (q) => q.eq('id', enemyId))
                .first())
            if (enemy && enemy.health > 0) {
                // Enemy attacks player
                const dmg = 5 // Constant for MVP
                const currentHp = progress.hp ?? 100
                await ctx.db.patch(progress._id, { hp: Math.max(0, currentHp - dmg) })
                
                newLog.push({
                    turn: session.turn,
                    phase: 'enemy_turn',
                    actorId: enemy._id,
                    actorName: enemy.type,
                    action: 'attack',
                    damage: dmg,
                    effects: [`Враг нанес вам ${dmg} урона!`],
                    timestamp: Date.now()
                })
            }
        }

        // 3. Next Turn
        // Draw cards logic would go here (move discard to deck if empty, draw 5)
        
        await ctx.db.patch(session._id, {
            turn: session.turn + 1,
            phase: 'player_turn',
            log: newLog
        })
        
        return { success: true }
    }
})



















