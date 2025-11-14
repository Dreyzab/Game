import React, { useCallback, useEffect, useMemo } from 'react'
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
  onRevealComplete?: () => void
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
  onRevealComplete,
}) => {
  const sanitizeText = useCallback((value: string) => {
    if (!value) {
      return value
    }
    let next = value.trimEnd()
    // Убираем "undefined" в конце строки
    next = next.replace(/[\s–—\-.,!?…]*undefined\s*$/gi, '')
    // Заменяем множественные пробелы на один
    next = next.replace(/\s+/g, ' ').trim()
    
    // Улучшаем разделение предложений
    // Убираем лишние пробелы вокруг скобок для лучшей читаемости
    next = next.replace(/\s*\(\s*/g, ' (').replace(/\s*\)\s*/g, ') ')
    // Добавляем пробел после многоточия, если его нет
    next = next.replace(/…(?=[А-ЯA-Z])/g, '… ')
    
    return next
  }, [])

  const displayedText = useMemo(() => {
    const fullText = text ?? ''
    const sanitizedFullText = sanitizeText(fullText)
    return sanitizedFullText.length > 0 ? sanitizedFullText : '...'
  }, [text, sanitizeText])

  const displayedStageDirection = useMemo(() => {
    return stageDirection ? sanitizeText(stageDirection) : undefined
  }, [stageDirection, sanitizeText])

  // Уведомляем о завершении показа текста сразу при изменении
  useEffect(() => {
    onRevealComplete?.()
  }, [displayedText, onRevealComplete])

  const handleAdvance = useCallback((e?: React.MouseEvent) => {
    if (disabled) return
    // Останавливаем всплытие события, чтобы клик на DialogueBox не вызывал обработчик родителя
    e?.stopPropagation()
    onAdvance?.()
  }, [disabled, onAdvance])

  return (
    <motion.div
      className={cn(
        'relative w-full rounded-3xl border border-white/10 bg-black/60 px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-lg transition duration-200',
        !disabled && 'cursor-pointer hover:border-white/30'
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      onClick={handleAdvance}
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

      <p className="text-base leading-relaxed text-white md:text-lg hyphens-auto wrap-break-word">
        {displayedText}
      </p>

      {displayedStageDirection && (
        <p className="pt-3 text-xs italic text-white/60 hyphens-auto wrap-break-word">
          {displayedStageDirection}
        </p>
      )}

      {!disabled && (
        <motion.div
          className="pointer-events-none absolute -bottom-3 right-6 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.45em] text-white/70"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: isPending ? 1.5 : 2.4, repeat: Infinity }}
        >
          {isPending ? '⏭ Skip' : 'Tap / Click'}
        </motion.div>
      )}
    </motion.div>
  )
}
