import type { AnalysisRecord } from "@/types/analysis";
export function reportFields(report: AnalysisRecord): [string, string][] {
  return [
    ["Classification", report.land_class ?? "Unknown"],
    ["Risk type", report.risk_type ?? "Unknown"],
    ["Risk level", report.risk_level ?? "Unknown"],
    ["Location", report.location ?? "Not recorded"],
    [
      "Analyzed",
      report.completed_at
        ? new Date(report.completed_at).toLocaleString()
        : "Not recorded",
    ],
    [
      "Model agreement",
      report.model_agreement === null
        ? "Not available"
        : `${report.model_agreement}/3 models`,
    ],
    ["Narrative source", report.narrative_source ?? "Not recorded"],
    [
      "Record source",
      report.provenance === "legacy"
        ? "Historical · incomplete"
        : report.provenance === "demo"
          ? "Illustrative sample"
          : "Saved analysis",
    ],
    [
      "Heuristic risk index /100",
      report.score === null ? "Not assigned" : String(report.score),
    ],
  ];
}
export function narrativeSections(text: string) {
  return text
    .split(/^##?\s+/m)
    .filter(Boolean)
    .map((part) => {
      const [heading, ...body] = part.split("\n");
      return { heading, text: body.join("\n").trim() };
    });
}
