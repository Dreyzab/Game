import React from 'react'
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion'
import { cn } from '../../../lib/utils/cn'

export interface MotionContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  stagger?: number
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  once?: boolean
}

const directionVariants: Record<NonNullable<MotionContainerProps['direction']>, Variants> = {
  up: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
}

export const MotionContainer = React.forwardRef<HTMLDivElement, MotionContainerProps>(
  ({ className, children, stagger = 0.1, delay = 0, direction = 'up', once = true, ...motionProps }, ref) => {
    const containerVariants: Variants = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: stagger,
          delayChildren: delay,
        },
      },
    }

    const itemVariants = directionVariants[direction]

    return (
      <motion.div
        ref={ref}
        className={cn(className)}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: "-100px" }}
        {...motionProps}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    )
  }
)

MotionContainer.displayName = 'MotionContainer'
