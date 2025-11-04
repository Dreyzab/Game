import React from 'react'
import { cn } from '../../../lib/utils/cn'
import { Loader2 } from 'lucide-react'

export type LoadingSpinnerSize = 'sm' | 'md' | 'lg'

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: LoadingSpinnerSize
  text?: string
}

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', text, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    }

    return (
      <div
        className={cn(
          'flex items-center justify-center p-4 text-(--color-text-muted)',
          className
        )}
        ref={ref}
        {...props}
      >
        <Loader2 className={cn('mr-3 animate-spin text-(--color-cyan)', sizeClasses[size])} />
        {text && (
          <span className="font-mono text-xs uppercase tracking-[0.32em]">
            {text}
          </span>
        )}
      </div>
    )
  }
)

LoadingSpinner.displayName = 'LoadingSpinner'
