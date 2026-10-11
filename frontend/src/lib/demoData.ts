import type { AnalysisRecord, RiskLevel, Summary } from "@/types/analysis";
const samples: [string, string, RiskLevel, string][] = [
  ["river_basin_01.jpg", "River", "high", "Flood Risk"],
  ["forest_canopy_02.jpg", "Forest", "low", "Carbon Sink"],
  ["annual_crop_03.jpg", "AnnualCrop", "medium", "Drought Vulnerability"],
  ["industrial_area_04.jpg", "Industrial", "high", "Pollution Risk"],
  ["pasture_05.jpg", "Pasture", "low", "Soil Degradation"],
  ["residential_06.jpg", "Residential", "medium", "Urban Expansion"],
];
export const demoReports: AnalysisRecord[] = samples.map(
  ([filename, land, level, risk], index) => ({
    id: `sample-${index + 1}`,
    image_id: index + 1,
    filename,
    uploaded_at: `2026-04-${20 - index}T09:00:00Z`,
    completed_at: `2026-04-${20 - index}T09:01:00Z`,
    status: "completed",
    land_class: land,
    risk_level: level,
    risk_type: risk,
    score: { low: 22, medium: 55, high: 82 }[level],
    location: null,
    model_votes: null,
    model_agreement: null,
    provenance: "demo",
    narrative_source: "sample",
    narrative_reason: null,
    failure_reason: null,
    description:
      "An illustrative land-cover classification and rule-based risk mapping. No model was run for this sample.",
    narrative: `## Executive Summary\nThis sample illustrates a ${land} classification and a ${level} heuristic index for ${risk}. It is not a measured assessment of an actual location.\n\n## Potential Impacts\nThe example demonstrates how a land-cover category is associated with an environmental concern. Local exposure and historical conditions would require independent verification.\n\n## Actionable Mitigation Strategies\n- Verify land cover with local observations.\n- Review relevant environmental and historical data.\n- Discuss adaptation options with qualified local specialists.`,
  }),
);
export const demoSummary: Summary = {
  total_analyzed: demoReports.length,
  active_high_risk_zones: demoReports.filter((r) => r.risk_level === "high")
    .length,
  average_risk_score:
    Math.round(
      (demoReports.reduce((sum, r) => sum + r.score!, 0) / demoReports.length) *
        10,
    ) / 10,
  reports_generated: demoReports.length,
};
