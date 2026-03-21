import { motion } from 'framer-motion'
import { RiskBreakdown } from '@/types/analysis'

interface RiskTypeBreakdownProps {
  breakdown: RiskBreakdown[]
}

// Each risk type gets its own color so the bars are immediately
// distinguishable without needing to read the labels
const RISK_TYPE_COLORS: Record<string, string> = {
  Drought:      '#f59e0b',
  Flood:        '#06b6d4',
  Wildfire:     '#ef4444',
  Deforestation:'#10b981',
  Erosion:      '#a78bfa',
}

export function RiskTypeBreakdown({ breakdown }: RiskTypeBreakdownProps) {
  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-xs uppercase tracking-widest"
        style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
      >
        Risk Type Breakdown
      </p>

      {breakdown.map((item, i) => {
        const color = RISK_TYPE_COLORS[item.type] ?? 'var(--color-amber)'

        return (
          <div key={item.type} className="flex flex-col gap-1.5">
            {/* Label row: risk type name on left, score on right */}
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {item.type}
              </span>
              <span
                className="text-sm font-bold"
                style={{ color, fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {item.score}
              </span>
            </div>

            {/* Progress bar track */}
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--color-border)' }}
            >
              {/* Animated fill — starts at 0 width, expands to score% */}
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                // delay: each bar starts 150ms after the previous
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.15, ease: 'easeOut' }}
              />
            </div>

            {/* Confidence sub-label */}
            <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {item.confidence}% confidence
            </p>
          </div>
        )
      })}
    </div>
  )
}