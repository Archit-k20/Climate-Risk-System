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

/**
 * Renders a markdown string as structured React elements.
 * Supports: **bold**, *italic*, bullet points (• or -), and plain paragraphs.
 * This avoids needing a full markdown library dependency.
 */
function MarkdownContent({ text }: { text: string }) {
  if (!text) return null

  const lines = text.split('\n')

  const renderInline = (str: string) => {
    // Handle **bold** and *italic* inline
    const parts: React.ReactNode[] = []
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index))
      }
      if (match[2]) {
        parts.push(<strong key={match.index} style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{match[2]}</strong>)
      } else if (match[3]) {
        parts.push(<em key={match.index}>{match[3]}</em>)
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < str.length) parts.push(str.slice(lastIndex))
    return parts
  }

  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) { i++; continue }

    // Bullet points: lines starting with •, -, or *
    if (/^[•\-\*]\s/.test(line)) {
      const bulletLines: string[] = []
      while (i < lines.length && /^[•\-\*]\s/.test(lines[i].trim())) {
        bulletLines.push(lines[i].trim().replace(/^[•\-\*]\s+/, ''))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '8px 0', paddingLeft: '0', listStyle: 'none' }}>
          {bulletLines.map((b, bi) => (
            <li key={bi} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--color-emerald)', marginTop: '2px', flexShrink: 0 }}>›</span>
              <span style={{ lineHeight: '1.6' }}>{renderInline(b)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Skip ## headings (already shown in the accordion header)
    if (line.startsWith('##')) { i++; continue }

    // Italicized notice lines (wrapped in *)
    if (line.startsWith('*(') && line.endsWith(')*')) {
      elements.push(
        <p key={`notice-${i}`} style={{
          marginTop: '12px',
          fontSize: '11px',
          color: 'var(--color-muted)',
          fontStyle: 'italic',
          opacity: 0.7,
          lineHeight: '1.5',
        }}>
          {line.slice(2, -2)}
        </p>
      )
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} style={{ margin: '0 0 8px 0', lineHeight: '1.7' }}>
        {renderInline(line)}
      </p>
    )
    i++
  }

  return <>{elements}</>
}

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

        // Don't render empty sections (e.g. when full report is in first section)
        if (!content) return null

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
                    className="px-5 pb-5 pt-2"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      fontSize: '13px',
                      color: 'hsl(var(--foreground) / 0.85)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <MarkdownContent text={content} />
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