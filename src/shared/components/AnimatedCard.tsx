import React from 'react'
import { motion } from 'framer-motion'

type AnimatedCardProps = React.PropsWithChildren<{
  className?: string
}>

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ className, children }) => {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard

