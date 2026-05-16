import type { PropsWithChildren } from 'react'
import { motion } from 'framer-motion'

export default function PageWrapper({ children }: PropsWithChildren) {
  return (
    <motion.div
      aria-live="polite"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
