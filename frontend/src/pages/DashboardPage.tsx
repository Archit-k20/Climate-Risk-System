import { ElementType } from 'react'
import { LayoutDashboard, AlertTriangle, BarChart3, FileCheck, Zap, Globe, Thermometer, Wind } from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { KPICard } from '@/components/dashboard/KPICard'
import { RiskDistributionChart } from '@/components/dashboard/RiskDistributionChart'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { SystemStatusBar } from '@/components/dashboard/SystemStatusBar'
import { LiveUpdateBanner } from '@/components/dashboard/LiveUpdateBanner'
import { KPICardSkeleton } from '@/components/ui/KPICardSkeleton'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { useSocket } from '@/providers/WebSocketProvider'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { mockSparklines } from '@/lib/mockData'


// ── Simulate Live Event Button ────────────────────────────────────────────────
function SimulateLiveEventButton() {
  const { simulateEvent } = useSocket()

  const RISK_TYPES  = ['Drought', 'Flood', 'Wildfire', 'Deforestation', 'Erosion']
  const RISK_LEVELS = ['low', 'medium', 'high'] as const
  const FILENAMES   = ['sahel_survey_new.jpg', 'amazon_patch_08.jpg', 'sierra_scan_04.jpg', 'delta_image_03.jpg']

  const fireEvent = () => {
    const riskLevel = RISK_LEVELS[Math.floor(Math.random() * RISK_LEVELS.length)]
    simulateEvent('analysis_complete', {
      image_id:    Math.floor(Math.random() * 1000),
      filename:    FILENAMES[Math.floor(Math.random() * FILENAMES.length)],
      risk_score:  riskLevel === 'high'   ? 70 + Math.floor(Math.random() * 30)
                 : riskLevel === 'medium' ? 35 + Math.floor(Math.random() * 30)
                 : Math.floor(Math.random() * 30),
      risk_level:  riskLevel,
      risk_type:   RISK_TYPES[Math.floor(Math.random() * RISK_TYPES.length)],
      confidence:  65 + Math.floor(Math.random() * 30),
      analyzed_at: new Date().toISOString(),
    })
  }

  return (
    <button
      onClick={fireEvent}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90 active:scale-95"
      style={{
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.3)',
        color: 'var(--color-amber)',
        fontFamily: 'IBM Plex Mono, monospace',
      }}
    >
      <Zap size={12} />
      Simulate Event
    </button>
  )
}

// ── Climate Stat Pill ─────────────────────────────────────────────────────────
function ClimatePill({ icon: Icon, label, value, color }: {
  icon: ElementType
  label: string
  value: string
  color: string
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: `${color}12`, border: `1px solid ${color}25` }}
    >
      <Icon size={11} style={{ color }} />
      <span className="text-xs" style={{ color: 'hsl(var(--foreground) / 0.5)', fontFamily: 'IBM Plex Mono, monospace' }}>
        {label}
      </span>
      <span className="text-xs font-bold" style={{ color, fontFamily: 'IBM Plex Mono, monospace' }}>
        {value}
      </span>
    </div>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { stats, isLoading } = useDashboardStats()

  const KPI_CONFIGS = [
    {
      title:          'Images Analyzed',
      value:          stats.total_analyzed,
      icon:           <LayoutDashboard size={15} />,
      sparklineData:  mockSparklines.totalAnalyzed,
      sparklineColor: 'var(--color-teal)',
      accentColor:    'var(--color-teal)',
    },
    {
      title:          'High Risk Zones',
      value:          stats.active_high_risk_zones,
      icon:           <AlertTriangle size={15} />,
      sparklineData:  mockSparklines.activeHighRiskZones,
      sparklineColor: 'var(--color-red)',
      accentColor:    'var(--color-red)',
    },
    {
      title:          'Avg Risk Score',
      value:          stats.average_risk_score,
      suffix:         '%',
      icon:           <BarChart3 size={15} />,
      sparklineData:  mockSparklines.averageRiskScore,
      sparklineColor: 'var(--color-amber)',
      accentColor:    'var(--color-amber)',
    },
    {
      title:          'Reports Generated',
      value:          stats.reports_generated,
      icon:           <FileCheck size={15} />,
      sparklineData:  mockSparklines.reportsGenerated,
      sparklineColor: 'var(--color-emerald)',
      accentColor:    'var(--color-emerald)',
    },
  ]

  return (
    <PageTransition>
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} style={{ color: 'var(--color-teal)' }} />
            <span
              className="text-xs uppercase tracking-[0.15em]"
              style={{ color: 'var(--color-teal)', fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Climate Intelligence Platform
            </span>
          </div>
          <h2
            className="text-3xl font-black"
            style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
          >
            Risk Overview
          </h2>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Real-time satellite analysis across all monitored regions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Climate context pills */}
          <ClimatePill icon={Thermometer} label="CO₂" value="+2.1°C" color="var(--color-amber)" />
          <ClimatePill icon={Wind} label="Events" value="↑ 34%" color="var(--color-red)" />
          <SimulateLiveEventButton />
        </div>
      </div>

      {/* ── System Status ─────────────────────────────────────────────────── */}
      <SystemStatusBar />
      <LiveUpdateBanner />

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
          : KPI_CONFIGS.map((config, index) => (
              <KPICard key={config.title} {...config} index={index} />
            ))
        }
      </div>

      {/* ── Bottom Row: Chart + Feed ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Risk donut chart */}
        <div className="lg:col-span-2">
          {isLoading
            ? <SkeletonCard lines={4} height="360px" />
            : <RiskDistributionChart />
          }
        </div>
        {/* Recent analysis feed */}
        <div className="lg:col-span-3">
          {isLoading
            ? <SkeletonCard lines={5} height="360px" />
            : <RecentActivityFeed />
          }
        </div>
      </div>
    </PageTransition>
  )
}