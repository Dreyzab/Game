import { usePlayerProgress } from '@/shared/hooks/usePlayer'
import {
    PARLIAMENT_VOICES,
    ATTRIBUTE_GROUPS,
    type VoiceDefinition,
    type AttributeGroup,
    type VoiceId
} from '@/shared/types/parliament'

/**
 * Hook for working with the Internal Parliament (Voices) system
 * Uses the canonical 18-voice system from parliament.ts
 */
export function usePsyche() {
    const { progress } = usePlayerProgress()
    const skills = progress?.skills || {}

    const getVoiceLevel = (voiceId: string) => skills[voiceId] || 0

    const getVoice = (voiceId: string): VoiceDefinition | undefined =>
        PARLIAMENT_VOICES[voiceId as VoiceId]

    const getVoicesByGroup = (group: AttributeGroup): VoiceDefinition[] => {
        const groupDef = ATTRIBUTE_GROUPS[group]
        if (!groupDef) return []
        return groupDef.voices.map(id => PARLIAMENT_VOICES[id])
    }

    const checkVoice = (voiceId: string, difficulty: number) => {
        const level = getVoiceLevel(voiceId)
        return level >= difficulty
    }

    return {
        skills,
        getVoiceLevel,
        getVoice,
        getVoicesByGroup,
        checkVoice,
        VOICES: PARLIAMENT_VOICES,
        VOICE_GROUPS: ATTRIBUTE_GROUPS,
    }
}

// Re-export types for convenience
export type { VoiceDefinition, AttributeGroup, VoiceId }
