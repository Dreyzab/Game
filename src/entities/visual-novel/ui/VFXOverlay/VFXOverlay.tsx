import React, { useMemo } from 'react'

export interface VFXOverlayProps {
  particleCount?: number
  disableVignette?: boolean
}

export const VFXOverlay: React.FC<VFXOverlayProps> = ({ particleCount = 20, disableVignette = false }) => {
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, () => ({
      size: Math.random() * 4 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.5 + 0.1,
    }))
  }, [particleCount])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 opacity-30">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full blur-[1px] animate-float"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>

      {!disableVignette && <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.6)]" />}
    </div>
  )
}

