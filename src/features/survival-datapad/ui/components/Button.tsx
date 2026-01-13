import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { playSound } from '../../utils/sound'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  colorClass?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  colorClass = 'text-white border-white',
  className = '',
  children,
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'relative font-bold uppercase tracking-widest transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'

  let variantStyles = ''
  switch (variant) {
    case 'primary':
      variantStyles = `border-2 bg-transparent hover:bg-white/5 ${colorClass}`
      break
    case 'secondary':
      variantStyles = `border bg-transparent text-xs py-2 hover:bg-white/5 ${colorClass}`
      break
    case 'ghost':
      variantStyles = 'text-white/70 hover:text-white'
      break
    case 'danger':
      variantStyles = 'border-2 border-red-500 text-red-500 hover:bg-red-500/10'
      break
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!disabled) playSound('click')
    onClick?.(e)
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

