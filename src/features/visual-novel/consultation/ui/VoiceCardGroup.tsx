import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { VoiceCard } from './VoiceCard'
import { VOICE_DEFINITIONS, CATEGORY_LABELS, type VoiceId, type VoiceCategory } from '../lib/voiceDefinitions'

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
  // Группируем голоса по категориям
  const voicesByCategory = useMemo(() => {
    const groups: Record<VoiceCategory, typeof VOICE_DEFINITIONS[VoiceId][]> = {
      body: [],
      motorics: [],
      mind: [],
      consciousness: [],
      psyche: [],
      sociality: [],
    }

    Object.values(VOICE_DEFINITIONS).forEach((voice) => {
      if (groups[voice.category]) {
        groups[voice.category].push(voice)
      }
    })

    return groups
  }, [])

  const categoryOrder: VoiceCategory[] = [
    'body',
    'motorics',
    'mind',
    'consciousness',
    'psyche',
    'sociality',
  ]

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryOrder.map((category) => {
          const voices = voicesByCategory[category]
          if (!voices || voices.length === 0) return null

          return (
            <div key={category} className="flex flex-col gap-3">
              <div className="mb-1 text-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/90">
                  {CATEGORY_LABELS[category]}
                </h3>
                {/* Optional: Add description tooltip or subtitle here if needed */}
              </div>

              <div className="flex flex-col gap-3">
                {voices.map((voice) => {
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
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
