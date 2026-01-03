import { usePlayerProgress } from '@/shared/hooks/usePlayer'
import {
    PARLIAMENT_VOICES,
    ATTRIBUTE_GROUPS,
    type VoiceDefinition,
    type AttributeGroup,
    type VoiceId
} from '@/shared/types/parliament'
import { calculateDerivedStats, calculateMaxResources } from '../lib/statCalculators'

export type CheckResult = 'critical_failure' | 'failure' | 'success' | 'critical_success'

/**
 * Hook for working with the Internal Parliament (Voices) system
 * Uses the canonical 18-voice system from parliament.ts
 */
export function useParliament() {
    const { progress } = usePlayerProgress()
    const attributes = progress?.attributes ?? progress?.skills ?? {}

    const getVoiceLevel = (voiceId: VoiceId) => attributes[voiceId] || 0

    const getVoice = (voiceId: VoiceId): VoiceDefinition | undefined =>
        PARLIAMENT_VOICES[voiceId]

    const getVoicesByGroup = (group: AttributeGroup): VoiceDefinition[] => {
        const groupDef = ATTRIBUTE_GROUPS[group]
        if (!groupDef) return []
        return groupDef.voices.map(id => PARLIAMENT_VOICES[id])
    }

    /**
     * Perform a voice check with success levels
     */
    const checkVoice = (voiceId: VoiceId, difficulty: number): CheckResult => {
        const level = getVoiceLevel(voiceId)
        // Note: For now using a simple 1-100 roll or 1-20 logic as suggested
        const roll = Math.floor(Math.random() * 20) + 1 // 1d20
        const total = level + roll

        if (roll === 20) return 'critical_success'
        if (roll === 1) return 'critical_failure'

        return total >= difficulty ? 'success' : 'failure'
    }

    const derivedStats = calculateDerivedStats(attributes)
    const maxResources = calculateMaxResources(attributes)

    return {
        attributes,
        getVoiceLevel,
        getVoice,
        getVoicesByGroup,
        checkVoice,
        derivedStats,
        maxResources,
        VOICES: PARLIAMENT_VOICES,
        VOICE_GROUPS: ATTRIBUTE_GROUPS,
    }
}

// Re-export types for convenience
export type { VoiceDefinition, AttributeGroup, VoiceId }
