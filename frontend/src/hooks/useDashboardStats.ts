import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { mockKPIs } from '@/lib/mockData'

interface DashboardStats {
  total_analyzed:          number
  active_high_risk_zones:  number
  average_risk_score:      number
  reports_generated:       number
}

/**
 * Fetches real aggregate statistics from the backend.
 * Falls back to mock data gracefully if the backend is offline.
 *
 * React Query handles caching, background refetching, and loading
 * states automatically — we just define what to fetch and it takes
 * care of the rest.
 */
export function useDashboardStats() {
  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn:  () => api.get('/images/stats/summary').then(r => r.data),
    // Refresh every 30 seconds so KPI numbers stay current
    refetchInterval: 30_000,
    // Don't retry more than once if the backend is offline
    retry: 1,
  })

  // If the query failed (backend offline), return mock data so the
  // dashboard still looks populated and functional
  const stats: DashboardStats = isError || !data
    ? {
        total_analyzed:          mockKPIs.totalAnalyzed,
        active_high_risk_zones:  mockKPIs.activeHighRiskZones,
        average_risk_score:      mockKPIs.averageRiskScore,
        reports_generated:       mockKPIs.reportsGenerated,
      }
    : data

  return { stats, isLoading: isLoading && !isError }
}