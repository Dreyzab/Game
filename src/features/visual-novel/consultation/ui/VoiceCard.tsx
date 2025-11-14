import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils/cn'
import type { VoiceDefinition } from '../lib/voiceDefinitions'

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

  return (
    <motion.button
      type="button"
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={cn(
        'relative flex min-h-[90px] flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 backdrop-blur transition-all duration-200',
        // Базовые стили
        'text-center text-xs font-medium uppercase tracking-wider',
        // Доступность и интерактивность
        canClick && 'cursor-pointer hover:scale-105',
        !canClick && 'cursor-not-allowed opacity-40',
        // Активное состояние
        isActive && 'border-white/90 bg-white/25 shadow-lg ring-2 ring-white/50',
        // Доступный, но не активный
        !isActive && isAvailable && 'border-white/50 bg-white/10 hover:border-white/70 hover:bg-white/15',
        // Недоступный
        !isAvailable && 'border-white/10 bg-white/5',
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        // Пульсация для доступных голосов
        ...(isAvailable && !isActive && {
          boxShadow: [
            '0 0 0 0 rgba(255, 255, 255, 0)',
            '0 0 0 4px rgba(255, 255, 255, 0.1)',
            '0 0 0 0 rgba(255, 255, 255, 0)',
          ],
        }),
      }}
      transition={{ 
        duration: 0.3,
        boxShadow: {
          duration: 2,
          repeat: isAvailable && !isActive ? Infinity : 0,
          repeatType: 'loop',
        },
      }}
      whileHover={canClick ? { scale: 1.05 } : undefined}
      whileTap={canClick ? { scale: 0.98 } : undefined}
    >
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

      {/* Иконка голоса */}
      {voice.icon && (
        <div className="text-2xl opacity-90">
          {voice.icon}
        </div>
      )}

      {/* Имя голоса */}
      <div 
        className="line-clamp-2 text-white"
        style={{
          textShadow: isActive ? `0 0 8px ${voice.color}` : undefined,
        }}
      >
        {voice.name}
      </div>

      {/* Уровень навыка */}
      <div className={cn(
        'text-[10px] font-normal',
        isAvailable ? 'text-white/70' : 'text-white/40'
      )}>
        {skillLevel}
      </div>

      {/* Полоска уровня */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-xl bg-white/10">
        <motion.div
          className="h-full"
          style={{ 
            backgroundColor: voice.color,
            opacity: isAvailable ? 0.8 : 0.3,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (skillLevel / 100) * 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </motion.button>
  )
}

