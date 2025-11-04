import React from 'react'
import { cn } from '../../../lib/utils/cn'

export type BadgeVariant = 'glow' | 'solid' | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  children: React.ReactNode
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'solid', children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'badge',
          variant && `badge--${variant}`,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'
