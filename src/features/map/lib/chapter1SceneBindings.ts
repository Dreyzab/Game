/**
 * Привязки сценариев к точкам карты для Акта 1
 * 
 * SceneBindings определяют, какой сценарий запускается при взаимодействии
 * с точкой карты, в зависимости от прогресса игрока.
 */

import type { SceneBinding } from '@/shared/types/map'

// =====================================
// ТИПЫ
// =====================================

export interface MapPointSceneConfig {
  pointId: string
  bindings: SceneBinding[]
}

// =====================================
// ПРИВЯЗКИ ДЛЯ АРТИСАНОВ
// =====================================

export const artisanSceneBindings: MapPointSceneConfig[] = [
  {
    pointId: 'workshop_center',
    bindings: [
      // Первый визит с посылкой
      {
        sceneId: 'dieter_hans_mention',
        priority: 100,
        conditions: {
          flags: ['has_dieter_parts'],
          notFlags: ['delivered_parts_to_dieter'],
        },
      },
      // Первый визит без посылки
      {
        sceneId: 'dieter_workshop_approach',
        priority: 50,
        conditions: {
          notFlags: ['met_dieter'],
        },
      },
      // Повторные визиты - квест Шлосберга
      {
        sceneId: 'dieter_schlossberg_quest',
        priority: 80,
        conditions: {
          flags: ['met_dieter', 'whispers_quest_active'],
          notFlags: ['talked_schlossberg_with_dieter'],
        },
      },
      // Обычный визит после знакомства
      {
        sceneId: 'dieter_farewell',
        priority: 10,
        conditions: {
          flags: ['met_dieter'],
        },
      },
    ],
  },
  {
    pointId: 'artisan_industrial_zone',
    bindings: [
      {
        sceneId: 'artisan_zone_arrival',
        priority: 50,
        conditions: {
          notFlags: ['visited_artisan_zone'],
        },
      },
      {
        sceneId: 'artisan_bulletin_board',
        priority: 10,
        conditions: {
          flags: ['visited_artisan_zone'],
        },
      },
    ],
  },
  {
    pointId: 'rico_hideout',
    bindings: [
      {
        sceneId: 'rico_hideout_approach',
        priority: 50,
        conditions: {
          flags: ['need_talk_to_rico'],
          notFlags: ['met_rico'],
        },
      },
      {
        sceneId: 'rico_introduction',
        priority: 30,
        conditions: {
          notFlags: ['met_rico'],
        },
      },
      {
        sceneId: 'rico_farewell',
        priority: 10,
        conditions: {
          flags: ['met_rico'],
        },
      },
    ],
  },
]

// =====================================
// ПРИВЯЗКИ ДЛЯ FJR
// =====================================

export const fjrSceneBindings: MapPointSceneConfig[] = [
  {
    pointId: 'fjr_hq',
    bindings: [
      {
        sceneId: 'fjr_recruitment_dialog',
        priority: 50,
        conditions: {
          notFlags: ['met_fjr'],
        },
      },
      {
        sceneId: 'fjr_briefing_point_dialog',
        priority: 40,
        conditions: {
          flags: ['fjr_recruitment_accepted'],
          questCompleted: [],
        },
      },
    ],
  },
  {
    pointId: 'fjr_recruitment_office',
    bindings: [
      {
        sceneId: 'fjr_recruitment_dialog',
        priority: 50,
        conditions: {
          notFlags: ['fjr_recruitment_accepted', 'fjr_recruitment_declined'],
        },
      },
    ],
  },
]

// =====================================
// ПРИВЯЗКИ ДЛЯ СИНТЕЗА
// =====================================

export const synthesisSceneBindings: MapPointSceneConfig[] = [
  {
    pointId: 'synthesis_campus',
    bindings: [
      {
        sceneId: 'synthesis_campus_arrival',
        priority: 50,
        conditions: {
          notFlags: ['visited_synthesis_campus'],
        },
      },
      {
        sceneId: 'synthesis_ask_about_professor',
        priority: 40,
        conditions: {
          flags: ['visited_synthesis_campus'],
          notFlags: ['know_professor_location'],
          questCompleted: [],
        },
      },
    ],
  },
  {
    pointId: 'synthesis_medical_center',
    bindings: [
      {
        sceneId: 'synthesis_medical_center_arrival',
        priority: 50,
        conditions: {
          flags: ['know_lena_richter'],
        },
      },
    ],
  },
]

// =====================================
// ПРИВЯЗКИ ДЛЯ СТАРОВЕРОВ
// =====================================

export const oldBelieversSceneBindings: MapPointSceneConfig[] = [
  {
    pointId: 'cathedral',
    bindings: [
      {
        sceneId: 'father_johann_meeting',
        priority: 50,
        conditions: {
          notFlags: ['met_father_johann'],
        },
      },
      // Возврат со свечами
      {
        sceneId: 'johann_candles_return',
        priority: 80,
        conditions: {
          flags: ['sanctuary_blessing_active', 'has_candles_for_johann'],
        },
      },
      // Повторный визит
      {
        sceneId: 'johann_return_visit',
        priority: 10,
        conditions: {
          flags: ['met_father_johann'],
        },
      },
    ],
  },
  {
    pointId: 'cathedral_priest_john',
    bindings: [
      {
        sceneId: 'father_johann_meeting',
        priority: 50,
        conditions: {
          notFlags: ['met_father_johann'],
        },
      },
      {
        sceneId: 'johann_return_visit',
        priority: 10,
        conditions: {
          flags: ['met_father_johann'],
        },
      },
    ],
  },
]

// =====================================
// ПРИВЯЗКИ ДЛЯ АНАРХИСТОВ
// =====================================

export const anarchistsSceneBindings: MapPointSceneConfig[] = [
  {
    pointId: 'augustinerplatz',
    bindings: [
      {
        sceneId: 'augustinerplatz_warning',
        priority: 50,
        conditions: {
          notFlags: ['anarchist_territory_entered'],
        },
      },
      {
        sceneId: 'asua_stargazer',
        priority: 40,
        conditions: {
          flags: ['need_find_asua'],
          notFlags: ['met_asua'],
        },
      },
    ],
  },
  {
    pointId: 'augustinerplatz_entrance',
    bindings: [
      {
        sceneId: 'augustinerplatz_warning',
        priority: 50,
        conditions: {
          notFlags: ['anarchist_territory_entered'],
        },
      },
    ],
  },
]

// =====================================
// ПРИВЯЗКИ ДЛЯ ТОРГОВЦЕВ
// =====================================

export const marketSceneBindings: MapPointSceneConfig[] = [
  {
    pointId: 'market_square_elias_stall',
    bindings: [
      // Квест "Шанс для новичка" - забрать посылку
      {
        sceneId: 'trader_meeting_dialog',
        priority: 100,
        conditions: {
          flags: ['chance_for_newbie_active'],
          notFlags: ['has_dieter_parts'],
        },
      },
      // Квест Староверов - купить свечи
      {
        sceneId: 'elias_candles_purchase',
        priority: 80,
        conditions: {
          flags: ['need_candles_for_johann'],
        },
      },
      // Обычная торговля
      {
        sceneId: 'elias_shop',
        priority: 10,
      },
    ],
  },
]

// =====================================
// ПРИВЯЗКИ ДЛЯ СТАНЦИИ
// =====================================

export const stationSceneBindings: MapPointSceneConfig[] = [
  {
    pointId: 'hans_at_station',
    bindings: [
      // После пролога - получить задание
      {
        sceneId: 'hans_introduction',
        priority: 100,
        conditions: {
          flags: ['prologue_complete'],
          notFlags: ['received_first_quest'],
        },
      },
      // Повторный визит
      {
        sceneId: 'hans_return_visit',
        priority: 10,
        conditions: {
          flags: ['received_first_quest'],
        },
      },
    ],
  },
  {
    pointId: 'info_bureau',
    bindings: [
      {
        sceneId: 'info_bureau_meeting',
        priority: 50,
        conditions: {
          flags: ['prologue_complete'],
          notFlags: ['visited_info_bureau'],
        },
      },
    ],
  },
]

// =====================================
// ПРИВЯЗКИ ДЛЯ АНОМАЛИЙ
// =====================================

export const anomalySceneBindings: MapPointSceneConfig[] = [
  {
    pointId: 'schlossberg_anomaly',
    bindings: [
      {
        sceneId: 'schlossberg_approach',
        priority: 50,
        conditions: {
          flags: ['whispers_quest_active'],
        },
      },
    ],
  },
]

// =====================================
// ОБЪЕДИНЁННЫЙ ЭКСПОРТ
// =====================================

export const allChapter1Bindings: MapPointSceneConfig[] = [
  ...artisanSceneBindings,
  ...fjrSceneBindings,
  ...synthesisSceneBindings,
  ...oldBelieversSceneBindings,
  ...anarchistsSceneBindings,
  ...marketSceneBindings,
  ...stationSceneBindings,
  ...anomalySceneBindings,
]

/**
 * Получает привязки для конкретной точки карты
 */
export function getBindingsForPoint(pointId: string): SceneBinding[] {
  const config = allChapter1Bindings.find(c => c.pointId === pointId)
  return config?.bindings ?? []
}

/**
 * Проверяет, есть ли у точки привязки сценариев
 */
export function hasSceneBindings(pointId: string): boolean {
  return allChapter1Bindings.some(c => c.pointId === pointId)
}







