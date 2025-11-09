import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils/cn'
import type { VisualNovelMood } from '@/shared/types/visualNovel'

const moodLabel: Record<VisualNovelMood, string> = {
  neutral: 'Спокойно',
  tense: 'Напряжённо',
  warm: 'Тепло',
  serious: 'Собранно',
  hopeful: 'Надежда',
  grim: 'Мрачно',
}

export interface DialogueBoxProps {
  speakerName?: string
  speakerTitle?: string
  text?: string
  stageDirection?: string
  mood?: VisualNovelMood
  disabled?: boolean
  isPending?: boolean
  onAdvance?: () => void
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speakerName,
  speakerTitle,
  text,
  stageDirection,
  mood = 'neutral',
  disabled,
  isPending,
  onAdvance,
}) => {
  return (
    <motion.div
      layout
      className={cn(
        'relative w-full rounded-3xl border border-white/10 bg-black/60 px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-lg transition duration-200',
        !disabled && 'cursor-pointer hover:border-white/30'
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      onClick={() => {
        if (!disabled && onAdvance) {
          onAdvance()
        }
      }}
    >
      <div className="flex flex-col gap-2 pb-2 md:flex-row md:items-center md:justify-between">
        <div>
          {speakerName && (
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              {speakerName}
            </p>
          )}
          {speakerTitle && (
            <p className="text-xs text-white/50">{speakerTitle}</p>
          )}
        </div>
        <span className="text-xs text-white/50">{moodLabel[mood]}</span>
      </div>

      <p className="text-base leading-relaxed text-white md:text-lg">
        {text || '...'}
      </p>

      {stageDirection && (
        <p className="pt-3 text-xs italic text-white/60">{stageDirection}</p>
      )}

      {!disabled && (
        <motion.div
          className="pointer-events-none absolute -bottom-3 right-6 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.45em] text-white/70"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          {isPending ? '...' : 'Tap / Click'}
        </motion.div>
      )}
    </motion.div>
  )
}
