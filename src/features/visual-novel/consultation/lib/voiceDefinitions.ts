/**
 * Определения внутренних голосов (навыков)
 * Основано на системе навыков из convex/gameProgress.ts
 */

export type VoiceId = 
  | 'logic'
  | 'encyclopedia'
  | 'technophile'
  | 'intuition'
  | 'authority'
  | 'cynicism'
  | 'empathy'
  | 'perception'
  | 'reflexes'
  | 'strength'
  | 'combat'
  | 'technique'

export type VoiceCategory = 'cogito' | 'spirit' | 'psyche' | 'corpus'

export interface VoiceDefinition {
  id: VoiceId
  name: string
  category: VoiceCategory
  color: string
  description: string
  icon?: string
}

export const VOICE_DEFINITIONS: Record<VoiceId, VoiceDefinition> = {
  // COGITO - Интеллект
  logic: {
    id: 'logic',
    name: 'ЛОГИКА',
    category: 'cogito',
    color: '#60A5FA', // blue-400
    description: 'Холодный расчёт и дедукция',
    icon: '🧠',
  },
  encyclopedia: {
    id: 'encyclopedia',
    name: 'ЭНЦИКЛОПЕДИЯ',
    category: 'cogito',
    color: '#A78BFA', // violet-400
    description: 'Знания и эрудиция',
    icon: '📚',
  },
  technophile: {
    id: 'technophile',
    name: 'ТЕХНОФИЛ',
    category: 'cogito',
    color: '#34D399', // emerald-400
    description: 'Понимание механизмов',
    icon: '⚙️',
  },
  intuition: {
    id: 'intuition',
    name: 'ИНТУИЦИЯ',
    category: 'cogito',
    color: '#818CF8', // indigo-400
    description: 'Чутьё и предчувствие',
    icon: '✨',
  },

  // SPIRIT - Дух
  authority: {
    id: 'authority',
    name: 'АВТОРИТЕТ',
    category: 'spirit',
    color: '#F87171', // red-400
    description: 'Власть и доминирование',
    icon: '👑',
  },
  cynicism: {
    id: 'cynicism',
    name: 'ЦИНИЗМ',
    category: 'spirit',
    color: '#6B7280', // gray-500
    description: 'Скептицизм и горечь',
    icon: '🚬',
  },

  // PSYCHE - Психика
  empathy: {
    id: 'empathy',
    name: 'ЭМПАТИЯ',
    category: 'psyche',
    color: '#F472B6', // pink-400
    description: 'Понимание эмоций',
    icon: '💖',
  },
  perception: {
    id: 'perception',
    name: 'ВОСПРИЯТИЕ',
    category: 'psyche',
    color: '#FBBF24', // amber-400
    description: 'Острота чувств',
    icon: '👁️',
  },

  // CORPUS - Тело
  reflexes: {
    id: 'reflexes',
    name: 'РЕФЛЕКСЫ',
    category: 'corpus',
    color: '#10B981', // green-500
    description: 'Скорость реакции',
    icon: '⚡',
  },
  strength: {
    id: 'strength',
    name: 'СИЛА',
    category: 'corpus',
    color: '#EF4444', // red-500
    description: 'Физическая мощь',
    icon: '💪',
  },
  combat: {
    id: 'combat',
    name: 'БОЕЦ',
    category: 'corpus',
    color: '#DC2626', // red-600
    description: 'Боевой опыт',
    icon: '⚔️',
  },
  technique: {
    id: 'technique',
    name: 'ТЕХНИКА',
    category: 'corpus',
    color: '#F59E0B', // amber-500
    description: 'Мастерство владения телом',
    icon: '🎯',
  },
}

export const VOICES_BY_CATEGORY: Record<VoiceCategory, VoiceId[]> = {
  cogito: ['logic', 'encyclopedia', 'technophile', 'intuition'],
  spirit: ['authority', 'cynicism'],
  psyche: ['empathy', 'perception'],
  corpus: ['reflexes', 'strength', 'combat', 'technique'],
}

export const CATEGORY_LABELS: Record<VoiceCategory, string> = {
  cogito: 'Интеллект',
  spirit: 'Дух',
  psyche: 'Психика',
  corpus: 'Тело',
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

