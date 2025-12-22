/**
 * Экспорт всех сценариев Акта 1 (Chapter 1)
 * 
 * Акт 1: "Новый дом"
 * - Знакомство с городом Фрайбург
 * - Встреча с основными фракциями
 * - Первые квесты и выборы
 * - Исследование карты
 */

// Импорт основных сценариев
import { industrialZoneScenes } from './industrial_zone'
import { marketTraderScenes } from './market_trader'
import { allFactionScenes } from './factions'
import { allDynamicScenes, DYNAMIC_EVENTS } from './dynamic_events'
import { onboardingScenes } from '../onboarding'

// Реэкспорт для удобства
export * from './factions'
export * from './dynamic_events'
export { industrialZoneScenes } from './industrial_zone'
export { marketTraderScenes } from './market_trader'

// Объединённый объект всех сценариев Chapter 1
export const chapter1Scenes = {
  ...onboardingScenes,
  ...industrialZoneScenes,
  ...marketTraderScenes,
  ...allFactionScenes,
  ...allDynamicScenes,
}

// Экспорт конфигурации динамических событий
export { DYNAMIC_EVENTS }

// =====================================
// КОНФИГУРАЦИЯ АКТА 1
// =====================================

export interface Chapter1Config {
  id: string
  title: string
  description: string
  startConditions: ChapterStartCondition[]
  mainQuests: string[]
  sideQuests: string[]
  factionIntroductions: FactionIntro[]
  availableLocations: string[]
  unlockableLocations: UnlockableLocation[]
}

interface ChapterStartCondition {
  type: 'flag' | 'quest' | 'level'
  value: string | number
}

interface FactionIntro {
  factionId: string
  introSceneId: string
  unlockCondition?: string
}

interface UnlockableLocation {
  locationId: string
  condition: {
    type: 'quest' | 'flag' | 'reputation'
    value: string | number
  }
}

export const CHAPTER_1_CONFIG: Chapter1Config = {
  id: 'chapter_1',
  title: 'Новый дом',
  description: 'Первые шаги во Фрайбурге. Знакомство с фракциями, поиск работы и союзников.',
  
  startConditions: [
    { type: 'flag', value: 'prologue_complete' },
    { type: 'quest', value: 'first_steps_in_freiburg' },
  ],
  
  mainQuests: [
    'delivery_for_professor',    // Главный квест - найти профессора
    'whispers_of_rift',          // Исследование Шлосберга
  ],
  
  sideQuests: [
    'chance_for_a_newbie',       // Первое задание от Ганса
    'sanctuary_blessing',        // Квест Староверов
    'anarchist_test',            // Тест Анархистов
    'fjr_recruitment_quest',     // Вступление в FJR
    'artisans_bulletin_board_quest', // Работа у Артисанов
  ],
  
  factionIntroductions: [
    {
      factionId: 'artisans',
      introSceneId: 'artisan_zone_arrival',
    },
    {
      factionId: 'fjr',
      introSceneId: 'fjr_recruitment_dialog',
    },
    {
      factionId: 'synthesis',
      introSceneId: 'synthesis_campus_arrival',
    },
    {
      factionId: 'old_believers',
      introSceneId: 'father_johann_meeting',
    },
    {
      factionId: 'anarchists',
      introSceneId: 'augustinerplatz_warning',
    },
  ],
  
  availableLocations: [
    'sorting_station',           // Стартовая точка
    'info_bureau',               // Инфобюро
    'market_square_elias_stall', // Лавка Элиаса
    'workshop_center',           // Мастерская Дитера
    'artisan_industrial_zone',   // Промзона Артисанов
    'synthesis_campus',          // Кампус Синтез
    'fjr_hq',                    // Штаб FJR
    'cathedral',                 // Кафедральный собор
    'augustinerplatz',           // Район Анархистов
  ],
  
  unlockableLocations: [
    {
      locationId: 'rico_hideout',
      condition: { type: 'flag', value: 'need_talk_to_rico' },
    },
    {
      locationId: 'schlossberg_anomaly',
      condition: { type: 'quest', value: 'whispers_of_rift' },
    },
    {
      locationId: 'synthesis_medical_center',
      condition: { type: 'flag', value: 'know_lena_richter' },
    },
  ],
}

// =====================================
// ФУНКЦИИ ПРОГРЕССА ГЛАВЫ
// =====================================

/**
 * Проверяет, может ли игрок начать Акт 1
 */
export function canStartChapter1(flags: Set<string>, completedQuests: Set<string>): boolean {
  return flags.has('prologue_complete') || completedQuests.has('first_steps_in_freiburg')
}

/**
 * Проверяет, завершён ли Акт 1
 */
export function isChapter1Complete(flags: Set<string>, completedQuests: Set<string>): boolean {
  // Акт 1 завершается, когда игрок нашёл профессора и исследовал Шлосберг
  return completedQuests.has('delivery_for_professor') && flags.has('schlossberg_investigated')
}

/**
 * Получает прогресс по Акту 1 в процентах
 */
export function getChapter1Progress(
  flags: Set<string>,
  completedQuests: Set<string>,
  discoveredLocations: Set<string>
): number {
  let progress = 0
  const maxProgress = 100
  
  // Основные квесты (40%)
  const mainQuestWeight = 40 / CHAPTER_1_CONFIG.mainQuests.length
  CHAPTER_1_CONFIG.mainQuests.forEach(quest => {
    if (completedQuests.has(quest)) progress += mainQuestWeight
  })
  
  // Побочные квесты (30%)
  const sideQuestWeight = 30 / CHAPTER_1_CONFIG.sideQuests.length
  CHAPTER_1_CONFIG.sideQuests.forEach(quest => {
    if (completedQuests.has(quest)) progress += sideQuestWeight
  })
  
  // Знакомство с фракциями (20%)
  const factionWeight = 20 / CHAPTER_1_CONFIG.factionIntroductions.length
  CHAPTER_1_CONFIG.factionIntroductions.forEach(faction => {
    const factionFlag = `met_${faction.factionId}`
    if (flags.has(factionFlag)) progress += factionWeight
  })
  
  // Исследование локаций (10%)
  const locationWeight = 10 / CHAPTER_1_CONFIG.availableLocations.length
  CHAPTER_1_CONFIG.availableLocations.forEach(location => {
    if (discoveredLocations.has(location)) progress += locationWeight
  })
  
  return Math.min(progress, maxProgress)
}

/**
 * Получает следующую рекомендуемую цель для игрока
 */
export function getNextObjective(
  flags: Set<string>,
  completedQuests: Set<string>,
  activeQuests: Set<string>
): string | null {
  // Приоритет 1: Активные квесты
  if (activeQuests.has('chance_for_a_newbie')) {
    if (!flags.has('has_dieter_parts')) {
      return 'Забрать запчасти у Элиаса в лавке "Ржавый Якорь"'
    }
    return 'Доставить запчасти мастеру Дитеру в Промзону'
  }
  
  if (activeQuests.has('delivery_for_professor')) {
    if (!flags.has('know_professor_location')) {
      return 'Найти информацию о профессоре в Кампусе "Синтез"'
    }
    return 'Встретиться с профессором'
  }
  
  // Приоритет 2: Начать новый квест
  if (!completedQuests.has('chance_for_a_newbie') && !activeQuests.has('chance_for_a_newbie')) {
    return 'Получить первое задание от Ганса на станции'
  }
  
  if (completedQuests.has('chance_for_a_newbie') && !activeQuests.has('delivery_for_professor')) {
    return 'Начать поиски профессора в Кампусе "Синтез"'
  }
  
  // Приоритет 3: Познакомиться с фракциями
  const unmetFactions = CHAPTER_1_CONFIG.factionIntroductions.filter(f => !flags.has(`met_${f.factionId}`))
  if (unmetFactions.length > 0) {
    const nextFaction = unmetFactions[0]
    return `Исследовать территорию фракции ${nextFaction.factionId}`
  }
  
  return null
}
