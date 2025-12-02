/**
 * =====================================================
 * БОЕВАЯ СИСТЕМА "ЭХО ФРАЙБУРГА" v0.4
 * Kinetic Layer - Side-View Combat System
 * Trinity Protocol: Card = Weapon + Artifact + Voice
 * =====================================================
 */

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

// ================== КОНСТАНТЫ ==================

const STAMINA_COSTS = {
  light_attack: 15,
  heavy_attack: 40,
  dash: 20,
  dodge: 25,
  block: 15,
  block_per_hit: 5,
  recover: 0,
} as const

const DEFAULT_TURN_TIME = 12 // секунд

const EXHAUSTION_THRESHOLDS = {
  winded: 30,     // Stamina < 30%
  exhausted: 10,  // Stamina < 10%
  collapsed: 0,   // Stamina = 0
} as const

type CombatRank = 1 | 2 | 3 | 4

type CombatCard = {
  id: string
  name: string
  type: 'attack' | 'defense' | 'movement' | 'voice' | 'cold_steel' | 'posture' | 'jammed' | 'debt' | 'item' | 'reaction'
  staminaCost: number
  damage?: string
  damageType?: string
  targetRanks?: number[]
  ammoCost?: number
  requiredRanks?: CombatRank[]
  effects?: any[]
  sourceWeapon?: string
  sourceArtifact?: string
  scalingVoice?: string
  rarity?: string
  icon?: string
}

// ================== БАЗОВЫЕ КАРТЫ ==================

const BASE_CARDS: Record<string, CombatCard> = {
  punch_basic: {
    id: 'punch_basic',
    name: 'Удар кулаком',
    type: 'attack',
    staminaCost: 10,
    damage: '1d4',
    damageType: 'crushing',
    requiredRanks: [1],
    targetRanks: [1],
    scalingVoice: 'force',
    rarity: 'common',
    icon: '👊'
  },
  dodge_basic: {
    id: 'dodge_basic',
    name: 'Уклонение',
    type: 'defense',
    staminaCost: 25,
    effects: [{ type: 'buff', value: 50, duration: 1, description: '+50% к уклонению' }],
    scalingVoice: 'reaction',
    rarity: 'common',
    icon: '💨'
  },
  block_basic: {
    id: 'block_basic',
    name: 'Блок',
    type: 'defense',
    staminaCost: 15,
    effects: [{ type: 'buff', value: 30, duration: 1, description: '+30% к защите' }],
    scalingVoice: 'resilience',
    rarity: 'common',
    icon: '🛡️'
  },
  advance: {
    id: 'advance',
    name: 'Наступление',
    type: 'movement',
    staminaCost: 15,
    effects: [{ type: 'move', value: -1, description: '+1 ранг вперёд' }],
    scalingVoice: 'courage',
    rarity: 'common',
    icon: '⬆️'
  },
  retreat: {
    id: 'retreat',
    name: 'Отступление',
    type: 'movement',
    staminaCost: 15,
    effects: [{ type: 'move', value: 1, description: '+1 ранг назад' }],
    rarity: 'common',
    icon: '⬇️'
  },
  dash: {
    id: 'dash',
    name: 'Рывок',
    type: 'movement',
    staminaCost: 20,
    effects: [{ type: 'move', value: -2, description: '+2 ранга вперёд' }],
    scalingVoice: 'endurance',
    rarity: 'uncommon',
    icon: '⚡'
  },
  recover: {
    id: 'recover',
    name: 'Восстановление',
    type: 'defense',
    staminaCost: 0,
    effects: [{ type: 'stamina_restore', value: 30, targetSelf: true, description: '+30 выносливости' }],
    scalingVoice: 'endurance',
    rarity: 'common',
    icon: '😤'
  },
  // Голосовые карты
  intimidate: {
    id: 'intimidate',
    name: 'Запугивание',
    type: 'voice',
    staminaCost: 10,
    targetRanks: [1, 2, 3],
    effects: [
      { type: 'fear', value: 20, chance: 50, duration: 1, description: '50% страх' },
      { type: 'morale_damage', value: 10, description: '-10 морали' }
    ],
    scalingVoice: 'authority',
    rarity: 'uncommon',
    icon: '😠'
  },
  rally: {
    id: 'rally',
    name: 'Воодушевление',
    type: 'voice',
    staminaCost: 15,
    effects: [
      { type: 'morale_boost', value: 15, targetSelf: true, description: '+15 морали' },
      { type: 'buff', value: 10, duration: 2, targetSelf: true, description: '+10% урона' }
    ],
    scalingVoice: 'courage',
    rarity: 'uncommon',
    icon: '🔥'
  },
  analyze_weakness: {
    id: 'analyze_weakness',
    name: 'Анализ Слабости',
    type: 'voice',
    staminaCost: 10,
    targetRanks: [1, 2, 3, 4],
    effects: [{ type: 'debuff', value: 25, duration: 3, description: '+25% урона по цели' }],
    scalingVoice: 'analysis',
    rarity: 'rare',
    icon: '🔍'
  },
  taunt: {
    id: 'taunt',
    name: 'Провокация',
    type: 'voice',
    staminaCost: 8,
    targetRanks: [1, 2, 3, 4],
    effects: [{ type: 'taunt', value: 0, duration: 2, description: 'Враг атакует только вас' }],
    scalingVoice: 'drama',
    rarity: 'common',
    icon: '🎭'
  },
  confuse: {
    id: 'confuse',
    name: 'Замешательство',
    type: 'voice',
    staminaCost: 20,
    targetRanks: [1, 2, 3],
    effects: [{ type: 'confusion', value: 30, chance: 60, duration: 2, description: '60% замешательство' }],
    scalingVoice: 'suggestion',
    rarity: 'rare',
    icon: '🌀'
  },
  counter_attack: {
    id: 'counter_attack',
    name: 'Контратака',
    type: 'reaction',
    staminaCost: 30,
    damage: '1d6+2',
    damageType: 'physical',
    requiredRanks: [1, 2],
    targetRanks: [1],
    scalingVoice: 'reaction',
    rarity: 'rare',
    icon: '⚔️'
  },
  interrupt: {
    id: 'interrupt',
    name: 'Прерывание',
    type: 'reaction',
    staminaCost: 25,
    effects: [{ type: 'interrupt', value: 100, description: 'Прерывает действие врага' }],
    scalingVoice: 'reaction',
    rarity: 'rare',
    icon: '✋'
  },
  // Arena-specific
  posture_aggressive: {
    id: 'posture_aggressive',
    name: 'Агрессивная стойка',
    type: 'posture',
    staminaCost: 10,
    effects: [{ type: 'buff', value: 20, duration: 2, description: '+20% урон, -10% защита' }],
    rarity: 'common',
    icon: '😤'
  },
  posture_defensive: {
    id: 'posture_defensive',
    name: 'Защитная стойка',
    type: 'posture',
    staminaCost: 10,
    effects: [{ type: 'buff', value: 20, duration: 2, description: '+20% защита, -10% урон' }],
    rarity: 'common',
    icon: '🛡️'
  },
  posture_evasive: {
    id: 'posture_evasive',
    name: 'Уклончивая стойка',
    type: 'posture',
    staminaCost: 15,
    effects: [{ type: 'buff', value: 30, duration: 2, description: '+30% уклонение' }],
    rarity: 'common',
    icon: '💨'
  }
}

// ================== УТИЛИТЫ ==================

function rollDice(notation: string): number {
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/)
  if (!match) return 0

  const count = parseInt(match[1])
  const sides = parseInt(match[2])
  const modifier = match[3] ? parseInt(match[3]) : 0

  let total = modifier
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1
  }
  return total
}

function calculateJamChance(
  condition: number,
  heat: number,
  analysisLevel: number
): number {
  const chance = (100 - condition) * 0.2 + (heat * 0.1) - (analysisLevel * 0.5)
  return Math.max(0, Math.min(100, chance))
}

function getExhaustionLevel(
  currentStamina: number,
  maxStamina: number
): 'none' | 'winded' | 'exhausted' | 'collapsed' {
  const percent = (currentStamina / maxStamina) * 100
  if (percent <= 0) return 'collapsed'
  if (percent < 10) return 'exhausted'
  if (percent < 30) return 'winded'
  return 'none'
}

/**
 * Определяет доминирующий голос на основе уровней скиллов
 */
function getDominantVoice(skills: Record<string, number>): string {
  let maxVoice = 'force'
  let maxLevel = 0
  
  for (const [voice, level] of Object.entries(skills)) {
    if (level > maxLevel) {
      maxLevel = level
      maxVoice = voice
    }
  }
  
  return maxVoice
}

/**
 * Получает снаряжение игрока из БД
 */
async function getPlayerEquipment(ctx: MutationCtx, deviceId: string) {
  // Получаем equipment mapping
  const equipment = await ctx.db
    .query('equipment')
    .withIndex('by_owner', (q) => q.eq('ownerId', deviceId))
    .first()

  if (!equipment) {
    return {
      weapons: [] as string[],
      artifacts: [] as string[],
      primaryWeapon: null as any,
      secondaryWeapon: null as any,
      meleeWeapon: null as any
    }
  }

  // Получаем все экипированные предметы
  const itemIds = [
    equipment.slots.primary,
    equipment.slots.secondary,
    equipment.slots.melee
  ].filter(Boolean)

  const items = await Promise.all(
    itemIds.map(async (id) => {
      if (!id) return null
      return await ctx.db.get(id)
    })
  )

  // Собираем templateId оружия
  const weapons: string[] = []
  let primaryWeapon = null
  let secondaryWeapon = null
  let meleeWeapon = null

  if (equipment.slots.primary) {
    const item = items.find(i => i?._id === equipment.slots.primary)
    if (item) {
      weapons.push(item.templateId)
      primaryWeapon = item
    }
  }

  if (equipment.slots.secondary) {
    const item = items.find(i => i?._id === equipment.slots.secondary)
    if (item) {
      weapons.push(item.templateId)
      secondaryWeapon = item
    }
  }

  if (equipment.slots.melee) {
    const item = items.find(i => i?._id === equipment.slots.melee)
    if (item) {
      weapons.push(item.templateId)
      meleeWeapon = item
    }
  }

  // Получаем артефакты
  const artifactIds = equipment.slots.artifacts || []
  const artifactItems = await Promise.all(
    artifactIds.map(async (id) => {
      if (!id) return null
      return await ctx.db.get(id)
    })
  )
  const artifacts = artifactItems
    .filter((i): i is NonNullable<typeof i> => i !== null)
    .map(i => i.templateId)

  return {
    weapons,
    artifacts,
    primaryWeapon,
    secondaryWeapon,
    meleeWeapon
  }
}

/**
 * Генерирует боевую колоду на основе снаряжения
 * Trinity Protocol: Card = Weapon + Artifact + Voice
 */
async function generateDeckFromEquipment(
  ctx: MutationCtx,
  deviceId: string,
  skills: Record<string, number>,
  mode: 'standard' | 'arena'
): Promise<{ deck: CombatCard[]; weaponId: string | null; ammo: number; condition: number }> {
  const deck: CombatCard[] = []
  
  // 1. Добавляем базовые карты
  deck.push(BASE_CARDS.punch_basic)
  deck.push(BASE_CARDS.dodge_basic)
  deck.push(BASE_CARDS.block_basic)
  deck.push(BASE_CARDS.recover)

  if (mode === 'standard') {
    deck.push(BASE_CARDS.advance)
    deck.push(BASE_CARDS.retreat)
    deck.push(BASE_CARDS.dash)
  } else {
    // Arena mode - стойки
    deck.push(BASE_CARDS.posture_defensive)
    deck.push(BASE_CARDS.posture_aggressive)
    deck.push(BASE_CARDS.posture_evasive)
  }

  // 2. Получаем снаряжение
  const equipment = await getPlayerEquipment(ctx, deviceId)
  const dominantVoice = getDominantVoice(skills)
  
  let primaryWeaponId: string | null = null
  let totalAmmo = 0
  let weaponCondition = 100

  // 3. Генерируем карты из оружия
  for (const weaponTemplateId of equipment.weapons) {
    const weaponTemplate = await ctx.db
      .query('weapon_templates')
      .withIndex('by_weapon_id', (q) => q.eq('id', weaponTemplateId))
      .first()

    if (!weaponTemplate) continue

    // Первое оружие - основное
    if (!primaryWeaponId) {
      primaryWeaponId = weaponTemplate.id
      
      // Получаем состояние оружия из предмета
      if (equipment.primaryWeapon) {
        weaponCondition = equipment.primaryWeapon.condition ?? 100
        totalAmmo = equipment.primaryWeapon.ammo ?? (weaponTemplate.magazineSize || 0)
      } else {
        totalAmmo = weaponTemplate.magazineSize || 0
      }
    }

    // Создаём карту атаки
    const attackCard: CombatCard = {
      id: `attack_${weaponTemplate.id}`,
      name: `Атака: ${weaponTemplate.nameRu}`,
      type: 'attack',
      staminaCost: weaponTemplate.isRanged ? 15 : 20,
      damage: weaponTemplate.damage || '1d6',
      damageType: weaponTemplate.damageType,
      targetRanks: weaponTemplate.range as number[],
      ammoCost: weaponTemplate.isRanged ? 1 : 0,
      sourceWeapon: weaponTemplate.id,
      scalingVoice: dominantVoice,
      rarity: 'common',
      icon: weaponTemplate.isRanged ? '🔫' : '⚔️'
    }
    
    // Применяем скейлинг от голоса
    const voiceLevel = skills[dominantVoice] || 0
    if (voiceLevel > 20) {
      attackCard.rarity = 'uncommon'
    }
    if (voiceLevel > 40) {
      attackCard.rarity = 'rare'
    }

    deck.push(attackCard)

    // Cold Steel карта (когда пустой магазин)
    if (weaponTemplate.coldSteelAction) {
      const coldSteelCard: CombatCard = {
        id: `cold_steel_${weaponTemplate.id}`,
        name: weaponTemplate.coldSteelAction.nameRu,
        type: 'cold_steel',
        staminaCost: weaponTemplate.coldSteelAction.staminaCost,
        damage: weaponTemplate.coldSteelAction.damage,
        damageType: weaponTemplate.coldSteelAction.damageType,
        requiredRanks: weaponTemplate.coldSteelAction.validRanks as CombatRank[],
        targetRanks: weaponTemplate.coldSteelAction.validRanks as number[],
        effects: weaponTemplate.coldSteelAction.effects,
        sourceWeapon: weaponTemplate.id,
        scalingVoice: weaponTemplate.coldSteelAction.requiredVoice,
        rarity: 'common',
        icon: '🔨'
      }
      deck.push(coldSteelCard)
    }
  }

  // 4. Артефакты - модификаторы (TODO: применить модификаторы к картам)
  // Пока просто логируем для будущей реализации
  if (equipment.artifacts.length > 0) {
    console.log('Equipped artifacts:', equipment.artifacts)
  }

  // 5. Голосовые карты на основе уровней
  if ((skills.authority ?? 0) >= 20) deck.push(BASE_CARDS.intimidate)
  if ((skills.courage ?? 0) >= 20) deck.push(BASE_CARDS.rally)
  if ((skills.analysis ?? 0) >= 25) deck.push(BASE_CARDS.analyze_weakness)
  if ((skills.drama ?? 0) >= 15) deck.push(BASE_CARDS.taunt)
  if ((skills.suggestion ?? 0) >= 30) deck.push(BASE_CARDS.confuse)
  if ((skills.reaction ?? 0) >= 35) deck.push(BASE_CARDS.counter_attack)
  if ((skills.reaction ?? 0) >= 40) deck.push(BASE_CARDS.interrupt)

  return {
    deck,
    weaponId: primaryWeaponId,
    ammo: totalAmmo,
    condition: weaponCondition
  }
}

// ================== QUERIES ==================

/**
 * Получить активную боевую сессию
 */
export const getActiveBattle = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('combat_sessions')
      .withIndex('by_device', (q) => q.eq('deviceId', args.deviceId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .first()

    return session
  }
})

/**
 * Получить историю боёв
 */
export const getBattleHistory = query({
  args: {
    deviceId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const battles = await ctx.db
      .query('combat_sessions')
      .withIndex('by_device', (q) => q.eq('deviceId', args.deviceId))
      .order('desc')
      .take(args.limit || 10)

    return battles
  }
})

/**
 * Получить шаблон врага
 */
export const getEnemyTemplate = query({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query('enemy_templates')
      .withIndex('by_enemy_id', (q) => q.eq('id', args.templateId))
      .first()

    return template
  }
})

/**
 * Получить модификатор зоны
 */
export const getCombatZone = query({
  args: { zoneId: v.string() },
  handler: async (ctx, args) => {
    const zone = await ctx.db
      .query('combat_zones')
      .withIndex('by_zone_id', (q) => q.eq('id', args.zoneId))
      .first()

    return zone
  }
})

// ================== MUTATIONS ==================

/**
 * Начать бой (Kinetic Layer)
 */
export const startBattle = mutation({
  args: {
    deviceId: v.string(),
    enemyTemplateIds: v.array(v.string()),
    zoneId: v.optional(v.string()),
    environment: v.optional(v.string()),
    playerWeaponId: v.optional(v.string()),
    playerAmmo: v.optional(v.number()),
    mode: v.optional(v.string()) // 'standard' | 'arena'
  },
  handler: async (ctx, args) => {
    const mode = (args.mode as 'standard' | 'arena') || 'standard'

    // 1. Проверяем, нет ли активного боя
    const existingBattle = await ctx.db
      .query('combat_sessions')
      .withIndex('by_device', (q) => q.eq('deviceId', args.deviceId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .first()

    if (existingBattle) {
      return { success: false, error: 'Already in combat', sessionId: existingBattle._id }
    }

    // 2. Получаем игрока и прогресс
    const player = await ctx.db
      .query('players')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
      .first()

    if (!player) {
      return { success: false, error: 'Player not found' }
    }

    const progress = await ctx.db
      .query('game_progress')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
      .first()

    if (!progress) {
      return { success: false, error: 'Game progress not found' }
    }

    // 3. Инициализируем состояние игрока
    const hp = progress.hp ?? 100
    const maxHp = progress.maxHp ?? 100
    const stamina = progress.stamina ?? 100
    const maxStamina = progress.maxStamina ?? 100
    const morale = progress.morale ?? 100
    const maxMorale = progress.maxMorale ?? 100
    const skills = (progress.skills as Record<string, number>) ?? {}

    // 4. Создаём состояния врагов
    const enemyStates: Array<{
      id: string
      templateId: string
      name: string
      rank: number
      hp: number
      maxHp: number
      morale: number
      armor: number
      activeEffects: Array<{ type: string; value: number; remainingTurns: number; source: string }>
    }> = []

    for (let i = 0; i < args.enemyTemplateIds.length; i++) {
      const templateId = args.enemyTemplateIds[i]
      const template = await ctx.db
        .query('enemy_templates')
        .withIndex('by_enemy_id', (q) => q.eq('id', templateId))
        .first()

      if (template) {
        // Распределяем врагов по рангам
        const preferredRank = template.preferredRanks[i % template.preferredRanks.length] || 1

        enemyStates.push({
          id: `enemy_${i}_${Date.now()}`,
          templateId,
          name: template.nameRu,
          rank: preferredRank,
          hp: template.hp,
          maxHp: template.hp,
          morale: template.morale,
          armor: template.armor,
          activeEffects: []
        })
      }
    }

    if (enemyStates.length === 0) {
      return { success: false, error: 'No valid enemies' }
    }

    // 5. Определяем порядок хода (инициатива)
    const reactionSkill = skills['reaction'] ?? 0
    const playerInitiative = 10 + reactionSkill / 5 + Math.random() * 5

    const turnOrder: string[] = []
    const initiatives: Array<{ id: string; init: number }> = [
      { id: 'player', init: playerInitiative }
    ]

    for (const enemy of enemyStates) {
      initiatives.push({
        id: enemy.id,
        init: 5 + Math.random() * 10
      })
    }

    initiatives.sort((a, b) => b.init - a.init)
    turnOrder.push(...initiatives.map(i => i.id))

    // 6. Генерируем колоду из снаряжения (Trinity Protocol)
    const deckResult = await generateDeckFromEquipment(ctx, args.deviceId, skills, mode)
    
    // Используем оружие из снаряжения или fallback на переданный ID
    const weaponId = deckResult.weaponId || args.playerWeaponId || null
    const weaponAmmo = deckResult.ammo || args.playerAmmo || 0
    const weaponCondition = deckResult.condition

    // Перемешиваем колоду (Fisher-Yates shuffle)
    const shuffled = [...deckResult.deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    const hand = shuffled.slice(0, 5)
    const deck = shuffled.slice(5)

    // 7. Создаём сессию боя
    const now = Date.now()
    const sessionId = await ctx.db.insert('combat_sessions', {
      playerId: player._id,
      deviceId: args.deviceId,
      mode,
      enemyIds: enemyStates.map(e => e.id),
      isActive: true,

      turn: 1,
      phase: turnOrder[0] === 'player' ? 'player_turn' : 'enemy_turn',
      turnOrder,
      currentActorIndex: 0,
      turnTimeRemaining: DEFAULT_TURN_TIME,

      playerRank: 3, // Начинаем в тылу
      zoneModifierId: args.zoneId,
      environment: args.environment,

      playerState: {
        hp,
        maxHp,
        morale,
        maxMorale,
        stamina,
        maxStamina,
        exhaustionLevel: 'none',
        currentWeaponId: weaponId ?? undefined,
        currentAmmo: weaponAmmo,
        weaponCondition,
        weaponHeat: 0,
        activeEffects: [],
        posture: mode === 'arena' ? 'neutral' : undefined,
        jamState: mode === 'arena' ? { isJammed: false, jamChance: 0, accumulatedHeat: 0 } : undefined
      },

      enemyStates,

      hand,
      deck,
      discard: [],
      exhaustPile: [],

      log: [{
        turn: 1,
        phase: 'initiative',
        actorId: 'system',
        actorName: 'Система',
        action: 'Бой начался!',
        effects: [`Порядок хода: ${turnOrder.map(id => id === 'player' ? 'Игрок' : enemyStates.find(e => e.id === id)?.name || id).join(' → ')}`],
        timestamp: now
      }],

      createdAt: now,
      updatedAt: now
    })

    return {
      success: true,
      sessionId,
      initialPhase: turnOrder[0] === 'player' ? 'player_turn' : 'enemy_turn',
      turnOrder
    }
  }
})

/**
 * Разыграть карту
 * Улучшенная версия с полной валидацией
 */
export const playCard = mutation({
  args: {
    deviceId: v.string(),
    sessionId: v.id('combat_sessions'),
    cardId: v.string(),
    targetEnemyId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // === ВАЛИДАЦИЯ СЕССИИ ===
    const session = await ctx.db.get(args.sessionId)
    if (!session) {
      return { success: false, error: 'Сессия боя не найдена', errorCode: 'SESSION_NOT_FOUND' }
    }
    
    if (!session.isActive) {
      return { success: false, error: 'Бой уже завершён', errorCode: 'SESSION_INACTIVE' }
    }

    if (session.deviceId !== args.deviceId) {
      return { success: false, error: 'Неверный игрок', errorCode: 'WRONG_PLAYER' }
    }

    if (session.phase !== 'player_turn') {
      return { success: false, error: 'Сейчас не ваш ход', errorCode: 'NOT_YOUR_TURN' }
    }

    // === ВАЛИДАЦИЯ КАРТЫ ===
    const cardIndex = session.hand.findIndex((c: any) => c.id === args.cardId)
    if (cardIndex === -1) {
      return { success: false, error: 'Карта не найдена в руке', errorCode: 'CARD_NOT_IN_HAND' }
    }

    const card = session.hand[cardIndex] as CombatCard
    if (!card) {
      return { success: false, error: 'Ошибка данных карты', errorCode: 'CARD_DATA_ERROR' }
    }
    
    const playerState = session.playerState

    // === ВАЛИДАЦИЯ РЕСУРСОВ ===
    if (playerState.stamina < card.staminaCost) {
      return { 
        success: false, 
        error: `Недостаточно выносливости! Нужно: ${card.staminaCost}, есть: ${playerState.stamina}`,
        errorCode: 'NOT_ENOUGH_STAMINA'
      }
    }

    // === ВАЛИДАЦИЯ ПОЗИЦИИ (Standard Mode) ===
    if (session.mode !== 'arena' && card.requiredRanks && card.requiredRanks.length > 0) {
      if (!card.requiredRanks.includes(session.playerRank as CombatRank)) {
        return { 
          success: false, 
          error: `Неверная позиция! Карта требует ранг ${card.requiredRanks.join(' или ')}, вы на ранге ${session.playerRank}`,
          errorCode: 'WRONG_RANK'
        }
      }
    }

    // === ВАЛИДАЦИЯ ЦЕЛИ ===
    if ((card.type === 'attack' || card.type === 'cold_steel' || card.type === 'voice') && card.targetRanks) {
      if (!args.targetEnemyId) {
        // Auto-target первого живого врага если цель не указана
        const firstAliveEnemy = session.enemyStates.find((e: any) => e.hp > 0)
        if (!firstAliveEnemy) {
          return { success: false, error: 'Нет доступных целей', errorCode: 'NO_TARGETS' }
        }
        // Используем auto-target
        args.targetEnemyId = firstAliveEnemy.id
      } else {
        // Проверяем что цель существует и жива
        const targetEnemy = session.enemyStates.find((e: any) => e.id === args.targetEnemyId)
        if (!targetEnemy) {
          return { success: false, error: 'Цель не найдена', errorCode: 'TARGET_NOT_FOUND' }
        }
        if (targetEnemy.hp <= 0) {
          return { success: false, error: 'Цель уже мертва', errorCode: 'TARGET_DEAD' }
        }
        // Проверяем досягаемость
        if (card.targetRanks && !card.targetRanks.includes(targetEnemy.rank)) {
          return { 
            success: false, 
            error: `Цель вне досягаемости! Карта достаёт ранги ${card.targetRanks.join(', ')}, враг на ранге ${targetEnemy.rank}`,
            errorCode: 'TARGET_OUT_OF_RANGE'
          }
        }
      }
    }

    // Проверяем патроны для дальнобойного оружия
    if (card.type === 'attack' && card.ammoCost && playerState.currentAmmo < (card.ammoCost || 1)) {
      // МОМЕНТ ЩЕЛЧКА (Click Moment)!
      const newLog = [...session.log, {
        turn: session.turn,
        phase: 'player_turn',
        actorId: 'player',
        actorName: 'Игрок',
        action: 'ЩЕЛЧОК! Магазин пуст!',
        effects: ['Ход потерян', 'Враг получает бонус к инициативе'],
        voiceComment: {
          voiceId: 'gambling',
          voiceName: 'АЗАРТ',
          comment: 'Ха! Теперь по-настоящему интересно!'
        },
        timestamp: Date.now()
      }]

      // Обновляем сессию
      await ctx.db.patch(args.sessionId, {
        lastClickMoment: {
          turn: session.turn,
          weaponId: playerState.currentWeaponId || 'unknown',
          consequence: 'turn_lost'
        },
        log: newLog,
        phase: 'enemy_turn',
        currentActorIndex: (session.currentActorIndex + 1) % session.turnOrder.length,
        updatedAt: Date.now()
      })

      return {
        success: false,
        error: 'Click Moment! Magazine empty!',
        clickMoment: true
      }
    }

    // JAMMING LOGIC (Arena only)
    if (session.mode === 'arena' && card.type === 'attack' && playerState.jamState && !playerState.jamState.isJammed) {
      // Get player skills from game_progress
      const progress = await ctx.db
        .query('game_progress')
        .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
        .first()
      const skills = (progress?.skills as Record<string, number>) ?? {}
      
      // Calculate jam chance
      const jamChance = calculateJamChance(
        playerState.weaponCondition,
        playerState.jamState.accumulatedHeat,
        (skills.analysis ?? 0)
      )

      if (Math.random() * 100 < jamChance) {
        // JAMMED!
        const newLog = [...session.log, {
          turn: session.turn,
          phase: 'player_turn',
          actorId: 'player',
          actorName: 'Игрок',
          action: 'ЗАКЛИНИЛО!',
          effects: ['Оружие заклинило', 'Карта потеряна'],
          timestamp: Date.now()
        }]

        // Replace card with JAMMED card
        const newHand = [...session.hand]
        newHand[cardIndex] = {
          id: `jammed_${Date.now()}`,
          name: 'ЗАКЛИНИЛО',
          type: 'jammed',
          staminaCost: 20,
          effects: []
        }

        await ctx.db.patch(args.sessionId, {
          log: newLog,
          hand: newHand,
          playerState: {
            ...playerState,
            jamState: { ...playerState.jamState, isJammed: true }
          },
          updatedAt: Date.now()
        })

        return { success: false, error: 'Weapon Jammed!', jammed: true }
      }

      // Increase heat
      playerState.jamState.accumulatedHeat += 10
    }

    // Выполняем действие карты
    let damage = 0
    let targetName = ''
    const effects: string[] = []
    const newEnemyStates = [...session.enemyStates]
    let newPlayerRank = session.playerRank

    // Атака
    if (card.type === 'attack' || card.type === 'cold_steel') {
      if (args.targetEnemyId) {
        const targetIndex = newEnemyStates.findIndex((e: any) => e.id === args.targetEnemyId)
        if (targetIndex !== -1) {
          const target = newEnemyStates[targetIndex]

          // Проверяем, можем ли атаковать этот ранг
          if (card.targetRanks && !card.targetRanks.includes(target.rank)) {
            return { success: false, error: 'Цель вне досягаемости!' }
          }

          // Рассчитываем урон
          damage = rollDice(card.damage || '1d4')

          // Применяем броню
          const actualDamage = Math.max(0, damage - target.armor)
          target.hp -= actualDamage
          targetName = target.name

          effects.push(`${actualDamage} урона`)

          if (target.hp <= 0) {
            effects.push('Враг повержен!')
          }

          newEnemyStates[targetIndex] = target
        }
      }
    }

    // Перемещение
    if (card.type === 'movement') {
      if (card.id === 'advance' || card.id === 'dash') {
        const moveAmount = card.id === 'dash' ? 2 : 1
        newPlayerRank = Math.max(1, session.playerRank - moveAmount) as 1 | 2 | 3 | 4
        effects.push(`Перемещение на ранг ${newPlayerRank}`)
      } else if (card.id === 'retreat') {
        newPlayerRank = Math.min(4, session.playerRank + 1) as 1 | 2 | 3 | 4
        effects.push(`Отступление на ранг ${newPlayerRank}`)
      }
    }

    // Защита
    if (card.type === 'defense') {
      if (card.id === 'recover') {
        effects.push('+30 к выносливости')
      } else if (card.id === 'dodge_basic') {
        effects.push('+50% к уклонению')
      } else if (card.id === 'block_basic') {
        effects.push('+30% к защите')
      }
    }

    // Голосовые карты
    if (card.type === 'voice') {
      if (card.id === 'intimidate' && args.targetEnemyId) {
        effects.push('-10 к морали врага')
        effects.push('50% шанс страха')
      } else if (card.id === 'rally') {
        effects.push('+15 к морали')
        effects.push('+10% к урону на 2 хода')
      } else if (card.id === 'analyze_weakness' && args.targetEnemyId) {
        effects.push('Враг получает +25% урона на 3 хода')
      }
    }

    // Posture cards
    if (card.type === 'posture') {
      if (card.id === 'posture_aggressive') {
        playerState.posture = 'aggressive'
        effects.push('Агрессивная стойка (+Dmg, -Def)')
      } else if (card.id === 'posture_defensive') {
        playerState.posture = 'defensive'
        effects.push('Защитная стойка (+Def, -Dmg)')
      }
    }

    // Jammed card clearing
    if (card.type === 'jammed') {
      if (playerState.jamState) {
        playerState.jamState = { 
          ...playerState.jamState, 
          isJammed: false, 
          accumulatedHeat: 0,
          jamChance: playerState.jamState.jamChance ?? 0
        }
      }
      effects.push('Оружие починено')
    }

    // Обновляем состояние игрока
    const newStamina = Math.max(0, playerState.stamina - card.staminaCost)
    const newAmmo = card.ammoCost ? playerState.currentAmmo - (card.ammoCost || 0) : playerState.currentAmmo
    const newExhaustion = getExhaustionLevel(newStamina, playerState.maxStamina)

    // Карта "Восстановление" восстанавливает стамину
    const staminaAfterRecover = card.id === 'recover'
      ? Math.min(playerState.maxStamina, newStamina + 30)
      : newStamina

    // Обновляем руку и сброс
    const newHand = [...session.hand]
    newHand.splice(cardIndex, 1)
    const newDiscard = [...session.discard, card]

    // Добавляем в лог
    const newLog = [...session.log, {
      turn: session.turn,
      phase: 'player_turn',
      actorId: 'player',
      actorName: 'Игрок',
      action: card.name,
      targets: targetName ? [targetName] : undefined,
      damage: damage > 0 ? damage : undefined,
      effects,
      timestamp: Date.now()
    }]

    // Обновляем сессию
    await ctx.db.patch(args.sessionId, {
      playerRank: newPlayerRank,
      playerState: {
        ...playerState,
        stamina: staminaAfterRecover,
        currentAmmo: newAmmo,
        exhaustionLevel: newExhaustion
      },
      enemyStates: newEnemyStates,
      hand: newHand,
      discard: newDiscard,
      log: newLog,
      updatedAt: Date.now()
    })

    // Проверяем победу
    const aliveEnemies = newEnemyStates.filter((e: any) => e.hp > 0)
    if (aliveEnemies.length === 0) {
      await ctx.db.patch(args.sessionId, {
        phase: 'victory',
        isActive: false,
        log: [...newLog, {
          turn: session.turn,
          phase: 'victory',
          actorId: 'system',
          actorName: 'Система',
          action: 'Победа!',
          timestamp: Date.now()
        }]
      })

      return { success: true, victory: true, damage }
    }

    return { success: true, damage, effects }
  }
})

/**
 * Завершить ход
 */
export const endTurn = mutation({
  args: {
    deviceId: v.string(),
    sessionId: v.id('combat_sessions')
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session || !session.isActive) {
      return { success: false, error: 'Invalid session' }
    }

    const now = Date.now()
    const newLog = [...session.log]

    // Переход к следующему актору
    let newActorIndex = (session.currentActorIndex + 1) % session.turnOrder.length
    let newPhase = session.phase
    let newTurn = session.turn

    // Если начинается новый раунд
    if (newActorIndex === 0) {
      newTurn += 1

      // Добираем карты
      let newDeck = [...session.deck]
      let newHand = [...session.hand]
      const drawCount = Math.max(0, 5 - newHand.length)

      if (newDeck.length < drawCount) {
        // Перемешиваем сброс в колоду
        newDeck = [...newDeck, ...session.discard.sort(() => Math.random() - 0.5)]
        await ctx.db.patch(args.sessionId, { discard: [] })
      }

      const drawn = newDeck.slice(0, drawCount)
      newDeck = newDeck.slice(drawCount)
      newHand = [...newHand, ...drawn]

      await ctx.db.patch(args.sessionId, {
        hand: newHand,
        deck: newDeck
      })

      newLog.push({
        turn: newTurn,
        phase: 'resolution',
        actorId: 'system',
        actorName: 'Система',
        action: `Раунд ${newTurn}`,
        effects: drawn.length > 0 ? [`Добрано карт: ${drawn.length}`] : undefined,
        timestamp: now
      })
    }

    // Определяем фазу
    const nextActor = session.turnOrder[newActorIndex]
    if (nextActor === 'player') {
      newPhase = 'player_turn'

      // Восстанавливаем немного стамины
      const playerState = session.playerState
      const progress = await ctx.db
        .query('game_progress')
        .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
        .first()

      const endurance = ((progress?.skills as Record<string, number> | undefined)?.endurance) ?? 0
      const regenAmount = 5 + endurance

      const newStamina = Math.min(playerState.maxStamina, playerState.stamina + regenAmount)

      await ctx.db.patch(args.sessionId, {
        playerState: {
          ...playerState,
          stamina: newStamina,
          exhaustionLevel: getExhaustionLevel(newStamina, playerState.maxStamina)
        }
      })
    } else {
      newPhase = 'enemy_turn'

      // Выполняем ход врага
      const enemy = session.enemyStates.find((e: any) => e.id === nextActor)
      if (enemy && enemy.hp > 0) {
        // Простой AI: атакует игрока
        const baseDamage = 5 + Math.floor(enemy.hp / 20) // Урон зависит от макс HP
        const playerState = session.playerState
        const newHp = Math.max(0, playerState.hp - baseDamage)

        newLog.push({
          turn: newTurn,
          phase: 'enemy_turn',
          actorId: enemy.id,
          actorName: enemy.name,
          action: 'Атака',
          targets: ['Игрок'],
          damage: baseDamage,
          timestamp: now
        })

        // Проверяем поражение
        if (newHp <= 0) {
          await ctx.db.patch(args.sessionId, {
            playerState: { ...playerState, hp: 0 },
            phase: 'defeat',
            isActive: false,
            log: [...newLog, {
              turn: newTurn,
              phase: 'defeat',
              actorId: 'system',
              actorName: 'Система',
              action: 'Поражение...',
              timestamp: now
            }]
          })

          return { success: true, defeat: true }
        }

        await ctx.db.patch(args.sessionId, {
          playerState: { ...playerState, hp: newHp }
        })
      }
    }

    await ctx.db.patch(args.sessionId, {
      turn: newTurn,
      phase: newPhase,
      currentActorIndex: newActorIndex,
      turnTimeRemaining: DEFAULT_TURN_TIME,
      log: newLog,
      updatedAt: now
    })

    return { success: true, newPhase, newTurn }
  }
})

/**
 * Убежать из боя
 */
export const fleeBattle = mutation({
  args: {
    deviceId: v.string(),
    sessionId: v.id('combat_sessions')
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session || !session.isActive) {
      return { success: false, error: 'Invalid session' }
    }

    // Проверяем, может ли игрок убежать (нужен ранг 4)
    if (session.playerRank !== 4) {
      return { success: false, error: 'Нужно отступить на ранг 4 для побега!' }
    }

    // Шанс побега зависит от скорости
    const progress = await ctx.db
      .query('game_progress')
      .withIndex('by_deviceId', (q) => q.eq('deviceId', args.deviceId))
      .first()

    const skills = (progress?.skills as any) ?? {}
    const reactionSkill = skills.reaction ?? 0
    const fleeChance = 50 + reactionSkill // 50% базовый + бонус от реакции

    const roll = Math.random() * 100

    if (roll <= fleeChance) {
      // Успешный побег
      await ctx.db.patch(args.sessionId, {
        phase: 'flee',
        isActive: false,
        log: [...session.log, {
          turn: session.turn,
          phase: 'flee',
          actorId: 'player',
          actorName: 'Игрок',
          action: 'Побег!',
          effects: ['Вы успешно сбежали из боя'],
          timestamp: Date.now()
        }],
        updatedAt: Date.now()
      })

      return { success: true, escaped: true }
    } else {
      // Неудачный побег - теряем ход
      await ctx.db.patch(args.sessionId, {
        log: [...session.log, {
          turn: session.turn,
          phase: 'player_turn',
          actorId: 'player',
          actorName: 'Игрок',
          action: 'Попытка побега',
          effects: ['Неудача! Враги блокируют путь'],
          timestamp: Date.now()
        }],
        updatedAt: Date.now()
      })

      return { success: true, escaped: false }
    }
  }
})



