/**
 * =====================================================
 * АРСЕНАЛ "ЭХО ФРАЙБУРГА"
 * Шаблоны оружия с протоколом "Холодная Сталь"
 * =====================================================
 */

import type { 
  WeaponTemplate, 
  ColdSteelAction, 
  CombatRank,
  DamageType 
} from '@/shared/types/combat'

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





