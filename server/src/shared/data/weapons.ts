/**
 * =====================================================
 * АРСЕНАЛ "ЭХО ФРАЙБУРГА"
 * Шаблоны оружия с протоколом "Холодная Сталь"
 * =====================================================
 */

import type {
  WeaponTemplate,
  ColdSteelAction,
  CombatRank
} from '../types/combat'

// ================== COLD STEEL ACTIONS ==================

const COLD_STEEL_ACTIONS: Record<string, ColdSteelAction> = {
  pistol_whip: {
    id: 'pistol_whip',
    name: 'Pistol Whip',
    nameRu: 'Удар рукоятью',
    damage: '1d4',
    damageType: 'crushing',
    staminaCost: 15,
    effects: [
      { type: 'stagger', value: 30, chance: 40, description: '40% шанс оглушить врага' }
    ],
    requiredVoice: 'gambling', // Азарт - риск ближнего боя с пистолетом
    validRanks: [1]
  },

  muzzle_thump: {
    id: 'muzzle_thump',
    name: 'Muzzle Thump',
    nameRu: 'Тычок стволом',
    damage: '1d6',
    damageType: 'crushing',
    staminaCost: 20,
    effects: [
      { type: 'push', value: 1, chance: 60, description: '60% шанс оттолкнуть врага на 1 ранг' }
    ],
    requiredVoice: 'force', // Сила - физическая мощь
    validRanks: [1, 2]
  },

  stock_bash: {
    id: 'stock_bash',
    name: 'Stock Bash',
    nameRu: 'Удар прикладом',
    damage: '1d8',
    damageType: 'crushing',
    staminaCost: 30,
    effects: [
      { type: 'stagger', value: 50, chance: 50, description: '50% шанс сильного оглушения' }
    ],
    requiredVoice: 'force',
    validRanks: [1, 2]
  },

  threaten: {
    id: 'threaten',
    name: 'Threaten',
    nameRu: 'Угроза',
    damage: '0',
    damageType: 'physical',
    staminaCost: 10,
    effects: [
      { type: 'fear', value: 20, chance: 50, description: '50% шанс заставить врага укрыться' },
      { type: 'morale_damage', value: 10, description: '-10 к морали врага' }
    ],
    requiredVoice: 'authority', // Авторитет / Драма
    validRanks: [1, 2, 3, 4]
  },

  knife_slash: {
    id: 'knife_slash',
    name: 'Knife Slash',
    nameRu: 'Режущий удар',
    damage: '1d6+2',
    damageType: 'slashing',
    staminaCost: 12,
    effects: [
      { type: 'damage', description: 'Дополнительный урон кровотечением' }
    ],
    requiredVoice: 'coordination',
    validRanks: [1]
  },

  heavy_swing: {
    id: 'heavy_swing',
    name: 'Heavy Swing',
    nameRu: 'Тяжёлый размах',
    damage: '2d6',
    damageType: 'crushing',
    staminaCost: 35,
    effects: [
      { type: 'stagger', value: 70, chance: 70, description: '70% шанс сильного оглушения' },
      { type: 'armor_pierce', value: 20, description: 'Игнорирует 20% брони' }
    ],
    requiredVoice: 'force',
    validRanks: [1, 2]
  },

  spear_thrust: {
    id: 'spear_thrust',
    name: 'Spear Thrust',
    nameRu: 'Выпад копьём',
    damage: '1d8+1',
    damageType: 'piercing',
    staminaCost: 18,
    effects: [
      { type: 'armor_pierce', value: 30, description: 'Игнорирует 30% брони' }
    ],
    requiredVoice: 'coordination',
    validRanks: [1, 2]
  },

  // ============ НОВЫЕ COLD STEEL ACTIONS ============

  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    nameRu: 'Удар Щитом',
    damage: '1d6',
    damageType: 'crushing',
    staminaCost: 20,
    effects: [
      { type: 'push', value: 1, chance: 70, description: '70% оттолкнуть на 1 ранг' },
      { type: 'stagger', value: 40, chance: 50, description: '50% оглушить врага' }
    ],
    requiredVoice: 'force',
    validRanks: [1]
  },

  flame_burst: {
    id: 'flame_burst',
    name: 'Flame Burst',
    nameRu: 'Вспышка Пламени',
    damage: '2d4',
    damageType: 'fire',
    staminaCost: 25,
    effects: [
      { type: 'damage', value: 5, duration: 2, description: '5 урона огнём в ход' },
      { type: 'fear', value: 15, chance: 40, description: '40% шанс страха (огонь)' }
    ],
    requiredVoice: 'gambling',
    validRanks: [1, 2]
  },

  bolt_load: {
    id: 'bolt_load',
    name: 'Quick Bolt',
    nameRu: 'Быстрый Болт',
    damage: '1d6',
    damageType: 'piercing',
    staminaCost: 15,
    effects: [
      { type: 'debuff', value: 10, duration: 1, description: '-10% скорости врага (болт в ноге)' }
    ],
    requiredVoice: 'coordination',
    validRanks: [1, 2, 3]
  }
}

// ================== WEAPON TEMPLATES ==================

export const WEAPON_TEMPLATES: Record<string, WeaponTemplate> = {
  // ============ ПИСТОЛЕТЫ ============
  glock_19: {
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
    coldSteelAction: COLD_STEEL_ACTIONS.pistol_whip,
    maxCondition: 100,
    jamBaseChance: 5,
    rankPenalties: { 4: -20 } // Дальняя дистанция
  },

  makarov: {
    id: 'makarov',
    name: 'PM Makarov',
    nameRu: 'ПМ Макаров',
    type: 'pistol',
    isRanged: true,
    magazineSize: 8,
    damage: '2d4+1',
    damageType: 'piercing',
    accuracy: 70,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.pistol_whip,
    maxCondition: 100,
    jamBaseChance: 8, // Старое оружие, чаще клинит
    rankPenalties: { 4: -25 }
  },

  revolver_38: {
    id: 'revolver_38',
    name: '.38 Revolver',
    nameRu: 'Револьвер .38',
    type: 'pistol',
    isRanged: true,
    magazineSize: 6,
    damage: '2d6+2',
    damageType: 'piercing',
    accuracy: 65,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.pistol_whip,
    maxCondition: 100,
    jamBaseChance: 2, // Револьверы редко клинят
    rankPenalties: { 4: -30 }
  },

  desert_eagle: {
    id: 'desert_eagle',
    name: 'Desert Eagle',
    nameRu: 'Пустынный Орёл',
    type: 'pistol',
    isRanged: true,
    magazineSize: 7,
    damage: '3d6',
    damageType: 'piercing',
    accuracy: 60,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.pistol_whip,
    maxCondition: 90,
    jamBaseChance: 8, // Мощный, но капризный
    rankPenalties: { 4: -35 }
  },

  beretta_m9: {
    id: 'beretta_m9',
    name: 'Beretta M9',
    nameRu: 'Беретта M9',
    type: 'pistol',
    isRanged: true,
    magazineSize: 15,
    damage: '2d6',
    damageType: 'piercing',
    accuracy: 78,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.pistol_whip,
    maxCondition: 100,
    jamBaseChance: 4,
    rankPenalties: { 4: -20 }
  },

  walther_p38: {
    id: 'walther_p38',
    name: 'Walther P38',
    nameRu: 'Вальтер П38',
    type: 'pistol',
    isRanged: true,
    magazineSize: 8,
    damage: '2d6',
    damageType: 'piercing',
    accuracy: 72,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.pistol_whip,
    maxCondition: 85,
    jamBaseChance: 7, // Старое немецкое оружие
    rankPenalties: { 4: -25 }
  },

  tt_33: {
    id: 'tt_33',
    name: 'TT-33 Tokarev',
    nameRu: 'ТТ-33 Токарев',
    type: 'pistol',
    isRanged: true,
    magazineSize: 8,
    damage: '2d6+1',
    damageType: 'piercing',
    accuracy: 68,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.pistol_whip,
    maxCondition: 90,
    jamBaseChance: 6,
    rankPenalties: { 4: -28 }
  },

  colt_1911: {
    id: 'colt_1911',
    name: 'Colt M1911',
    nameRu: 'Кольт M1911',
    type: 'pistol',
    isRanged: true,
    magazineSize: 7,
    damage: '2d6+2',
    damageType: 'piercing',
    accuracy: 70,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.pistol_whip,
    maxCondition: 100,
    jamBaseChance: 3, // Легендарная надёжность
    rankPenalties: { 4: -22 }
  },

  // ============ ДРОБОВИКИ ============
  sawed_off: {
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
    coldSteelAction: COLD_STEEL_ACTIONS.muzzle_thump,
    maxCondition: 80,
    jamBaseChance: 10,
    rankPenalties: { 3: -40, 4: -80 } // Очень неэффективен на дистанции
  },

  pump_shotgun: {
    id: 'pump_shotgun',
    name: 'Pump Shotgun',
    nameRu: 'Помповый дробовик',
    type: 'shotgun',
    isRanged: true,
    magazineSize: 6,
    damage: '3d6+2',
    damageType: 'piercing',
    accuracy: 55,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 100,
    jamBaseChance: 7,
    rankPenalties: { 4: -60 }
  },

  double_barrel: {
    id: 'double_barrel',
    name: 'Double Barrel Shotgun',
    nameRu: 'Двустволка',
    type: 'shotgun',
    isRanged: true,
    magazineSize: 2,
    damage: '4d6',
    damageType: 'piercing',
    accuracy: 50,
    range: [1, 2],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 120, // Надёжная классика
    jamBaseChance: 3,
    rankPenalties: { 3: -50, 4: -90 }
  },

  spas_12: {
    id: 'spas_12',
    name: 'SPAS-12',
    nameRu: 'СПАС-12',
    type: 'shotgun',
    isRanged: true,
    magazineSize: 8,
    damage: '3d6+3',
    damageType: 'piercing',
    accuracy: 58,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 100,
    jamBaseChance: 6,
    rankPenalties: { 4: -55 }
  },

  ks_23: {
    id: 'ks_23',
    name: 'KS-23',
    nameRu: 'КС-23',
    type: 'shotgun',
    isRanged: true,
    magazineSize: 3,
    damage: '4d6+2',
    damageType: 'piercing',
    accuracy: 48,
    range: [1, 2],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 90,
    jamBaseChance: 5,
    rankPenalties: { 3: -45, 4: -85 }
  },

  streetsweeper: {
    id: 'streetsweeper',
    name: 'Streetsweeper',
    nameRu: 'Уличный Метельщик',
    type: 'shotgun',
    isRanged: true,
    magazineSize: 12,
    damage: '3d4+2',
    damageType: 'piercing',
    accuracy: 45,
    range: [1, 2],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 75, // Много механики - чаще ломается
    jamBaseChance: 12,
    rankPenalties: { 3: -60, 4: -100 }
  },

  // ============ ВИНТОВКИ ============
  ak_74: {
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
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 100,
    jamBaseChance: 4,
    rankPenalties: { 1: -40 } // Неудобно в упор
  },

  hunting_rifle: {
    id: 'hunting_rifle',
    name: 'Hunting Rifle',
    nameRu: 'Охотничья винтовка',
    type: 'rifle',
    isRanged: true,
    magazineSize: 5,
    damage: '2d10',
    damageType: 'piercing',
    accuracy: 80,
    range: [3, 4],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 100,
    jamBaseChance: 3,
    rankPenalties: { 1: -60, 2: -30 }
  },

  m16: {
    id: 'm16',
    name: 'M16A2',
    nameRu: 'М16А2',
    type: 'rifle',
    isRanged: true,
    magazineSize: 30,
    damage: '2d8+1',
    damageType: 'piercing',
    accuracy: 75,
    range: [2, 3, 4],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 90,
    jamBaseChance: 5, // Чувствителен к грязи
    rankPenalties: { 1: -45 }
  },

  sks: {
    id: 'sks',
    name: 'SKS',
    nameRu: 'СКС',
    type: 'rifle',
    isRanged: true,
    magazineSize: 10,
    damage: '2d8+2',
    damageType: 'piercing',
    accuracy: 72,
    range: [2, 3, 4],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 110, // Советская надёжность
    jamBaseChance: 3,
    rankPenalties: { 1: -35 }
  },

  fn_fal: {
    id: 'fn_fal',
    name: 'FN FAL',
    nameRu: 'ФН ФАЛ',
    type: 'rifle',
    isRanged: true,
    magazineSize: 20,
    damage: '2d10',
    damageType: 'piercing',
    accuracy: 68,
    range: [2, 3, 4],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 95,
    jamBaseChance: 6,
    rankPenalties: { 1: -50 }
  },

  stg_44: {
    id: 'stg_44',
    name: 'STG-44',
    nameRu: 'Штурмгевер-44',
    type: 'rifle',
    isRanged: true,
    magazineSize: 30,
    damage: '2d8',
    damageType: 'piercing',
    accuracy: 65,
    range: [2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 70, // Антикварное оружие
    jamBaseChance: 10,
    rankPenalties: { 1: -40, 4: -30 }
  },

  // ============ СНАЙПЕРСКИЕ ============
  mosin: {
    id: 'mosin',
    name: 'Mosin-Nagant',
    nameRu: 'Мосин-Наган',
    type: 'sniper',
    isRanged: true,
    magazineSize: 5,
    damage: '3d8',
    damageType: 'piercing',
    accuracy: 90,
    range: [4],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 100,
    jamBaseChance: 2,
    rankPenalties: { 1: -80, 2: -50, 3: -20 }
  },

  svd_dragunov: {
    id: 'svd_dragunov',
    name: 'SVD Dragunov',
    nameRu: 'СВД Драгунов',
    type: 'sniper',
    isRanged: true,
    magazineSize: 10,
    damage: '3d8+2',
    damageType: 'piercing',
    accuracy: 88,
    range: [3, 4],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 95,
    jamBaseChance: 3,
    rankPenalties: { 1: -75, 2: -40 }
  },

  awm: {
    id: 'awm',
    name: 'AWM',
    nameRu: 'AWM Магнум',
    type: 'sniper',
    isRanged: true,
    magazineSize: 5,
    damage: '4d8',
    damageType: 'piercing',
    accuracy: 95,
    range: [4],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 100,
    jamBaseChance: 2,
    rankPenalties: { 1: -90, 2: -60, 3: -25 }
  },

  barrett_m82: {
    id: 'barrett_m82',
    name: 'Barrett M82',
    nameRu: 'Барретт М82',
    type: 'sniper',
    isRanged: true,
    magazineSize: 10,
    damage: '5d8',
    damageType: 'piercing',
    accuracy: 85,
    range: [4],
    coldSteelAction: COLD_STEEL_ACTIONS.stock_bash,
    maxCondition: 90,
    jamBaseChance: 4,
    rankPenalties: { 1: -95, 2: -70, 3: -35 }
  },

  // ============ БЛИЖНИЙ БОЙ - НОЖИ ============
  combat_knife: {
    id: 'combat_knife',
    name: 'Combat Knife',
    nameRu: 'Боевой нож',
    type: 'melee_knife',
    isRanged: false,
    damage: '1d6+2',
    damageType: 'slashing',
    accuracy: 85,
    range: [1],
    coldSteelAction: COLD_STEEL_ACTIONS.knife_slash,
    maxCondition: 150, // Ножи прочнее
    jamBaseChance: 0, // Не заклинивают
    rankPenalties: { 2: -20, 3: -50, 4: -80 }
  },

  machete: {
    id: 'machete',
    name: 'Machete',
    nameRu: 'Мачете',
    type: 'melee_knife',
    isRanged: false,
    damage: '1d8+1',
    damageType: 'slashing',
    accuracy: 75,
    range: [1, 2],
    coldSteelAction: COLD_STEEL_ACTIONS.knife_slash,
    maxCondition: 120,
    jamBaseChance: 0,
    rankPenalties: { 3: -40, 4: -70 }
  },

  // ============ БЛИЖНИЙ БОЙ - ДРОБЯЩЕЕ ============
  rusty_pipe: {
    id: 'rusty_pipe',
    name: 'Rusty Pipe',
    nameRu: 'Ржавая труба',
    type: 'melee_blunt',
    isRanged: false,
    damage: '1d6',
    damageType: 'crushing',
    accuracy: 70,
    range: [1, 2],
    coldSteelAction: COLD_STEEL_ACTIONS.heavy_swing,
    maxCondition: 60, // Быстро ломается
    jamBaseChance: 0,
    rankPenalties: { 3: -50, 4: -80 }
  },

  baseball_bat: {
    id: 'baseball_bat',
    name: 'Baseball Bat',
    nameRu: 'Бейсбольная бита',
    type: 'melee_blunt',
    isRanged: false,
    damage: '1d8',
    damageType: 'crushing',
    accuracy: 75,
    range: [1, 2],
    coldSteelAction: COLD_STEEL_ACTIONS.heavy_swing,
    maxCondition: 80,
    jamBaseChance: 0,
    rankPenalties: { 3: -40, 4: -70 }
  },

  wrench: {
    id: 'wrench',
    name: 'Heavy Wrench',
    nameRu: 'Разводной ключ',
    type: 'melee_blunt',
    isRanged: false,
    damage: '1d6+1',
    damageType: 'crushing',
    accuracy: 72,
    range: [1],
    coldSteelAction: COLD_STEEL_ACTIONS.heavy_swing,
    maxCondition: 100, // Металл прочный
    jamBaseChance: 0,
    rankPenalties: { 2: -20, 3: -50, 4: -80 }
  },

  // ============ БЛИЖНИЙ БОЙ - КОПЬЯ ============
  makeshift_spear: {
    id: 'makeshift_spear',
    name: 'Makeshift Spear',
    nameRu: 'Самодельное копьё',
    type: 'melee_spear',
    isRanged: false,
    damage: '1d8',
    damageType: 'piercing',
    accuracy: 65,
    range: [1, 2],
    coldSteelAction: COLD_STEEL_ACTIONS.spear_thrust,
    maxCondition: 50, // Хрупкое
    jamBaseChance: 0,
    rankPenalties: { 3: -30, 4: -60 }
  },

  pike: {
    id: 'pike',
    name: 'Pike',
    nameRu: 'Пика',
    type: 'melee_spear',
    isRanged: false,
    damage: '1d10',
    damageType: 'piercing',
    accuracy: 60,
    range: [2], // Только средняя дистанция!
    coldSteelAction: COLD_STEEL_ACTIONS.spear_thrust,
    maxCondition: 70,
    jamBaseChance: 0,
    rankPenalties: { 1: -30, 3: -40, 4: -70 } // Неудобна в упор и издалека
  },

  // ============ ОСОБОЕ ОРУЖИЕ ============
  megaphone: {
    id: 'megaphone',
    name: 'Megaphone',
    nameRu: 'Мегафон',
    type: 'melee_blunt', // Технически sonic weapon
    isRanged: false,
    damage: '1d4',
    damageType: 'sonic',
    accuracy: 90,
    range: [1, 2, 3],
    coldSteelAction: COLD_STEEL_ACTIONS.threaten,
    maxCondition: 50,
    jamBaseChance: 15, // Электроника может сломаться
    rankPenalties: {}
  },

  fists: {
    id: 'fists',
    name: 'Bare Fists',
    nameRu: 'Голые кулаки',
    type: 'fist',
    isRanged: false,
    damage: '1d4',
    damageType: 'crushing',
    accuracy: 80,
    range: [1],
    maxCondition: 999, // Не ломаются
    jamBaseChance: 0,
    rankPenalties: { 2: -40, 3: -80, 4: -100 }
  },

  // ============ НОВОЕ ОРУЖИЕ ============

  riot_shield: {
    id: 'riot_shield',
    name: 'Riot Shield',
    nameRu: 'Штурмовой Щит',
    type: 'melee_blunt',
    isRanged: false,
    damage: '1d4',
    damageType: 'crushing',
    accuracy: 85,
    range: [1],
    coldSteelAction: COLD_STEEL_ACTIONS.shield_bash,
    maxCondition: 150, // Очень прочный
    jamBaseChance: 0,
    rankPenalties: { 2: -50, 3: -80, 4: -100 }
  },

  crossbow: {
    id: 'crossbow',
    name: 'Crossbow',
    nameRu: 'Арбалет',
    type: 'rifle',
    isRanged: true,
    magazineSize: 1,
    damage: '2d6+2',
    damageType: 'piercing',
    accuracy: 80,
    range: [2, 3, 4],
    coldSteelAction: COLD_STEEL_ACTIONS.bolt_load,
    maxCondition: 80,
    jamBaseChance: 3, // Тихое и надёжное
    rankPenalties: { 1: -40 }
  },

  flamethrower: {
    id: 'flamethrower',
    name: 'Improvised Flamethrower',
    nameRu: 'Импровизированный Огнемёт',
    type: 'shotgun',
    isRanged: true,
    magazineSize: 10,
    damage: '2d4',
    damageType: 'fire',
    accuracy: 60,
    range: [1, 2],
    coldSteelAction: COLD_STEEL_ACTIONS.flame_burst,
    maxCondition: 60, // Ненадёжный
    jamBaseChance: 20, // Часто ломается
    rankPenalties: { 3: -60, 4: -100 }
  },

  grenade_launcher: {
    id: 'grenade_launcher',
    name: 'Grenade Launcher',
    nameRu: 'Гранатомёт',
    type: 'shotgun',
    isRanged: true,
    magazineSize: 1,
    damage: '3d6',
    damageType: 'crushing',
    accuracy: 55,
    range: [2, 3, 4],
    coldSteelAction: COLD_STEEL_ACTIONS.muzzle_thump,
    maxCondition: 70,
    jamBaseChance: 10,
    rankPenalties: { 1: -80 } // Опасно стрелять вблизи
  },

  combat_taser: {
    id: 'combat_taser',
    name: 'Combat Taser',
    nameRu: 'Боевой Электрошокер',
    type: 'pistol',
    isRanged: true,
    magazineSize: 3,
    damage: '1d4',
    damageType: 'electric',
    accuracy: 75,
    range: [1, 2],
    coldSteelAction: COLD_STEEL_ACTIONS.pistol_whip,
    maxCondition: 80,
    jamBaseChance: 8,
    rankPenalties: { 3: -50, 4: -80 }
  }
}

// ================== УТИЛИТЫ ==================

/**
 * Получить эффективный урон оружия для конкретного ранга
 */
export function getWeaponEffectivenessAtRank(
  weapon: WeaponTemplate,
  rank: CombatRank
): { canAttack: boolean; accuracyMod: number } {
  if (!weapon.range.includes(rank)) {
    return { canAttack: false, accuracyMod: -100 }
  }

  const penalty = weapon.rankPenalties[rank] ?? 0
  return { canAttack: true, accuracyMod: penalty }
}

/**
 * Проверить, может ли оружие использовать Cold Steel на данном ранге
 */
export function canUseColdSteel(
  weapon: WeaponTemplate,
  rank: CombatRank
): boolean {
  if (!weapon.coldSteelAction) return false
  return weapon.coldSteelAction.validRanks.includes(rank)
}

/**
 * Парсинг dice notation (например, "2d6+2")
 */
export function parseDiceNotation(notation: string): {
  count: number;
  sides: number;
  modifier: number
} {
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/)
  if (!match) return { count: 1, sides: 4, modifier: 0 }

  return {
    count: parseInt(match[1]),
    sides: parseInt(match[2]),
    modifier: match[3] ? parseInt(match[3]) : 0
  }
}

/**
 * Бросок кубиков
 */
export function rollDice(notation: string): number {
  const { count, sides, modifier } = parseDiceNotation(notation)
  let total = modifier

  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1
  }

  return total
}

/**
 * Получить среднее значение урона
 */
export function getAverageDamage(notation: string): number {
  const { count, sides, modifier } = parseDiceNotation(notation)
  return count * ((sides + 1) / 2) + modifier
}

















