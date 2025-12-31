/**
 * =====================================================
 * СИСТЕМА ОПЫТА И УРОВНЕЙ
 * Experience & Leveling System
 * =====================================================
 */

import type { VoiceId, AttributeGroup } from './parliament'

// ================== КОНФИГУРАЦИЯ УРОВНЕЙ ==================

/**
 * Максимальный уровень персонажа
 */
export const MAX_LEVEL = 20

/**
 * Рассчитать XP, необходимый для достижения уровня
 * Формула: 100 × N × (1 + N × 0.1)
 */
export function getXPForLevel(level: number): number {
    if (level <= 1) return 0
    return Math.floor(100 * level * (1 + level * 0.1))
}

/**
 * Рассчитать общий XP, необходимый для уровня (накопительно)
 */
export function getTotalXPForLevel(level: number): number {
    let total = 0
    for (let i = 2; i <= level; i++) {
        total += getXPForLevel(i)
    }
    return total
}

/**
 * Получить текущий уровень по общему XP
 */
export function getLevelFromXP(totalXP: number): number {
    let level = 1
    let accumulated = 0

    while (level < MAX_LEVEL) {
        const required = getXPForLevel(level + 1)
        if (accumulated + required > totalXP) break
        accumulated += required
        level++
    }

    return level
}

/**
 * Получить прогресс до следующего уровня (0-1)
 */
export function getLevelProgress(totalXP: number): number {
    const currentLevel = getLevelFromXP(totalXP)
    if (currentLevel >= MAX_LEVEL) return 1

    const currentLevelXP = getTotalXPForLevel(currentLevel)
    const nextLevelXP = getTotalXPForLevel(currentLevel + 1)
    const xpInCurrentLevel = totalXP - currentLevelXP
    const xpNeededForNext = nextLevelXP - currentLevelXP

    return xpInCurrentLevel / xpNeededForNext
}

// ================== ОЧКИ РАСПРЕДЕЛЕНИЯ ==================

/**
 * Типы очков распределения
 */
export type PointType = 'voice' | 'group'

/**
 * Конфигурация очков за уровень
 */
interface LevelPointsConfig {
    voicePoints: number
    groupPoints: number
}

/**
 * Получить очки за достижение уровня
 */
export function getPointsForLevel(level: number): LevelPointsConfig {
    if (level <= 5) {
        return { voicePoints: 3, groupPoints: 0 }
    } else if (level <= 10) {
        return { voicePoints: 2, groupPoints: 1 }
    } else {
        return { voicePoints: 1, groupPoints: 1 }
    }
}

/**
 * Рассчитать общие очки для уровня (накопительно)
 */
export function getTotalPointsForLevel(level: number): LevelPointsConfig {
    let voicePoints = 0
    let groupPoints = 0

    for (let i = 2; i <= level; i++) {
        const points = getPointsForLevel(i)
        voicePoints += points.voicePoints
        groupPoints += points.groupPoints
    }

    return { voicePoints, groupPoints }
}

// ================== ПРОГРЕСС ПЕРСОНАЖА ==================

/**
 * Состояние прогресса персонажа
 */
export interface CharacterProgression {
    /** Общий накопленный опыт */
    totalXP: number

    /** Потраченные очки на голоса */
    spentVoicePoints: Partial<Record<VoiceId, number>>

    /** Потраченные очки на группы */
    spentGroupPoints: Partial<Record<AttributeGroup, number>>

    /** Нераспределённые очки голосов */
    availableVoicePoints: number

    /** Нераспределённые очки групп */
    availableGroupPoints: number
}

/**
 * Начальное состояние прогресса
 */
export const INITIAL_PROGRESSION: CharacterProgression = {
    totalXP: 0,
    spentVoicePoints: {},
    spentGroupPoints: {},
    availableVoicePoints: 0,
    availableGroupPoints: 0,
}

/**
 * Добавить опыт и обновить доступные очки
 */
export function addExperience(
    progression: CharacterProgression,
    amount: number
): CharacterProgression {
    const oldLevel = getLevelFromXP(progression.totalXP)
    const newXP = progression.totalXP + amount
    const newLevel = getLevelFromXP(newXP)

    let newVoicePoints = progression.availableVoicePoints
    let newGroupPoints = progression.availableGroupPoints

    // Начислить очки за новые уровни
    for (let level = oldLevel + 1; level <= newLevel; level++) {
        const points = getPointsForLevel(level)
        newVoicePoints += points.voicePoints
        newGroupPoints += points.groupPoints
    }

    return {
        ...progression,
        totalXP: newXP,
        availableVoicePoints: newVoicePoints,
        availableGroupPoints: newGroupPoints,
    }
}

/**
 * Потратить очко на голос
 */
export function spendVoicePoint(
    progression: CharacterProgression,
    voiceId: VoiceId
): CharacterProgression | null {
    if (progression.availableVoicePoints <= 0) return null

    const currentSpent = progression.spentVoicePoints[voiceId] ?? 0

    return {
        ...progression,
        availableVoicePoints: progression.availableVoicePoints - 1,
        spentVoicePoints: {
            ...progression.spentVoicePoints,
            [voiceId]: currentSpent + 1,
        },
    }
}

/**
 * Потратить очко на группу (бонус ко всем голосам группы)
 */
export function spendGroupPoint(
    progression: CharacterProgression,
    groupId: AttributeGroup
): CharacterProgression | null {
    if (progression.availableGroupPoints <= 0) return null

    const currentSpent = progression.spentGroupPoints[groupId] ?? 0

    return {
        ...progression,
        availableGroupPoints: progression.availableGroupPoints - 1,
        spentGroupPoints: {
            ...progression.spentGroupPoints,
            [groupId]: currentSpent + 1,
        },
    }
}

// ================== ИСТОЧНИКИ ОПЫТА ==================

/**
 * Награды опыта за различные действия
 */
export const XP_REWARDS = {
    /** Успешная проверка навыка (базовая) */
    SKILL_CHECK_SUCCESS: 10,

    /** Критический успех (множитель) */
    CRITICAL_SUCCESS_MULTIPLIER: 2,

    /** Провал проверки (утешительный) */
    SKILL_CHECK_FAILURE: 3,

    /** Первое использование навыка */
    FIRST_USE_BONUS: 10,

    /** Завершение сцены */
    SCENE_COMPLETE: 50,

    /** Завершение главы */
    CHAPTER_COMPLETE: 200,

    /** Бонус за сложность (множитель DC/10) */
    DIFFICULTY_BONUS_FACTOR: 0.1,
} as const

/**
 * Рассчитать XP за проверку навыка
 */
export function calculateSkillCheckXP(
    baseDC: number,
    success: boolean,
    isCritical: boolean,
    isFirstUse: boolean
): number {
    let xp = success ? XP_REWARDS.SKILL_CHECK_SUCCESS : XP_REWARDS.SKILL_CHECK_FAILURE

    // Бонус за сложность
    xp += Math.floor(baseDC * XP_REWARDS.DIFFICULTY_BONUS_FACTOR)

    // Критический успех
    if (success && isCritical) {
        xp *= XP_REWARDS.CRITICAL_SUCCESS_MULTIPLIER
    }

    // Первое использование
    if (isFirstUse) {
        xp += XP_REWARDS.FIRST_USE_BONUS
    }

    return xp
}

// ================== ТАБЛИЦА УРОВНЕЙ (для справки) ==================

/**
 * Получить таблицу уровней для отладки/отображения
 */
export function getLevelTable(): Array<{
    level: number
    xpRequired: number
    totalXP: number
    voicePoints: number
    groupPoints: number
}> {
    const table = []

    for (let level = 1; level <= MAX_LEVEL; level++) {
        const points = getTotalPointsForLevel(level)
        table.push({
            level,
            xpRequired: getXPForLevel(level),
            totalXP: getTotalXPForLevel(level),
            voicePoints: points.voicePoints,
            groupPoints: points.groupPoints,
        })
    }

    return table
}
