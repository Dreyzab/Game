import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useNarrativeStore } from '@/entities/visual-novel/model/useNarrativeStore'

export type EntropyIntensity = 'none' | 'low' | 'medium' | 'high' | 'critical'

export const INTENSITY_CONFIG: Record<
  EntropyIntensity,
  {
    saturation: number
    glitchFrequency: number
    noiseOpacity: number
    scanlineOpacity: number
    rgbShift: number
    pulseSpeed: number
    invertChance: number
  }
> = {
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

const getEntropyIntensity = (entropyLevel: number): EntropyIntensity => {
  if (entropyLevel < 10) return 'none'
  if (entropyLevel < 30) return 'low'
  if (entropyLevel < 60) return 'medium'
  if (entropyLevel < 85) return 'high'
  return 'critical'
}

export const getEntropyMapStyles = (entropyLevel: number): CSSProperties => {
  const intensity = getEntropyIntensity(entropyLevel)
  const config = INTENSITY_CONFIG[intensity]

  return {
    filter: `saturate(${config.saturation}%) contrast(${100 + (100 - config.saturation) * 0.1}%)`,
    transition: 'filter 1s ease-in-out',
  }
}

export function useEntropyEffects() {
  const entropyLevel = useNarrativeStore((state) => state.entropyVisuals)
  const setEntropy = useNarrativeStore((state) => state.setEntropy)
  const incrementEntropy = useNarrativeStore((state) => state.incrementEntropy)
  const decrementEntropy = useNarrativeStore((state) => state.decrementEntropy)

  const mapStyles = useMemo(() => getEntropyMapStyles(entropyLevel), [entropyLevel])
  const intensity = useMemo(() => getEntropyIntensity(entropyLevel), [entropyLevel])

  return {
    entropyLevel,
    intensity,
    mapStyles,
    setEntropy,
    incrementEntropy,
    decrementEntropy,
  }
}

