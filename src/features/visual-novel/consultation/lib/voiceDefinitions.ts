/**
 * Определения внутренних голосов (навыков)
 * Иконки берутся из public/images/Атрибут/...
 */

export type VoiceId =
  // Body (Тело)
  | 'strength'
  | 'endurance'
  | 'stamina'
  // Motorics (Моторика)
  | 'perception'
  | 'reaction'
  | 'coordination'
  // Mind (Разум)
  | 'logic'
  | 'rhetoric'
  | 'analysis'
  // Consciousness (Сознание)
  | 'authority'
  | 'suggestion'
  | 'courage'
  // Psyche (Психика)
  | 'drama'
  | 'creativity'
  | 'gambling'
  // Sociality (Социальность)
  | 'solidarity'
  | 'honor'
  | 'empathy'

export type VoiceCategory = 'body' | 'motorics' | 'mind' | 'consciousness' | 'psyche' | 'sociality'

export interface VoiceDefinition {
  id: VoiceId
  name: string
  category: VoiceCategory
  color: string
  description: string
  icon: string // Path to image
}

export const VOICE_DEFINITIONS: Record<VoiceId, VoiceDefinition> = {
  // BODY - ТЕЛО
  strength: {
    id: 'strength',
    name: 'СИЛА',
    category: 'body',
    color: '#EF4444',
    description: 'Физическая мощь',
    icon: '/images/Атрибут/Тело/Сила.jpg',
  },
  endurance: {
    id: 'endurance',
    name: 'СТОЙКОСТЬ',
    category: 'body',
    color: '#DC2626',
    description: 'Способность переносить боль',
    icon: '/images/Атрибут/Тело/Стойкостъ.jpg',
  },
  stamina: {
    id: 'stamina',
    name: 'ВЫНОСЛИВОСТЬ',
    category: 'body',
    color: '#B91C1C',
    description: 'Запас сил',
    icon: '/images/Атрибут/Тело/Выносливость.jpg',
  },

  // MOTORICS - МОТОРИКА
  perception: {
    id: 'perception',
    name: 'ВОСПРИЯТИЕ',
    category: 'motorics',
    color: '#FBBF24',
    description: 'Острота чувств',
    icon: '/images/Атрибут/Моторика/Восприятие.jpg',
  },
  reaction: {
    id: 'reaction',
    name: 'РЕАКЦИЯ',
    category: 'motorics',
    color: '#F59E0B',
    description: 'Скорость ответа',
    icon: '/images/Атрибут/Моторика/Реакция.jpg',
  },
  coordination: {
    id: 'coordination',
    name: 'КООРДИНАЦИЯ',
    category: 'motorics',
    color: '#D97706',
    description: 'Точность движений',
    icon: '/images/Атрибут/Моторика/Координация.jpg',
  },

  // MIND - РАЗУМ
  logic: {
    id: 'logic',
    name: 'ЛОГИКА',
    category: 'mind',
    color: '#60A5FA',
    description: 'Холодный расчёт',
    icon: '/images/Атрибут/Разум/Логика.jpg',
  },
  rhetoric: {
    id: 'rhetoric',
    name: 'РИТОРИКА',
    category: 'mind',
    color: '#3B82F6',
    description: 'Искусство убеждения',
    icon: '/images/Атрибут/Разум/РиторикаРус.jpg',
  },
  analysis: {
    id: 'analysis',
    name: 'АНАЛИЗ',
    category: 'mind',
    color: '#2563EB',
    description: 'Разбор деталей',
    icon: '/images/Атрибут/Разум/Анализ.jpg',
  },

  // CONSCIOUSNESS - СОЗНАНИЕ
  authority: {
    id: 'authority',
    name: 'АВТОРИТЕТ',
    category: 'consciousness',
    color: '#818CF8',
    description: 'Власть и доминирование',
    icon: '/images/Атрибут/Сознание/Авторитет.jpg',
  },
  suggestion: {
    id: 'suggestion',
    name: 'ВНУШЕНИЕ',
    category: 'consciousness',
    color: '#6366F1',
    description: 'Влияние на волю',
    icon: '/images/Атрибут/Сознание/Внушение.jpg',
  },
  courage: {
    id: 'courage',
    name: 'ОТВАГА',
    category: 'consciousness',
    color: '#4F46E5',
    description: 'Сила духа',
    icon: '/images/Атрибут/Сознание/Отвага.jpg',
  },

  // PSYCHE - ПСИХИКА
  drama: {
    id: 'drama',
    name: 'ДРАМА',
    category: 'psyche',
    color: '#F472B6',
    description: 'Актерская игра и ложь',
    icon: '/images/Атрибут/Психика/Драма.jpg',
  },
  creativity: {
    id: 'creativity',
    name: 'ТВОРЧЕСТВО',
    category: 'psyche',
    color: '#EC4899',
    description: 'Создание нового',
    icon: '/images/Атрибут/Психика/Творчество.jpg',
  },
  gambling: {
    id: 'gambling',
    name: 'АЗАРТ',
    category: 'psyche',
    color: '#DB2777',
    description: 'Риск и удача',
    icon: '/images/Атрибут/Психика/азарт.jpg',
  },

  // SOCIALITY - СОЦИАЛЬНОСТЬ
  solidarity: {
    id: 'solidarity',
    name: 'СОЛИДАРНОСТЬ',
    category: 'sociality',
    color: '#34D399',
    description: 'Чувство локтя',
    icon: '/images/Атрибут/Социальность/Солидарность.jpg',
  },
  honor: {
    id: 'honor',
    name: 'ЧЕСТЬ',
    category: 'sociality',
    color: '#10B981',
    description: 'Кодекс и долг',
    icon: '/images/Атрибут/Социальность/Честь.jpg',
  },
  empathy: {
    id: 'empathy',
    name: 'ЭМПАТИЯ',
    category: 'sociality',
    color: '#059669',
    description: 'Понимание чувств',
    icon: '/images/Атрибут/Социальность/photo_2025-11-23_13-36-06.jpg',
  },
}

export const VOICES_BY_CATEGORY: Record<VoiceCategory, VoiceId[]> = {
  body: ['strength', 'endurance', 'stamina'],
  motorics: ['perception', 'reaction', 'coordination'],
  mind: ['logic', 'rhetoric', 'analysis'],
  consciousness: ['authority', 'suggestion', 'courage'],
  psyche: ['drama', 'creativity', 'gambling'],
  sociality: ['solidarity', 'honor', 'empathy'],
}

export const CATEGORY_LABELS: Record<VoiceCategory, string> = {
  body: 'Тело',
  motorics: 'Моторика',
  mind: 'Разум',
  consciousness: 'Сознание',
  psyche: 'Психика',
  sociality: 'Социальность',
}

export const CATEGORY_DESCRIPTIONS: Record<VoiceCategory, string> = {
  body: 'Физическая сила и выносливость',
  motorics: 'Восприятие и координация',
  mind: 'Интеллект и логика',
  consciousness: 'Воля и личность',
  psyche: 'Эмоции и эмпатия',
  sociality: 'Общение и связи',
}

/**
 * Получить определение голоса по ID
 */
export function getVoiceDefinition(id: string): VoiceDefinition | undefined {
  return VOICE_DEFINITIONS[id as VoiceId]
}

/**
 * Получить все голоса определённой категории
 */
export function getVoicesByCategory(category: VoiceCategory): VoiceDefinition[] {
  return VOICES_BY_CATEGORY[category].map((id) => VOICE_DEFINITIONS[id])
}
