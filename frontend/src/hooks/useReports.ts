import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { mockReports, ReportRecord } from '@/lib/mockData'

interface FullReportRecord {
  id:          number
  filename:    string
  uploaded_at: string
  score:       number | null
  risk_level:  string
  risk_type:   string
  land_class:  string
}

// Maps backend risk level string to frontend RiskLevel type
function normalizeRiskLevel(level: string): 'low' | 'medium' | 'high' {
  const normalized = level.toLowerCase()
  if (normalized === 'high')   return 'high'
  if (normalized === 'medium') return 'medium'
  return 'low'
}

// Maps risk type from backend to the dominantRisk field the UI expects
function normalizeDominantRisk(
  riskType: string
): 'Drought' | 'Flood' | 'Wildfire' | 'Deforestation' | 'Erosion' {
  if (riskType.includes('Flood'))         return 'Flood'
  if (riskType.includes('Drought'))       return 'Drought'
  if (riskType.includes('Wildfire'))      return 'Wildfire'
  if (riskType.includes('Deforestation')) return 'Deforestation'
  if (riskType.includes('Erosion'))       return 'Erosion'
  if (riskType.includes('Carbon'))        return 'Deforestation'
  if (riskType.includes('Pollution'))     return 'Erosion'
  if (riskType.includes('Heat'))          return 'Drought'
  if (riskType.includes('Crop'))          return 'Drought'
  if (riskType.includes('Soil'))          return 'Erosion'
  if (riskType.includes('Urban'))         return 'Erosion'
  return 'Drought'
}

function adaptFullReport(record: FullReportRecord, index: number): ReportRecord {
  const riskLevel = normalizeRiskLevel(record.risk_level)

  // Use the actual score from the database, or derive from risk level
  const scoreMap = { low: 22, medium: 55, high: 82 }
  const score = record.score ?? scoreMap[riskLevel]

  return {
    id:           String(record.id),
    filename:     record.filename,
    location:     mockReports[index % mockReports.length].location, // still mock until geocoding
    riskScore:    Math.round(score),
    riskLevel,
    dominantRisk: normalizeDominantRisk(record.risk_type),
    analyzedAt:   record.uploaded_at,
    starred:      false,
  }
}

export function useReports() {
  const { data, isLoading, isError, refetch } = useQuery<FullReportRecord[]>({
    queryKey: ['reports-full'],
    queryFn:  () => api.get('/images/reports/full').then(r => r.data),
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const reports: ReportRecord[] = isError || !data || data.length === 0
    ? mockReports
    : data.map((record, index) => adaptFullReport(record, index))

  return {
    reports,
    isLoading:        isLoading && !isError,
    isError,
    refetch,
    isUsingMockData:  isError || !data || data.length === 0,
  }
}