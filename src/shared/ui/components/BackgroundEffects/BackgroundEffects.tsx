import React from 'react'
import { cn } from '../../../lib/utils/cn'

export interface BackgroundEffect {
  position: string
  gradient: string
  blur?: string
  size?: string
}

export interface BackgroundEffectsProps extends React.HTMLAttributes<HTMLDivElement> {
  effects?: BackgroundEffect[]
}

const defaultEffects: BackgroundEffect[] = [
  {
    position: 'absolute -left-24 top-32',
    gradient: 'bg-[radial-gradient(circle,rgba(79,70,229,0.28),transparent_60%)]',
    blur: 'blur-3xl',
    size: 'h-80 w-80'
  },
  {
    position: 'absolute -right-10 top-20',
    gradient: 'bg-[radial-gradient(circle,rgba(14,165,233,0.22),transparent_65%)]',
    blur: 'blur-3xl',
    size: 'h-72 w-72'
  },
  {
    position: 'absolute bottom-10 left-1/2 -translate-x-1/2',
    gradient: 'bg-[radial-gradient(circle,rgba(244,114,182,0.18),transparent_70%)]',
    blur: 'blur-3xl',
    size: 'h-96 w-96'
  }
]

export const BackgroundEffects = React.forwardRef<HTMLDivElement, BackgroundEffectsProps>(
  ({ className, effects = defaultEffects, ...props }, ref) => {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-60',
          className
        )}
        ref={ref}
        {...props}
      >
        {effects.map((effect, index) => (
          <div
            key={index}
            className={cn(
              effect.position,
              effect.size,
              'rounded-full',
              effect.gradient,
              effect.blur
            )}
          />
        ))}
      </div>
    )
  }
)

BackgroundEffects.displayName = 'BackgroundEffects'
