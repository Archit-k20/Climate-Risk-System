import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { Notification } from '@/store/useAppStore'

/**
 * Watches the global notification store and displays the most recent
 * unread high-priority notification as a dismissible banner.
 *
 * The banner only shows for 'danger' or 'warning' type notifications —
 * routine 'success' and 'info' events are handled by toast popups instead,
 * which are less intrusive.
 */
export function LiveUpdateBanner() {
  const navigate = useNavigate()
  const { notifications, markNotificationRead } = useAppStore()

  // Find the most recent unread high-priority notification
  const activeAlert = notifications.find(
    n => !n.read && (n.type === 'danger' || n.type === 'warning')
  ) ?? null

  // Track whether the banner is visible.
  // We separate this from the notification existence so the exit
  // animation can play before we clear the notification from state.
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<Notification | null>(null)

  useEffect(() => {
    if (activeAlert && activeAlert.id !== current?.id) {
      setCurrent(activeAlert)
      setVisible(true)

      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setVisible(false)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [activeAlert, current?.id])

  const dismiss = () => {
    setVisible(false)
    if (current) markNotificationRead(current.id)
  }

  const handleViewOnMap = () => {
    dismiss()
    navigate('/risk-map')
  }

  const isCritical = current?.type === 'danger'

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          // Slides down from above the dashboard content
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
          style={{
            background: isCritical
              ? 'rgba(239, 68, 68, 0.12)'
              : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${isCritical ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
          }}
        >
          {/* Pulsing alert icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 risk-pulse"
            style={{
              background: isCritical ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
            }}
          >
            <AlertTriangle
              size={16}
              style={{ color: isCritical ? 'var(--color-red)' : 'var(--color-amber)' }}
            />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold"
              style={{
                color: isCritical ? 'var(--color-red)' : 'var(--color-amber)',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              {isCritical ? 'High Risk Alert' : 'Risk Warning'}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {current.message}
              {current.region && ` · ${current.region}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleViewOnMap}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/10"
              style={{
                border: `1px solid ${isCritical ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
                color: isCritical ? 'var(--color-red)' : 'var(--color-amber)',
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              View on Map <ArrowRight size={11} />
            </button>
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            >
              <X size={13} style={{ color: 'var(--color-muted)' }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}