// These types now precisely match your FastAPI backend's Pydantic schemas.
// Every field name here must match what the backend actually returns —
// if there's a mismatch, you'll get undefined values with no error.

export type RiskLevel = 'low' | 'medium' | 'high'

export type ProcessingStep =
  | 'idle'
  | 'uploading'
  | 'preprocessing'
  | 'analyzing'
  | 'generating_report'
  | 'complete'
  | 'error'

// Matches your backend's ImageResponse Pydantic schema exactly
export interface ImageUploadResponse {
  id: number
  filename: string
  file_path: string
  uploaded_at: string
}

// Matches your backend's RiskAssessmentResponse Pydantic schema exactly.
// Note: the backend returns land_class, risk_level, risk_type, description —
// NOT a numeric risk_score. We derive the numeric score from risk_level
// in the frontend adapter function below.
export interface BackendRiskResponse {
  land_class:   string   // e.g. "Forest", "SeaLake", "Industrial"
  risk_level:   string   // e.g. "High", "Medium", "Low"
  risk_type:    string   // e.g. "Flood Risk", "Carbon Sink"
  description:  string   // e.g. "Water bodies can overflow..."
  dynamic_report?: string // Optional LLM-generated report from Celery task
}

// The shape of the Celery task status response
export interface TaskStatusResponse {
  status: 'Pending' | 'Completed' | 'Failed' | string
  result?: BackendRiskResponse
  details?: string
}

// The frontend's internal representation of a completed analysis.
// This is what our UI components work with — it's richer than the
// raw backend response because we derive additional fields like
// numeric risk_score and structured risk_breakdown from the raw data.
export interface AnalysisResult {
  image_id:         number
  filename:         string
  land_class:       string
  risk_score:       number   // derived: High=82, Medium=55, Low=22
  risk_level:       RiskLevel
  dominant_risk:    string
  risk_breakdown:   RiskBreakdown[]
  mitigation_report: MitigationReport
  analyzed_at:      string
  raw_description:  string   // the original description from risk_mapper
}

export interface RiskBreakdown {
  type:       'Drought' | 'Flood' | 'Wildfire' | 'Deforestation' | 'Erosion'
  score:      number
  confidence: number
}

export interface MitigationReport {
  immediate_actions:    string
  medium_term_strategy: string
  long_term_resilience: string
}

export interface StepperStep {
  key:         ProcessingStep
  label:       string
  description: string
}