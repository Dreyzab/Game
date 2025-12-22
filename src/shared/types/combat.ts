/**
 * =====================================================
 * БОЕВАЯ СИСТЕМА "ЭХО ФРАЙБУРГА" v0.4
 * Кинетический Слой (Kinetic Layer) - Side-View Combat
 * =====================================================
 */

export type BattleMode = 'standard' | 'arena'

// ================== СИСТЕМА РАНГОВ (Rank System) ==================

/**
 * Позиция на боевой арене (1-4 для каждой стороны)
 * - Rank 1 (Авангард): Point Blank - ближний бой
 * - Rank 2 (Поддержка): Reach - средняя дистанция
 * - Rank 3 (Тыл): Ranged - дальний бой
 * - Rank 4 (Артиллерия): Sniper/Support
 */
export type CombatRank = 1 | 2 | 3 | 4

export type CombatSide = 'player' | 'enemy'

export interface CombatPosition {
  side: CombatSide
  rank: CombatRank
  posture?: Posture // For Arena mode
}

export type Posture = 'neutral' | 'aggressive' | 'defensive' | 'evasive'

// ================== ТИПЫ ОРУЖИЯ ==================

export type WeaponType =
  | 'pistol'
  | 'shotgun'
  | 'rifle'
  | 'sniper'
  | 'melee_knife'
  | 'melee_blunt'
  | 'melee_spear'
  | 'fist'

export type DamageType =
  | 'physical'
  | 'crushing'
  | 'piercing'
  | 'slashing'
  | 'electric'
  | 'fire'
  | 'poison'
  | 'sonic'

/**
 * Протокол "Холодная Сталь" (Cold Steel Protocol)
 * Трансформация оружия при 0 патронов
 */
export interface ColdSteelAction {
  id: string
  name: string
  nameRu: string
  damage: string // dice notation, e.g. "1d4"
  damageType: DamageType
  staminaCost: number
  effects: CombatEffect[]
  requiredVoice: string // Voice attribute for scaling
  validRanks: CombatRank[] // Ranks where this action is effective
}

export interface WeaponTemplate {
  id: string
  name: string
  nameRu: string
  type: WeaponType
  isRanged: boolean

  // Ranged stats
  magazineSize?: number
  damage?: string // dice notation
  damageType: DamageType
  accuracy: number // base accuracy modifier
  range: CombatRank[] // valid attack ranks

  // Cold Steel fallback
  coldSteelAction?: ColdSteelAction

  // Degradation system
  maxCondition: number
  jamBaseChance: number // P = (100-Condition) * 0.2 + (Heat * 0.1) - (Analysis * 0.5)

  // Rank restrictions
  rankPenalties: Partial<Record<CombatRank, number>> // accuracy penalty per rank
}

// ================== СИСТЕМА КАРТ ==================

export type CardType =
  | 'attack'
  | 'defense'
  | 'movement'
  | 'voice'
  | 'item'
  | 'reaction'
  | 'reaction'
  | 'cold_steel'
  | 'posture'
  | 'jammed'
  | 'debt'

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'negative'

/**
 * Trinity Protocol: Card = Weapon (Base) + Artifact (Modifier) + Voice (Scaling)
 */
export interface CombatCard {
  id: string
  name: string
  nameRu: string
  type: CardType
  rarity: CardRarity

  // Costs
  staminaCost: number
  ammoCost?: number

  // Requirements
  requiredRanks?: CombatRank[] // Player must be in these ranks
  targetRanks?: CombatRank[] // Valid target ranks

  // Effects
  baseDamage?: string // dice notation
  damageType?: DamageType
  effects: CombatEffect[]

  // Trinity Protocol sources
  sourceWeapon?: string
  sourceArtifact?: string
  scalingVoice?: string // Voice that increases effectiveness
  scalingFormula?: string // e.g. "1 + (voice / 10)"

  // Visual
  icon: string
  animation?: string
}

export type EffectType =
  | 'damage'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'stagger'
  | 'push'
  | 'pull'
  | 'fear'
  | 'confusion'
  | 'paralysis'
  | 'morale_damage'
  | 'morale_boost'
  | 'stamina_drain'
  | 'stamina_restore'
  | 'armor_pierce'
  | 'critical_boost'
  | 'interrupt'

export interface CombatEffect {
  type: EffectType
  value?: number
  duration?: number
  chance?: number // probability 0-100
  targetSelf?: boolean
  description: string
}

// ================== СОСТОЯНИЕ БОЯ ==================

/**
 * Состояние истощения (Exhaustion State)
 * Если Stamina = 0, персонаж входит в это состояние
 */
export type ExhaustionLevel = 'none' | 'winded' | 'exhausted' | 'collapsed'

export interface CombatantResources {
  hp: number
  maxHp: number
  ap: number
  maxAp: number
  mp: number
  maxMp: number
  wp: number
  maxWp: number
  pp: number
  maxPp: number // Hard cap 100
}

export interface CombatantState {
  id: string
  name: string
  side: CombatSide
  rank: CombatRank

  resources: CombatantResources

  // Deprecated flat fields (kept for compatibility if needed, but prefer resources object)
  // hp: number -> resources.hp
  // morale: number -> resources.wp
  // stamina: number -> resources.ap

  // Equipment state
  currentWeaponId?: string
  currentAmmo: number
  weaponCondition: number
  weaponHeat: number

  // Status
  exhaustionLevel: ExhaustionLevel
  activeEffects: ActiveEffect[]

  // Arena specific
  posture?: Posture
  jamState?: JamState

  // For enemies
  threatLevel?: ThreatLevel
  aiType?: EnemyAIType
}

export interface JamState {
  isJammed: boolean
  jamChance: number
  accumulatedHeat: number
}

export interface ActiveEffect {
  type: EffectType
  value: number
  remainingTurns: number
  source: string
}

// ================== СИСТЕМА ВРАГОВ ==================

/**
 * Уровни угрозы (Threat Levels) - T1-T4
 */
export type ThreatLevel = 'T1' | 'T2' | 'T3' | 'T4'

export type EnemyAIType =
  | 'scavenger'    // T1: Трусливый, стайный
  | 'enforcer'     // T2: Дисциплинированный, щиты
  | 'feral_drone'  // T3: Летающий, игнорирует укрытия
  | 'boss'         // T4: Фазовый, иммунен к контролю

export interface EnemyTemplate {
  id: string
  name: string
  nameRu: string
  threatLevel: ThreatLevel
  aiType: EnemyAIType

  // Base stats
  hp: number
  morale: number
  armor: number

  // Behavior
  preferredRanks: CombatRank[]
  retreatThreshold: number // HP% at which to retreat
  immunities: Array<EffectType | DamageType>

  // Cards/Actions
  availableActions: string[] // Card IDs

  // AI Logic
  aggroRadius?: number
  fleeConditions?: string[]

  // Rewards
  xpReward: number
  lootTable?: string
}

// ================== ГЕО-НАРРАТИВНЫЕ ЗОНЫ ==================

/**
 * Genius Loci - Дух Места
 * Модификаторы от реальных районов Фрайбурга
 */
export type ZoneType =
  | 'sanctuary'      // Freiburger Münster - Sacred Ground
  | 'chaos_zone'     // Vauban District - Solar Overcharge
  | 'forge'          // Industrial North - Magnetic Field
  | 'canals'         // Bächle - Slippery
  | 'neutral'

export interface ZoneModifier {
  id: string
  zoneType: ZoneType
  name: string
  nameRu: string

  // Effects on combat
  voiceBuffs: Partial<Record<string, number>>    // Voice ID -> modifier
  voiceDebuffs: Partial<Record<string, number>>

  cardCostModifiers: Partial<Record<CardType, number>> // AP cost changes
  damageModifiers: Partial<Record<DamageType, number>>

  specialEffects: CombatEffect[]

  // Lore
  historicalContext: string
  geniusLociDescription: string
}

// ================== СЕССИЯ БОЯ ==================

export type BattlePhase =
  | 'initiative'      // Определение порядка хода
  | 'player_turn'     // Ход игрока
  | 'enemy_turn'      // Ход врагов
  | 'resolution'      // Применение эффектов конца хода
  | 'victory'         // Победа
  | 'defeat'          // Поражение
  | 'flee'            // Побег

export interface BattleSession {
  id: string
  mode: BattleMode
  playerId: string

  // Arena
  zoneModifier?: ZoneModifier
  environment?: string

  // Turn management
  turn: number
  phase: BattlePhase
  turnOrder: string[] // Combatant IDs in initiative order
  currentActorIndex: number
  turnTimeRemaining?: number // seconds (12s default)

  // Combatants
  playerState: CombatantState
  enemies: CombatantState[]

  // Team Resources
  teamSP: number      // Social Points (Current)
  maxTeamSP: number   // Social Points (Max)

  // Deck state (Card-based combat)
  deck: CombatCard[]
  hand: CombatCard[]
  discard: CombatCard[]
  exhaustPile: CombatCard[] // Cards removed from play

  // "Момент Щелчка" (Click Moment) tracking
  lastClickMoment?: {
    turn: number
    weaponId: string
    consequence: string
  }

  // Combat log
  log: BattleLogEntry[]

  // Timestamps
  startedAt: number
  updatedAt: number
}

export interface BattleLogEntry {
  turn: number
  phase: BattlePhase
  actorId: string
  actorName: string
  action: string
  targets?: string[]
  damage?: number
  effects?: string[]
  voiceComment?: {
    voiceId: string
    voiceName: string
    comment: string
  }
  timestamp: number
}

// ================== ФОРМУЛЫ И РАСЧЁТЫ ==================

/**
 * Формула вероятности заклинивания (Jam Chance):
 * P_jam = (100 - Condition) * 0.2 + (Heat * 0.1) - (V_Analysis * 0.5)
 */
export function calculateJamChance(
  condition: number,
  heat: number,
  analysisLevel: number
): number {
  const chance = (100 - condition) * 0.2 + (heat * 0.1) - (analysisLevel * 0.5)
  return Math.max(0, Math.min(100, chance))
}

/**
 * Формула базового урона:
 * Damage = (Base_Weapon_Dmg + Force * k_force + Analysis * k_analysis) * M_artifact - Target_Armor
 */
export function calculateDamage(
  baseDamage: number,
  forceLevel: number,
  analysisLevel: number,
  artifactMultiplier: number,
  targetArmor: number,
  kForce = 0.5,
  kAnalysis = 0.3
): number {
  const raw = (baseDamage + forceLevel * kForce + analysisLevel * kAnalysis) * artifactMultiplier
  return Math.max(0, Math.floor(raw - targetArmor))
}

/**
 * Эффективный урон с учётом крита:
 * E_DMG = Damage * (1 + P_crit * (M_crit - 1))
 */
export function calculateEffectiveDamage(
  damage: number,
  critChance: number, // 0-1
  critMultiplier: number
): number {
  return Math.floor(damage * (1 + critChance * (critMultiplier - 1)))
}

/**
 * Power Score для матчмейкинга:
 * PS = Σ(Item_Score) + (Level × 10) + Σ(Voice_Levels × 5)
 */
export function calculatePowerScore(
  itemScores: number[],
  playerLevel: number,
  voiceLevels: number[]
): number {
  const itemSum = itemScores.reduce((a, b) => a + b, 0)
  const voiceSum = voiceLevels.reduce((a, b) => a + b, 0)
  return itemSum + (playerLevel * 10) + (voiceSum * 5)
}

// ================== ACTION POINT COSTS ==================

export const ACTION_POINT_COSTS = {
  light_attack: 2,
  heavy_attack: 4,
  move: 1,
  dash: 2,
  dodge: 2, // Reaction cost
  block: 1,
  reload: 2,
  item_use: 1,
  overwatch: 2
} as const

// ================== ЭКСПОРТ ==================



















