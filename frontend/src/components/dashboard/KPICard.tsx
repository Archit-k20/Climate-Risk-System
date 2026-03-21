import { ReactNode } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

interface KPICardProps {
  title: string
  value: number
  suffix?: string
  icon: ReactNode
  sparklineData: number[]
  sparklineColor: string
  accentColor: string
  index: number        // used to stagger the entrance animation
}

/**
 * A single KPI tile. The card has three visual layers:
 * 1. Top row: title + icon
 * 2. Middle: the big animated number
 * 3. Bottom: a tiny sparkline chart showing the 7-day trend
 */
export function KPICard({
  title, value, suffix, icon,
  sparklineData, sparklineColor, accentColor, index
}: KPICardProps) {
  // Convert raw numbers to the shape Recharts expects
  const chartData = sparklineData.map((v, i) => ({ i, v }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // staggered delay: each card enters 100ms after the previous one
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      className="rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        border: `1px solid var(--color-border)`,
        // subtle top-left gradient glow using the card's accent color
        backgroundImage: `radial-gradient(ellipse at top left, ${accentColor}15, transparent 60%)`,
      }}
    >
      {/* ── Row 1: Title + Icon ── */}
      <div className="flex items-start justify-between">
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {title}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}20`, color: accentColor }}
        >
          {icon}
        </div>
      </div>

      {/* ── Row 2: Big animated number ── */}
      <div
        className="text-3xl font-bold"
        style={{ fontFamily: 'Syne, sans-serif', color: accentColor }}
      >
        <AnimatedNumber value={value} suffix={suffix} />
      </div>

      {/* ── Row 3: Sparkline trend chart ── */}
      <div className="h-12 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={sparklineColor}
              strokeWidth={1.5}
              fill={`url(#grad-${title})`}
              dot={false}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Trend label ── */}
      <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
        7-day trend
      </p>
    </motion.div>
  )
}