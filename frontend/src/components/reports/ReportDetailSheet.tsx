import { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Calendar, MapPin, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ReportRecord } from '@/lib/mockData'

// Color maps — same tokens used throughout the app for consistency
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

// Mock mitigation text — in production this comes from the backend
const MOCK_MITIGATION = {
  immediate_actions: 'Deploy emergency response teams to assess ground-level conditions. Activate early warning systems for vulnerable communities within a 50km radius. Coordinate with regional disaster management authorities to pre-position resources.',
  medium_term_strategy: 'Establish continuous satellite monitoring cadence for the affected zone. Engage with local agricultural extension services to implement adaptive farming practices. Review and update regional risk management frameworks based on observed trends.',
  long_term_resilience: 'Invest in climate-resilient infrastructure including drought-resistant crop varieties and improved irrigation systems. Develop community-based early warning networks that integrate satellite intelligence with ground-level observation. Build institutional capacity for ongoing climate risk assessment.',
}

interface ReportDetailSheetProps {
  report: ReportRecord | null
  isOpen: boolean
  onClose: () => void
  onDownloadPDF: () => void
  isGeneratingPDF: boolean
}

/**
 * forwardRef allows the parent (ReportsPage) to attach a ref to this
 * component's root DOM node. That ref is what html2canvas uses to know
 * *which* DOM element to screenshot when generating the PDF.
 * Without forwardRef, functional components can't receive refs from parents.
 */
export const ReportDetailSheet = forwardRef<HTMLDivElement, ReportDetailSheetProps>(
  ({ report, isOpen, onClose, onDownloadPDF, isGeneratingPDF }, ref) => {

    if (!report) return null

    const riskColor = RISK_COLORS[report.riskLevel]
    const typeColor = RISK_TYPE_COLORS[report.dominantRisk]

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay — clicking it closes the sheet */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0"
              style={{ background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
            />

            {/* Slide-in sheet — enters from the right side of the screen */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl overflow-y-auto"
              style={{
                background: 'var(--color-bg-base)',
                borderLeft: '1px solid var(--color-border)',
                zIndex: 201,
              }}
            >
              {/* ── Sheet Header (not part of PDF capture) ── */}
              <div
                className="sticky top-0 flex items-center justify-between px-6 py-4"
                style={{
                  background: 'var(--color-bg-base)',
                  borderBottom: '1px solid var(--color-border)',
                  zIndex: 10,
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
                >
                  Report Detail
                </p>
                <div className="flex items-center gap-2">
                  {/* Download PDF button */}
                  <button
                    onClick={onDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      background: 'rgba(245,158,11,0.15)',
                      border: '1px solid rgba(245,158,11,0.4)',
                      color: 'var(--color-amber)',
                      fontFamily: 'IBM Plex Mono, monospace',
                      opacity: isGeneratingPDF ? 0.6 : 1,
                    }}
                  >
                    <Download size={12} />
                    {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                  </button>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    <X size={14} style={{ color: 'var(--color-muted)' }} />
                  </button>
                </div>
              </div>

              {/*
                ── PDF Capture Zone ──
                Everything inside this div gets captured by html2canvas.
                The ref is forwarded here so the parent can target this node.
                We give it a solid background so the PDF doesn't have transparency issues.
              */}
              <div ref={ref} style={{ background: 'var(--color-bg-base)' }}>
                <div className="p-6 flex flex-col gap-6">

                  {/* ── Cover Section ── */}
                  <div
                    className="rounded-xl p-6"
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      backgroundImage: `radial-gradient(ellipse at top right, ${riskColor}15, transparent 60%)`,
                    }}
                  >
                    {/* Project logo header for PDF */}
                    <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--color-teal), var(--color-amber))' }}
                      >
                        <span style={{ fontSize: '10px' }}>🛰</span>
                      </div>
                      <span
                        className="text-xs font-bold tracking-wider uppercase"
                        style={{ color: 'var(--color-amber)', fontFamily: 'Syne, sans-serif' }}
                      >
                        ClimateRisk Intelligence
                      </span>
                    </div>

                    {/* Risk level badge */}
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                          background: `${riskColor}20`,
                          color: riskColor,
                          border: `1px solid ${riskColor}50`,
                          fontFamily: 'IBM Plex Mono, monospace',
                        }}
                      >
                        {report.riskLevel} Risk
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: `${typeColor}20`,
                          color: typeColor,
                          border: `1px solid ${typeColor}50`,
                          fontFamily: 'IBM Plex Mono, monospace',
                        }}
                      >
                        {report.dominantRisk}
                      </span>
                    </div>

                    <h3
                      className="text-xl font-bold mb-4"
                      style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
                    >
                      {report.filename}
                    </h3>

                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} style={{ color: 'var(--color-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                          {report.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} style={{ color: 'var(--color-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                          {format(new Date(report.analyzedAt), 'PPP')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Risk Score Visual ── */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                  >
                    <p
                      className="text-xs uppercase tracking-widest mb-3"
                      style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      Overall Risk Score
                    </p>

                    {/* Score bar visualization */}
                    <div className="flex items-center gap-4">
                      <span
                        className="text-4xl font-bold"
                        style={{ color: riskColor, fontFamily: 'Syne, sans-serif', minWidth: '60px' }}
                      >
                        {report.riskScore}
                      </span>
                      <div className="flex-1">
                        <div
                          className="h-3 rounded-full overflow-hidden"
                          style={{ background: 'var(--color-border)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${report.riskScore}%`,
                              background: `linear-gradient(to right, var(--color-emerald), ${riskColor})`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>0</span>
                          <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Mitigation Report ── */}
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    <div
                      className="px-5 py-3 flex items-center gap-2"
                      style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}
                    >
                      <AlertTriangle size={14} style={{ color: 'var(--color-amber)' }} />
                      <p
                        className="text-sm font-semibold"
                        style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
                      >
                        Mitigation Report
                      </p>
                    </div>

                    {/* Three mitigation sections rendered flat (not accordion) for PDF readability */}
                    {[
                      { label: 'Immediate Actions',      color: 'var(--color-red)',     content: MOCK_MITIGATION.immediate_actions      },
                      { label: 'Medium-term Strategy',   color: 'var(--color-amber)',   content: MOCK_MITIGATION.medium_term_strategy   },
                      { label: 'Long-term Resilience',   color: 'var(--color-emerald)', content: MOCK_MITIGATION.long_term_resilience   },
                    ].map((section, i) => (
                      <div
                        key={i}
                        className="px-5 py-4"
                        style={{ borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}
                      >
                        <p
                          className="text-xs font-semibold mb-2"
                          style={{ color: section.color, fontFamily: 'IBM Plex Mono, monospace' }}
                        >
                          {section.label}
                        </p>
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            color: 'hsl(var(--foreground))',
                            fontFamily: 'IBM Plex Mono, monospace',
                            fontSize: '12px',
                            lineHeight: '1.7',
                          }}
                        >
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ── Footer ── */}
                  <div className="text-center py-2">
                    <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                      Generated by ClimateRisk Intelligence Dashboard · {format(new Date(), 'PPP')}
                    </p>
                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }
)

// Display name helps React DevTools show a meaningful name for the forwardRef component
ReportDetailSheet.displayName = 'ReportDetailSheet'