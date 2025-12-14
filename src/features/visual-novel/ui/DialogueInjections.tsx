/**
 * DialogueInjections — Компонент отображения внутренних голосов
 * 
 * Отвечает за:
 * - Фильтрацию инъекций на основе skills игрока
 * - Разрешение конфликтов по приоритету
 * - Визуализацию с цветовой схемой по группам голосов
 * - Анимации появления через Framer Motion
 */

import { useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { cn } from '@/shared/lib/utils/cn'
import type { 
  PrivateInjection, 
  ActiveInjection, 
  VoiceGroup,
  VoiceId 
} from '@/entities/visual-novel/model/types'
import { 
  useNarrativeStore, 
  VOICE_GROUP_COLORS,
  VOICE_TO_GROUP,
  VOICE_NAMES,
  filterInjectionsBySkills,
  resolveInjectionConflicts,
} from '@/shared/stores/useNarrativeStore'
import './VoiceInjectionStyles.css'

// ============================================================================
// TYPES
// ============================================================================

interface DialogueInjectionsProps {
  /** Список потенциальных инъекций из сценария */
  injections: PrivateInjection[]
  /** Навыки игрока (skills из game_progress) */
  skills: Record<string, number>
  /** Активные флаги игрока */
  flags?: Set<string>
  /** ID текущей сцены (для логирования) */
  sceneId?: string
  /** ID текущего диалога */
  dialogueId?: string
  /** Максимальное количество видимых инъекций */
  maxVisible?: number
  /** Режим отображения */
  displayMode?: 'overlay' | 'sidebar' | 'inline'
  /** Callback при просмотре инъекции */
  onInjectionView?: (injection: ActiveInjection) => void
  /** Скрыть компонент */
  hidden?: boolean
  /** Дополнительные классы */
  className?: string
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

const injectionVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * InjectionBubble — Пузырёк с текстом инъекции
 */
const InjectionBubble = ({
  injection,
  onClick,
  isNew,
}: {
  injection: ActiveInjection
  onClick?: () => void
  isNew: boolean
}) => {
  const colors = VOICE_GROUP_COLORS[injection.voiceGroup]
  const voiceName = injection.voiceName ?? VOICE_NAMES[injection.voice]
  
  // Получаем CSS класс для эффекта
  const effectClass = getEffectClass(injection.effect ?? 'none')
  
  return (
    <motion.div
      variants={injectionVariants}
      onClick={onClick}
      className={cn(
        'injection-bubble',
        `injection-${injection.voiceGroup}`,
        effectClass,
        isNew && 'injection-new',
        'relative p-3 rounded-lg cursor-pointer',
        'backdrop-blur-sm border',
        'transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg',
      )}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.primary,
        boxShadow: `0 0 20px ${colors.glow}`,
        '--voice-primary': colors.primary,
        '--voice-secondary': colors.secondary,
        '--voice-glow': colors.glow,
      } as React.CSSProperties}
    >
      {/* Voice Label */}
      <div 
        className="voice-label flex items-center gap-2 mb-2"
        style={{ color: colors.primary }}
      >
        <VoiceIcon voiceGroup={injection.voiceGroup} />
        <span className="text-xs font-bold uppercase tracking-wider">
          {voiceName}
        </span>
        {injection.isConflicted && (
          <span className="text-[10px] opacity-60">(подавлен)</span>
        )}
      </div>
      
      {/* Injection Text */}
      <div 
        className={cn(
          'injection-text text-sm leading-relaxed',
          getTextClass(injection.voiceGroup),
        )}
        style={{ color: colors.secondary }}
      >
        {formatInjectionText(injection.text, injection.voiceGroup)}
      </div>
      
      {/* Skill Value Indicator */}
      <div className="absolute bottom-1 right-2 opacity-40">
        <span className="text-[10px]" style={{ color: colors.primary }}>
          [{injection.skillValue}]
        </span>
      </div>
      
      {/* New Indicator */}
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: colors.primary }}
        />
      )}
    </motion.div>
  )
}

/**
 * VoiceIcon — Иконка группы голосов
 */
const VoiceIcon = ({ voiceGroup }: { voiceGroup: VoiceGroup }) => {
  const icons: Record<VoiceGroup, string> = {
    body: '💪',
    motorics: '⚡',
    mind: '🧠',
    consciousness: '👁️',
    psyche: '🎭',
    sociality: '🤝',
  }
  
  return <span className="text-base">{icons[voiceGroup]}</span>
}

/**
 * ConflictIndicator — Индикатор конфликта голосов
 */
const ConflictIndicator = ({
  conflicts,
}: {
  conflicts: Array<{ voice1: VoiceId; voice2: VoiceId }>
}) => {
  if (conflicts.length === 0) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-2 p-2 rounded bg-black/30 border border-yellow-500/30"
    >
      <div className="text-[10px] text-yellow-500/80 uppercase tracking-wider mb-1">
        ⚔️ Внутренний конфликт
      </div>
      {conflicts.slice(0, 2).map((conflict, i) => (
        <div key={i} className="text-xs text-gray-400">
          {VOICE_NAMES[conflict.voice1]} vs {VOICE_NAMES[conflict.voice2]}
        </div>
      ))}
    </motion.div>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Получить CSS класс для визуального эффекта
 */
function getEffectClass(effect: string): string {
  const effectClasses: Record<string, string> = {
    glitch: 'effect-glitch',
    pulse: 'effect-pulse',
    glow: 'effect-glow',
    terminal: 'effect-terminal',
    whisper: 'effect-whisper',
    shake: 'effect-shake',
    fade: 'effect-fade',
    none: '',
  }
  
  return effectClasses[effect] ?? ''
}

/**
 * Получить CSS класс для текста по группе голосов
 */
function getTextClass(voiceGroup: VoiceGroup): string {
  const textClasses: Record<VoiceGroup, string> = {
    body: 'font-bold',
    motorics: 'font-medium',
    mind: 'font-mono text-[13px]',
    consciousness: 'font-semibold uppercase text-[13px] tracking-wide',
    psyche: 'italic',
    sociality: 'font-light',
  }
  
  return textClasses[voiceGroup]
}

/**
 * Форматировать текст инъекции в зависимости от группы
 */
function formatInjectionText(text: string, voiceGroup: VoiceGroup): string {
  switch (voiceGroup) {
    case 'mind':
      // Терминальный стиль для разума
      return `> ${text}`
    case 'consciousness':
      // Капслок для авторитета
      return text.toUpperCase()
    case 'psyche':
      // Курсив с многоточиями для психики
      return `«${text}»`
    default:
      return text
  }
}

/**
 * Преобразовать PrivateInjection в ActiveInjection
 */
function enrichInjection(
  injection: PrivateInjection,
  skills: Record<string, number>
): ActiveInjection {
  const skillValue = skills[injection.voice] ?? 0
  const voiceGroup = VOICE_TO_GROUP[injection.voice] ?? injection.voiceGroup as VoiceGroup
  
  return {
    ...injection,
    voiceGroup,
    voiceName: injection.voiceName ?? VOICE_NAMES[injection.voice],
    skillValue,
    isConflicted: false,
    conflictWith: undefined,
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DialogueInjections = ({
  injections,
  skills,
  flags = new Set(),
  sceneId,
  dialogueId,
  maxVisible = 3,
  displayMode = 'overlay',
  onInjectionView,
  hidden = false,
  className,
}: DialogueInjectionsProps) => {
  // Store
  const {
    setActiveInjections,
    setConflictingVoices,
    recordInjectionView,
    hasViewedInjection,
  } = useNarrativeStore()
  
  // Обогащаем инъекции данными о навыках
  const enrichedInjections = useMemo(() => 
    injections.map((inj) => enrichInjection(inj, skills)),
    [injections, skills]
  )
  
  // Фильтруем по навыкам и флагам
  const filteredInjections = useMemo(() => 
    filterInjectionsBySkills(enrichedInjections, skills, flags),
    [enrichedInjections, skills, flags]
  )
  
  // Разрешаем конфликты
  const { visible: visibleInjections, conflicts } = useMemo(() => 
    resolveInjectionConflicts(filteredInjections, maxVisible),
    [filteredInjections, maxVisible]
  )
  
  // Обновляем store при изменении инъекций
  useEffect(() => {
    setActiveInjections(visibleInjections)
    setConflictingVoices(conflicts)
  }, [visibleInjections, conflicts, setActiveInjections, setConflictingVoices])
  
  // Обработчик клика по инъекции
  const handleInjectionClick = useCallback((injection: ActiveInjection) => {
    // Записываем просмотр
    if (sceneId && dialogueId) {
      recordInjectionView({
        injectionId: injection.id,
        voiceId: injection.voice,
        sceneId,
        dialogueId,
      })
    }
    
    // Вызываем callback
    onInjectionView?.(injection)
  }, [sceneId, dialogueId, recordInjectionView, onInjectionView])
  
  // Не рендерим если скрыто или нет инъекций
  if (hidden || visibleInjections.length === 0) {
    return null
  }
  
  // Выбираем layout в зависимости от режима
  const layoutClass = {
    overlay: 'fixed top-4 right-4 w-80 z-50',
    sidebar: 'w-72 h-full overflow-y-auto',
    inline: 'w-full mt-4',
  }[displayMode]
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dialogueId ?? 'injections'}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          'dialogue-injections',
          layoutClass,
          className,
        )}
      >
        {/* Conflict Indicator */}
        <ConflictIndicator conflicts={conflicts} />
        
        {/* Injection Bubbles */}
        <div className="space-y-3">
          {visibleInjections.map((injection) => (
            <InjectionBubble
              key={injection.id}
              injection={injection}
              onClick={() => handleInjectionClick(injection)}
              isNew={!hasViewedInjection(injection.id)}
            />
          ))}
        </div>
        
        {/* Hidden Voices Indicator */}
        {filteredInjections.length > maxVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-center"
          >
            <span className="text-xs text-gray-500">
              +{filteredInjections.length - maxVisible} других голосов...
            </span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default DialogueInjections








