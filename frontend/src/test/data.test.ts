import { describe, it, expect } from "vitest";
import { demoReports, demoSummary } from "@/lib/demoData";
import { reportFields, narrativeSections } from "@/lib/report";
import { runSimulation } from "@/lib/simulationEngine";
import { scenarioInsight } from "@/lib/scenarioInsight";
import { DEFAULT_PARAMS } from "@/types/simulator";
import { useAppStore } from "@/store/useAppStore";
describe("data provenance", () => {
  it("uses consistent deterministic samples across reports and KPIs", () => {
    expect(demoSummary.total_analyzed).toBe(demoReports.length);
    expect(demoSummary.active_high_risk_zones).toBe(
      demoReports.filter((r) => r.risk_level === "high").length,
    );
    expect(
      demoReports.every(
        (r) =>
          r.provenance === "demo" &&
          r.model_agreement === null &&
          r.location === null,
      ),
    ).toBe(true);
  });
  it("keeps unknown archive fields unknown", () => {
    const record = {
      ...demoReports[0],
      score: null,
      land_class: null,
      location: null,
      risk_level: null,
      narrative: null,
      completed_at: null,
    };
    expect(reportFields(record)).toContainEqual(["Location", "Not recorded"]);
    expect(reportFields(record)).toContainEqual([
      "Heuristic risk index /100",
      "Not assigned",
    ]);
    expect(reportFields(record)).toContainEqual(["Risk level", "Unknown"]);
  });
  it("keeps original section meanings and pollution risk", () => {
    const r = demoReports[3];
    expect(reportFields(r)).toContainEqual(["Risk type", "Pollution Risk"]);
    expect(narrativeSections(r.narrative!).map((s) => s.heading)).toEqual([
      "Executive Summary",
      "Potential Impacts",
      "Actionable Mitigation Strategies",
    ]);
  });
  it("deduplicates socket and polling notifications using actual risk level", () => {
    useAppStore.setState({ seenAnalyses: [], notifications: [] });
    const report = { ...demoReports[0], provenance: "model" as const };
    useAppStore.getState().recordCompletion(report);
    useAppStore.getState().recordCompletion(report);
    expect(useAppStore.getState().notifications).toHaveLength(1);
    useAppStore.getState().setNotificationPref("low", false);
    useAppStore.getState().recordCompletion(demoReports[1]);
    expect(useAppStore.getState().notifications).toHaveLength(1);
  });
});
describe("scenario interpretation", () => {
  it("does not invent a dominant risk at zero stress", () => {
    const output = runSimulation(DEFAULT_PARAMS),
      text = scenarioInsight(DEFAULT_PARAMS, output);
    expect(output.overallRiskScore).toBe(0);
    expect(text).toContain("no drought, flood, or wildfire stress");
    expect(text).not.toContain("prioritized");
  });
  it("describes a gain without a negative deficit", () => {
    const params = { ...DEFAULT_PARAMS, temperatureDelta: -5 };
    const text = scenarioInsight(params, runSimulation(params));
    expect(text).toContain("5% gain");
    expect(text).not.toContain("deficit");
  });
  it("preserves formulas and output bounds across extremes", () => {
    for (const rainfall of [0, 250, 500])
      for (const temperatureDelta of [-5, 0, 10])
        for (const humidity of [0, 60, 100]) {
          const params = {
              ...DEFAULT_PARAMS,
              rainfall,
              temperatureDelta,
              humidity,
            },
            result = runSimulation(params);
          expect(runSimulation(params)).toEqual(result);
          expect(
            result.riskMatrix.every((r) => r.score >= 0 && r.score <= 100),
          ).toBe(true);
          expect(result.monthlyYield.every((r) => r.projected >= 0)).toBe(true);
        }
  });
});
