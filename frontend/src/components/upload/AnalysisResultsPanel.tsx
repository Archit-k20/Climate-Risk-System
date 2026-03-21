import { motion } from 'framer-motion'
import { AnalysisResult } from '@/types/analysis'
import { RiskScoreGauge } from './RiskScoreGauge'
import { RiskTypeBreakdown } from './RiskTypeBreakdown'
import { MitigationReportCard } from './MitigationReportCard'
import { CheckCircle2, Clock } from 'lucide-react'

interface AnalysisResultsPanelProps {
  result: AnalysisResult
}

export function AnalysisResultsPanel({ result }: AnalysisResultsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col gap-6"
    >
      {/* ── Success Banner ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        <CheckCircle2 size={18} style={{ color: 'var(--color-emerald)' }} />
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: 'var(--color-emerald)', fontFamily: 'Syne, sans-serif' }}
          >
            Analysis Complete
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {result.filename} — processed successfully
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Clock size={12} style={{ color: 'var(--color-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {new Date(result.analyzed_at).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* ── Top Row: Gauge + Breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Score Gauge */}
        <div
          className="rounded-xl p-6 flex flex-col items-center justify-center"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <RiskScoreGauge
            score={result.risk_score}
            riskLevel={result.risk_level}
          />
        </div>

        {/* Risk Type Breakdown bars */}
        <div
          className="rounded-xl p-6"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <RiskTypeBreakdown breakdown={result.risk_breakdown} />
        </div>
      </div>

      {/* ── Mitigation Report ── */}
      <MitigationReportCard report={result.mitigation_report} />
    </motion.div>
  )
}