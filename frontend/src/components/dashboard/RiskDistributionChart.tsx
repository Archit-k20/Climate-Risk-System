import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { mockRiskDistribution } from '@/lib/mockData'
import { useAppStore } from '@/store/useAppStore'
import { useRiskDistribution } from '@/hooks/useRiskDistribution'

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { count?: number } }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        fontFamily: 'IBM Plex Mono, monospace',
        color: 'hsl(var(--foreground))',
      }}
    >
      <p>{payload[0].name}</p>
      <p style={{ color: 'var(--color-amber)' }}>{payload[0].value}%</p>
      {/* Show raw count when available (real backend data) */}
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
  const {
    isBackendOnline,
    hasData,
    backendDistribution,
  } = useRiskDistribution()

  // ── Determine which data source to use ───────────────────────────────────
  //
  // Priority order:
  // 1. Real backend data (when backend is online AND database has records)
  // 2. Live notification-based distribution (when backend is online but
  //    database is empty — this covers the period between app start and
  //    first analysis completing)
  // 3. Mock data (when backend is completely offline)
  //
  // This three-tier approach ensures the chart always shows something
  // meaningful regardless of the system state.

  const distribution = useMemo(() => {
    // Tier 1: Real database data — most accurate, use when available
    if (isBackendOnline && hasData && backendDistribution) {
      return backendDistribution
    }

    // Tier 2: Backend is online but no database records yet.
    // Count from live WebSocket notifications accumulated this session.
    if (isBackendOnline && !hasData) {
      const counts = { low: 0, medium: 0, high: 0 }
      notifications.forEach(n => {
        if (n.type === 'danger')  counts.high   += 1
        if (n.type === 'warning') counts.medium += 1
        if (n.type === 'success') counts.low    += 1
      })
      const total = counts.low + counts.medium + counts.high

      // If no notifications either, return equal zero state
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

    // Tier 3: Backend offline — use mock baseline with live session events
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

  // The dominant slice is the one with the highest percentage.
  // When all values are 0 (empty database), we show a neutral state.
  const allZero  = distribution.every(d => d.value === 0)
  const dominant = allZero
    ? null
    : distribution.reduce((a, b) => a.value > b.value ? a : b)

  // When the database is empty, show a uniform grey placeholder ring
  // instead of trying to render a 0/0/0 donut (which would be invisible)
  const chartData = allZero
    ? [{ name: 'No data', value: 100, color: 'var(--color-border)' }]
    : distribution

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header with data source indicator */}
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Risk Distribution
        </p>
        {/* Small badge showing whether we're using real or mock data */}
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: isBackendOnline
              ? 'rgba(16,185,129,0.15)'
              : 'rgba(74,85,104,0.2)',
            color: isBackendOnline
              ? 'var(--color-emerald)'
              : 'var(--color-muted)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '10px',
          }}
        >
          {isBackendOnline ? 'Live Data' : 'Demo Data'}
        </span>
      </div>

      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={allZero ? 0 : 3}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={600}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                  strokeWidth={0}
                />
              ))}
            </Pie>
            {!allZero && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {allZero ? (
            // Empty state center label
            <p
              className="text-xs text-center px-4"
              style={{
                color: 'var(--color-muted)',
                fontFamily: 'IBM Plex Mono, monospace',
                lineHeight: '1.5',
              }}
            >
              Upload images to see distribution
            </p>
          ) : (
            // Normal dominant risk label
            <>
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
              >
                Dominant
              </p>
              <p
                className="text-sm font-bold risk-pulse"
                style={{ color: dominant?.color, fontFamily: 'Syne, sans-serif' }}
              >
                {dominant?.name}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Legend with live percentages and raw counts */}
      <div className="flex flex-col gap-2 mt-2">
        {distribution.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: item.color }}
              />
              <span
                className="text-xs"
                style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Show raw image count when using real backend data */}
              {'count' in item && item.count !== undefined && (
                <span
                  className="text-xs"
                  style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  {item.count}
                </span>
              )}
              <motion.span
                key={item.value}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-xs font-semibold"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                {item.value}%
              </motion.span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}