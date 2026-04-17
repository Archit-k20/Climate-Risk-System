import { motion } from 'framer-motion'
import { RiskMatrixCell } from '@/types/simulator'

interface RiskImpactMatrixProps {
  cells: RiskMatrixCell[]
}

const PROBABILITY_LEVELS = ['low', 'medium', 'high'] as const

const LEVEL_COLORS = {
  low:    { bg: 'rgba(16,185,129,0.2)',  border: '#10b981', text: '#10b981' },
  medium: { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b', text: '#f59e0b' },
  high:   { bg: 'rgba(239,68,68,0.2)',  border: '#ef4444', text: '#ef4444' },
}

const RISK_ICONS: Record<string, string> = {
  Drought:  '☀️',
  Flood:    '🌊',
  Wildfire: '🔥',
}

export function RiskImpactMatrix({ cells }: RiskImpactMatrixProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <p
        className="text-xs uppercase tracking-widest mb-4"
        style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
      >
        Risk Impact Matrix
      </p>

      {/* Column headers */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <div /> {/* empty top-left cell for the row labels column */}
        {PROBABILITY_LEVELS.map((level) => (
          <div key={level} className="text-center">
            <span
              className="text-xs capitalize"
              style={{ color: LEVEL_COLORS[level].text, fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {level}
            </span>
          </div>
        ))}
      </div>

      {/* Matrix rows — one per risk type */}
      {cells.map((cell, rowIndex) => (
        <motion.div
          key={cell.riskType}
          className="grid grid-cols-4 gap-2 mb-2"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: rowIndex * 0.08 }}
        >
          {/* Row label */}
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '14px' }}>{RISK_ICONS[cell.riskType]}</span>
            <span
              className="text-xs"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {cell.riskType}
            </span>
          </div>

          {/* Three probability cells — only the matching one lights up */}
          {PROBABILITY_LEVELS.map((level) => {
            const isActive = cell.probability === level
            const colors   = LEVEL_COLORS[level]

            return (
              <motion.div
                key={level}
                animate={{
                  background: isActive ? colors.bg : 'transparent',
                  borderColor: isActive ? colors.border : 'var(--color-border)',
                  scale: isActive ? 1.03 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="h-10 rounded-lg flex items-center justify-center"
                style={{
                  border: '1px solid var(--color-border)',
                }}
              >
                {isActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs font-bold"
                    style={{ color: colors.text, fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    {cell.score}
                  </motion.span>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      ))}
    </div>
  )
}