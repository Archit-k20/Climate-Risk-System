import { ReactNode } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  suffix?: string
  icon: ReactNode
  sparklineData: number[]
  sparklineColor: string
  accentColor: string
  index: number
  unit?: string
}

export function KPICard({
  title, value, suffix, icon,
  sparklineData, sparklineColor, accentColor, index
}: KPICardProps) {
  const chartData = sparklineData.map((v, i) => ({ i, v }))

  // Derive trend from sparkline: compare last vs first value
  const first = sparklineData[0] ?? 0
  const last  = sparklineData[sparklineData.length - 1] ?? 0
  const trendPct = first > 0 ? Math.round(((last - first) / first) * 100) : 0
  const TrendIcon = trendPct > 0 ? TrendingUp : trendPct < 0 ? TrendingDown : Minus
  const trendColor = trendPct > 0
    ? 'var(--color-emerald)'
    : trendPct < 0
    ? 'var(--color-red)'
    : 'var(--color-muted)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group"
      style={{
        background: `linear-gradient(135deg, #0d1424 0%, #0a1020 100%)`,
        border: `1px solid ${accentColor}22`,
        boxShadow: `0 0 0 1px ${accentColor}10, inset 0 1px 0 ${accentColor}15`,
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${accentColor}12 0%, transparent 65%)`,
        }}
      />
      {/* Corner accent line */}
      <div
        className="absolute top-0 left-0 w-16 h-0.5 rounded-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      {/* Row 1: Icon + Title */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-[0.15em] mb-0.5"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {title}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Row 2: Big number */}
      <div>
        <div
          className="text-4xl font-black leading-none"
          style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
        >
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
      </div>

      {/* Row 3: Sparkline */}
      <div className="h-10 -mx-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={sparklineColor}
              strokeWidth={2}
              fill={`url(#grad-${title})`}
              dot={false}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 4: Trend indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
          7-day trend
        </span>
        <div className="flex items-center gap-1">
          <TrendIcon size={11} style={{ color: trendColor }} />
          <span className="text-xs font-semibold" style={{ color: trendColor, fontFamily: 'IBM Plex Mono, monospace' }}>
            {trendPct > 0 ? '+' : ''}{trendPct}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}