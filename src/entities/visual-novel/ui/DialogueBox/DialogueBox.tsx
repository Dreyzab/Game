import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
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
  onManualInteraction?: () => void
  forceTypingAnimation?: boolean
}

export interface DialogueBoxRef {
  speedUp: () => void
}

export const DialogueBox = forwardRef<DialogueBoxRef, DialogueBoxProps>(({
  speakerName,
  speakerTitle,
  text,
  stageDirection,
  mood = 'neutral',
  disabled,
  isPending,
  onAdvance,
  onRevealComplete,
  onManualInteraction,
  forceTypingAnimation = false,
}, ref) => {
  const log = useCallback((...args: unknown[]) => {
    console.log('💬 [VN Dialogue]', ...args)
  }, [])
  const sanitizeText = useCallback((value: string) => {
    if (!value) {
      return value
    }
    let next = value.trimEnd()
    // Убираем "undefined" в конце строки
    next = next.replace(/[\s–—\-.,!?…]*undefined\s*$/gi, '')
    // Заменяем множественные пробелы на один
    next = next.replace(/\s+/g, ' ').trim()
    
    // Улучшаем разделение предложений: добавляем небольшую паузу после знаков препинания
    // Убираем лишние пробелы вокруг скобок для лучшей читаемости
    next = next.replace(/\s*\(\s*/g, ' (').replace(/\s*\)\s*/g, ') ')
    // Добавляем пробел после многоточия, если его нет
    next = next.replace(/…(?=[А-ЯA-Z])/g, '… ')
    
    return next
  }, [])
  const [displayedText, setDisplayedText] = useState<string>(() => {
    if (!text || text.length === 0) {
      return '...'
    }
    return ''
  })
  const timeoutRef = useRef<number | null>(null)
  const hasNotifiedRef = useRef(false)
  const fullTextRef = useRef<string>(text ?? '')
  const prevTextRef = useRef<string | null>(null)
  const isTypingRef = useRef<boolean>(false)
  const textParagraphRef = useRef<HTMLParagraphElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }

    return undefined
  }, [])

  const notifyRevealComplete = useCallback(() => {
    if (hasNotifiedRef.current) return
    hasNotifiedRef.current = true
    log('✅ Текст полностью показан', {
      characters: fullTextRef.current.length,
    })
    onRevealComplete?.()
  }, [log, onRevealComplete])

  useEffect(() => {
    const paragraph = textParagraphRef.current
    if (!paragraph) {
      return
    }

    const fullText = text ?? ''
    const sanitizedFullText = sanitizeText(fullText)
    const hasContent = sanitizedFullText.length > 0
    const effectiveText = hasContent ? sanitizedFullText : '...'

    fullTextRef.current = effectiveText
    hasNotifiedRef.current = false
    clearTimer()

    prevTextRef.current = effectiveText

    const shouldSkipTyping = !hasContent || (prefersReducedMotion && !forceTypingAnimation)

    if (shouldSkipTyping) {
      log('ℹ️ Пропуск анимации печати', {
        hasText: hasContent,
        prefersReducedMotion,
        forceTypingAnimation,
      })
      paragraph.textContent = effectiveText
      setDisplayedText(effectiveText)
      isTypingRef.current = false
      notifyRevealComplete()
      return
    }

    paragraph.textContent = ''
    setDisplayedText('')
    isTypingRef.current = true

    const characters = Array.from(effectiveText)
    log('⌨️ Начало анимации печати', { characters: characters.length })
    let index = 0
    let builtText = ''

    const typeNext = () => {
      builtText += characters[index]
      paragraph.textContent = builtText
      index += 1

      if (index >= characters.length) {
        setDisplayedText(effectiveText)
        isTypingRef.current = false
        notifyRevealComplete()
        clearTimer()
        return
      }

      const previousChar = characters[index - 1]
      const delay = /[.,!?…;:]/.test(previousChar) ? 180 : 35
      timeoutRef.current = window.setTimeout(typeNext, delay)
    }

    timeoutRef.current = window.setTimeout(typeNext, 30)

    return () => {
      log('🛑 Остановка анимации печати', { reason: 'cleanup' })
      clearTimer()
    }
  }, [
    clearTimer,
    forceTypingAnimation,
    log,
    notifyRevealComplete,
    prefersReducedMotion,
    sanitizeText,
    text,
  ])

  const revealImmediately = useCallback(() => {
    clearTimer()
    const paragraph = textParagraphRef.current
    if (paragraph) {
      paragraph.textContent = fullTextRef.current
    }
    setDisplayedText(fullTextRef.current)
    isTypingRef.current = false
    notifyRevealComplete()
    log('⏭️ Мгновенное раскрытие текста', { characters: fullTextRef.current.length })
  }, [clearTimer, log, notifyRevealComplete])

  const handleAdvance = useCallback((e?: React.MouseEvent) => {
    if (disabled) return
    // Останавливаем всплытие события, чтобы клик на DialogueBox не вызывал обработчик родителя
    e?.stopPropagation()
    // Используем ref для проверки реального состояния анимации
    if (isTypingRef.current) {
      log('⚡ Завершение печати по клику')
      revealImmediately()
      onManualInteraction?.()
      return
    }
    log('➡️ Передача события onAdvance')
    onAdvance?.()
  }, [disabled, log, onAdvance, revealImmediately, onManualInteraction])

  // Экспортируем метод ускорения через ref
  useImperativeHandle(ref, () => ({
    speedUp: () => {
      if (!disabled && isTypingRef.current) {
        log('⚡ Ускорение анимации через ref')
        revealImmediately()
      }
    },
  }), [disabled, log, revealImmediately])

  useEffect(
    () => () => {
      log('♻️ Очистка диалогового окна при размонтировании')
      clearTimer()
    },
    [clearTimer, log]
  )

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

      <p
        ref={textParagraphRef}
        className="text-base leading-relaxed text-white md:text-lg hyphens-auto wrap-break-word"
      >
        {sanitizeText(displayedText)}
      </p>

      {stageDirection && (
        <p className="pt-3 text-xs italic text-white/60 hyphens-auto wrap-break-word">
          {sanitizeText(stageDirection)}
        </p>
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
})

DialogueBox.displayName = 'DialogueBox'
