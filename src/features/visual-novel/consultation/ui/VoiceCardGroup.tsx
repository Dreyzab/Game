import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { VoiceCard } from './VoiceCard'
import { VOICE_DEFINITIONS } from '../lib/voiceDefinitions'
import type { VoiceId } from '../lib/voiceDefinitions'

export interface VoiceCardGroupProps {
  skills: Record<string, number>
  availableVoiceIds: string[]
  activeVoiceId: string | null
  viewedVoiceIds: Set<string>
  onVoiceClick: (voiceId: string) => void
  disabled?: boolean
}

export const VoiceCardGroup: React.FC<VoiceCardGroupProps> = ({
  skills,
  availableVoiceIds,
  activeVoiceId,
  viewedVoiceIds,
  onVoiceClick,
  disabled = false,
}) => {
  // Сортируем голоса по категориям и доступности
  const sortedVoices = useMemo(() => {
    const voices = Object.values(VOICE_DEFINITIONS)
    
    // Сначала доступные, потом недоступные
    return voices.sort((a, b) => {
      const aAvailable = availableVoiceIds.includes(a.id)
      const bAvailable = availableVoiceIds.includes(b.id)
      
      if (aAvailable && !bAvailable) return -1
      if (!aAvailable && bAvailable) return 1
      
      // Внутри групп сортируем по категориям
      if (a.category !== b.category) {
        const categoryOrder = { cogito: 0, spirit: 1, psyche: 2, corpus: 3 }
        return categoryOrder[a.category] - categoryOrder[b.category]
      }
      
      return 0
    })
  }, [availableVoiceIds])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      className="w-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
        {sortedVoices.map((voice) => {
          const skillLevel = skills[voice.id as VoiceId] ?? 0
          const isAvailable = availableVoiceIds.includes(voice.id)
          const isActive = activeVoiceId === voice.id
          const isViewed = viewedVoiceIds.has(voice.id)

          return (
            <motion.div key={voice.id} variants={item}>
              <VoiceCard
                voice={voice}
                skillLevel={skillLevel}
                isAvailable={isAvailable}
                isActive={isActive}
                isViewed={isViewed}
                onClick={() => onVoiceClick(voice.id)}
                disabled={disabled}
              />
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

