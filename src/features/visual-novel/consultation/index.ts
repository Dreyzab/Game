// UI Components
export { VoiceCard } from './ui/VoiceCard'
export { VoiceCardGroup } from './ui/VoiceCardGroup'

// Model
export { useConsultationMode } from './model/useConsultationMode'

// Lib
export {
  VOICE_DEFINITIONS,
  VOICES_BY_CATEGORY,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  VOICE_ICONS,
  getVoiceDefinition,
  getVoicesByCategoryUI,
} from './lib/voiceDefinitions'

export {
  filterAvailableAdvices,
  getSkillLevel,
  isAdviceAvailable,
  groupAdvicesByCategory,
  getAvailableVoiceIds,
} from './lib/consultationUtils'

// Types - Re-exported from parliament.ts via voiceDefinitions
export type { VoiceId, VoiceCategory, VoiceDefinition } from './lib/voiceDefinitions'
export type { AttributeGroup } from '@/shared/types/parliament'
export type { VoiceCardProps } from './ui/VoiceCard'
export type { VoiceCardGroupProps } from './ui/VoiceCardGroup'
export type {
  ConsultationModeState,
  ConsultationModeActions,
  UseConsultationModeParams,
  UseConsultationModeReturn,
} from './model/useConsultationMode'

