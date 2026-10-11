export type RiskLevel = "low" | "medium" | "high";
export type AnalysisStatus =
  | "queued"
  | "running"
  | "completed"
  | "inconclusive"
  | "failed";
export interface AnalysisRecord {
  id: string;
  image_id: number;
  filename: string;
  uploaded_at: string;
  completed_at: string | null;
  status: AnalysisStatus;
  task_id?: string;
  land_class: string | null;
  risk_level: RiskLevel | null;
  risk_type: string | null;
  score: number | null;
  description: string | null;
  model_votes: Record<string, string> | null;
  model_agreement: number | null;
  model_version?: string | null;
  narrative: string | null;
  narrative_source: "gemini" | "template" | "sample" | null;
  narrative_reason: string | null;
  failure_reason: string | null;
  location: string | null;
  provenance: "model" | "legacy" | "demo";
}
export interface Summary {
  total_analyzed: number;
  active_high_risk_zones: number;
  average_risk_score: number | null;
  reports_generated: number;
}
