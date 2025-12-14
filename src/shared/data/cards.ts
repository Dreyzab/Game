/**
 * =====================================================
 * TRINITY PROTOCOL - СИСТЕМА СИНТЕЗА КАРТ
 * Card = Weapon (Base) + Artifact (Modifier) + Voice (Scaling)
 * =====================================================
 */

import type {
  CombatCard,
  CardRarity,
  CombatEffect,
  CombatRank,
  DamageType
} from '@/shared/types/combat'
import type { VoiceId } from '@/shared/types/parliament'
import { WEAPON_TEMPLATES } from './weapons'

// ================== АРТЕФАКТЫ (МОДИФИКАТОРЫ) ==================

export interface Artifact {
  id: string
  name: string
  nameRu: string
  description: string

  // Модификаторы к картам
  damageTypeOverride?: DamageType
  damageMultiplier?: number
  additionalEffects: CombatEffect[]

  // Требования
  requiredVoice?: VoiceId
  requiredVoiceLevel?: number

  // Редкость
  rarity: CardRarity

  // Где найти
  sourceZone?: string
}

export const ARTIFACTS: Record<string, Artifact> = {
  tesla_coil: {
    id: 'tesla_coil',
    name: 'Tesla Coil',
    nameRu: 'Электро-катушка Теслы',
    description: 'Добавляет электрический урон к атакам',
    damageTypeOverride: 'electric',
    damageMultiplier: 1.2,
    additionalEffects: [
      { type: 'paralysis', value: 1, chance: 20, duration: 1, description: '20% шанс паралича' }
    ],
    requiredVoice: 'analysis',
    requiredVoiceLevel: 20,
    rarity: 'rare',
    sourceZone: 'chaos_zone_vauban'
  },

  holy_water: {
    id: 'holy_water',
    name: 'Holy Water',
    nameRu: 'Святая Вода',
    description: 'Усиливает урон по призракам и демонам',
    damageMultiplier: 1.5, // против нежити
    additionalEffects: [
      { type: 'morale_damage', value: 15, description: '+15 морального урона врагам' },
      { type: 'fear', value: 20, chance: 30, description: '30% шанс страха у нежити' }
    ],
    requiredVoice: 'empathy',
    rarity: 'uncommon',
    sourceZone: 'sanctuary_munster'
  },

  poison_vial: {
    id: 'poison_vial',
    name: 'Poison Vial',
    nameRu: 'Флакон Яда',
    description: 'Отравляет оружие',
    additionalEffects: [
      { type: 'damage', value: 3, duration: 3, description: '3 урона в ход на 3 хода (яд)' }
    ],
    rarity: 'common'
  },

  incendiary_oil: {
    id: 'incendiary_oil',
    name: 'Incendiary Oil',
    nameRu: 'Зажигательное Масло',
    description: 'Поджигает цель',
    damageTypeOverride: 'fire',
    additionalEffects: [
      { type: 'damage', value: 5, duration: 2, description: '5 урона в ход на 2 хода (огонь)' }
    ],
    rarity: 'uncommon'
  },

  magnetic_fragment: {
    id: 'magnetic_fragment',
    name: 'Magnetic Fragment',
    nameRu: 'Магнитный Осколок',
    description: 'Притягивает врагов',
    additionalEffects: [
      { type: 'pull', value: 1, chance: 40, description: '40% шанс притянуть врага на 1 ранг' }
    ],
    requiredVoice: 'force',
    rarity: 'rare',
    sourceZone: 'forge_industrial'
  },

  adrenaline_syringe: {
    id: 'adrenaline_syringe',
    name: 'Adrenaline Syringe',
    nameRu: 'Шприц Адреналина',
    description: 'Игнорирует усталость',
    additionalEffects: [
      { type: 'stamina_restore', value: 20, targetSelf: true, description: '+20 к выносливости после атаки' }
    ],
    requiredVoice: 'gambling',
    rarity: 'rare'
  },

  echo_crystal: {
    id: 'echo_crystal',
    name: 'Echo Crystal',
    nameRu: 'Кристалл Эха',
    description: 'Усиливает психические атаки',
    damageMultiplier: 1.3,
    additionalEffects: [
      { type: 'confusion', value: 20, chance: 25, duration: 2, description: '25% шанс замешательства на 2 хода' }
    ],
    requiredVoice: 'suggestion',
    requiredVoiceLevel: 30,
    rarity: 'legendary'
  },

  honor_badge: {
    id: 'honor_badge',
    name: 'Honor Badge',
    nameRu: 'Знак Чести',
    description: 'Бонус за честный бой',
    additionalEffects: [
      { type: 'morale_boost', value: 10, targetSelf: true, description: '+10 к морали при честной победе' }
    ],
    requiredVoice: 'honor',
    rarity: 'uncommon'
  }
}

// ================== БАЗОВЫЕ КАРТЫ ==================

export const BASE_CARDS: Record<string, CombatCard> = {
  // ============ АТАКИ ============
  punch_basic: {
    id: 'punch_basic',
    name: 'Basic Punch',
    nameRu: 'Удар кулаком',
    type: 'attack',
    rarity: 'common',
    staminaCost: 10,
    requiredRanks: [1],
    targetRanks: [1],
    baseDamage: '1d4',
    damageType: 'crushing',
    effects: [],
    sourceWeapon: 'fists',
    scalingVoice: 'force',
    scalingFormula: '1 + (force / 20)',
    icon: '👊',
    animation: 'punch'
  },

  dodge_basic: {
    id: 'dodge_basic',
    name: 'Dodge',
    nameRu: 'Уклонение',
    type: 'defense',
    rarity: 'common',
    staminaCost: 25,
    effects: [
      { type: 'buff', value: 50, duration: 1, description: '+50% к уклонению на 1 ход' }
    ],
    scalingVoice: 'reaction',
    scalingFormula: '1 + (reaction / 30)',
    icon: '💨',
    animation: 'dodge'
  },

  block_basic: {
    id: 'block_basic',
    name: 'Block',
    nameRu: 'Блок',
    type: 'defense',
    rarity: 'common',
    staminaCost: 15,
    effects: [
      { type: 'buff', value: 30, duration: 1, description: '+30% к защите на 1 ход' }
    ],
    scalingVoice: 'resilience',
    scalingFormula: '1 + (resilience / 25)',
    icon: '🛡️',
    animation: 'block'
  },

  // ============ ПЕРЕМЕЩЕНИЕ ============
  advance: {
    id: 'advance',
    name: 'Advance',
    nameRu: 'Наступление',
    type: 'movement',
    rarity: 'common',
    staminaCost: 15,
    effects: [
      { type: 'buff', value: -1, description: 'Перемещает игрока на 1 ранг вперёд' }
    ],
    scalingVoice: 'courage',
    icon: '⬆️',
    animation: 'advance'
  },

  retreat: {
    id: 'retreat',
    name: 'Retreat',
    nameRu: 'Отступление',
    type: 'movement',
    rarity: 'common',
    staminaCost: 15,
    effects: [
      { type: 'buff', value: 1, description: 'Перемещает игрока на 1 ранг назад' }
    ],
    icon: '⬇️',
    animation: 'retreat'
  },

  dash: {
    id: 'dash',
    name: 'Dash',
    nameRu: 'Рывок',
    type: 'movement',
    rarity: 'uncommon',
    staminaCost: 20,
    effects: [
      { type: 'buff', value: -2, description: 'Перемещает игрока на 2 ранга вперёд' }
    ],
    scalingVoice: 'endurance',
    icon: '⚡',
    animation: 'dash'
  },

  // ============ ГОЛОСОВЫЕ КАРТЫ ============
  intimidate: {
    id: 'intimidate',
    name: 'Intimidate',
    nameRu: 'Запугивание',
    type: 'voice',
    rarity: 'uncommon',
    staminaCost: 10,
    targetRanks: [1, 2, 3],
    effects: [
      { type: 'fear', value: 20, chance: 50, duration: 1, description: '50% шанс страха на 1 ход' },
      { type: 'morale_damage', value: 10, description: '-10 к морали врага' }
    ],
    scalingVoice: 'authority',
    scalingFormula: '1 + (authority / 15)',
    icon: '😠',
    animation: 'intimidate'
  },

  rally: {
    id: 'rally',
    name: 'Rally',
    nameRu: 'Воодушевление',
    type: 'voice',
    rarity: 'uncommon',
    staminaCost: 15,
    effects: [
      { type: 'morale_boost', value: 15, targetSelf: true, description: '+15 к морали' },
      { type: 'buff', value: 10, duration: 2, targetSelf: true, description: '+10% к урону на 2 хода' }
    ],
    scalingVoice: 'courage',
    icon: '🔥',
    animation: 'rally'
  },

  analyze_weakness: {
    id: 'analyze_weakness',
    name: 'Analyze Weakness',
    nameRu: 'Анализ Слабости',
    type: 'voice',
    rarity: 'rare',
    staminaCost: 10,
    targetRanks: [1, 2, 3, 4],
    effects: [
      { type: 'debuff', value: 25, duration: 3, description: 'Враг получает +25% урона на 3 хода' }
    ],
    scalingVoice: 'analysis',
    scalingFormula: '1 + (analysis / 20)',
    icon: '🔍',
    animation: 'analyze'
  },

  taunt: {
    id: 'taunt',
    name: 'Taunt',
    nameRu: 'Провокация',
    type: 'voice',
    rarity: 'common',
    staminaCost: 8,
    targetRanks: [1, 2, 3, 4],
    effects: [
      { type: 'debuff', value: 0, duration: 2, description: 'Враг атакует только вас 2 хода' }
    ],
    scalingVoice: 'drama',
    icon: '🎭',
    animation: 'taunt'
  },

  confuse: {
    id: 'confuse',
    name: 'Confuse',
    nameRu: 'Замешательство',
    type: 'voice',
    rarity: 'rare',
    staminaCost: 20,
    targetRanks: [1, 2, 3],
    effects: [
      { type: 'confusion', value: 30, chance: 60, duration: 2, description: '60% шанс замешательства на 2 хода' }
    ],
    scalingVoice: 'suggestion',
    scalingFormula: '1 + (suggestion / 20)',
    icon: '🌀',
    animation: 'confuse'
  },

  // ============ ПРЕДМЕТЫ ============
  use_bandage: {
    id: 'use_bandage',
    name: 'Use Bandage',
    nameRu: 'Применить Бинт',
    type: 'item',
    rarity: 'common',
    staminaCost: 5,
    effects: [
      { type: 'heal', value: 15, targetSelf: true, description: '+15 HP' }
    ],
    icon: '🩹',
    animation: 'heal'
  },

  use_medkit: {
    id: 'use_medkit',
    name: 'Use Medkit',
    nameRu: 'Применить Аптечку',
    type: 'item',
    rarity: 'uncommon',
    staminaCost: 10,
    effects: [
      { type: 'heal', value: 40, targetSelf: true, description: '+40 HP' }
    ],
    icon: '💊',
    animation: 'heal'
  },

  use_stimulant: {
    id: 'use_stimulant',
    name: 'Use Stimulant',
    nameRu: 'Применить Стимулятор',
    type: 'item',
    rarity: 'rare',
    staminaCost: 0,
    effects: [
      { type: 'stamina_restore', value: 50, targetSelf: true, description: '+50 Выносливости' },
      { type: 'morale_damage', value: 5, targetSelf: true, description: '-5 Морали (побочный эффект)' }
    ],
    icon: '💉',
    animation: 'inject'
  },

  // ============ РЕАКЦИИ ============
  counter_attack: {
    id: 'counter_attack',
    name: 'Counter Attack',
    nameRu: 'Контратака',
    type: 'reaction',
    rarity: 'rare',
    staminaCost: 30,
    requiredRanks: [1, 2],
    targetRanks: [1],
    baseDamage: '1d6+2',
    damageType: 'physical',
    effects: [],
    scalingVoice: 'reaction',
    scalingFormula: '1 + (reaction / 15)',
    icon: '⚔️',
    animation: 'counter'
  },

  interrupt: {
    id: 'interrupt',
    name: 'Interrupt',
    nameRu: 'Прерывание',
    type: 'reaction',
    rarity: 'rare',
    staminaCost: 25,
    effects: [
      { type: 'interrupt', value: 100, description: 'Прерывает действие врага' }
    ],
    scalingVoice: 'reaction',
    icon: '✋',
    animation: 'interrupt'
  },

  // ============ ВОССТАНОВЛЕНИЕ ============
  recover: {
    id: 'recover',
    name: 'Recover',
    nameRu: 'Восстановление',
    type: 'defense',
    rarity: 'common',
    staminaCost: 0, // Бесплатно, но тратит ход
    effects: [
      { type: 'stamina_restore', value: 30, targetSelf: true, description: '+30 Выносливости' }
    ],
    scalingVoice: 'endurance',
    scalingFormula: '1 + (endurance / 25)',
    icon: '😤',
    animation: 'recover'
  },
  // ============ ARENA SPECIFIC ============
  jammed: {
    id: 'jammed',
    name: 'JAMMED',
    nameRu: 'ЗАКЛИНИЛО',
    type: 'jammed',
    rarity: 'negative',
    staminaCost: 20, // Cost to clear
    effects: [
      { type: 'debuff', value: 0, description: 'Оружие не стреляет. Потратьте 20 выносливости чтобы починить.' }
    ],
    icon: '🚫',
    animation: 'jam'
  },

  debt: {
    id: 'debt',
    name: 'DEBT',
    nameRu: 'ДОЛГ',
    type: 'debt',
    rarity: 'negative',
    staminaCost: 0,
    effects: [
      { type: 'stamina_drain', value: 10, targetSelf: true, description: 'Отнимает 10 выносливости каждый ход' }
    ],
    icon: '💸',
    animation: 'debuff'
  },

  posture_aggressive: {
    id: 'posture_aggressive',
    name: 'Aggressive Stance',
    nameRu: 'Агрессивная стойка',
    type: 'posture',
    rarity: 'common',
    staminaCost: 10,
    effects: [
      { type: 'buff', value: 20, duration: 2, description: '+20% к урону, -10% к защите' }
    ],
    icon: '😤',
    animation: 'buff'
  },

  posture_defensive: {
    id: 'posture_defensive',
    name: 'Defensive Stance',
    nameRu: 'Защитная стойка',
    type: 'posture',
    rarity: 'common',
    staminaCost: 10,
    effects: [
      { type: 'buff', value: 20, duration: 2, description: '+20% к защите, -10% к урону' }
    ],
    icon: '🛡️',
    animation: 'buff'
  },

  posture_evasive: {
    id: 'posture_evasive',
    name: 'Evasive Stance',
    nameRu: 'Уклончивая стойка',
    type: 'posture',
    rarity: 'common',
    staminaCost: 15,
    effects: [
      { type: 'buff', value: 30, duration: 2, description: '+30% к уклонению' }
    ],
    icon: '💨',
    animation: 'buff'
  }
}

// ================== TRINITY PROTOCOL - СИНТЕЗ КАРТ ==================

/**
 * Синтезирует карту из оружия, артефакта и голоса
 */
export function synthesizeCard(
  weaponId: string,
  artifactId: string | null,
  scalingVoiceId: VoiceId,
  voiceLevel: number
): CombatCard | null {
  const weapon = WEAPON_TEMPLATES[weaponId]
  if (!weapon) return null

  const artifact = artifactId ? ARTIFACTS[artifactId] : null

  // Проверяем требования артефакта
  if (artifact?.requiredVoice && artifact.requiredVoice !== scalingVoiceId) {
    return null
  }
  if (artifact?.requiredVoiceLevel && voiceLevel < artifact.requiredVoiceLevel) {
    return null
  }

  // Базовая карта из оружия
  const baseDamage = weapon.damage || '1d4'
  let damageType = weapon.damageType
  let effects: CombatEffect[] = []
  let damageMultiplier = 1

  // Применяем модификаторы артефакта
  if (artifact) {
    if (artifact.damageTypeOverride) {
      damageType = artifact.damageTypeOverride
    }
    if (artifact.damageMultiplier) {
      damageMultiplier *= artifact.damageMultiplier
    }
    effects = [...effects, ...artifact.additionalEffects]
  }

  // Скейлинг от голоса
  const voiceScaling = 1 + (voiceLevel / 20)
  damageMultiplier *= voiceScaling

  // Определяем редкость
  let rarity: CardRarity = 'common'
  if (artifact?.rarity === 'legendary') rarity = 'legendary'
  else if (artifact?.rarity === 'rare' || voiceLevel > 50) rarity = 'rare'
  else if (artifact?.rarity === 'uncommon' || voiceLevel > 30) rarity = 'uncommon'

  // Генерируем название
  const namePrefix = artifact ? `${artifact.nameRu} ` : ''
  const cardName = `${namePrefix}${weapon.nameRu}`

  const synthesizedCard: CombatCard = {
    id: `synth_${weaponId}_${artifactId || 'none'}_${scalingVoiceId}`,
    name: `${artifact?.name || ''} ${weapon.name}`.trim(),
    nameRu: cardName,
    type: weapon.isRanged ? 'attack' : 'cold_steel',
    rarity,
    staminaCost: weapon.isRanged ? 15 : 20,
    ammoCost: weapon.isRanged ? 1 : 0,
    requiredRanks: weapon.range as CombatRank[],
    targetRanks: weapon.range as CombatRank[],
    baseDamage: `${baseDamage}*${damageMultiplier.toFixed(1)}`,
    damageType,
    effects,
    sourceWeapon: weaponId,
    sourceArtifact: artifactId || undefined,
    scalingVoice: scalingVoiceId,
    scalingFormula: `1 + (${scalingVoiceId} / 20)`,
    icon: weapon.isRanged ? '🔫' : '⚔️'
  }

  return synthesizedCard
}

/**
 * Генерирует колоду из снаряжения игрока
 */
export function generateDeckFromEquipment(
  equippedWeapons: string[],
  equippedArtifacts: string[],
  voiceLevels: Record<string, number>,
  dominantVoice: VoiceId
): CombatCard[] {
  const deck: CombatCard[] = []

  // Добавляем базовые карты
  deck.push(BASE_CARDS.punch_basic)
  deck.push(BASE_CARDS.dodge_basic)
  deck.push(BASE_CARDS.block_basic)
  deck.push(BASE_CARDS.advance)
  deck.push(BASE_CARDS.retreat)
  deck.push(BASE_CARDS.recover)

  // Синтезируем карты из оружия
  for (const weaponId of equippedWeapons) {
    const weapon = WEAPON_TEMPLATES[weaponId]
    if (!weapon) continue

    // Основная атака
    const primaryCard = synthesizeCard(
      weaponId,
      equippedArtifacts[0] || null,
      dominantVoice,
      voiceLevels[dominantVoice] || 0
    )
    if (primaryCard) deck.push(primaryCard)

    // Cold Steel fallback
    if (weapon.coldSteelAction) {
      const coldSteelCard: CombatCard = {
        id: `cold_steel_${weaponId}`,
        name: weapon.coldSteelAction.name,
        nameRu: weapon.coldSteelAction.nameRu,
        type: 'cold_steel',
        rarity: 'common',
        staminaCost: weapon.coldSteelAction.staminaCost,
        requiredRanks: weapon.coldSteelAction.validRanks,
        targetRanks: weapon.coldSteelAction.validRanks,
        baseDamage: weapon.coldSteelAction.damage,
        damageType: weapon.coldSteelAction.damageType,
        effects: weapon.coldSteelAction.effects,
        sourceWeapon: weaponId,
        scalingVoice: weapon.coldSteelAction.requiredVoice as VoiceId,
        icon: '🔨'
      }
      deck.push(coldSteelCard)
    }
  }

  // Добавляем голосовые карты в зависимости от уровней
  if ((voiceLevels.authority || 0) >= 20) deck.push(BASE_CARDS.intimidate)
  if ((voiceLevels.courage || 0) >= 20) deck.push(BASE_CARDS.rally)
  if ((voiceLevels.analysis || 0) >= 25) deck.push(BASE_CARDS.analyze_weakness)
  if ((voiceLevels.drama || 0) >= 15) deck.push(BASE_CARDS.taunt)
  if ((voiceLevels.suggestion || 0) >= 30) deck.push(BASE_CARDS.confuse)
  if ((voiceLevels.reaction || 0) >= 35) deck.push(BASE_CARDS.counter_attack)
  if ((voiceLevels.reaction || 0) >= 40) deck.push(BASE_CARDS.interrupt)

  return deck
}

/**
 * Перемешивает колоду (Fisher-Yates shuffle)
 */
export function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Тянет карты из колоды
 */
export function drawCards(
  deck: CombatCard[],
  count: number
): { drawn: CombatCard[]; remaining: CombatCard[] } {
  const drawn = deck.slice(0, count)
  const remaining = deck.slice(count)
  return { drawn, remaining }
}

















