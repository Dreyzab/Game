import React from 'react'
import { motion } from 'framer-motion'

type MotionContainerProps = React.PropsWithChildren<{
  className?: string
}>

export const MotionContainer: React.FC<MotionContainerProps> = ({ className, children }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default MotionContainer

