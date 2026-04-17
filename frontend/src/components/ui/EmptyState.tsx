import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * A reusable empty state component. The design follows the same
 * visual language as the rest of the app — dark card, muted text,
 * an icon for visual anchoring, and an optional CTA button.
 * 
 * The gentle entrance animation (fade + slight scale) prevents the
 * empty state from feeling abrupt or jarring when data disappears.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-16 px-8"
    >
      {/* Icon container */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        {icon}
      </div>

      <h3
        className="text-base font-semibold mb-2"
        style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
      >
        {title}
      </h3>

      <p
        className="text-xs max-w-xs mb-5"
        style={{
          color: 'var(--color-muted)',
          fontFamily: 'IBM Plex Mono, monospace',
          lineHeight: '1.7',
        }}
      >
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--color-teal), var(--color-amber))',
            color: 'white',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}