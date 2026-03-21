// These types define the "vocabulary" of our WebSocket communication.
// Think of them as the agreed-upon message formats between server and client.
// Every event the backend emits must match one of these shapes exactly.

// Fired when a new image analysis completes successfully.
// This is the primary event that updates the dashboard in real time.
export interface AnalysisCompleteEvent {
  image_id: number
  filename: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  risk_type: 'Drought' | 'Flood' | 'Wildfire' | 'Deforestation' | 'Erosion'
  confidence: number
  region?: string
  analyzed_at: string
}

// Fired when a high-risk zone is detected that warrants immediate attention.
// This is what triggers the LiveUpdateBanner at the top of the dashboard.
export interface RiskAlertEvent {
  alert_id: string
  region: string
  risk_type: string
  risk_level: 'medium' | 'high'
  risk_score: number
  message: string
  timestamp: string
}

// Fired periodically to update aggregate KPI statistics.
// Instead of recalculating KPIs on every analysis_complete event
// (which could cause rapid flickering), the server batches updates
// and sends this summary every few seconds.
export interface KPIUpdateEvent {
  total_analyzed: number
  active_high_risk_zones: number
  average_risk_score: number
  reports_generated: number
}

// The full map of event names to their payload types.
// This is used to make our useSocket hook type-safe —
// when you listen for 'analysis_complete', TypeScript knows
// exactly what shape the callback argument will have.
export interface ServerToClientEvents {
  analysis_complete: (data: AnalysisCompleteEvent) => void
  risk_alert:        (data: RiskAlertEvent) => void
  kpi_update:        (data: KPIUpdateEvent) => void
  connect:           () => void
  disconnect:        (reason: string) => void
}