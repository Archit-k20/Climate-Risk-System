import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { mockActivityFeed } from '@/lib/mockData'
import { ImageIcon, Wifi, WifiOff, SatelliteDish } from 'lucide-react'
import { useAppStore, LiveActivityEntry } from '@/store/useAppStore'
import { useRecentAnalyses } from '@/hooks/useRecentAnalyses'

const RISK_COLORS = {
  low:    '#10b981',
  medium: '#f59e0b',
  high:   '#ef4444',
}

const RISK_BG = {
  low:    'rgba(16,185,129,0.08)',
  medium: 'rgba(245,158,11,0.08)',
  high:   'rgba(239,68,68,0.08)',
}

const RISK_LABEL = {
  low:    'LOW',
  medium: 'MED',
  high:   'HIGH',
}

interface ActivityEntry {
  id:         string
  filename:   string
  riskType:   string
  confidence: number
  score:      number
  landClass:  string
  riskLevel:  'low' | 'medium' | 'high'
  timestamp:  Date
  isLive:     boolean
}

// Strip WhatsApp-style " at HH.MM.SS AM/PM" from filenames
function cleanFilename(name: string): string {
  return name.replace(/\s+at\s+[\d.]+\s*(AM|PM)?/i, '').trim()
}

export function RecentActivityFeed() {
  const { liveActivityEntries } = useAppStore()
  const { isBackendOnline } = useRecentAnalyses()

  const entries: ActivityEntry[] = useMemo(() => {
    const live: ActivityEntry[] = liveActivityEntries.map((e: LiveActivityEntry) => ({
      ...e,
      score:     e.score     ?? e.confidence,
      landClass: e.landClass ?? 'Unknown',
    }))

    if (isBackendOnline) {
      return live.slice(0, 8)
    } else {
      const mock: ActivityEntry[] = mockActivityFeed.map(m => ({
        ...m,
        score:     m.confidence,
        landClass: 'Unknown',
        isLive:    false,
      }))
      return [...live, ...mock].slice(0, 8)
    }
  }, [liveActivityEntries, isBackendOnline])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-2xl p-5 h-full"
      style={{
        background: 'linear-gradient(135deg, #0d1424 0%, #090e1a 100%)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SatelliteDish size={13} style={{ color: 'var(--color-teal)' }} />
          <p
            className="text-xs uppercase tracking-[0.15em]"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Recent Analyses
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isBackendOnline ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full risk-pulse" style={{ background: 'var(--color-emerald)' }} />
              <span className="text-xs" style={{ color: 'var(--color-emerald)', fontFamily: 'IBM Plex Mono, monospace' }}>
                Live Feed
              </span>
            </>
          ) : (
            <>
              <WifiOff size={10} style={{ color: 'var(--color-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                Demo
              </span>
            </>
          )}
        </div>
      </div>

      {/* Column headers */}
      {entries.length > 0 && (
        <div
          className="grid gap-3 px-3 mb-2"
          style={{ gridTemplateColumns: '2.5rem 1fr auto' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px' }}>Score</span>
          <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px' }}>Image / Land Class</span>
          <span className="text-xs text-right" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px' }}>Risk</span>
        </div>
      )}

      {/* Empty state */}
      {isBackendOnline && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
          >
            <ImageIcon size={22} style={{ color: 'var(--color-teal)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground) / 0.6)', fontFamily: 'IBM Plex Mono, monospace' }}>
            No analyses yet
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
            Upload a satellite image to begin
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {entries.map((item, idx) => {
            const color = RISK_COLORS[item.riskLevel]
            const bg    = RISK_BG[item.riskLevel]

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className="grid items-center gap-3 px-3 py-2.5 rounded-xl group cursor-default"
                style={{
                  gridTemplateColumns: '2.5rem 1fr auto',
                  background: item.isLive ? bg : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${item.isLive ? color + '30' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                {/* Score badge */}
                <div
                  className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 800, color, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.1 }}>
                    {item.score}
                  </span>
                  <span style={{ fontSize: '7px', color: `${color}80`, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>
                    /100
                  </span>
                </div>

                {/* Filename + land class */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {item.isLive && (
                      <span
                        className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold"
                        style={{
                          background: 'rgba(16,185,129,0.2)',
                          color: 'var(--color-emerald)',
                          fontSize: '8px',
                          fontFamily: 'IBM Plex Mono, monospace',
                          letterSpacing: '0.05em',
                        }}
                      >
                        NEW
                      </span>
                    )}
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: 'hsl(var(--foreground) / 0.85)', fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      {cleanFilename(item.filename)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.landClass && item.landClass !== 'Unknown' && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-teal)',
                          fontFamily: 'IBM Plex Mono, monospace',
                          opacity: 0.75,
                        }}
                      >
                        {item.landClass}
                      </span>
                    )}
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        background: `${color}12`,
                        color: `${color}cc`,
                        fontSize: '9px',
                        fontFamily: 'IBM Plex Mono, monospace',
                        border: `1px solid ${color}20`,
                      }}
                    >
                      {item.riskType}
                    </span>
                  </div>
                </div>

                {/* Risk level pill */}
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                  style={{
                    background: `${color}18`,
                    color,
                    border: `1px solid ${color}30`,
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: '9px',
                    letterSpacing: '0.08em',
                  }}
                >
                  {RISK_LABEL[item.riskLevel]}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}