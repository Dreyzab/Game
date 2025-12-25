import type { AttributeGroup as VoiceGroup, VoiceId } from '@/shared/types/parliament'

export type SceneMap = Record<string, Scene>
export type PolyphonicSceneMap = Record<string, PolyphonicScene>

// ============================================================================
// VOICE GROUPS — Группы внутренних голосов
// ============================================================================

export type { VoiceGroup, VoiceId }

// ============================================================================
// PRIVATE INJECTION — Инъекция внутреннего голоса
// ============================================================================

/**
 * Визуальный эффект для инъекции
 */
export type InjectionEffect =
  | 'none'          // Без эффекта
  | 'glitch'        // Глитч-эффект (параноидный)
  | 'pulse'         // Пульсация (телесный)
  | 'glow'          // Свечение (социальный)
  | 'terminal'      // Терминал (логический)
  | 'whisper'       // Шёпот (мистический)
  | 'shake'         // Дрожь (страх/паника)
  | 'fade'          // Затухание (слабый голос)

/**
 * PrivateInjection — структура «внутренней мысли»
 * Представляет комментарий от одного из 18 внутренних голосов
 */
export interface PrivateInjection {
  id: string

  // Идентификация голоса
  voice: VoiceId                    // ID голоса: logic, empathy, perception, etc.
  voiceGroup: VoiceGroup            // Группа голоса для стилизации
  voiceName?: string                // Отображаемое имя: "ЛОГИКА", "ЭМПАТИЯ"

  // Условия активации
  threshold: number                 // Порог активации (0-100)
  maxThreshold?: number             // Максимальный порог (если есть)
  requiredFlags?: string[]          // Требуемые флаги
  excludedFlags?: string[]          // Исключающие флаги
  requiredFlag?: string             // Legacy alias (single-flag form)
  excludedFlag?: string             // Legacy alias (single-flag form)

  // Контент
  text: string                      // Текст внутренней мысли

  // Визуализация
  effect?: InjectionEffect          // Визуальный эффект
  priority: number                  // Приоритет при конфликте (выше = важнее)

  // Побочные эффекты от просмотра
  onView?: {
    addFlags?: string[]             // Добавить флаги после просмотра
    xpBonus?: number                // Бонус XP за просмотр
    unlockHint?: string             // Разблокировать подсказку
    revealInfo?: string             // ID информации для раскрытия
  }
}

/**
 * Активированная инъекция с вычисленными данными
 */
export interface ActiveInjection extends PrivateInjection {
  skillValue: number                // Текущее значение навыка игрока
  isConflicted: boolean             // Есть ли конфликт с другим голосом
  conflictWith?: VoiceId            // С кем конфликтует
}

// ============================================================================
// POLYPHONIC DIALOGUE — Полифонический диалог
// ============================================================================

/**
 * SharedContent — общий контент, видимый всем игрокам
 */
export interface SharedContent {
  text: string                      // Текст диалога
  speaker: string                   // Говорящий (NPC, Narrator)
  speakerId?: string                // ID персонажа
  emotion?: SceneEmotion            // Эмоция говорящего
  background?: string               // Фон сцены
  music?: string                    // Музыка
}

/**
 * PolyphonicDialogue — диалог с разделением на Shared/Private слои
 */
export interface PolyphonicDialogue {
  id: string

  // Shared Reality — видно всем
  sharedContent: SharedContent

  // Private Reality — зависит от навыков игрока
  privateInjections: PrivateInjection[]

  // Варианты ответа
  options?: PolyphonicChoice[]

  // Переход
  nextDialogue?: string
  nextScene?: string

  // Эффекты при показе диалога (совместимость со сценарием)
  effects?: SceneChoiceEffects
}

/**
 * PolyphonicChoice — вариант ответа с учётом внутренних голосов
 */
export interface PolyphonicChoice {
  id: string
  text: string

  // Навигация
  nextDialogue?: string
  nextScene?: string

  // Требования
  requiredStat?: {
    stat: VoiceId
    value: number
  }
  requiredFlag?: string
  excludedFlag?: string

  // Эффекты
  effects?: SceneChoiceEffects

  // Презентация
  presentation?: {
    color?: string
    icon?: string
    tooltip?: string
    voiceHint?: VoiceId             // Какой голос подсказывает этот выбор
  }
}

/**
 * PolyphonicScene — сцена с полифоническими диалогами
 */
export interface PolyphonicScene {
  id: string
  chapterId: string                 // chapter3, chapter4
  questId?: string                  // Привязка к квесту

  // Настройки сцены
  background: string
  music?: string
  characters: SceneCharacter[]

  // Полифонические диалоги
  dialogues: PolyphonicDialogue[]
  entryDialogueId: string           // Начальный диалог

  // Простые советы (совместимость со старой системой)
  advices?: SceneAdvice[]

  // Метаданные
  isActive?: boolean
}

// ============================================================================
// ORIGINAL TYPES — Оригинальные типы (без изменений)
// ============================================================================

export interface Scene {
  id: string
  background: string
  music?: string
  characters: SceneCharacter[]
  dialogue: SceneDialogue[]
  choices?: SceneChoice[]
  advices?: SceneAdvice[]
  nextScene?: string

  // Новое: поддержка полифонического режима
  polyphonicDialogues?: PolyphonicDialogue[]
  entryDialogueId?: string
}

export interface SceneAdvice {
  characterId: string
  text: string
  mood?: string
  stageDirection?: string
  minSkillLevel?: number
  maxSkillLevel?: number
  requiredFlags?: string[]
  excludedFlags?: string[]
}

export interface SceneCharacter {
  id: string
  name: string
  position?: 'left' | 'right' | 'center'
  sprite?: string
  emotion?: SceneEmotion
}

export interface SceneEmotion {
  primary: string
  intensity?: number
}

export interface SceneDialogue {
  speaker: string
  text: string
  characterId?: string
  emotion?: SceneEmotion
  /**
   * Optional per-line background override (relative to /public).
   * Example: '/images/oknorazbil.png'
   */
  background?: string
  condition?: {
    flag?: string
    notFlag?: string
  }
}

export interface SceneChoiceFlagEffect {
  key: string
  value?: boolean
}

export interface SceneChoiceImmediateEffect {
  type: string
  data?: Record<string, unknown>
}

export interface SceneChoiceReputationEffect {
  faction: string
  delta: number
}

export interface SceneChoiceBranchEffects {
  nextScene?: string
  addFlags?: string[]
  removeFlags?: string[]
}

export interface SceneChoiceEffects {
  addFlags?: string[]
  removeFlags?: string[]
  flags?: SceneChoiceFlagEffect[]
  immediate?: SceneChoiceImmediateEffect[]
  narrative?: string
  xp?: number
  reputation?: SceneChoiceReputationEffect[]
  onSuccess?: SceneChoiceBranchEffects
  onFailure?: SceneChoiceBranchEffects
}

export interface SceneChoice {
  id: string
  text: string
  nextScene?: string
  presentation?: {
    color?: string
    icon?: string
    tooltip?: string
  }
  availability?: {
    skillCheck?: {
      skill: string
      difficulty: number
      successText?: string
      failureText?: string
    }
    condition?: {
      [key: string]: unknown
      flag?: string
      flags?: string[]
      notFlag?: string
      notFlags?: string[]
      /**
       * Минимальное количество валюты (кредитов), требуемое для выбора.
       * Используется в сценариях для покупок/пожертвований.
       */
      currency?: number
    }
  }
  effects?: SceneChoiceEffects
}
