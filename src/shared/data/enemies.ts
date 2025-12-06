/**
 * =====================================================
 * ТАКСОНОМИЯ ВРАГОВ "ЭХО ФРАЙБУРГА"
 * Уровни Угроз T1-T4
 * =====================================================
 */

import type { 
  EnemyTemplate, 
  ThreatLevel, 
  EnemyAIType, 
  CombatRank, 
  EffectType 
} from '@/shared/types/combat'

// ================== ШАБЛОНЫ ВРАГОВ ==================

export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = {
  
  // ============ T1: SCAVENGER (МАРОДЁРЫ) ============
  // Логика: Трусливый, стайный. Опасен только в группе.
  // Триггер отступления: Убегает при потере 50% HP или при успешной угрозе
  
  scavenger_basic: {
    id: 'scavenger_basic',
    name: 'Street Scavenger',
    nameRu: 'Уличный Мародёр',
    threatLevel: 'T1',
    aiType: 'scavenger',
    
    hp: 25,
    morale: 30,
    armor: 0,
    
    preferredRanks: [1, 2], // Пытается окружить
    retreatThreshold: 50, // Убегает при 50% HP
    immunities: [],
    
    availableActions: ['scav_knife_stab', 'scav_throw_rock', 'scav_flee'],
    
    aggroRadius: 15, // метры
    fleeConditions: ['hp_below_50', 'ally_killed', 'intimidated'],
    
    xpReward: 15,
    lootTable: 'scavenger_basic_loot'
  },
  
  scavenger_armed: {
    id: 'scavenger_armed',
    name: 'Armed Scavenger',
    nameRu: 'Вооружённый Мародёр',
    threatLevel: 'T1',
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
  
  scavenger_pack_leader: {
    id: 'scavenger_pack_leader',
    name: 'Pack Leader',
    nameRu: 'Вожак Стаи',
    threatLevel: 'T1',
    aiType: 'scavenger',
    
    hp: 45,
    morale: 50,
    armor: 10,
    
    preferredRanks: [2],
    retreatThreshold: 30,
    immunities: [],
    
    availableActions: ['leader_rally_cry', 'scav_pistol_shot', 'leader_command_attack'],
    
    aggroRadius: 25,
    fleeConditions: ['hp_below_30', 'all_allies_dead'],
    
    xpReward: 40,
    lootTable: 'scavenger_leader_loot'
  },

  // ============ T2: FJR ENFORCER (СИЛОВИКИ) ============
  // Логика: Дисциплинированный солдат. Использует щиты и подавляющий огонь.
  // Не реагирует на Блеф. Прикрывает T3 юнитов.
  
  fjr_patrol: {
    id: 'fjr_patrol',
    name: 'FJR Patrol',
    nameRu: 'Патрульный ФЯР',
    threatLevel: 'T2',
    aiType: 'enforcer',
    
    hp: 50,
    morale: 60,
    armor: 15,
    
    preferredRanks: [2, 3],
    retreatThreshold: 20,
    immunities: ['fear'], // Дисциплина
    
    availableActions: ['fjr_rifle_burst', 'fjr_suppressive_fire', 'fjr_take_cover'],
    
    aggroRadius: 30,
    fleeConditions: ['hp_below_20', 'squad_wiped'],
    
    xpReward: 50,
    lootTable: 'fjr_patrol_loot'
  },
  
  fjr_shield: {
    id: 'fjr_shield',
    name: 'FJR Shield Bearer',
    nameRu: 'Щитоносец ФЯР',
    threatLevel: 'T2',
    aiType: 'enforcer',
    
    hp: 70,
    morale: 70,
    armor: 35, // Высокая броня от щита
    
    preferredRanks: [1], // Всегда впереди
    retreatThreshold: 15,
    immunities: ['fear', 'stagger'], // Щит защищает
    
    availableActions: ['fjr_shield_bash', 'fjr_shield_wall', 'fjr_baton_strike'],
    
    fleeConditions: ['hp_below_15'],
    
    xpReward: 65,
    lootTable: 'fjr_shield_loot'
  },
  
  fjr_sergeant: {
    id: 'fjr_sergeant',
    name: 'FJR Sergeant',
    nameRu: 'Сержант ФЯР',
    threatLevel: 'T2',
    aiType: 'enforcer',
    
    hp: 60,
    morale: 80,
    armor: 20,
    
    preferredRanks: [3],
    retreatThreshold: 10,
    immunities: ['fear', 'confusion'],
    
    availableActions: ['fjr_command_advance', 'fjr_pistol_execute', 'fjr_call_reinforcements'],
    
    fleeConditions: ['hp_below_10'],
    
    xpReward: 80,
    lootTable: 'fjr_sergeant_loot'
  },

  // ============ T3: FERAL DRONE (ДИКИЕ ДРОНЫ) ============
  // Логика: Летающий юнит. Игнорирует препятствия и укрытия.
  // Атака: Наносит урон по Выносливости (электрошокеры).
  // Уязвим к атакам АНАЛИЗА.
  
  drone_scout: {
    id: 'drone_scout',
    name: 'Scout Drone',
    nameRu: 'Дрон-Разведчик',
    threatLevel: 'T3',
    aiType: 'feral_drone',
    
    hp: 30,
    morale: 100, // Роботы не боятся
    armor: 10,
    
    preferredRanks: [3, 4], // Держится на дистанции
    retreatThreshold: 0, // Роботы не отступают
    immunities: ['fear', 'morale_damage', 'poison'],
    
    availableActions: ['drone_scan', 'drone_taser', 'drone_mark_target'],
    
    aggroRadius: 50, // Отличные сенсоры
    
    xpReward: 60,
    lootTable: 'drone_scout_loot'
  },
  
  drone_assault: {
    id: 'drone_assault',
    name: 'Assault Drone',
    nameRu: 'Штурмовой Дрон',
    threatLevel: 'T3',
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
  
  drone_heavy: {
    id: 'drone_heavy',
    name: 'Heavy Combat Drone',
    nameRu: 'Тяжёлый Боевой Дрон',
    threatLevel: 'T3',
    aiType: 'feral_drone',
    
    hp: 80,
    morale: 100,
    armor: 40,
    
    preferredRanks: [2],
    retreatThreshold: 0,
    immunities: ['fear', 'morale_damage', 'poison', 'stagger', 'pull'],
    
    availableActions: ['drone_heavy_laser', 'drone_emp_pulse', 'drone_repair_self'],
    
    aggroRadius: 35,
    
    xpReward: 120,
    lootTable: 'drone_heavy_loot'
  },

  // ============ T4: BOSS (БОССЫ) ============
  // Логика: Фазовая структура боя. Иммунитет к контролю.
  // Меняет условия арены.
  
  boss_anarchist_warlord: {
    id: 'boss_anarchist_warlord',
    name: 'Anarchist Warlord',
    nameRu: 'Анархист-Полководец',
    threatLevel: 'T4',
    aiType: 'boss',
    
    hp: 200,
    morale: 100,
    armor: 25,
    
    preferredRanks: [1, 2], // Агрессивный, лезет вперёд
    retreatThreshold: 0,
    immunities: ['fear', 'stagger', 'confusion', 'paralysis', 'pull', 'push'],
    
    availableActions: [
      'boss_rage_mode',           // Фаза 1: Ярость
      'boss_call_reinforcements', // Призыв подкрепления
      'boss_devastating_blow',    // Мощный удар
      'boss_battle_cry',          // Бафф союзникам
      'boss_execute'              // Добивание раненых
    ],
    
    xpReward: 500,
    lootTable: 'boss_anarchist_loot'
  },
  
  boss_synthesis_commander: {
    id: 'boss_synthesis_commander',
    name: 'Synthesis Commander',
    nameRu: 'Командир Синтеза',
    threatLevel: 'T4',
    aiType: 'boss',
    
    hp: 180,
    morale: 100,
    armor: 35,
    
    preferredRanks: [3, 4], // Тактик, держится сзади
    retreatThreshold: 0,
    immunities: ['fear', 'stagger', 'confusion', 'paralysis', 'morale_damage'],
    
    availableActions: [
      'boss_tactical_analysis',   // Фаза 1: Анализ
      'boss_drone_swarm',         // Призыв дронов
      'boss_precision_strike',    // Точный удар
      'boss_hack_systems',        // Взлом оружия игрока
      'boss_overload'             // AoE электрический урон
    ],
    
    xpReward: 550,
    lootTable: 'boss_synthesis_loot'
  },
  
  boss_echo_phantom: {
    id: 'boss_echo_phantom',
    name: 'Echo Phantom',
    nameRu: 'Фантом Эха',
    threatLevel: 'T4',
    aiType: 'boss',
    
    hp: 150,
    morale: 100,
    armor: 10, // Низкая броня, но...
    
    preferredRanks: [1, 2, 3, 4], // Телепортируется
    retreatThreshold: 0,
    immunities: ['fear', 'stagger', 'confusion', 'paralysis', 'physical'], // Иммунен к физике!
    
    availableActions: [
      'boss_phase_shift',         // Телепортация
      'boss_psychic_scream',      // Моральный урон всем
      'boss_possession_attempt',  // Попытка контроля
      'boss_echo_clone',          // Создание иллюзий
      'boss_reality_tear'         // Изменение арены
    ],
    
    xpReward: 600,
    lootTable: 'boss_phantom_loot'
  }
}

// ================== ДЕЙСТВИЯ ВРАГОВ ==================

export interface EnemyAction {
  id: string
  name: string
  nameRu: string
  staminaCost: number
  cooldown: number // ходов
  
  targetType: 'single' | 'area' | 'self' | 'ally'
  targetRanks?: CombatRank[]
  
  damage?: string // dice notation
  damageType?: string
  effects: Array<{
    type: EffectType
    value: number
    duration?: number
    chance?: number
    description: string
  }>
  
  aiPriority: number // 1-10, выше = чаще используется
  conditions?: string[] // условия для использования
}

export const ENEMY_ACTIONS: Record<string, EnemyAction> = {
  // ============ T1 ACTIONS ============
  scav_knife_stab: {
    id: 'scav_knife_stab',
    name: 'Knife Stab',
    nameRu: 'Удар ножом',
    staminaCost: 10,
    cooldown: 0,
    targetType: 'single',
    targetRanks: [1],
    damage: '1d4+1',
    damageType: 'slashing',
    effects: [],
    aiPriority: 5
  },
  
  scav_throw_rock: {
    id: 'scav_throw_rock',
    name: 'Throw Rock',
    nameRu: 'Бросок камня',
    staminaCost: 5,
    cooldown: 0,
    targetType: 'single',
    targetRanks: [1, 2, 3],
    damage: '1d4',
    damageType: 'crushing',
    effects: [
      { type: 'stagger', value: 10, chance: 20, description: '20% шанс оглушить' }
    ],
    aiPriority: 3
  },
  
  scav_flee: {
    id: 'scav_flee',
    name: 'Flee',
    nameRu: 'Побег',
    staminaCost: 20,
    cooldown: 0,
    targetType: 'self',
    effects: [],
    aiPriority: 8,
    conditions: ['hp_below_threshold', 'ally_killed']
  },
  
  scav_pistol_shot: {
    id: 'scav_pistol_shot',
    name: 'Pistol Shot',
    nameRu: 'Выстрел из пистолета',
    staminaCost: 10,
    cooldown: 0,
    targetType: 'single',
    targetRanks: [1, 2, 3],
    damage: '2d4',
    damageType: 'piercing',
    effects: [],
    aiPriority: 6
  },
  
  leader_rally_cry: {
    id: 'leader_rally_cry',
    name: 'Rally Cry',
    nameRu: 'Боевой Клич',
    staminaCost: 15,
    cooldown: 3,
    targetType: 'ally',
    effects: [
      { type: 'morale_boost', value: 15, duration: 2, description: '+15 к морали союзников на 2 хода' }
    ],
    aiPriority: 7,
    conditions: ['has_allies']
  },
  
  leader_command_attack: {
    id: 'leader_command_attack',
    name: 'Command Attack',
    nameRu: 'Приказ Атаковать',
    staminaCost: 10,
    cooldown: 2,
    targetType: 'ally',
    effects: [
      { type: 'buff', value: 20, duration: 1, description: 'Союзник получает +20% к урону на 1 ход' }
    ],
    aiPriority: 6,
    conditions: ['has_allies']
  },

  // ============ T2 ACTIONS ============
  fjr_rifle_burst: {
    id: 'fjr_rifle_burst',
    name: 'Rifle Burst',
    nameRu: 'Очередь из винтовки',
    staminaCost: 15,
    cooldown: 0,
    targetType: 'single',
    targetRanks: [1, 2, 3, 4],
    damage: '2d6',
    damageType: 'piercing',
    effects: [],
    aiPriority: 7
  },
  
  fjr_suppressive_fire: {
    id: 'fjr_suppressive_fire',
    name: 'Suppressive Fire',
    nameRu: 'Подавляющий огонь',
    staminaCost: 25,
    cooldown: 2,
    targetType: 'area',
    targetRanks: [1, 2, 3],
    damage: '1d6',
    damageType: 'piercing',
    effects: [
      { type: 'debuff', value: 30, duration: 1, description: '-30% к точности игрока на 1 ход' }
    ],
    aiPriority: 6
  },
  
  fjr_take_cover: {
    id: 'fjr_take_cover',
    name: 'Take Cover',
    nameRu: 'Укрыться',
    staminaCost: 10,
    cooldown: 1,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 30, duration: 1, description: '+30% к защите на 1 ход' }
    ],
    aiPriority: 5,
    conditions: ['hp_below_50']
  },
  
  fjr_shield_bash: {
    id: 'fjr_shield_bash',
    name: 'Shield Bash',
    nameRu: 'Удар Щитом',
    staminaCost: 20,
    cooldown: 1,
    targetType: 'single',
    targetRanks: [1],
    damage: '1d6+3',
    damageType: 'crushing',
    effects: [
      { type: 'stagger', value: 50, chance: 70, description: '70% шанс оглушить' },
      { type: 'push', value: 1, chance: 50, description: '50% шанс оттолкнуть' }
    ],
    aiPriority: 8
  },
  
  fjr_shield_wall: {
    id: 'fjr_shield_wall',
    name: 'Shield Wall',
    nameRu: 'Стена Щитов',
    staminaCost: 15,
    cooldown: 2,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 50, duration: 2, description: '+50% к блоку на 2 хода' }
    ],
    aiPriority: 7,
    conditions: ['ally_in_rear']
  },
  
  fjr_baton_strike: {
    id: 'fjr_baton_strike',
    name: 'Baton Strike',
    nameRu: 'Удар Дубинкой',
    staminaCost: 10,
    cooldown: 0,
    targetType: 'single',
    targetRanks: [1],
    damage: '1d6',
    damageType: 'crushing',
    effects: [
      { type: 'stamina_drain', value: 15, description: '-15 выносливости игрока' }
    ],
    aiPriority: 6
  },

  // ============ T3 ACTIONS ============
  drone_scan: {
    id: 'drone_scan',
    name: 'Tactical Scan',
    nameRu: 'Тактическое Сканирование',
    staminaCost: 5,
    cooldown: 2,
    targetType: 'single',
    effects: [
      { type: 'debuff', value: 20, duration: 3, description: 'Цель получает +20% урона на 3 хода' }
    ],
    aiPriority: 8
  },
  
  drone_taser: {
    id: 'drone_taser',
    name: 'Taser Shock',
    nameRu: 'Электрошок',
    staminaCost: 15,
    cooldown: 1,
    targetType: 'single',
    targetRanks: [1, 2, 3],
    damage: '1d6',
    damageType: 'electric',
    effects: [
      { type: 'stamina_drain', value: 20, description: '-20 выносливости' },
      { type: 'paralysis', value: 1, chance: 30, duration: 1, description: '30% шанс паралича на 1 ход' }
    ],
    aiPriority: 7
  },
  
  drone_mark_target: {
    id: 'drone_mark_target',
    name: 'Mark Target',
    nameRu: 'Пометить Цель',
    staminaCost: 10,
    cooldown: 3,
    targetType: 'single',
    effects: [
      { type: 'debuff', value: 30, duration: 2, description: 'Все союзники получают +30% к точности против цели' }
    ],
    aiPriority: 6,
    conditions: ['has_allies']
  },
  
  drone_machine_gun: {
    id: 'drone_machine_gun',
    name: 'Machine Gun Burst',
    nameRu: 'Пулемётная Очередь',
    staminaCost: 20,
    cooldown: 1,
    targetType: 'single',
    targetRanks: [1, 2, 3, 4],
    damage: '3d6',
    damageType: 'piercing',
    effects: [],
    aiPriority: 8
  },
  
  drone_shock_burst: {
    id: 'drone_shock_burst',
    name: 'Shock Burst',
    nameRu: 'Электрический Разряд',
    staminaCost: 25,
    cooldown: 2,
    targetType: 'area',
    targetRanks: [1, 2],
    damage: '2d6',
    damageType: 'electric',
    effects: [
      { type: 'stamina_drain', value: 15, description: '-15 выносливости всем в зоне' }
    ],
    aiPriority: 7
  },
  
  drone_ram: {
    id: 'drone_ram',
    name: 'Ram Attack',
    nameRu: 'Таран',
    staminaCost: 30,
    cooldown: 2,
    targetType: 'single',
    targetRanks: [1, 2],
    damage: '2d8',
    damageType: 'crushing',
    effects: [
      { type: 'push', value: 1, chance: 80, description: '80% шанс отбросить' }
    ],
    aiPriority: 6
  },

  // ============ T4 BOSS ACTIONS ============
  boss_rage_mode: {
    id: 'boss_rage_mode',
    name: 'Rage Mode',
    nameRu: 'Режим Ярости',
    staminaCost: 0,
    cooldown: 0, // Фазовая способность
    targetType: 'self',
    effects: [
      { type: 'buff', value: 50, duration: 99, description: '+50% к урону (перманентно)' },
      { type: 'debuff', value: 20, duration: 99, description: '-20% к защите (перманентно)' }
    ],
    aiPriority: 10,
    conditions: ['hp_below_50', 'phase_1']
  },
  
  boss_devastating_blow: {
    id: 'boss_devastating_blow',
    name: 'Devastating Blow',
    nameRu: 'Сокрушительный Удар',
    staminaCost: 40,
    cooldown: 2,
    targetType: 'single',
    targetRanks: [1, 2],
    damage: '4d8',
    damageType: 'crushing',
    effects: [
      { type: 'stagger', value: 100, chance: 100, description: 'Гарантированное оглушение' }
    ],
    aiPriority: 9
  },
  
  boss_battle_cry: {
    id: 'boss_battle_cry',
    name: 'Battle Cry',
    nameRu: 'Боевой Рёв',
    staminaCost: 20,
    cooldown: 3,
    targetType: 'ally',
    effects: [
      { type: 'morale_boost', value: 30, duration: 3, description: '+30 к морали всех союзников' },
      { type: 'buff', value: 15, duration: 2, description: '+15% к урону союзников' }
    ],
    aiPriority: 7,
    conditions: ['has_allies']
  },
  
  boss_call_reinforcements: {
    id: 'boss_call_reinforcements',
    name: 'Call Reinforcements',
    nameRu: 'Вызов Подкрепления',
    staminaCost: 30,
    cooldown: 5,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 0, description: 'Призывает 2 T1 юнитов' }
    ],
    aiPriority: 8,
    conditions: ['allies_below_2']
  },
  
  boss_execute: {
    id: 'boss_execute',
    name: 'Execute',
    nameRu: 'Казнь',
    staminaCost: 50,
    cooldown: 4,
    targetType: 'single',
    targetRanks: [1],
    damage: '6d6',
    damageType: 'slashing',
    effects: [],
    aiPriority: 10,
    conditions: ['target_hp_below_25']
  },
  
  boss_phase_shift: {
    id: 'boss_phase_shift',
    name: 'Phase Shift',
    nameRu: 'Фазовый Сдвиг',
    staminaCost: 15,
    cooldown: 1,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 100, duration: 1, description: 'Неуязвим на 1 ход + телепортация' }
    ],
    aiPriority: 9,
    conditions: ['just_took_damage']
  },
  
  boss_psychic_scream: {
    id: 'boss_psychic_scream',
    name: 'Psychic Scream',
    nameRu: 'Психический Крик',
    staminaCost: 35,
    cooldown: 3,
    targetType: 'area',
    targetRanks: [1, 2, 3, 4],
    effects: [
      { type: 'morale_damage', value: 25, description: '-25 морали всем' },
      { type: 'fear', value: 30, chance: 50, duration: 2, description: '50% шанс страха на 2 хода' }
    ],
    aiPriority: 8
  }
}

// ================== AI ЛОГИКА ==================

export interface AIDecision {
  actionId: string
  targetId?: string
  targetRank?: CombatRank
  priority: number
}

/**
 * Простой AI для выбора действия
 */
export function selectEnemyAction(
  enemy: EnemyTemplate,
  context: {
    currentHp: number
    maxHp: number
    playerRank: CombatRank
    enemyRank: CombatRank
    allyCount: number
    turnNumber: number
  }
): AIDecision | null {
  const availableActions = enemy.availableActions
    .map(id => ENEMY_ACTIONS[id])
    .filter(Boolean)
  
  if (availableActions.length === 0) return null
  
  const hpPercent = (context.currentHp / context.maxHp) * 100
  
  // Фильтруем по условиям
  const validActions = availableActions.filter(action => {
    if (!action.conditions) return true
    
    for (const condition of action.conditions) {
      switch (condition) {
        case 'hp_below_threshold':
        case 'hp_below_50':
          if (hpPercent >= enemy.retreatThreshold) return false
          break
        case 'hp_below_40':
          if (hpPercent >= 40) return false
          break
        case 'has_allies':
          if (context.allyCount === 0) return false
          break
        case 'ally_killed':
          // Проверяется внешне
          break
      }
    }
    
    // Проверяем дальность
    if (action.targetRanks && !action.targetRanks.includes(context.playerRank)) {
      return false
    }
    
    return true
  })
  
  if (validActions.length === 0) return null
  
  // Сортируем по приоритету
  validActions.sort((a, b) => b.aiPriority - a.aiPriority)
  
  // Выбираем с небольшой рандомизацией
  const topActions = validActions.slice(0, 3)
  const selected = topActions[Math.floor(Math.random() * topActions.length)]
  
  return {
    actionId: selected.id,
    targetRank: context.playerRank,
    priority: selected.aiPriority
  }
}










