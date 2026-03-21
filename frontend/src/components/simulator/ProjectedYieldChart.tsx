import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { motion } from 'framer-motion'
import { MonthlyYieldPoint } from '@/types/simulator'

interface ProjectedYieldChartProps {
  data: MonthlyYieldPoint[]
  cropType: string
}

// Custom tooltip — we build this ourselves so it matches the dark theme
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        fontFamily: 'IBM Plex Mono, monospace',
      }}
    >
      <p className="mb-1 font-bold" style={{ color: 'hsl(var(--foreground))' }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()} kg/ha
        </p>
      ))}
    </div>
  )
}

export function ProjectedYieldChart({ data, cropType }: ProjectedYieldChartProps) {
  return (
    <motion.div
      // When data changes (parameters updated), the chart fades out and
      // back in smoothly instead of jarring to new values instantly
      key={JSON.stringify(data[0])}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl p-5"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Projected Yield — {cropType.charAt(0).toUpperCase() + cropType.slice(1)}
        </p>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: 'rgba(6,182,212,0.1)',
            color: 'var(--color-teal)',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          kg / hectare
        </span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />

          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--color-muted)', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: 'var(--color-muted)', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '11px',
              color: 'var(--color-muted)',
            }}
          />

          {/*
            The shaded area between the two lines is achieved by rendering
            an Area chart with the PROJECTED data and a fill gradient.
            The Area sits between the projected line and the X axis, but
            visually the gradient fades out quickly, so only the gap
            between the two lines appears prominently shaded.
          */}
          <Area
            type="monotone"
            dataKey="baseline"
            fill="rgba(6,182,212,0.08)"
            stroke="transparent"
            name="Baseline"
          />

          {/* Baseline line — steady teal reference line */}
          <Line
            type="monotone"
            dataKey="baseline"
            stroke="var(--color-teal)"
            strokeWidth={2}
            dot={false}
            name="Baseline"
            strokeDasharray="5 3"  // dashed to distinguish from projected
          />

          {/* Projected line — solid amber, shows simulated outcome */}
          <Line
            type="monotone"
            dataKey="projected"
            stroke="var(--color-amber)"
            strokeWidth={2.5}
            dot={false}
            name="Projected"
            isAnimationActive={true}
            animationDuration={400}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  )
}