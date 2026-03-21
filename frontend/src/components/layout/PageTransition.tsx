import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Wraps every page with a subtle fade+slide-up entrance animation.
 * This makes route changes feel polished instead of jarring.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  )
}