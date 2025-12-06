/**
 * EntropyOverlay — Визуальные эффекты энтропии для карты
 * 
 * Реализует «Серость» (The Pale) — визуальное искажение реальности
 * при высоком уровне энтропии в Разломе:
 * 
 * - Десатурация цветов
 * - Глитч-эффекты (смещение пикселей)
 * - Инверсия в критических зонах
 * - Шум и помехи
 */

import { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/lib/utils/cn'
import { useNarrativeStore, selectEntropyIntensity } from '@/shared/stores/useNarrativeStore'

// ============================================================================
// TYPES
// ============================================================================

interface EntropyOverlayProps {
  /** Переопределить уровень энтропии (0-100) */
  entropyLevel?: number
  /** Включить/выключить эффекты */
  enabled?: boolean
  /** Дополнительные классы */
  className?: string
  /** Z-index для позиционирования */
  zIndex?: number
}

type EntropyIntensity = 'none' | 'low' | 'medium' | 'high' | 'critical'

// ============================================================================
// CONSTANTS
// ============================================================================

const INTENSITY_CONFIG: Record<EntropyIntensity, {
  saturation: number
  glitchFrequency: number
  noiseOpacity: number
  scanlineOpacity: number
  rgbShift: number
  pulseSpeed: number
  invertChance: number
}> = {
  none: {
    saturation: 100,
    glitchFrequency: 0,
    noiseOpacity: 0,
    scanlineOpacity: 0,
    rgbShift: 0,
    pulseSpeed: 0,
    invertChance: 0,
  },
  low: {
    saturation: 85,
    glitchFrequency: 0.1,
    noiseOpacity: 0.02,
    scanlineOpacity: 0.03,
    rgbShift: 0.5,
    pulseSpeed: 8,
    invertChance: 0,
  },
  medium: {
    saturation: 60,
    glitchFrequency: 0.3,
    noiseOpacity: 0.05,
    scanlineOpacity: 0.08,
    rgbShift: 1.5,
    pulseSpeed: 5,
    invertChance: 0.05,
  },
  high: {
    saturation: 35,
    glitchFrequency: 0.6,
    noiseOpacity: 0.1,
    scanlineOpacity: 0.15,
    rgbShift: 3,
    pulseSpeed: 3,
    invertChance: 0.15,
  },
  critical: {
    saturation: 10,
    glitchFrequency: 0.9,
    noiseOpacity: 0.2,
    scanlineOpacity: 0.25,
    rgbShift: 5,
    pulseSpeed: 1.5,
    invertChance: 0.3,
  },
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * NoiseLayer — Слой статического шума
 */
const NoiseLayer = ({ opacity }: { opacity: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (opacity === 0) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    
    let animationId: number
    
    const drawNoise = () => {
      const imageData = ctx.createImageData(width, height)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255
        data[i] = value     // R
        data[i + 1] = value // G
        data[i + 2] = value // B
        data[i + 3] = 255   // A
      }
      
      ctx.putImageData(imageData, 0, 0)
      animationId = requestAnimationFrame(drawNoise)
    }
    
    drawNoise()
    
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [opacity])
  
  if (opacity === 0) return null
  
  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={128}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        opacity,
        mixBlendMode: 'overlay',
        imageRendering: 'pixelated',
      }}
    />
  )
}

/**
 * ScanlineLayer — Слой скан-линий (ретро-эффект)
 */
const ScanlineLayer = ({ opacity }: { opacity: number }) => {
  if (opacity === 0) return null
  
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity,
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.3) 2px,
          rgba(0, 0, 0, 0.3) 4px
        )`,
      }}
    />
  )
}

/**
 * GlitchLayer — Слой глитч-эффектов
 */
const GlitchLayer = ({ 
  frequency, 
  rgbShift 
}: { 
  frequency: number
  rgbShift: number 
}) => {
  const [isGlitching, setIsGlitching] = useState(false)
  
  useEffect(() => {
    if (frequency === 0) return
    
    const glitchInterval = setInterval(() => {
      if (Math.random() < frequency) {
        setIsGlitching(true)
        setTimeout(() => setIsGlitching(false), 50 + Math.random() * 150)
      }
    }, 100)
    
    return () => clearInterval(glitchInterval)
  }, [frequency])
  
  if (!isGlitching || rgbShift === 0) return null
  
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          linear-gradient(
            ${Math.random() * 360}deg,
            rgba(255, 0, 0, 0.1) 0%,
            transparent 50%,
            rgba(0, 0, 255, 0.1) 100%
          )
        `,
        transform: `translate(${(Math.random() - 0.5) * rgbShift * 2}px, ${(Math.random() - 0.5) * rgbShift}px)`,
        mixBlendMode: 'screen',
      }}
    />
  )
}

// Import useState for GlitchLayer
import { useState } from 'react'

/**
 * PulseLayer — Слой пульсации
 */
const PulseLayer = ({ speed }: { speed: number }) => {
  if (speed === 0) return null
  
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{
        opacity: [0, 0.1, 0],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        background: 'radial-gradient(circle at center, rgba(100, 100, 100, 0.3) 0%, transparent 70%)',
      }}
    />
  )
}

/**
 * VignetteLayer — Слой виньетки
 */
const VignetteLayer = ({ intensity }: { intensity: EntropyIntensity }) => {
  const vignetteStrength = {
    none: 0,
    low: 0.2,
    medium: 0.4,
    high: 0.6,
    critical: 0.8,
  }[intensity]
  
  if (vignetteStrength === 0) return null
  
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(
          ellipse at center,
          transparent 40%,
          rgba(0, 0, 0, ${vignetteStrength}) 100%
        )`,
      }}
    />
  )
}

/**
 * WarningIndicator — Индикатор уровня энтропии
 */
const WarningIndicator = ({ 
  intensity,
  entropyLevel,
}: { 
  intensity: EntropyIntensity
  entropyLevel: number 
}) => {
  if (intensity === 'none') return null
  
  const colors = {
    low: 'text-yellow-500',
    medium: 'text-orange-500',
    high: 'text-red-500',
    critical: 'text-red-600',
  }
  
  const labels = {
    low: 'Нестабильность',
    medium: 'Высокая энтропия',
    high: 'Опасный уровень',
    critical: 'КРИТИЧЕСКАЯ ЭНТРОПИЯ',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'absolute top-4 left-1/2 -translate-x-1/2',
        'px-4 py-2 rounded-lg',
        'bg-black/70 backdrop-blur-sm border',
        intensity === 'critical' ? 'border-red-500' : 'border-gray-600',
      )}
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className={cn('w-2 h-2 rounded-full', colors[intensity], 'bg-current')}
        />
        <span className={cn('text-xs font-bold uppercase tracking-wider', colors[intensity])}>
          {labels[intensity]}
        </span>
        <span className="text-xs text-gray-400">
          {entropyLevel}%
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full',
            intensity === 'low' && 'bg-yellow-500',
            intensity === 'medium' && 'bg-orange-500',
            intensity === 'high' && 'bg-red-500',
            intensity === 'critical' && 'bg-red-600',
          )}
          initial={{ width: 0 }}
          animate={{ width: `${entropyLevel}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EntropyOverlay = ({
  entropyLevel: externalLevel,
  enabled = true,
  className,
  zIndex = 100,
}: EntropyOverlayProps) => {
  // Get entropy from store or use external
  const storeEntropyVisuals = useNarrativeStore((state) => state.entropyVisuals)
  const entropyLevel = externalLevel ?? storeEntropyVisuals
  
  // Calculate intensity
  const intensity = useMemo((): EntropyIntensity => {
    if (entropyLevel < 10) return 'none'
    if (entropyLevel < 30) return 'low'
    if (entropyLevel < 60) return 'medium'
    if (entropyLevel < 85) return 'high'
    return 'critical'
  }, [entropyLevel])
  
  const config = INTENSITY_CONFIG[intensity]
  
  // CSS filter for saturation
  const filterStyle = useMemo(() => ({
    filter: `saturate(${config.saturation}%)`,
  }), [config.saturation])
  
  if (!enabled || intensity === 'none') {
    return null
  }
  
  return (
    <AnimatePresence>
      <div
        className={cn(
          'fixed inset-0 pointer-events-none overflow-hidden',
          className,
        )}
        style={{ zIndex }}
      >
        {/* Main filter container (applies to children via CSS) */}
        <div 
          className="absolute inset-0"
          style={filterStyle}
        />
        
        {/* Noise Layer */}
        <NoiseLayer opacity={config.noiseOpacity} />
        
        {/* Scanline Layer */}
        <ScanlineLayer opacity={config.scanlineOpacity} />
        
        {/* Glitch Layer */}
        <GlitchLayer 
          frequency={config.glitchFrequency} 
          rgbShift={config.rgbShift} 
        />
        
        {/* Pulse Layer */}
        <PulseLayer speed={config.pulseSpeed} />
        
        {/* Vignette Layer */}
        <VignetteLayer intensity={intensity} />
        
        {/* Warning Indicator */}
        <WarningIndicator 
          intensity={intensity} 
          entropyLevel={entropyLevel} 
        />
        
        {/* Critical Screen Flash */}
        {intensity === 'critical' && (
          <motion.div
            className="absolute inset-0 bg-red-900/10"
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
    </AnimatePresence>
  )
}

// ============================================================================
// ENTROPY OVERLAY CSS (for applying filter to map)
// ============================================================================

/**
 * CSS класс для применения к родительскому контейнеру карты
 * Позволяет фильтрам энтропии влиять на содержимое карты
 */
export const getEntropyMapStyles = (entropyLevel: number): React.CSSProperties => {
  const intensity = (() => {
    if (entropyLevel < 10) return 'none'
    if (entropyLevel < 30) return 'low'
    if (entropyLevel < 60) return 'medium'
    if (entropyLevel < 85) return 'high'
    return 'critical'
  })()
  
  const config = INTENSITY_CONFIG[intensity as EntropyIntensity]
  
  return {
    filter: `saturate(${config.saturation}%) contrast(${100 + (100 - config.saturation) * 0.1}%)`,
    transition: 'filter 1s ease-in-out',
  }
}

// ============================================================================
// HOOK FOR MAP INTEGRATION
// ============================================================================

/**
 * Хук для интеграции с картой Mapbox
 * Возвращает стили и компонент оверлея
 */
export function useEntropyEffects() {
  const entropyLevel = useNarrativeStore((state) => state.entropyVisuals)
  const setEntropy = useNarrativeStore((state) => state.setEntropy)
  const incrementEntropy = useNarrativeStore((state) => state.incrementEntropy)
  const decrementEntropy = useNarrativeStore((state) => state.decrementEntropy)
  
  const mapStyles = useMemo(
    () => getEntropyMapStyles(entropyLevel),
    [entropyLevel]
  )
  
  const intensity = useMemo((): EntropyIntensity => {
    if (entropyLevel < 10) return 'none'
    if (entropyLevel < 30) return 'low'
    if (entropyLevel < 60) return 'medium'
    if (entropyLevel < 85) return 'high'
    return 'critical'
  }, [entropyLevel])
  
  return {
    entropyLevel,
    intensity,
    mapStyles,
    setEntropy,
    incrementEntropy,
    decrementEntropy,
    EntropyOverlay,
  }
}

export default EntropyOverlay


