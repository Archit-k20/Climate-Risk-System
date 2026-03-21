import { motion } from 'framer-motion'
import { Filter, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const RISK_LEVELS = ['low', 'medium', 'high'] as const
const RISK_TYPES  = ['Drought', 'Flood', 'Wildfire', 'Deforestation', 'Erosion'] as const

const LEVEL_COLORS = {
  low:    '#10b981',
  medium: '#f59e0b',
  high:   '#ef4444',
}

const TYPE_COLORS: Record<string, string> = {
  Drought:       '#f59e0b',
  Flood:         '#06b6d4',
  Wildfire:      '#ef4444',
  Deforestation: '#10b981',
  Erosion:       '#a78bfa',
}

export function MapFilterPanel() {
  const { mapFilters, setMapFilters } = useAppStore()

  // Toggle a risk level in/out of the active filter array
  const toggleLevel = (level: typeof RISK_LEVELS[number]) => {
    const current = mapFilters.riskLevels
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)    // remove if already selected
      : [...current, level]                   // add if not selected
    setMapFilters({ riskLevels: updated })
  }

  // Toggle a risk type in/out of the active filter array
  const toggleType = (type: string) => {
    const current = mapFilters.riskTypes
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    setMapFilters({ riskTypes: updated })
  }

  // Reset all filters to show everything
  const resetFilters = () => {
    setMapFilters({
      riskLevels: ['low', 'medium', 'high'],
      riskTypes:  ['Drought', 'Flood', 'Wildfire', 'Deforestation', 'Erosion'],
    })
  }

  const isFiltered =
    mapFilters.riskLevels.length < 3 || mapFilters.riskTypes.length < 5

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-xl p-4 w-56"
      // z-index 1000 keeps this above Leaflet's map tiles (z-index ~400)
      // but below our navbar (z-index 50 in Tailwind = z-50)
      style={{ zIndex: 1000 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: 'var(--color-amber)' }} />
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Filters
          </span>
        </div>
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
            style={{
              color: 'var(--color-amber)',
              fontFamily: 'IBM Plex Mono, monospace',
              background: 'rgba(245,158,11,0.1)',
            }}
          >
            <X size={10} /> Reset
          </button>
        )}
      </div>

      {/* Risk Level Filter */}
      <div className="mb-3">
        <p className="text-xs mb-2" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
          Risk Level
        </p>
        <div className="flex flex-col gap-1.5">
          {RISK_LEVELS.map((level) => {
            const isActive = mapFilters.riskLevels.includes(level)
            return (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all"
                style={{
                  background: isActive ? `${LEVEL_COLORS[level]}15` : 'transparent',
                  border: `1px solid ${isActive ? LEVEL_COLORS[level] + '50' : 'var(--color-border)'}`,
                  opacity: isActive ? 1 : 0.45,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: LEVEL_COLORS[level] }}
                />
                <span
                  className="text-xs capitalize"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  {level}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Risk Type Filter */}
      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
          Risk Type
        </p>
        <div className="flex flex-col gap-1.5">
          {RISK_TYPES.map((type) => {
            const isActive = mapFilters.riskTypes.includes(type)
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all"
                style={{
                  background: isActive ? `${TYPE_COLORS[type]}15` : 'transparent',
                  border: `1px solid ${isActive ? TYPE_COLORS[type] + '50' : 'var(--color-border)'}`,
                  opacity: isActive ? 1 : 0.45,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: TYPE_COLORS[type] }}
                />
                <span
                  className="text-xs"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  {type}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}