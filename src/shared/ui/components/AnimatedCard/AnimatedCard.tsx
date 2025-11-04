import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../../lib/utils/cn'

export interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'interactive'
  children: React.ReactNode
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, variant = 'default', children, ...motionProps }, ref) => {
    const defaultMotionProps: HTMLMotionProps<'div'> = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3, ease: 'easeOut' },
      whileHover: variant === 'interactive' ? { y: -4, scale: 1.02 } : undefined,
      whileTap: variant === 'interactive' ? { scale: 0.98 } : undefined,
    }

    const cardClasses = cn(
      variant === 'default' && 'glass-panel',
      variant === 'elevated' && 'glass-panel',
      variant === 'interactive' && 'glass-panel',
      className
    )

    return (
      <motion.div
        ref={ref}
        className={cardClasses}
        {...defaultMotionProps}
        {...motionProps}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'
