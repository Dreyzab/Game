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
  getVoiceDefinition,
  getVoicesByCategory,
} from './lib/voiceDefinitions'

export {
  filterAvailableAdvices,
  getSkillLevel,
  isAdviceAvailable,
  groupAdvicesByCategory,
  getAvailableVoiceIds,
} from './lib/consultationUtils'

// Types
export type { VoiceId, VoiceCategory, VoiceDefinition } from './lib/voiceDefinitions'
export type { VoiceCardProps } from './ui/VoiceCard'
export type { VoiceCardGroupProps } from './ui/VoiceCardGroup'
export type {
  ConsultationModeState,
  ConsultationModeActions,
  UseConsultationModeParams,
  UseConsultationModeReturn,
} from './model/useConsultationMode'

