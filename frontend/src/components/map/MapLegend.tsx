import { motion } from 'framer-motion'
import { mockMapPoints } from '@/lib/mockData'

export function MapLegend() {
  // Count how many points fall into each risk level for the legend counts
  const counts = {
    high:   mockMapPoints.filter((p) => p.riskLevel === 'high').length,
    medium: mockMapPoints.filter((p) => p.riskLevel === 'medium').length,
    low:    mockMapPoints.filter((p) => p.riskLevel === 'low').length,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="glass rounded-xl p-3"
      style={{ zIndex: 1000, minWidth: '140px' }}
    >
      <p
        className="text-xs uppercase tracking-widest mb-2"
        style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
      >
        Legend
      </p>

      {/* Color gradient bar showing low → high */}
      <div
        className="h-2 rounded-full mb-2"
        style={{
          background: 'linear-gradient(to right, #10b981, #f59e0b, #ef4444)',
        }}
      />

      <div className="flex justify-between mb-3">
        <span className="text-xs" style={{ color: '#10b981', fontFamily: 'IBM Plex Mono, monospace' }}>Low</span>
        <span className="text-xs" style={{ color: '#f59e0b', fontFamily: 'IBM Plex Mono, monospace' }}>Med</span>
        <span className="text-xs" style={{ color: '#ef4444', fontFamily: 'IBM Plex Mono, monospace' }}>High</span>
      </div>

      {/* Point counts per level */}
      {(Object.entries(counts) as [keyof typeof counts, number][]).map(([level, count]) => {
        const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
        return (
          <div key={level} className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: colors[level] }} />
              <span className="text-xs capitalize" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {level}
              </span>
            </div>
            <span className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}>
              {count}
            </span>
          </div>
        )
      })}
    </motion.div>
  )
}