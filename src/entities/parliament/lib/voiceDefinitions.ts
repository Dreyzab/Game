/**
 * Определения внутренних голосов (навыков)
 * 
 * УНИФИЦИРОВАННАЯ СИСТЕМА: Реэкспорт из parliament.ts (18 голосов, 6 групп)
 * UI-специфичные поля (иконки) добавлены здесь
 */

// Re-export canonical types from parliament.ts
export {
  type VoiceId,
  type AttributeGroup as VoiceCategory,
  type VoiceDefinition as ParliamentVoiceDefinition,
  PARLIAMENT_VOICES,
  ATTRIBUTE_GROUPS,
  getVoiceGroup,
  getVoicesByGroup,
} from '@/shared/types/parliament'

import {
  type VoiceId,
  type AttributeGroup,
  PARLIAMENT_VOICES,
  ATTRIBUTE_GROUPS
} from '@/shared/types/parliament'

// UI-specific interface with icon paths
export interface VoiceDefinition {
  id: VoiceId
  name: string
  category: AttributeGroup
  color: string
  description: string
  icon: string // Path to image
}

// Icon paths mapping for each voice
export const VOICE_ICONS: Record<VoiceId, string> = {
  // BODY - ТЕЛО
  force: '/images/Атрибут/Тело/Сила.jpg',
  resilience: '/images/Атрибут/Тело/Стойкостъ.jpg',
  endurance: '/images/Атрибут/Тело/Выносливость.jpg',
  // MOTORICS - МОТОРИКА
  perception: '/images/Атрибут/Моторика/Восприятие.jpg',
  reaction: '/images/Атрибут/Моторика/Реакция.jpg',
  coordination: '/images/Атрибут/Моторика/Координация.jpg',
  // MIND - РАЗУМ
  logic: '/images/Атрибут/Разум/Логика.jpg',
  rhetoric: '/images/Атрибут/Разум/РиторикаРус.jpg',
  knowledge: '/images/Атрибут/Разум/Анализ.jpg',
  // CONSCIOUSNESS - СОЗНАНИЕ
  authority: '/images/Атрибут/Сознание/Авторитет.jpg',
  suggestion: '/images/Атрибут/Сознание/Внушение.jpg',
  courage: '/images/Атрибут/Сознание/Отвага.jpg',
  // PSYCHE - ПСИХИКА
  gambling: '/images/Атрибут/Психика/азарт.jpg',
  drama: '/images/Атрибут/Психика/Драма.jpg',
  creativity: '/images/Атрибут/Психика/Творчество.jpg',
  // SOCIALITY - СОЦИАЛЬНОСТЬ
  empathy: '/images/Атрибут/Социальность/photo_2025-11-23_13-36-06.jpg',
  solidarity: '/images/Атрибут/Социальность/Солидарность.jpg',
  honor: '/images/Атрибут/Социальность/Честь.jpg',
}

// Colors for each group
const GROUP_COLORS: Record<AttributeGroup, string[]> = {
  body: ['#EF4444', '#DC2626', '#B91C1C'],
  motorics: ['#FBBF24', '#F59E0B', '#D97706'],
  mind: ['#60A5FA', '#3B82F6', '#2563EB'],
  consciousness: ['#818CF8', '#6366F1', '#4F46E5'],
  psyche: ['#F472B6', '#EC4899', '#DB2777'],
  sociality: ['#34D399', '#10B981', '#059669'],
}

// Build VOICE_DEFINITIONS from parliament.ts data
export const VOICE_DEFINITIONS: Record<VoiceId, VoiceDefinition> = Object.fromEntries(
  Object.entries(PARLIAMENT_VOICES).map(([id, voice]) => {
    const group = voice.group
    const groupVoices = ATTRIBUTE_GROUPS[group].voices
    const colorIndex = groupVoices.indexOf(id as VoiceId)

    return [id, {
      id: id as VoiceId,
      name: voice.nameRu,
      category: group,
      color: GROUP_COLORS[group][colorIndex] || GROUP_COLORS[group][0],
      description: voice.motto,
      icon: VOICE_ICONS[id as VoiceId],
    }]
  })
) as Record<VoiceId, VoiceDefinition>

// Category helpers (re-mapped from parliament.ts)
export const VOICES_BY_CATEGORY: Record<AttributeGroup, VoiceId[]> = Object.fromEntries(
  Object.entries(ATTRIBUTE_GROUPS).map(([groupId, group]) => [groupId, group.voices])
) as Record<AttributeGroup, VoiceId[]>

export const CATEGORY_LABELS: Record<AttributeGroup, string> = Object.fromEntries(
  Object.entries(ATTRIBUTE_GROUPS).map(([groupId, group]) => [groupId, group.nameRu])
) as Record<AttributeGroup, string>

export const CATEGORY_DESCRIPTIONS: Record<AttributeGroup, string> = Object.fromEntries(
  Object.entries(ATTRIBUTE_GROUPS).map(([groupId, group]) => [groupId, group.description])
) as Record<AttributeGroup, string>

/**
 * Получить определение голоса по ID
 */
export function getVoiceDefinition(id: string): VoiceDefinition | undefined {
  return VOICE_DEFINITIONS[id as VoiceId]
}

/**
 * Получить все голоса определённой категории (с UI данными)
 */
export function getVoicesByCategoryUI(category: AttributeGroup): VoiceDefinition[] {
  return VOICES_BY_CATEGORY[category].map((id) => VOICE_DEFINITIONS[id])
}
