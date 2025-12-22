import React, { useCallback, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils/cn'
import type { VisualNovelMood } from '@/shared/types/visualNovel'

const moodLabel: Record<VisualNovelMood, string> = {
  neutral: 'Neutral',
  tense: 'Tense',
  warm: 'Warm',
  serious: 'Serious',
  hopeful: 'Hopeful',
  grim: 'Grim',
}

export interface DialogueBoxProps {
  speakerName?: string
  speakerTitle?: string
  text?: string
  stageDirection?: string
  mood?: VisualNovelMood
  disabled?: boolean
  isPending?: boolean
  style?: React.CSSProperties
  onAdvance?: () => void
  onRevealComplete?: () => void
  onTypingStatusChange?: (isTyping: boolean) => void
  forceShow?: boolean
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speakerName,
  speakerTitle,
  text,
  stageDirection,
  mood = 'neutral',
  disabled,
  isPending,
  style,
  onAdvance,
  onRevealComplete,
  onTypingStatusChange,
  forceShow,
}) => {
  const sanitizeText = useCallback((value: string) => {
    if (!value) return value

    let next = value.trimEnd()
    next = next.replace(/[\s\-.,!?]*undefined\s*$/gi, '')
    next = next.replace(/\s+/g, ' ').trim()
    next = next.replace(/\s*\(\s*/g, ' (').replace(/\s*\)\s*/g, ') ')
    return next
  }, [])

  const [visibleCount, setVisibleCount] = React.useState(0)
  const [isTyping, setIsTyping] = React.useState(false)

  const displayedText = useMemo(() => {
    const fullText = text ?? ''
    const sanitizedFullText = sanitizeText(fullText)
    return sanitizedFullText.length > 0 ? sanitizedFullText : '...'
  }, [text, sanitizeText])

  const displayedStageDirection = useMemo(() => {
    return stageDirection ? sanitizeText(stageDirection) : undefined
  }, [stageDirection, sanitizeText])

  useEffect(() => {
    setVisibleCount(0)
    setIsTyping(true)
  }, [displayedText])

  useEffect(() => {
    onTypingStatusChange?.(isTyping)
  }, [isTyping, onTypingStatusChange])

  useEffect(() => {
    if (forceShow && isTyping) {
      setVisibleCount(displayedText.length)
      setIsTyping(false)
      onRevealComplete?.()
    }
  }, [forceShow, isTyping, displayedText.length, onRevealComplete])

  useEffect(() => {
    if (!isTyping) return

    if (visibleCount >= displayedText.length) {
      setIsTyping(false)
      onRevealComplete?.()
      return
    }

    const timeoutId = setTimeout(() => {
      setVisibleCount((prev) => prev + 1)
    }, 25)

    return () => clearTimeout(timeoutId)
  }, [visibleCount, isTyping, displayedText.length, onRevealComplete])

  const handleAdvance = useCallback(
    (e?: React.MouseEvent) => {
      if (disabled) return
      e?.stopPropagation()

      if (isTyping) {
        setVisibleCount(displayedText.length)
        setIsTyping(false)
        onRevealComplete?.()
        return
      }

      onAdvance?.()
    },
    [disabled, displayedText.length, isTyping, onAdvance, onRevealComplete]
  )

  return (
    <motion.div
      onClick={handleAdvance}
      className={cn(
        'relative w-full max-w-5xl mx-auto mb-8 px-6 select-none',
        !disabled && 'cursor-pointer'
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
    >
      <div
        className={cn(
          'bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden min-h-[160px] transition-colors',
          !disabled && 'hover:border-white/20'
        )}
        style={style}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            {speakerName && (
              <h3 className="font-cinzel text-lg font-bold tracking-[0.2em] text-white">
                {speakerName.toUpperCase()}
              </h3>
            )}
            {speakerTitle && (
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">
                {speakerTitle}
              </p>
            )}
          </div>
          <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <span className="text-[10px] text-slate-300 font-medium tracking-widest uppercase">
              {moodLabel[mood]}
            </span>
          </div>
        </div>

        <div className="font-playfair text-xl leading-relaxed text-slate-100 min-h-[3rem]">
          {displayedText.slice(0, visibleCount)}
          {isTyping && (
            <span className="inline-block w-2 h-5 bg-white/40 ml-1 animate-pulse" />
          )}
        </div>

        {displayedStageDirection && !isTyping && (
          <p className="text-sm text-slate-500 italic mt-4 animate-fade-in">
            * {displayedStageDirection} *
          </p>
        )}

        {!disabled && !isTyping && (
          <div className="absolute bottom-4 right-10 flex items-center gap-2 animate-pulse-soft">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isPending ? 'Tap / Click to skip' : 'Tap / Click to continue'}
            </span>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

