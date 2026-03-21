import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Search, Eye, Download, Star
} from 'lucide-react'
import { ReportRecord } from '@/lib/mockData'
import { EmptyState } from '@/components/ui/EmptyState'


interface ReportsTableProps {
  reports: ReportRecord[]
  onViewReport: (report: ReportRecord) => void
  onDownloadPDF: (report: ReportRecord) => void
}

// Which column is currently being sorted, and in which direction
type SortKey = 'analyzedAt' | 'riskScore' | 'filename' | 'location'
type SortDir = 'asc' | 'desc'

const RISK_COLORS = {
  low:    'var(--color-emerald)',
  medium: 'var(--color-amber)',
  high:   'var(--color-red)',
}

const RISK_TYPE_COLORS: Record<string, string> = {
  Drought:       '#f59e0b',
  Flood:         '#06b6d4',
  Wildfire:      '#ef4444',
  Deforestation: '#10b981',
  Erosion:       '#a78bfa',
}

export function ReportsTable({ reports, onViewReport, onDownloadPDF }: ReportsTableProps) {
  const [search,   setSearch]   = useState('')
  const [sortKey,  setSortKey]  = useState<SortKey>('analyzedAt')
  const [sortDir,  setSortDir]  = useState<SortDir>('desc')
  const [levelFilter, setLevelFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')

  // Handle clicking a column header — if already sorting by this column,
  // toggle direction. Otherwise switch to this column descending.
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  // useMemo: only re-filter and re-sort when the dependencies actually change,
  // not on every render. This keeps the table fast even with many records.
  const processedReports = useMemo(() => {
    let result = [...reports]

    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.filename.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.dominantRisk.toLowerCase().includes(q)
      )
    }

    // Apply risk level filter
    if (levelFilter !== 'all') {
      result = result.filter(r => r.riskLevel === levelFilter)
    }

    // Apply sort
    result.sort((a, b) => {
      let aVal: string | number = a[sortKey]
      let bVal: string | number = b[sortKey]

      // For dates, compare as timestamps
      if (sortKey === 'analyzedAt') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [reports, search, levelFilter, sortKey, sortDir])

  // Renders the sort indicator icon for a column header
  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronsUpDown size={12} style={{ color: 'var(--color-muted)' }} />
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ color: 'var(--color-amber)' }} />
      : <ChevronDown size={12} style={{ color: 'var(--color-amber)' }} />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Controls Bar: search + filter ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search box */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-48"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <Search size={13} style={{ color: 'var(--color-muted)' }} />
          <input
            type="text"
            placeholder="Search by filename, location, or risk type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-xs w-full"
            style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
          />
        </div>

        {/* Risk level filter buttons */}
        <div className="flex items-center gap-1">
          {(['all', 'high', 'medium', 'low'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className="px-3 py-1.5 rounded-lg text-xs capitalize transition-all"
              style={{
                background: levelFilter === level
                  ? level === 'all' ? 'rgba(245,158,11,0.15)' : `${RISK_COLORS[level as 'low'|'medium'|'high']}20`
                  : 'transparent',
                border: `1px solid ${levelFilter === level
                  ? level === 'all' ? 'var(--color-amber)' : RISK_COLORS[level as 'low'|'medium'|'high']
                  : 'var(--color-border)'}`,
                color: levelFilter === level
                  ? level === 'all' ? 'var(--color-amber)' : RISK_COLORS[level as 'low'|'medium'|'high']
                  : 'var(--color-muted)',
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
          {processedReports.length} of {reports.length} reports
        </span>
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        {/* Table header */}
        <div
          className="grid gap-3 px-4 py-3 text-xs uppercase tracking-wider"
          style={{
            gridTemplateColumns: '1fr 1fr 80px 100px 80px 90px',
            background: 'var(--color-bg-card)',
            borderBottom: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          {/* Sortable column headers */}
          {([
            { key: 'filename',   label: 'Filename'  },
            { key: 'location',   label: 'Location'  },
            { key: 'riskScore',  label: 'Score'     },
            { key: 'analyzedAt', label: 'Date'      },
          ] as { key: SortKey; label: string }[]).map(col => (
            <button
              key={col.key}
              onClick={() => handleSort(col.key)}
              className="flex items-center gap-1 text-left hover:opacity-80 transition-opacity"
            >
              {col.label}
              <SortIcon column={col.key} />
            </button>
          ))}
          <span>Risk Type</span>
          <span>Actions</span>
        </div>

        {/* Table rows */}
        {processedReports.length === 0 ? (
        <div style={{ background: 'var(--color-bg-card)' }}>
          <EmptyState
            icon={<Search size={24} style={{ color: 'var(--color-muted)' }} />}
            title="No reports found"
            description={
              search
                ? `No reports match "${search}". Try a different search term or clear the filters.`
                : `No reports match the current filters. Try selecting different risk levels.`
            }
          />
        </div>
      ) : (
          processedReports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              // Stagger: each row enters 40ms after the previous
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="grid gap-3 px-4 py-3 items-center transition-colors hover:bg-white/3"
              style={{
                gridTemplateColumns: '1fr 1fr 80px 100px 80px 90px',
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
              onClick={() => onViewReport(report)}
            >
              {/* Filename + starred indicator */}
              <div className="flex items-center gap-2 min-w-0">
                {report.starred && (
                  <Star size={10} style={{ color: 'var(--color-amber)', flexShrink: 0 }} fill="var(--color-amber)" />
                )}
                <span
                  className="text-xs truncate"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  {report.filename}
                </span>
              </div>

              {/* Location */}
              <span
                className="text-xs truncate"
                style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {report.location}
              </span>

              {/* Risk score with color */}
              <span
                className="text-xs font-bold"
                style={{ color: RISK_COLORS[report.riskLevel], fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {report.riskScore}
                <span style={{ color: 'var(--color-muted)', fontWeight: 'normal' }}>/100</span>
              </span>

              {/* Date */}
              <span
                className="text-xs"
                style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {format(new Date(report.analyzedAt), 'MMM d, yyyy')}
              </span>

              {/* Risk type badge */}
              <span
                className="text-xs px-2 py-0.5 rounded-full text-center"
                style={{
                  background: `${RISK_TYPE_COLORS[report.dominantRisk]}20`,
                  color: RISK_TYPE_COLORS[report.dominantRisk],
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '10px',
                }}
              >
                {report.dominantRisk}
              </span>

              {/* Action buttons — stop propagation so clicking buttons
                  doesn't also trigger the row's onClick (which opens the sheet) */}
              <div
                className="flex items-center gap-1"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => onViewReport(report)}
                  className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                  title="View report"
                >
                  <Eye size={13} style={{ color: 'var(--color-muted)' }} />
                </button>
                <button
                  onClick={() => onDownloadPDF(report)}
                  className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                  title="Download PDF"
                >
                  <Download size={13} style={{ color: 'var(--color-muted)' }} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}