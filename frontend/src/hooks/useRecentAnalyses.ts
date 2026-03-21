import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'

interface FullReportRecord {
  id:          number
  filename:    string
  uploaded_at: string
  score:       number | null
  risk_level:  string
  risk_type:   string
  land_class:  string
}

// Normalize backend risk level string to our frontend type.
// The backend returns 'Low', 'Medium', 'High' with capital letters.
// Our frontend store expects lowercase 'low', 'medium', 'high'.
function normalizeRiskLevel(level: string): 'low' | 'medium' | 'high' {
  const l = level.toLowerCase()
  if (l === 'high')   return 'high'
  if (l === 'medium') return 'medium'
  return 'low'
}

// Extract a clean risk type label from the backend's verbose risk_type string.
// Backend returns strings like "Drought Vulnerability", "Wildfire Risk",
// "Carbon Sink", "Flood Risk" — we want just the primary word for the badge.
function extractRiskTypeLabel(riskType: string): string {
  if (riskType.includes('Drought'))       return 'Drought'
  if (riskType.includes('Flood'))         return 'Flood'
  if (riskType.includes('Wildfire'))      return 'Wildfire'
  if (riskType.includes('Deforestation')) return 'Deforestation'
  if (riskType.includes('Erosion'))       return 'Erosion'
  if (riskType.includes('Carbon'))        return 'Carbon Sink'
  if (riskType.includes('Pollution'))     return 'Pollution'
  if (riskType.includes('Heat'))          return 'Heat Island'
  if (riskType.includes('Crop'))          return 'Crop Disease'
  if (riskType.includes('Soil'))          return 'Soil Degradation'
  if (riskType.includes('Urban'))         return 'Urban Expansion'
  return riskType  // fallback: return as-is
}

export function useRecentAnalyses() {
  const { addLiveActivityEntry, clearLiveActivityEntries } = useAppStore()

  // Use the full reports endpoint which joins images with their
  // actual risk analysis results from the risk_scores table.
  // This gives us real risk_level and risk_type per image.
  const { data, isError, isSuccess } = useQuery<FullReportRecord[]>({
    queryKey: ['recent-analyses-full'],
    queryFn:  () => api.get('/images/reports/full?limit=8').then(r => r.data),
    retry: 1,
    refetchOnWindowFocus: false,
    // Refetch every 30 seconds so new uploads appear automatically
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!isSuccess || !data) return

    // Clear existing entries and replace with fresh data from backend.
    // We always replace rather than checking if empty, so the feed
    // stays accurate after uploads without requiring a page refresh.
    clearLiveActivityEntries()

    // data is already ordered newest-first from the backend (ORDER BY uploaded_at DESC).
    // We reverse before adding so that addLiveActivityEntry (which prepends)
    // results in the newest item at the top after all items are added.
    ;[...data].reverse().forEach((record) => {
      const riskLevel = normalizeRiskLevel(record.risk_level)

      // Derive confidence from the actual score — images with higher scores
      // are analyzed with higher "confidence" in the risk assessment.
      // We map score 0-100 to confidence range 65-95 for realistic display.
      const scoreMap = { low: 22, medium: 55, high: 82 }
      const score     = record.score ?? scoreMap[riskLevel]
      const confidence = Math.round(65 + (score / 100) * 30)

      addLiveActivityEntry({
        id:         `backend-${record.id}`,
        filename:   record.filename,
        // Use the actual risk type from the ML analysis result
        riskType:   extractRiskTypeLabel(record.risk_type),
        confidence,
        // Use the actual risk level from the ML analysis result
        riskLevel,
        timestamp:  new Date(record.uploaded_at),
        isLive:     false,
      })
    })
  }, [isSuccess, data])

  return { isBackendOnline: isSuccess && !isError }
}