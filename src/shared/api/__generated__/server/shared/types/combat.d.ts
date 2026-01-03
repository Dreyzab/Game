/**
 * =====================================================
 * БОЕВАЯ СИСТЕМА "ЭХО ФРАЙБУРГА" v0.4
 * Кинетический Слой (Kinetic Layer) - Side-View Combat
 * =====================================================
 */
export type BattleMode = 'standard' | 'arena';
/**
 * Позиция на боевой арене (1-4 для каждой стороны)
 * - Rank 1 (Авангард): Point Blank - ближний бой
 * - Rank 2 (Поддержка): Reach - средняя дистанция
 * - Rank 3 (Тыл): Ranged - дальний бой
 * - Rank 4 (Артиллерия): Sniper/Support
 */
export type CombatRank = 1 | 2 | 3 | 4;
export type CombatSide = 'player' | 'enemy';
export interface CombatPosition {
    side: CombatSide;
    rank: CombatRank;
    posture?: Posture;
}
export type Posture = 'neutral' | 'aggressive' | 'defensive' | 'evasive';
export type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'sniper' | 'melee_knife' | 'melee_blunt' | 'melee_spear' | 'fist';
export type DamageType = 'physical' | 'crushing' | 'piercing' | 'slashing' | 'electric' | 'fire' | 'poison' | 'sonic' | 'ritual' | 'ice';
/**
 * Протокол "Холодная Сталь" (Cold Steel Protocol)
 * Трансформация оружия при 0 патронов
 */
export interface ColdSteelAction {
    id: string;
    name: string;
    nameRu: string;
    damage: string;
    damageType: DamageType;
    staminaCost: number;
    effects: CombatEffect[];
    requiredVoice: string;
    validRanks: CombatRank[];
}
export interface WeaponTemplate {
    id: string;
    name: string;
    nameRu: string;
    type: WeaponType;
    isRanged: boolean;
    magazineSize?: number;
    damage?: string;
    damageType: DamageType;
    accuracy: number;
    range: CombatRank[];
    coldSteelAction?: ColdSteelAction;
    maxCondition: number;
    jamBaseChance: number;
    rankPenalties: Partial<Record<CombatRank, number>>;
}
export type CardType = 'attack' | 'defense' | 'movement' | 'voice' | 'item' | 'reaction' | 'reaction' | 'cold_steel' | 'posture' | 'jammed' | 'debt' | 'analysis';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'negative';
/**
 * Trinity Protocol: Card = Weapon (Base) + Artifact (Modifier) + Voice (Scaling)
 */
export interface CombatCard {
    id: string;
    name: string;
    nameRu: string;
    type: CardType;
    rarity: CardRarity;
    staminaCost: number;
    ammoCost?: number;
    requiredRanks?: CombatRank[];
    targetRanks?: CombatRank[];
    baseDamage?: string;
    damageType?: DamageType;
    effects: CombatEffect[];
    sourceWeapon?: string;
    sourceArtifact?: string;
    scalingVoice?: string;
    scalingFormula?: string;
    icon: string;
    animation?: string;
}
export type EffectType = 'damage' | 'heal' | 'buff' | 'debuff' | 'stagger' | 'push' | 'pull' | 'fear' | 'confusion' | 'paralysis' | 'morale_damage' | 'morale_boost' | 'stamina_drain' | 'stamina_restore' | 'armor_pierce' | 'critical_boost' | 'interrupt' | 'freeze' | 'root' | 'calm' | 'blessed' | 'analyze';
export interface CombatEffect {
    type: EffectType;
    value?: number;
    duration?: number;
    chance?: number;
    targetSelf?: boolean;
    description: string;
}
/**
 * Состояние истощения (Exhaustion State)
 * Если Stamina = 0, персонаж входит в это состояние
 */
export type ExhaustionLevel = 'none' | 'winded' | 'exhausted' | 'collapsed';
export interface CombatantResources {
    hp: number;
    maxHp: number;
    ap: number;
    maxAp: number;
    mp: number;
    maxMp: number;
    wp: number;
    maxWp: number;
    pp: number;
    maxPp: number;
}
export interface CombatantState {
    id: string;
    name: string;
    side: CombatSide;
    rank: CombatRank;
    resources: CombatantResources;
    currentWeaponId?: string;
    currentAmmo: number;
    weaponCondition: number;
    weaponHeat: number;
    exhaustionLevel: ExhaustionLevel;
    activeEffects: ActiveEffect[];
    scannedLevel?: number;
    posture?: Posture;
    jamState?: JamState;
    threatLevel?: ThreatLevel;
    aiType?: EnemyAIType;
}
export interface JamState {
    isJammed: boolean;
    jamChance: number;
    accumulatedHeat: number;
}
export interface ActiveEffect {
    type: EffectType;
    value: number;
    remainingTurns: number;
    source: string;
}
/**
 * Уровни угрозы (Threat Levels) - T1-T4
 */
export type ThreatLevel = 'T1' | 'T2' | 'T3' | 'T4';
export type EnemyAIType = 'scavenger' | 'enforcer' | 'feral_drone' | 'scorpion' | 'boss';
export interface EnemyTemplate {
    id: string;
    name: string;
    nameRu: string;
    threatLevel: ThreatLevel;
    aiType: EnemyAIType;
    hp: number;
    morale: number;
    armor: number;
    preferredRanks: CombatRank[];
    retreatThreshold: number;
    immunities: Array<EffectType | DamageType>;
    availableActions: string[];
    aggroRadius?: number;
    fleeConditions?: string[];
    xpReward: number;
    lootTable?: string;
}
/**
 * Genius Loci - Дух Места
 * Модификаторы от реальных районов Фрайбурга
 */
export type ZoneType = 'sanctuary' | 'chaos_zone' | 'forge' | 'canals' | 'neutral';
export interface ZoneModifier {
    id: string;
    zoneType: ZoneType;
    name: string;
    nameRu: string;
    voiceBuffs: Partial<Record<string, number>>;
    voiceDebuffs: Partial<Record<string, number>>;
    cardCostModifiers: Partial<Record<CardType, number>>;
    damageModifiers: Partial<Record<DamageType, number>>;
    specialEffects: CombatEffect[];
    historicalContext: string;
    geniusLociDescription: string;
}
export type BattlePhase = 'initiative' | 'player_turn' | 'enemy_turn' | 'resolution' | 'victory' | 'defeat' | 'flee';
export interface BattleSession {
    id: string;
    mode: BattleMode;
    playerId: string;
    zoneModifier?: ZoneModifier;
    environment?: string;
    turn: number;
    phase: BattlePhase;
    turnOrder: string[];
    currentActorIndex: number;
    turnTimeRemaining?: number;
    playerState: CombatantState;
    enemies: CombatantState[];
    teamSP: number;
    maxTeamSP: number;
    deck: CombatCard[];
    hand: CombatCard[];
    discard: CombatCard[];
    exhaustPile: CombatCard[];
    lastClickMoment?: {
        turn: number;
        weaponId: string;
        consequence: string;
    };
    log: BattleLogEntry[];
    startedAt: number;
    updatedAt: number;
}
export interface BattleLogEntry {
    turn: number;
    phase: BattlePhase;
    actorId: string;
    actorName: string;
    action: string;
    targets?: string[];
    damage?: number;
    effects?: string[];
    voiceComment?: {
        voiceId: string;
        voiceName: string;
        comment: string;
    };
    timestamp: number;
}
/**
 * Формула вероятности заклинивания (Jam Chance):
 * P_jam = (100 - Condition) * 0.2 + (Heat * 0.1) - (V_Analysis * 0.5)
 */
export declare function calculateJamChance(condition: number, heat: number, analysisLevel: number): number;
/**
 * Формула базового урона:
 * Damage = (Base_Weapon_Dmg + Force * k_force + Analysis * k_analysis) * M_artifact - Target_Armor
 */
export declare function calculateDamage(baseDamage: number, forceLevel: number, analysisLevel: number, artifactMultiplier: number, targetArmor: number, kForce?: number, kAnalysis?: number): number;
/**
 * Эффективный урон с учётом крита:
 * E_DMG = Damage * (1 + P_crit * (M_crit - 1))
 */
export declare function calculateEffectiveDamage(damage: number, critChance: number, // 0-1
critMultiplier: number): number;
/**
 * Power Score для матчмейкинга:
 * PS = Σ(Item_Score) + (Level × 10) + Σ(Voice_Levels × 5)
 */
export declare function calculatePowerScore(itemScores: number[], playerLevel: number, voiceLevels: number[]): number;
export declare const ACTION_POINT_COSTS: {
    readonly light_attack: 2;
    readonly heavy_attack: 4;
    readonly move: 1;
    readonly dash: 2;
    readonly dodge: 2;
    readonly block: 1;
    readonly reload: 2;
    readonly item_use: 1;
    readonly overwatch: 2;
    readonly scan: 1;
};
