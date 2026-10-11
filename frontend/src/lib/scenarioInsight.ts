import type { SimulatorParams, SimulationOutput } from "@/types/simulator";
export function scenarioInsight(
  params: SimulatorParams,
  output: SimulationOutput,
) {
  const maximum = Math.max(...output.riskMatrix.map((r) => r.score));
  const dominant = output.riskMatrix
    .filter((r) => r.score === maximum)
    .map((r) => r.riskType)
    .join(" and ");
  const base = output.monthlyYield.reduce((sum, p) => sum + p.baseline, 0),
    projected = output.monthlyYield.reduce((sum, p) => sum + p.projected, 0);
  const change = Math.round((projected / base - 1) * 100);
  const yieldText =
    change === 0
      ? "matches the illustrative baseline"
      : `shows an illustrative ${Math.abs(change)}% ${change > 0 ? "gain" : "deficit"} against the baseline`;
  return `For ${params.cropType}, this scenario ${yieldText}. ${maximum === 0 ? "The model assigns no drought, flood, or wildfire stress at these settings." : `${dominant} has the highest stress index in this simplified calculation.`} These local formulas describe a scenario; they do not predict field performance or recommend interventions.`;
}
