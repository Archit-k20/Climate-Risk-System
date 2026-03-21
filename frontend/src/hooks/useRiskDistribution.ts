import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface DistributionResponse {
  low:    number
  medium: number
  high:   number
  total:  number
}

interface DistributionSlice {
  name:  string
  value: number   // percentage 0-100
  count: number   // raw count from database
  color: string
}

/**
 * Fetches the real risk distribution from the backend and converts
 * raw counts into percentages for the donut chart.
 *
 * Returns both isBackendOnline and the distribution data so the
 * chart can decide which data source to render.
 */
export function useRiskDistribution() {
  const { data, isError, isSuccess } = useQuery<DistributionResponse>({
    queryKey: ['risk-distribution'],
    queryFn:  () => api.get('/images/stats/distribution').then(r => r.data),
    retry: 1,
    // Refetch every 30 seconds so the chart stays current after new analyses
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  })

  const isBackendOnline = isSuccess && !isError

  // Convert raw counts to percentage slices for the chart.
  // We only compute this when backend data is available and
  // the database actually has records (total > 0).
  let backendDistribution: DistributionSlice[] | null = null

  if (isBackendOnline && data && data.total > 0) {
    const { low, medium, high, total } = data
    backendDistribution = [
      {
        name:  'Low Risk',
        value: Math.round((low    / total) * 100),
        count: low,
        color: '#10b981',
      },
      {
        name:  'Medium Risk',
        value: Math.round((medium / total) * 100),
        count: medium,
        color: '#f59e0b',
      },
      {
        name:  'High Risk',
        value: Math.round((high   / total) * 100),
        count: high,
        color: '#ef4444',
      },
    ]
  }

  return {
    isBackendOnline,
    hasData:             isBackendOnline && data ? data.total > 0 : false,
    backendDistribution,
    totalAnalyzed:       data?.total ?? 0,
  }
}