/**
 * =====================================================
 * СИСТЕМА ПРОВЕРОК НАВЫКОВ
 * Skill Check System with Cooperative Mechanics
 * =====================================================
 */

import type { VoiceId } from '../types/parliament'
import { STARTING_SKILLS } from './stats'
import { calculateSkillCheckXP } from '../types/experience'

// ================== УРОВНИ СЛОЖНОСТИ ==================

/**
 * Уровни сложности проверок
 */
export type DifficultyLevel =
    | 'trivial'     // DC 15 - Почти автоматически
    | 'easy'        // DC 30 - Базовые навыки
    | 'medium'      // DC 50 - Стандартная сложность
    | 'hard'        // DC 70 - Развитый навык
    | 'very_hard'   // DC 85 - Экспертный уровень
    | 'legendary'   // DC 95 - Легендарная сложность

/**
 * DC значения для уровней сложности
 */
export const DIFFICULTY_DC: Record<DifficultyLevel, number> = {
    trivial: 15,
    easy: 30,
    medium: 50,
    hard: 70,
    very_hard: 85,
    legendary: 95,
}

/**
 * Русские названия сложностей
 */
export const DIFFICULTY_NAMES_RU: Record<DifficultyLevel, string> = {
    trivial: 'Тривиальная',
    easy: 'Лёгкая',
    medium: 'Средняя',
    hard: 'Сложная',
    very_hard: 'Очень сложная',
    legendary: 'Легендарная',
}

/**
 * Цвета сложностей
 */
export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
    trivial: 'text-gray-400',
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-orange-500',
    very_hard: 'text-red-500',
    legendary: 'text-purple-500',
}

// ================== КООПЕРАТИВНЫЕ ПРОВЕРКИ ==================

/**
 * Конфигурация кооперативных проверок
 */
export const COOP_CHECK_CONFIG = {
    /** Максимум помощников */
    MAX_HELPERS: 3,

    /** Минимальный навык для помощи (иначе мешает) */
    MIN_SKILL_TO_HELP: 20,

    /** Порог, ниже которого помощник мешает */
    HINDRANCE_THRESHOLD: 15,

    /** Штраф за "мешающего" помощника */
    HINDRANCE_PENALTY: 5,

    /** Базовый процент навыка помощника, переходящий в бонус */
    ASSIST_PERCENTAGE: 0.3,

    /** Коэффициент убывающей отдачи для каждого следующего помощника */
    DIMINISHING_FACTOR: 0.8,

    /** Максимальное снижение DC (в процентах от базовой) */
    MAX_DC_REDUCTION_PERCENT: 0.5,
} as const

/**
 * Информация об участнике проверки
 */
export interface CheckParticipant {
    id: string
    name: string
    classId?: string
    voiceLevels: Partial<Record<VoiceId, number>>
}

/**
 * Результат расчёта бонуса помощника
 */
export interface HelperContribution {
    participant: CheckParticipant
    skillLevel: number
    rawBonus: number
    diminishedBonus: number
    isHindrance: boolean
}

/**
 * Рассчитать бонус от помощников
 */
export function calculateAssistBonus(
    helpers: CheckParticipant[],
    voiceId: VoiceId
): {
    totalBonus: number
    contributions: HelperContribution[]
    hindranceCount: number
} {
    const contributions: HelperContribution[] = []
    let totalBonus = 0
    let hindranceCount = 0

    // Сортируем помощников по убыванию навыка
    const sortedHelpers = [...helpers].sort((a, b) => {
        const aLevel = getEffectiveVoiceLevel(a.voiceLevels, voiceId)
        const bLevel = getEffectiveVoiceLevel(b.voiceLevels, voiceId)
        return bLevel - aLevel
    })

    // Ограничиваем количество помощников
    const limitedHelpers = sortedHelpers.slice(0, COOP_CHECK_CONFIG.MAX_HELPERS)

    limitedHelpers.forEach((helper, index) => {
        const skillLevel = getEffectiveVoiceLevel(helper.voiceLevels, voiceId)

        // Проверка на "мешающего" помощника
        if (skillLevel < COOP_CHECK_CONFIG.HINDRANCE_THRESHOLD) {
            contributions.push({
                participant: helper,
                skillLevel,
                rawBonus: -COOP_CHECK_CONFIG.HINDRANCE_PENALTY,
                diminishedBonus: -COOP_CHECK_CONFIG.HINDRANCE_PENALTY,
                isHindrance: true,
            })
            totalBonus -= COOP_CHECK_CONFIG.HINDRANCE_PENALTY
            hindranceCount++
            return
        }

        // Проверка минимального навыка для помощи
        if (skillLevel < COOP_CHECK_CONFIG.MIN_SKILL_TO_HELP) {
            contributions.push({
                participant: helper,
                skillLevel,
                rawBonus: 0,
                diminishedBonus: 0,
                isHindrance: false,
            })
            return
        }

        // Расчёт бонуса с убывающей отдачей
        const rawBonus = skillLevel * COOP_CHECK_CONFIG.ASSIST_PERCENTAGE
        const diminishingFactor = Math.pow(COOP_CHECK_CONFIG.DIMINISHING_FACTOR, index)
        const diminishedBonus = Math.floor(rawBonus * diminishingFactor)

        contributions.push({
            participant: helper,
            skillLevel,
            rawBonus,
            diminishedBonus,
            isHindrance: false,
        })

        totalBonus += diminishedBonus
    })

    return { totalBonus, contributions, hindranceCount }
}

/**
 * Получить эффективный уровень голоса (база + модификаторы)
 */
function getEffectiveVoiceLevel(
    voiceLevels: Partial<Record<VoiceId, number>>,
    voiceId: VoiceId
): number {
    const base = (STARTING_SKILLS as any)[voiceId]
    const modifier = voiceLevels[voiceId] ?? 0
    return base + modifier
}

// ================== СИНЕРГИИ КЛАССОВ ==================

/**
 * Таблица синергий классов
 */
export const CLASS_SYNERGIES: Array<{
    classes: string[]
    voiceBonus: Partial<Record<VoiceId, number>>
    description: string
}> = [
        {
            classes: ['valkyrie', 'vorschlag'],
            voiceBonus: { knowledge: 10, logic: 5 },
            description: 'Медик + Техник: бонус к аналитическим проверкам',
        },
        {
            classes: ['ghost', 'vorschlag'],
            voiceBonus: { perception: 15, coordination: 5 },
            description: 'Снайпер + Техник: бонус к наблюдению',
        },
        {
            classes: ['shustrya', 'ghost'],
            voiceBonus: { courage: 10, reaction: 10 },
            description: 'Подрывник + Снайпер: бонус к реакции',
        },
        {
            classes: ['valkyrie', 'shustrya'],
            voiceBonus: { empathy: 10, drama: 10 },
            description: 'Медик + Подрывник: эмоциональная синергия',
        },
    ]

/**
 * Найти синергию между классами
 */
export function findClassSynergy(
    leaderClass: string,
    helperClasses: string[]
): typeof CLASS_SYNERGIES[number] | null {
    const allClasses = [leaderClass, ...helperClasses]

    for (const synergy of CLASS_SYNERGIES) {
        if (synergy.classes.every(c => allClasses.includes(c))) {
            return synergy
        }
    }

    return null
}

// ================== ПРОВЕРКА НАВЫКА ==================

/**
 * Результат проверки навыка
 */
export interface SkillCheckResult {
    /** Успех или провал */
    success: boolean

    /** Критический результат */
    isCritical: boolean

    /** Значение броска (1-100) */
    roll: number

    /** Эффективная сложность после модификаторов */
    effectiveDC: number

    /** Эффективный навык лидера */
    effectiveSkill: number

    /** Бонус от помощников */
    assistBonus: number

    /** Бонус от синергии */
    synergyBonus: number

    /** Заработанный опыт */
    xpEarned: number

    /** Детали для UI */
    details: {
        baseDC: number
        leaderSkill: number
        helperContributions: HelperContribution[]
        synergy: typeof CLASS_SYNERGIES[number] | null
    }
}

/**
 * Выполнить проверку навыка
 */
export function performSkillCheck(
    leader: CheckParticipant,
    helpers: CheckParticipant[],
    voiceId: VoiceId,
    difficulty: DifficultyLevel | number,
    options?: {
        /** Использовать фиксированный бросок (для тестов) */
        fixedRoll?: number
        /** Это первое использование навыка? */
        isFirstUse?: boolean
    }
): SkillCheckResult {
    const baseDC = typeof difficulty === 'number' ? difficulty : DIFFICULTY_DC[difficulty]
    const leaderSkill = getEffectiveVoiceLevel(leader.voiceLevels, voiceId)

    // Расчёт бонуса помощников
    const { totalBonus: assistBonus, contributions } = calculateAssistBonus(helpers, voiceId)

    // Поиск синергии
    const helperClasses = helpers.map(h => h.classId).filter((c): c is string => !!c)
    const synergy = leader.classId ? findClassSynergy(leader.classId, helperClasses) : null
    const synergyBonus = synergy?.voiceBonus[voiceId] ?? 0

    // Расчёт эффективной сложности
    const maxReduction = Math.floor(baseDC * COOP_CHECK_CONFIG.MAX_DC_REDUCTION_PERCENT)
    const totalReduction = Math.min(assistBonus + synergyBonus, maxReduction)
    const effectiveDC = Math.max(5, baseDC - totalReduction)

    // Бросок
    const roll = options?.fixedRoll ?? Math.floor(Math.random() * 100) + 1

    // Определение результата
    const isCriticalSuccess = roll <= 5
    const isCriticalFailure = roll >= 96
    const isCritical = isCriticalSuccess || isCriticalFailure

    // Успех: бросок <= навыку, с учётом DC
    // Упрощённая формула: успех если roll <= (skill - (effectiveDC - 50))
    const effectiveSkill = leaderSkill + (50 - effectiveDC)
    const success = isCriticalSuccess || (!isCriticalFailure && roll <= effectiveSkill)

    // Расчёт опыта
    const xpEarned = calculateSkillCheckXP(
        baseDC,
        success,
        isCriticalSuccess,
        options?.isFirstUse ?? false
    )

    return {
        success,
        isCritical,
        roll,
        effectiveDC,
        effectiveSkill,
        assistBonus,
        synergyBonus,
        xpEarned,
        details: {
            baseDC,
            leaderSkill,
            helperContributions: contributions,
            synergy,
        },
    }
}

/**
 * Рассчитать шанс успеха (для UI)
 */
export function calculateSuccessChance(
    leader: CheckParticipant,
    helpers: CheckParticipant[],
    voiceId: VoiceId,
    difficulty: DifficultyLevel | number
): number {
    const baseDC = typeof difficulty === 'number' ? difficulty : DIFFICULTY_DC[difficulty]
    const leaderSkill = getEffectiveVoiceLevel(leader.voiceLevels, voiceId)

    const { totalBonus: assistBonus } = calculateAssistBonus(helpers, voiceId)

    const helperClasses = helpers.map(h => h.classId).filter((c): c is string => !!c)
    const synergy = leader.classId ? findClassSynergy(leader.classId, helperClasses) : null
    const synergyBonus = synergy?.voiceBonus[voiceId] ?? 0

    const maxReduction = Math.floor(baseDC * COOP_CHECK_CONFIG.MAX_DC_REDUCTION_PERCENT)
    const totalReduction = Math.min(assistBonus + synergyBonus, maxReduction)
    const effectiveDC = Math.max(5, baseDC - totalReduction)

    const effectiveSkill = leaderSkill + (50 - effectiveDC)

    // Шанс = эффективный навык (ограничен 5-95%)
    return Math.max(5, Math.min(95, effectiveSkill))
}

/**
 * Получить уровень сложности по DC
 */
export function getDifficultyFromDC(dc: number): DifficultyLevel {
    if (dc <= 15) return 'trivial'
    if (dc <= 30) return 'easy'
    if (dc <= 50) return 'medium'
    if (dc <= 70) return 'hard'
    if (dc <= 85) return 'very_hard'
    return 'legendary'
}

// ================== РАСПРЕДЕЛЕНИЕ ОПЫТА В КООПЕРАТИВЕ ==================

/**
 * Доли XP для участников кооперативной проверки
 */
export const COOP_XP_SHARES = {
    leader: 1.0,
    helper1: 0.5,
    helper2: 0.3,
    helper3: 0.2,
    failurePenalty: 0.25, // При провале все получают 25%
} as const

/**
 * Рассчитать XP для каждого участника
 */
export function distributeCoopXP(
    baseXP: number,
    success: boolean,
    helperCount: number
): { leader: number; helpers: number[] } {
    const failureMultiplier = success ? 1 : COOP_XP_SHARES.failurePenalty

    const leaderXP = Math.floor(baseXP * COOP_XP_SHARES.leader * failureMultiplier)

    const helperShares = [
        COOP_XP_SHARES.helper1,
        COOP_XP_SHARES.helper2,
        COOP_XP_SHARES.helper3,
    ]

    const helpers = helperShares
        .slice(0, helperCount)
        .map(share => Math.floor(baseXP * share * failureMultiplier))

    return { leader: leaderXP, helpers }
}
