import { LayoutDashboard, AlertTriangle, BarChart3, FileCheck, Zap } from 'lucide-react'
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
  const REGIONS     = ['Sahel, Sudan', 'Amazon Basin', 'California, USA', 'Ganges Delta', 'Central Australia']
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
      region:      REGIONS[Math.floor(Math.random() * REGIONS.length)],
      analyzed_at: new Date().toISOString(),
    })
  }

  return (
    <button
      onClick={fireEvent}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95"
      style={{
        background: 'rgba(245,158,11,0.15)',
        border: '1px solid rgba(245,158,11,0.4)',
        color: 'var(--color-amber)',
        fontFamily: 'IBM Plex Mono, monospace',
      }}
    >
      <Zap size={14} />
      Simulate Live Event
    </button>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  // Fetch real stats from backend — falls back to mock data if offline
  const { stats, isLoading } = useDashboardStats()
  

  // KPI configuration now uses real data from the hook
  const KPI_CONFIGS = [
    {
      title:          'Total Analyzed',
      value:          stats.total_analyzed,
      icon:           <LayoutDashboard size={16} />,
      sparklineData:  mockSparklines.totalAnalyzed,
      sparklineColor: 'var(--color-teal)',
      accentColor:    'var(--color-teal)',
    },
    {
      title:          'High Risk Zones',
      value:          stats.active_high_risk_zones,
      icon:           <AlertTriangle size={16} />,
      sparklineData:  mockSparklines.activeHighRiskZones,
      sparklineColor: 'var(--color-red)',
      accentColor:    'var(--color-red)',
    },
    {
      title:          'Avg Risk Score',
      value:          stats.average_risk_score,
      suffix:         '%',
      icon:           <BarChart3 size={16} />,
      sparklineData:  mockSparklines.averageRiskScore,
      sparklineColor: 'var(--color-amber)',
      accentColor:    'var(--color-amber)',
    },
    {
      title:          'Reports Generated',
      value:          stats.reports_generated,
      icon:           <FileCheck size={16} />,
      sparklineData:  mockSparklines.reportsGenerated,
      sparklineColor: 'var(--color-emerald)',
      accentColor:    'var(--color-emerald)',
    },
  ]

  return (
    <PageTransition>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
          >
            Overview
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Real-time climate risk intelligence across all monitored regions
          </p>
        </div>
        <SimulateLiveEventButton />
      </div>

      <LiveUpdateBanner />
      <SystemStatusBar />

      {/* KPI Cards — show skeletons while loading, real cards when ready */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
          : KPI_CONFIGS.map((config, index) => (
              <KPICard key={config.title} {...config} index={index} />
            ))
        }
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          {isLoading
            ? <SkeletonCard lines={4} height="320px" />
            : <RiskDistributionChart />
          }
        </div>
        <div className="lg:col-span-2">
          {isLoading
            ? <SkeletonCard lines={5} height="320px" />
            : <RecentActivityFeed />
          }
        </div>
      </div>
    </PageTransition>
  )
}