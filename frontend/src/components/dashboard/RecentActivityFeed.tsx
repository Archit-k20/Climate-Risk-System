import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { mockActivityFeed } from '@/lib/mockData'
import { ImageIcon, Wifi, WifiOff } from 'lucide-react'
import { useAppStore, LiveActivityEntry } from '@/store/useAppStore'
import { useRecentAnalyses } from '@/hooks/useRecentAnalyses'

const RISK_COLORS = {
  low:    'var(--color-emerald)',
  medium: 'var(--color-amber)',
  high:   'var(--color-red)',
}

interface ActivityEntry {
  id:         string
  filename:   string
  riskType:   string
  confidence: number
  riskLevel:  'low' | 'medium' | 'high'
  timestamp:  Date
  isLive:     boolean
}

export function RecentActivityFeed() {
  const { liveActivityEntries } = useAppStore()

  // useRecentAnalyses does two things simultaneously:
  // 1. Fetches real images from the backend and seeds liveActivityEntries
  // 2. Returns isBackendOnline so we know which data source to trust
  const { isBackendOnline } = useRecentAnalyses()

  const entries: ActivityEntry[] = useMemo(() => {
    const live: ActivityEntry[] = liveActivityEntries.map((e: LiveActivityEntry) => ({
      ...e,
      isLive: e.isLive,
    }))

    // This is the critical decision point.
    // When the backend is online, we trust only the backend data that
    // has been seeded into liveActivityEntries via useRecentAnalyses.
    // We do NOT mix in mock data because that would be misleading —
    // showing fake entries alongside real ones.
    // When the backend is offline, liveActivityEntries will be empty
    // (or contain only WebSocket events from this session), so we
    // fall back to mock data to keep the UI looking populated.
    if (isBackendOnline) {
      // Backend is on — show only real data, no mock mixing
      return live.slice(0, 8)
    } else {
      // Backend is off — mix live session events with mock baseline
      const mock: ActivityEntry[] = mockActivityFeed.map(m => ({
        ...m,
        isLive: false,
      }))
      return [...live, ...mock].slice(0, 8)
    }
  }, [liveActivityEntries, isBackendOnline])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl p-5"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      {/* Header with live/offline indicator */}
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Recent Analyses
        </p>
        <div className="flex items-center gap-1.5">
          {isBackendOnline ? (
            <>
              <Wifi size={11} style={{ color: 'var(--color-emerald)' }} />
              <span className="text-xs" style={{ color: 'var(--color-emerald)', fontFamily: 'IBM Plex Mono, monospace' }}>
                Live
              </span>
            </>
          ) : (
            <>
              <WifiOff size={11} style={{ color: 'var(--color-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                Demo
              </span>
            </>
          )}
        </div>
      </div>

      {/* Empty state when backend is on but no images uploaded yet */}
      {isBackendOnline && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ImageIcon size={28} style={{ color: 'var(--color-muted)', marginBottom: '12px' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
            No analyses yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', opacity: 0.6, fontFamily: 'IBM Plex Mono, monospace' }}>
            Upload a satellite image to begin
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {entries.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: item.isLive
                  ? `${RISK_COLORS[item.riskLevel]}08`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${item.isLive
                  ? RISK_COLORS[item.riskLevel] + '30'
                  : 'var(--color-border)'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${RISK_COLORS[item.riskLevel]}20` }}
              >
                <ImageIcon size={16} style={{ color: RISK_COLORS[item.riskLevel] }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  {item.isLive && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-bold"
                      style={{
                        background: 'rgba(16,185,129,0.2)',
                        color: 'var(--color-emerald)',
                        fontSize: '9px',
                        fontFamily: 'IBM Plex Mono, monospace',
                      }}
                    >
                      NEW
                    </span>
                  )}
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    {item.filename}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-1 rounded-full overflow-hidden"
                    style={{ background: 'var(--color-border)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.confidence}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: RISK_COLORS[item.riskLevel] }}
                    />
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>
                    {item.confidence}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${RISK_COLORS[item.riskLevel]}20`,
                    color: RISK_COLORS[item.riskLevel],
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  {item.riskType}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted)', fontSize: '10px' }}>
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}