import React, { useCallback, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'

export interface DialogueBoxProps {
  speakerName?: string
  speakerTitle?: string
  text?: string
  stageDirection?: string
  disabled?: boolean
  isPending?: boolean
  style?: React.CSSProperties
  onAdvance?: () => void
  onRevealComplete?: () => void
  onTypingStatusChange?: (isTyping: boolean) => void
  forceShow?: boolean
  onOpenMenu?: () => void
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speakerName: _speakerName,
  speakerTitle: _speakerTitle,
  text,
  stageDirection,
  disabled,
  isPending,
  style,
  onAdvance,
  onRevealComplete,
  onTypingStatusChange,
  forceShow,
  onOpenMenu,
}) => {
  // Note: _speakerName and _speakerTitle are received as props but not displayed
  // in this version of the component. They're kept for API compatibility.
  void _speakerName
  void _speakerTitle
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

  const handleOpenMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onOpenMenu?.()
    },
    [onOpenMenu]
  )

  return (
    <motion.div
      onClick={handleAdvance}
      className={cn(
        'relative w-full max-w-5xl mx-auto mb-4 sm:mb-8 px-4 sm:px-6 select-none',
        !disabled && 'cursor-pointer'
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      style={{ opacity: disabled ? 0.9 : 1 }}
    >
      <div
        className={cn(
          'bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl overflow-hidden min-h-[120px] sm:min-h-[160px] transition-colors',
          !disabled && 'hover:border-white/20'
        )}
        style={style}
      >
        <div className="font-sans text-[17px] sm:text-[20px] leading-relaxed text-white/90 font-medium tracking-tight min-h-[3rem]">
          {displayedText.slice(0, visibleCount)}
          {isTyping && (
            <span className="inline-block w-1 h-5 bg-[color:var(--color-cyan)] ml-1 animate-pulse" />
          )}
        </div>

        {displayedStageDirection && !isTyping && (
          <p className="text-sm text-slate-500 italic mt-4 animate-fade-in">
            * {displayedStageDirection} *
          </p>
        )}

        {!disabled && !isTyping && (
          <div className="absolute bottom-4 right-14 flex items-center gap-2 animate-pulse-soft">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isPending ? 'Tap / Click to skip' : 'Tap / Click to continue'}
            </span>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
          </div>
        )}

        <button
          type="button"
          onClick={handleOpenMenu}
          className={cn(
            'absolute bottom-3 right-3 h-9 w-9 rounded-xl border border-white/15 bg-black/30 backdrop-blur-md',
            'flex items-center justify-center text-white/90 hover:bg-black/45 hover:border-white/25 transition',
            disabled && 'opacity-60 pointer-events-none'
          )}
          aria-label="Меню"
          title="Меню"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

