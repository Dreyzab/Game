import React from 'react'
import { cn } from '../../../lib/utils/cn'

export type TextVariant = 'body' | 'muted' | 'accent'
export type TextSize = 'xs' | 'sm' | 'base' | 'lg'

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant
  size?: TextSize
  children: React.ReactNode
}

const variantClasses = {
  body: 'text-[color:var(--color-text-primary)]',
  muted: 'text-[color:var(--color-text-muted)]',
  accent: 'text-[color:var(--color-text-secondary)]'
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg'
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant = 'body', size = 'base', children, ...props }, ref) => {
    return (
      <p
        className={cn(
          'leading-relaxed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </p>
    )
  }
)

Text.displayName = 'Text'
