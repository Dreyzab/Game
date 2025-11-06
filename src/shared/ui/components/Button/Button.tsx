import React from 'react'
import { cn } from '../../../lib/utils/cn'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'admin'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  uppercase?: boolean
  tracking?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, loading, leftIcon, rightIcon, uppercase, tracking, children, disabled, ...props }, ref) => {
    // Map tracking values to Tailwind classes
    const trackingClassMap: Record<string, string> = {
      'tight': 'tracking-tight',
      'normal': 'tracking-normal',
      'wide': 'tracking-wide',
      'wider': 'tracking-wider',
      'widest': 'tracking-widest',
      '0.32em': 'tracking-[0.32em]',
    }
    
    const trackingClass = tracking 
      ? (trackingClassMap[tracking] || null)
      : (uppercase ? 'tracking-[0.32em]' : null)
    
    return (
      <button
        className={cn(
          'btn',
          variant && `btn--${variant}`,
          size && size !== 'md' && `btn--${size}`, // md is default, no class needed
          fullWidth && 'btn--full-width',
          loading && 'opacity-50',
          uppercase && 'uppercase',
          trackingClass,
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
