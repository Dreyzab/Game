import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils/cn'
import type { VoiceDefinition } from '../lib/voiceDefinitions'

function hexToRgba(color: string, alpha = 1): string {
  if (!color) {
    return `rgba(255, 255, 255, ${alpha})`
  }

  if (color.startsWith('#')) {
    let hex = color.replace('#', '')
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('')
    }

    const intVal = Number.parseInt(hex, 16)
    const r = (intVal >> 16) & 255
    const g = (intVal >> 8) & 255
    const b = intVal & 255

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return color
}

export interface VoiceCardProps {
  voice: VoiceDefinition
  skillLevel: number
  isAvailable: boolean
  isActive: boolean
  isViewed: boolean
  onClick: () => void
  disabled?: boolean
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  skillLevel,
  isAvailable,
  isActive,
  isViewed,
  onClick,
  disabled = false,
}) => {
  const canClick = isAvailable && !disabled
  const normalizedLevel = Math.min(1, Math.max(0, skillLevel / 100))
  const gradientStart = hexToRgba(voice.color, 0.55 + normalizedLevel * 0.25)
  const gradientEnd = hexToRgba(voice.color, 0.25 + normalizedLevel * 0.25)
  const borderColor = hexToRgba(voice.color, isActive ? 0.85 : isAvailable ? 0.45 : 0.2)

  const baseShadow = `0 12px 35px ${hexToRgba('#000000', 0.45)}`

  return (
    <motion.button
      type="button"
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={cn(
        'relative flex h-full min-h-[120px] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-white shadow-lg backdrop-blur transition-all duration-200',
        canClick && 'cursor-pointer hover:scale-105',
        !canClick && 'cursor-not-allowed opacity-35',
        isActive && 'ring-2 ring-white/60 shadow-xl',
        !isActive && isAvailable && 'hover:ring-1 hover:ring-white/40',
        !isAvailable && !isActive && 'grayscale-[35%] opacity-70',
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: baseShadow,
      }}
      transition={{ duration: 0.3 }}
      whileHover={canClick ? { scale: 1.03 } : undefined}
      whileTap={canClick ? { scale: 0.98 } : undefined}
      style={{
        borderColor,
        backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
      }}
    >
      {voice.icon && (
        <div className="absolute inset-0 z-0">
          <img
            src={voice.icon}
            alt={voice.name}
            className="h-full w-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-black/20 via-transparent to-white/10 z-10" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-1.5">
        {/* Индикатор просмотра */}
        {isViewed && (
          <motion.div
            className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500/80 text-[10px]"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            ✓
          </motion.div>
        )}

        {/* Имя голоса */}
        <div
          className="line-clamp-2 text-white"
          style={{
            textShadow: isActive ? `0 0 10px ${voice.color}` : '0 0 6px rgba(0,0,0,0.25)',
          }}
        >
          {voice.name}
        </div>

        {/* Уровень навыка */}
        <div className={cn(
          'text-[11px] font-semibold tracking-[0.25em]',
          isAvailable ? 'text-white/80' : 'text-white/50'
        )}>
          {skillLevel}
        </div>
      </div>
    </motion.button>
  )
}

