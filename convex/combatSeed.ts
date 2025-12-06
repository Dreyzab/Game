/**
 * =====================================================
 * SEED DATA - БОЕВАЯ СИСТЕМА "ЭХО ФРАЙБУРГА"
 * =====================================================
 */

import { mutation } from './_generated/server'

// ================== WEAPON TEMPLATES ==================

const WEAPON_DATA = [
  {
    id: 'glock_19',
    name: 'Glock-19',
    nameRu: 'Глок-19',
    type: 'pistol',
    isRanged: true,
    magazineSize: 15,
    damage: '2d6',
    damageType: 'piercing',
    accuracy: 75,
    range: [1, 2, 3],
    coldSteelAction: {
      id: 'pistol_whip',
      name: 'Pistol Whip',
      nameRu: 'Удар рукоятью',
      damage: '1d4',
      damageType: 'crushing',
      staminaCost: 15,
      effects: [{ type: 'stagger', value: 30, chance: 40, description: '40% шанс оглушить' }],
      requiredVoice: 'gambling',
      validRanks: [1]
    },
    maxCondition: 100,
    jamBaseChance: 5,
    rankPenalties: { 4: -20 }
  },
  {
    id: 'sawed_off',
    name: 'Sawed-off Shotgun',
    nameRu: 'Обрез',
    type: 'shotgun',
    isRanged: true,
    magazineSize: 2,
    damage: '3d6',
    damageType: 'piercing',
    accuracy: 60,
    range: [1, 2],
    coldSteelAction: {
      id: 'muzzle_thump',
      name: 'Muzzle Thump',
      nameRu: 'Тычок стволом',
      damage: '1d6',
      damageType: 'crushing',
      staminaCost: 20,
      effects: [{ type: 'push', value: 1, chance: 60, description: '60% шанс отбросить' }],
      requiredVoice: 'force',
      validRanks: [1, 2]
    },
    maxCondition: 80,
    jamBaseChance: 10,
    rankPenalties: { 3: -40, 4: -80 }
  },
  {
    id: 'ak_74',
    name: 'AK-74',
    nameRu: 'АК-74',
    type: 'rifle',
    isRanged: true,
    magazineSize: 30,
    damage: '2d8',
    damageType: 'piercing',
    accuracy: 70,
    range: [2, 3, 4],
    coldSteelAction: {
      id: 'stock_bash',
      name: 'Stock Bash',
      nameRu: 'Удар прикладом',
      damage: '1d8',
      damageType: 'crushing',
      staminaCost: 30,
      effects: [{ type: 'stagger', value: 50, chance: 50, description: '50% шанс оглушения' }],
      requiredVoice: 'force',
      validRanks: [1, 2]
    },
    maxCondition: 100,
    jamBaseChance: 4,
    rankPenalties: { 1: -40 }
  },
  {
    id: 'combat_knife',
    name: 'Combat Knife',
    nameRu: 'Боевой нож',
    type: 'melee_knife',
    isRanged: false,
    damage: '1d6+2',
    damageType: 'slashing',
    accuracy: 85,
    range: [1],
    coldSteelAction: {
      id: 'knife_slash',
      name: 'Knife Slash',
      nameRu: 'Режущий удар',
      damage: '1d6+2',
      damageType: 'slashing',
      staminaCost: 12,
      effects: [],
      requiredVoice: 'coordination',
      validRanks: [1]
    },
    maxCondition: 150,
    jamBaseChance: 0,
    rankPenalties: { 2: -20, 3: -50, 4: -80 }
  },
  {
    id: 'rusty_pipe',
    name: 'Rusty Pipe',
    nameRu: 'Ржавая труба',
    type: 'melee_blunt',
    isRanged: false,
    damage: '1d6',
    damageType: 'crushing',
    accuracy: 70,
    range: [1, 2],
    coldSteelAction: {
      id: 'heavy_swing',
      name: 'Heavy Swing',
      nameRu: 'Тяжёлый размах',
      damage: '2d6',
      damageType: 'crushing',
      staminaCost: 35,
      effects: [{ type: 'stagger', value: 70, chance: 70, description: '70% шанс оглушения' }],
      requiredVoice: 'force',
      validRanks: [1, 2]
    },
    maxCondition: 60,
    jamBaseChance: 0,
    rankPenalties: { 3: -50, 4: -80 }
  },
  {
    id: 'fists',
    name: 'Bare Fists',
    nameRu: 'Голые кулаки',
    type: 'fist',
    isRanged: false,
    damage: '1d4',
    damageType: 'crushing',
    accuracy: 80,
    range: [1],
    maxCondition: 999,
    jamBaseChance: 0,
    rankPenalties: { 2: -40, 3: -80, 4: -100 }
  }
]

// ================== ENEMY TEMPLATES ==================

const ENEMY_DATA = [
  // T1: Scavengers
  {
    id: 'scavenger_basic',
    name: 'Street Scavenger',
    nameRu: 'Уличный Мародёр',
    threatLevel: 'T1' as const,
    aiType: 'scavenger',
    hp: 25,
    morale: 30,
    armor: 0,
    preferredRanks: [1, 2],
    retreatThreshold: 50,
    immunities: [],
    availableActions: ['scav_knife_stab', 'scav_throw_rock', 'scav_flee'],
    aggroRadius: 15,
    fleeConditions: ['hp_below_50', 'ally_killed', 'intimidated'],
    xpReward: 15,
    lootTable: 'scavenger_basic_loot'
  },
  {
    id: 'scavenger_armed',
    name: 'Armed Scavenger',
    nameRu: 'Вооружённый Мародёр',
    threatLevel: 'T1' as const,
    aiType: 'scavenger',
    hp: 30,
    morale: 35,
    armor: 5,
    preferredRanks: [2, 3],
    retreatThreshold: 40,
    immunities: [],
    availableActions: ['scav_pistol_shot', 'scav_knife_stab', 'scav_flee'],
    aggroRadius: 20,
    fleeConditions: ['hp_below_40', 'out_of_ammo', 'ally_killed'],
    xpReward: 25,
    lootTable: 'scavenger_armed_loot'
  },
  // T2: Enforcers
  {
    id: 'fjr_patrol',
    name: 'FJR Patrol',
    nameRu: 'Патрульный ФЯР',
    threatLevel: 'T2' as const,
    aiType: 'enforcer',
    hp: 50,
    morale: 60,
    armor: 15,
    preferredRanks: [2, 3],
    retreatThreshold: 20,
    immunities: ['fear'],
    availableActions: ['fjr_rifle_burst', 'fjr_suppressive_fire', 'fjr_take_cover'],
    aggroRadius: 30,
    fleeConditions: ['hp_below_20', 'squad_wiped'],
    xpReward: 50,
    lootTable: 'fjr_patrol_loot'
  },
  {
    id: 'fjr_shield',
    name: 'FJR Shield Bearer',
    nameRu: 'Щитоносец ФЯР',
    threatLevel: 'T2' as const,
    aiType: 'enforcer',
    hp: 70,
    morale: 70,
    armor: 35,
    preferredRanks: [1],
    retreatThreshold: 15,
    immunities: ['fear', 'stagger'],
    availableActions: ['fjr_shield_bash', 'fjr_shield_wall', 'fjr_baton_strike'],
    xpReward: 65,
    lootTable: 'fjr_shield_loot'
  },
  // T3: Drones
  {
    id: 'drone_scout',
    name: 'Scout Drone',
    nameRu: 'Дрон-Разведчик',
    threatLevel: 'T3' as const,
    aiType: 'feral_drone',
    hp: 30,
    morale: 100,
    armor: 10,
    preferredRanks: [3, 4],
    retreatThreshold: 0,
    immunities: ['fear', 'morale_damage', 'poison'],
    availableActions: ['drone_scan', 'drone_taser', 'drone_mark_target'],
    aggroRadius: 50,
    xpReward: 60,
    lootTable: 'drone_scout_loot'
  },
  {
    id: 'drone_assault',
    name: 'Assault Drone',
    nameRu: 'Штурмовой Дрон',
    threatLevel: 'T3' as const,
    aiType: 'feral_drone',
    hp: 45,
    morale: 100,
    armor: 20,
    preferredRanks: [2, 3],
    retreatThreshold: 0,
    immunities: ['fear', 'morale_damage', 'poison', 'stagger'],
    availableActions: ['drone_machine_gun', 'drone_shock_burst', 'drone_ram'],
    aggroRadius: 40,
    xpReward: 90,
    lootTable: 'drone_assault_loot'
  },
  // T4: Boss
  {
    id: 'boss_anarchist_warlord',
    name: 'Anarchist Warlord',
    nameRu: 'Анархист-Полководец',
    threatLevel: 'T4' as const,
    aiType: 'boss',
    hp: 200,
    morale: 100,
    armor: 25,
    preferredRanks: [1, 2],
    retreatThreshold: 0,
    immunities: ['fear', 'stagger', 'confusion', 'paralysis', 'pull', 'push'],
    availableActions: ['boss_rage_mode', 'boss_call_reinforcements', 'boss_devastating_blow', 'boss_battle_cry'],
    xpReward: 500,
    lootTable: 'boss_anarchist_loot'
  }
]

// ================== COMBAT ZONES ==================

const ZONE_DATA = [
  {
    id: 'sanctuary_munster',
    zoneType: 'sanctuary',
    name: 'Freiburger Münster Sanctuary',
    nameRu: 'Святилище Мюнстера',
    voiceBuffs: { empathy: 2, honor: 2, courage: 1 },
    voiceDebuffs: { analysis: -2, gambling: -1 },
    cardCostModifiers: { voice: -1 },
    damageModifiers: { fire: -20 },
    specialEffects: [
      { type: 'heal', value: 20, description: 'Исцеление +20%' },
      { type: 'morale_boost', value: 5, description: '+5 мораль' }
    ],
    historicalContext: 'Готический собор, строительство которого началось в 1200 году.',
    geniusLociDescription: 'Здесь камни помнят молитвы веков.'
  },
  {
    id: 'chaos_zone_vauban',
    zoneType: 'chaos_zone',
    name: 'Vauban Chaos Zone',
    nameRu: 'Зона Хаоса Ваубан',
    voiceBuffs: { creativity: 2, gambling: 2, courage: 1 },
    voiceDebuffs: { authority: -1, honor: -1 },
    cardCostModifiers: {},
    damageModifiers: { electric: 15 },
    specialEffects: [
      { type: 'critical_boost', value: 10, description: '+10% крит' },
      { type: 'stamina_restore', value: 5, description: '+5 реген выносливости' }
    ],
    historicalContext: 'Бывшая военная база, преобразованная в эко-район.',
    geniusLociDescription: 'Солнечные панели гудят на крышах.'
  },
  {
    id: 'forge_industrial',
    zoneType: 'forge',
    name: 'Industrial North Forge',
    nameRu: 'Кузница Индустриального Севера',
    voiceBuffs: { analysis: 2, logic: 1, force: 1 },
    voiceDebuffs: { empathy: -1, drama: -1 },
    cardCostModifiers: {},
    damageModifiers: { electric: -15 },
    specialEffects: [
      { type: 'debuff', value: 15, chance: 15, description: '15% сбой электроники' }
    ],
    historicalContext: 'Крупнейшая промзона Фрайбурга.',
    geniusLociDescription: 'Магнитные поля искажают реальность.'
  },
  {
    id: 'canals_bachle',
    zoneType: 'canals',
    name: 'Bächle City Arteries',
    nameRu: 'Артерии Города Бёхле',
    voiceBuffs: { coordination: 2, perception: 1 },
    voiceDebuffs: { force: -1, endurance: -1 },
    cardCostModifiers: { movement: 2 },
    damageModifiers: { electric: 30 },
    specialEffects: [
      { type: 'debuff', value: 10, description: '-10% уклонение (скользко)' }
    ],
    historicalContext: 'Знаменитые открытые ручьи Фрайбурга.',
    geniusLociDescription: 'Вода журчит по древним каналам.'
  },
  {
    id: 'neutral_zone',
    zoneType: 'neutral',
    name: 'Neutral Territory',
    nameRu: 'Нейтральная Территория',
    voiceBuffs: {},
    voiceDebuffs: {},
    cardCostModifiers: {},
    damageModifiers: {},
    specialEffects: [],
    historicalContext: 'Обычные улицы города.',
    geniusLociDescription: 'Просто город.'
  }
]

// ================== SEED MUTATIONS ==================

export const seedWeaponTemplates = mutation({
  handler: async (ctx) => {
    let created = 0
    let updated = 0
    const now = Date.now()

    for (const weapon of WEAPON_DATA) {
      const existing = await ctx.db
        .query('weapon_templates')
        .withIndex('by_weapon_id', (q) => q.eq('id', weapon.id))
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, { ...weapon })
        updated++
      } else {
        await ctx.db.insert('weapon_templates', { ...weapon, createdAt: now })
        created++
      }
    }

    return { success: true, created, updated, total: WEAPON_DATA.length }
  }
})

export const seedEnemyTemplates = mutation({
  handler: async (ctx) => {
    let created = 0
    let updated = 0
    const now = Date.now()

    for (const enemy of ENEMY_DATA) {
      const existing = await ctx.db
        .query('enemy_templates')
        .withIndex('by_enemy_id', (q) => q.eq('id', enemy.id))
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, { ...enemy })
        updated++
      } else {
        await ctx.db.insert('enemy_templates', { ...enemy, createdAt: now })
        created++
      }
    }

    return { success: true, created, updated, total: ENEMY_DATA.length }
  }
})

export const seedCombatZones = mutation({
  handler: async (ctx) => {
    let created = 0
    let updated = 0
    const now = Date.now()

    for (const zone of ZONE_DATA) {
      const existing = await ctx.db
        .query('combat_zones')
        .withIndex('by_zone_id', (q) => q.eq('id', zone.id))
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, { ...zone, isActive: true })
        updated++
      } else {
        await ctx.db.insert('combat_zones', { ...zone, isActive: true, createdAt: now })
        created++
      }
    }

    return { success: true, created, updated, total: ZONE_DATA.length }
  }
})

export const seedAllCombatData = mutation({
  handler: async (ctx) => {
    const now = Date.now()

    // Weapons
    let weaponsCreated = 0
    for (const weapon of WEAPON_DATA) {
      const existing = await ctx.db
        .query('weapon_templates')
        .withIndex('by_weapon_id', (q) => q.eq('id', weapon.id))
        .first()
      if (!existing) {
        await ctx.db.insert('weapon_templates', { ...weapon, createdAt: now })
        weaponsCreated++
      }
    }

    // Enemies
    let enemiesCreated = 0
    for (const enemy of ENEMY_DATA) {
      const existing = await ctx.db
        .query('enemy_templates')
        .withIndex('by_enemy_id', (q) => q.eq('id', enemy.id))
        .first()
      if (!existing) {
        await ctx.db.insert('enemy_templates', { ...enemy, createdAt: now })
        enemiesCreated++
      }
    }

    // Zones
    let zonesCreated = 0
    for (const zone of ZONE_DATA) {
      const existing = await ctx.db
        .query('combat_zones')
        .withIndex('by_zone_id', (q) => q.eq('id', zone.id))
        .first()
      if (!existing) {
        await ctx.db.insert('combat_zones', { ...zone, isActive: true, createdAt: now })
        zonesCreated++
      }
    }

    return {
      success: true,
      weapons: { created: weaponsCreated, total: WEAPON_DATA.length },
      enemies: { created: enemiesCreated, total: ENEMY_DATA.length },
      zones: { created: zonesCreated, total: ZONE_DATA.length }
    }
  }
})

export const clearCombatData = mutation({
  handler: async (ctx) => {
    // Clear weapons
    const weapons = await ctx.db.query('weapon_templates').collect()
    for (const w of weapons) await ctx.db.delete(w._id)

    // Clear enemies
    const enemies = await ctx.db.query('enemy_templates').collect()
    for (const e of enemies) await ctx.db.delete(e._id)

    // Clear zones
    const zones = await ctx.db.query('combat_zones').collect()
    for (const z of zones) await ctx.db.delete(z._id)

    // Clear sessions
    const sessions = await ctx.db.query('combat_sessions').collect()
    for (const s of sessions) await ctx.db.delete(s._id)

    return {
      success: true,
      deleted: {
        weapons: weapons.length,
        enemies: enemies.length,
        zones: zones.length,
        sessions: sessions.length
      }
    }
  }
})










