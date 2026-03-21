import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Copy, Zap, TrendingUp, Shield } from 'lucide-react'
import { MitigationReport } from '@/types/analysis'
import toast from 'react-hot-toast'

interface MitigationReportCardProps {
  report: MitigationReport
}

// Each accordion section has its own icon and color for visual identity
const SECTIONS = [
  {
    key: 'immediate_actions' as keyof MitigationReport,
    label: 'Immediate Actions',
    icon: Zap,
    color: 'var(--color-red)',
    description: 'Actions to take within 72 hours',
  },
  {
    key: 'medium_term_strategy' as keyof MitigationReport,
    label: 'Medium-term Strategy',
    icon: TrendingUp,
    color: 'var(--color-amber)',
    description: '1–6 month intervention plan',
  },
  {
    key: 'long_term_resilience' as keyof MitigationReport,
    label: 'Long-term Resilience',
    icon: Shield,
    color: 'var(--color-emerald)',
    description: '12+ month resilience building',
  },
]

export function MitigationReportCard({ report }: MitigationReportCardProps) {
  // Track which accordion section is open. null = all closed.
  const [openSection, setOpenSection] = useState<keyof MitigationReport | null>(
    'immediate_actions' // open the most urgent section by default
  )

  const copyToClipboard = () => {
    const text = [
      `IMMEDIATE ACTIONS:\n${report.immediate_actions}`,
      `\nMEDIUM-TERM STRATEGY:\n${report.medium_term_strategy}`,
      `\nLONG-TERM RESILIENCE:\n${report.long_term_resilience}`,
    ].join('\n')
    navigator.clipboard.writeText(text)
    toast.success('Report copied to clipboard')
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}
      >
        <p
          className="text-sm font-semibold"
          style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
        >
          Mitigation Report
        </p>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/10"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          <Copy size={12} />
          Copy
        </button>
      </div>

      {/* ── Accordion Sections ── */}
      {SECTIONS.map((section) => {
        const Icon = section.icon
        const isOpen = openSection === section.key
        const content = report[section.key]

        return (
          <div
            key={section.key}
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            {/* Section header / toggle button */}
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/3"
              onClick={() => setOpenSection(isOpen ? null : section.key)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${section.color}20` }}
                >
                  <Icon size={14} style={{ color: section.color }} />
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    {section.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Rotating chevron indicates open/closed state */}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={16} style={{ color: 'var(--color-muted)' }} />
              </motion.div>
            </button>

            {/* Expandable content area */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    className="px-5 pb-4 pt-1"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: 'hsl(var(--foreground))',
                        fontFamily: 'IBM Plex Mono, monospace',
                        fontSize: '13px',
                        lineHeight: '1.7',
                      }}
                    >
                      {content}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}