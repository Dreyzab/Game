import { usePlayerProgress } from '@/shared/hooks/usePlayer'
import { VOICES, type VoiceDefinition, type VoiceGroup, VOICE_GROUPS } from './voices'

export function usePsyche() {
    const { progress } = usePlayerProgress()
    const skills = progress?.skills || {}

    const getVoiceLevel = (voiceId: string) => skills[voiceId] || 0

    const getVoice = (voiceId: string): VoiceDefinition | undefined => VOICES[voiceId]

    const getVoicesByGroup = (group: VoiceGroup): VoiceDefinition[] => {
        return Object.values(VOICES).filter((voice) => voice.group === group)
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
        VOICES,
        VOICE_GROUPS,
    }
}
