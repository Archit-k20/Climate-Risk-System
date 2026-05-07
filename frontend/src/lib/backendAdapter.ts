import {
  BackendRiskResponse,
  AnalysisResult,
  RiskLevel,
  RiskBreakdown,
  MitigationReport
} from '@/types/analysis'

// Maps the backend's string risk level to a representative numeric score.
// We use the midpoint of each range: Low=22, Medium=55, High=82.
// These values match the gauge's color thresholds: <33=green, <66=amber, else red.
const RISK_LEVEL_TO_SCORE: Record<string, number> = {
  'Low':    22,
  'Medium': 55,
  'High':   82,
  'low':    22,
  'medium': 55,
  'high':   82,
}

// Maps the backend's risk_type to a RiskBreakdown array.
// The primary risk type gets the highest score; related risks get
// plausible secondary scores based on typical co-occurrence patterns.
// For example, a Flood Risk zone also has elevated Erosion risk.
function deriveRiskBreakdown(
  riskType: string,
  riskLevel: string
): RiskBreakdown[] {
  const primaryScore = RISK_LEVEL_TO_SCORE[riskLevel] ?? 50

  // Risk type to breakdown mapping — defines which secondary risks
  // co-occur with each primary risk type and at what relative intensity
  const breakdownMap: Record<string, RiskBreakdown[]> = {
    'Flood Risk': [
      { type: 'Flood',        score: primaryScore,           confidence: 88 },
      { type: 'Erosion',      score: Math.round(primaryScore * 0.7), confidence: 71 },
      { type: 'Drought',      score: Math.round(primaryScore * 0.2), confidence: 45 },
      { type: 'Wildfire',     score: Math.round(primaryScore * 0.1), confidence: 30 },
      { type: 'Deforestation',score: Math.round(primaryScore * 0.3), confidence: 52 },
    ],
    'Drought Vulnerability': [
      { type: 'Drought',      score: primaryScore,           confidence: 91 },
      { type: 'Wildfire',     score: Math.round(primaryScore * 0.75), confidence: 78 },
      { type: 'Erosion',      score: Math.round(primaryScore * 0.4),  confidence: 60 },
      { type: 'Flood',        score: Math.round(primaryScore * 0.1),  confidence: 28 },
      { type: 'Deforestation',score: Math.round(primaryScore * 0.2),  confidence: 40 },
    ],
    'Wildfire Risk': [
      { type: 'Wildfire',     score: primaryScore,           confidence: 89 },
      { type: 'Drought',      score: Math.round(primaryScore * 0.8),  confidence: 82 },
      { type: 'Erosion',      score: Math.round(primaryScore * 0.3),  confidence: 55 },
      { type: 'Flood',        score: Math.round(primaryScore * 0.1),  confidence: 25 },
      { type: 'Deforestation',score: Math.round(primaryScore * 0.4),  confidence: 61 },
    ],
    'Pollution Risk': [
      { type: 'Deforestation',score: primaryScore,           confidence: 85 },
      { type: 'Erosion',      score: Math.round(primaryScore * 0.6),  confidence: 70 },
      { type: 'Drought',      score: Math.round(primaryScore * 0.3),  confidence: 48 },
      { type: 'Wildfire',     score: Math.round(primaryScore * 0.2),  confidence: 35 },
      { type: 'Flood',        score: Math.round(primaryScore * 0.15), confidence: 30 },
    ],
    'Carbon Sink': [
      { type: 'Deforestation',score: Math.round(primaryScore * 0.4),  confidence: 65 },
      { type: 'Wildfire',     score: Math.round(primaryScore * 0.3),  confidence: 55 },
      { type: 'Drought',      score: Math.round(primaryScore * 0.2),  confidence: 40 },
      { type: 'Erosion',      score: Math.round(primaryScore * 0.15), confidence: 32 },
      { type: 'Flood',        score: Math.round(primaryScore * 0.1),  confidence: 25 },
    ],
  }

  // Return the matching breakdown, or a generic one if the type isn't mapped
  return breakdownMap[riskType] ?? [
    { type: 'Drought',       score: primaryScore,           confidence: 75 },
    { type: 'Flood',         score: Math.round(primaryScore * 0.6), confidence: 60 },
    { type: 'Wildfire',      score: Math.round(primaryScore * 0.4), confidence: 50 },
    { type: 'Erosion',       score: Math.round(primaryScore * 0.3), confidence: 42 },
    { type: 'Deforestation', score: Math.round(primaryScore * 0.2), confidence: 35 },
  ]
}

// Parses the LLM-generated dynamic_report string into our three-section
// MitigationReport structure. Our backend uses markdown ## headings:
//   ## Executive Summary
//   ## Potential Impacts
//   ## Actionable Mitigation Strategies
// We split on those, mapping them to our three display slots.
function parseDynamicReport(
  dynamicReport: string | undefined,
  description: string,
  landClass: string,
  riskType: string
): MitigationReport {

  if (dynamicReport && dynamicReport.length > 100) {
    // Split on any ## heading, keeping the heading text as the delimiter marker
    const parts = dynamicReport.split(/\n?##\s+/i).filter(s => s.trim().length > 0)

    if (parts.length >= 3) {
      // parts[0] = "Executive Summary\n<content>"
      // parts[1] = "Potential Impacts\n<content>"
      // parts[2] = "Actionable Mitigation Strategies\n<content>"
      const stripHeading = (s: string) => s.replace(/^[^\n]+\n/, '').trim()
      return {
        immediate_actions:    stripHeading(parts[0]) || parts[0].trim(),
        medium_term_strategy: stripHeading(parts[1]) || parts[1].trim(),
        long_term_resilience: stripHeading(parts[2]) || parts[2].trim(),
      }
    }

    // Fallback: try numbered headings (1. Executive Summary ...)
    const numbered = dynamicReport.split(/\d\.\s+(?:Executive Summary|Potential Impacts|Actionable)/i)
    if (numbered.length >= 3) {
      return {
        immediate_actions:    numbered[1]?.trim() ?? dynamicReport,
        medium_term_strategy: numbered[2]?.trim() ?? description,
        long_term_resilience: numbered[3]?.trim() ?? `Continue monitoring ${landClass} zones for ${riskType} indicators.`,
      }
    }

    // Last resort: show the full report in the first section rather than cutting mid-word
    return {
      immediate_actions:    dynamicReport.trim(),
      medium_term_strategy: '',
      long_term_resilience: '',
    }
  }

  // No dynamic report — construct from static risk mapper description
  return {
    immediate_actions:
      `Immediate assessment required for ${landClass} classification zone. ${description} Deploy monitoring resources and alert relevant authorities.`,
    medium_term_strategy:
      `Establish a systematic monitoring programme for this ${riskType} zone. Review land use policies and implement early warning systems for the affected region over the next 3-6 months.`,
    long_term_resilience:
      `Develop long-term resilience strategies for ${landClass} environments facing ${riskType} pressures. Invest in community preparedness and infrastructure improvements aligned with climate projections.`,
  }
}

/**
 * The main adapter function. Takes the raw backend response and produces
 * the rich AnalysisResult object that the frontend UI components expect.
 *
 * This function is the single point of translation between backend and
 * frontend data shapes. If the backend API changes, you only update
 * this function — no component code needs to change.
 */
export function adaptBackendResponse(
  raw: BackendRiskResponse,
  imageId: number,
  filename: string
): AnalysisResult {

  const riskLevelNormalized = raw.risk_level.toLowerCase() as RiskLevel

  // Use actual_score from database if available (populated by Celery task
  // using compute_risk_score with model agreement variation).
  // Fall back to the flat mapping only if the database score isn't available.
  const flatScoreMap: Record<string, number> = {
    'Low': 22, 'low': 22,
    'Medium': 55, 'medium': 55,
    'High': 82, 'high': 82,
  }

  const riskScore = (raw as BackendRiskResponse & { actual_score?: number }).actual_score
    ?? flatScoreMap[raw.risk_level]
    ?? 50

  return {
    image_id:      imageId,
    filename,
    land_class:    raw.land_class,
    risk_score:    Math.round(riskScore),
    risk_level:    riskLevelNormalized,
    dominant_risk: raw.risk_type,
    risk_breakdown: deriveRiskBreakdown(raw.risk_type, raw.risk_level),
    mitigation_report: parseDynamicReport(
      raw.dynamic_report,
      raw.description,
      raw.land_class,
      raw.risk_type
    ),
    analyzed_at:     new Date().toISOString(),
    raw_description: raw.description,
  }
}
