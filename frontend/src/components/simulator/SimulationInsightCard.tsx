import type { SimulatorParams, SimulationOutput } from "@/types/simulator";
import { scenarioInsight } from "@/lib/scenarioInsight";
export function SimulationInsightCard({
  params,
  output,
}: {
  params: SimulatorParams;
  output: SimulationOutput;
}) {
  return (
    <section className="insight" aria-live="polite">
      <h2>Scenario interpretation</h2>
      <p>{scenarioInsight(params, output)}</p>
    </section>
  );
}
