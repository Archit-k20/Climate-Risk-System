import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { mockRiskDistribution } from '@/lib/mockData'
import { useAppStore } from '@/store/useAppStore'
import { useRiskDistribution } from '@/hooks/useRiskDistribution'
import { ShieldAlert } from 'lucide-react'

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { count?: number; color: string } }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{
        background: '#0d1424',
        border: `1px solid ${payload[0].payload.color}40`,
        fontFamily: 'IBM Plex Mono, monospace',
        color: 'hsl(var(--foreground))',
        boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
      }}
    >
      <p style={{ color: payload[0].payload.color, fontWeight: 600 }}>{payload[0].name}</p>
      <p style={{ color: 'hsl(var(--foreground) / 0.7)' }}>{payload[0].value}% of total</p>
      {payload[0].payload.count !== undefined && (
        <p style={{ color: 'var(--color-muted)' }}>
          {payload[0].payload.count} image{payload[0].payload.count !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

export function RiskDistributionChart() {
  const { notifications } = useAppStore()
  const { isBackendOnline, hasData, backendDistribution } = useRiskDistribution()

  const distribution = useMemo(() => {
    if (isBackendOnline && hasData && backendDistribution) {
      return backendDistribution
    }
    if (isBackendOnline && !hasData) {
      const counts = { low: 0, medium: 0, high: 0 }
      notifications.forEach(n => {
        if (n.type === 'danger')  counts.high   += 1
        if (n.type === 'warning') counts.medium += 1
        if (n.type === 'success') counts.low    += 1
      })
      const total = counts.low + counts.medium + counts.high
      if (total === 0) {
        return [
          { name: 'Low Risk',    value: 0, color: '#10b981' },
          { name: 'Medium Risk', value: 0, color: '#f59e0b' },
          { name: 'High Risk',   value: 0, color: '#ef4444' },
        ]
      }
      return [
        { name: 'Low Risk',    value: Math.round((counts.low    / total) * 100), color: '#10b981' },
        { name: 'Medium Risk', value: Math.round((counts.medium / total) * 100), color: '#f59e0b' },
        { name: 'High Risk',   value: Math.round((counts.high   / total) * 100), color: '#ef4444' },
      ]
    }
    const counts = {
      low:    mockRiskDistribution.find(r => r.name === 'Low Risk')?.value    ?? 48,
      medium: mockRiskDistribution.find(r => r.name === 'Medium Risk')?.value ?? 33,
      high:   mockRiskDistribution.find(r => r.name === 'High Risk')?.value   ?? 19,
    }
    notifications.forEach(n => {
      if (n.type === 'danger')  counts.high   += 1
      if (n.type === 'warning') counts.medium += 1
      if (n.type === 'success') counts.low    += 1
    })
    const total = counts.low + counts.medium + counts.high
    return [
      { name: 'Low Risk',    value: Math.round((counts.low    / total) * 100), color: '#10b981' },
      { name: 'Medium Risk', value: Math.round((counts.medium / total) * 100), color: '#f59e0b' },
      { name: 'High Risk',   value: Math.round((counts.high   / total) * 100), color: '#ef4444' },
    ]
  }, [isBackendOnline, hasData, backendDistribution, notifications])

  const allZero  = distribution.every(d => d.value === 0)
  const dominant = allZero
    ? null
    : distribution.reduce((a, b) => a.value > b.value ? a : b)

  const chartData = allZero
    ? [{ name: 'No data', value: 100, color: '#1e2d45' }]
    : distribution

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-2xl p-5 h-full"
      style={{
        background: 'linear-gradient(135deg, #0d1424 0%, #090e1a 100%)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={13} style={{ color: 'var(--color-amber)' }} />
          <p
            className="text-xs uppercase tracking-[0.15em]"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Risk Distribution
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{
            background: isBackendOnline ? 'rgba(16,185,129,0.12)' : 'rgba(74,85,104,0.15)',
            color: isBackendOnline ? 'var(--color-emerald)' : 'var(--color-muted)',
            border: `1px solid ${isBackendOnline ? 'rgba(16,185,129,0.25)' : 'rgba(74,85,104,0.2)'}`,
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '10px',
          }}
        >
          {isBackendOnline ? '● Live' : '○ Demo'}
        </span>
      </div>

      {/* Donut chart */}
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <defs>
              {chartData.map((_, i) => (
                <filter key={i} id={`glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={allZero ? 0 : 4}
              dataKey="value"
              strokeWidth={0}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
            {!allZero && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {allZero ? (
            <p
              className="text-xs text-center px-6"
              style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: '1.6' }}
            >
              Upload images<br />to see distribution
            </p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest mb-0.5"
                style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                Dominant
              </p>
              <p
                className="text-base font-black"
                style={{ color: dominant?.color, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}
              >
                {dominant?.name.replace(' Risk', '') ?? '—'}
              </p>
              <p className="text-xl font-black mt-0.5"
                style={{ color: dominant?.color, fontFamily: 'Syne, sans-serif' }}>
                {dominant?.value}%
              </p>
            </>
          )}
        </div>
      </div>

      {/* Legend bars */}
      <div className="flex flex-col gap-3 mt-4">
        {distribution.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-xs" style={{ color: 'hsl(var(--foreground) / 0.6)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  {item.name}
                </span>
              </div>
              <motion.span
                key={item.value}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                className="text-xs font-bold"
                style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {item.value}%
              </motion.span>
            </div>
            {/* Progress bar */}
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: `${item.color}18` }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${item.color}aa, ${item.color})` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}