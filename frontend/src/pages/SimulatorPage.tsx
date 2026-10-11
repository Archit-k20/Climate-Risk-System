import { useState, useMemo } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { SimulatorControlPanel } from "@/components/simulator/SimulatorControlPanel";
import { ProjectedYieldChart } from "@/components/simulator/ProjectedYieldChart";
import { RiskImpactMatrix } from "@/components/simulator/RiskImpactMatrix";
import { SimulationInsightCard } from "@/components/simulator/SimulationInsightCard";
import { DEFAULT_PARAMS } from "@/types/simulator";
import { runSimulation } from "@/lib/simulationEngine";
export default function SimulatorPage() {
  const [params, setParams] = useState(DEFAULT_PARAMS),
    output = useMemo(() => runSimulation(params), [params]);
  return (
    <PageTransition>
      <PageHeader
        number="04"
        title="What if the conditions change?"
        description="Explore how rainfall, temperature, humidity, and soil moisture influence a simplified agricultural scenario."
      >
        <div>
          <p className="eyebrow">Scenario index</p>
          <div className="report-index">
            {output.overallRiskScore}
            <small> / 100</small>
          </div>
        </div>
      </PageHeader>
      <div className="notice">
        Heuristic scenario demonstration. These local formulas and authored
        baselines have not been validated for predictive agricultural accuracy.
      </div>
      <div className="simulator-grid">
        <SimulatorControlPanel params={params} onChange={setParams} />
        <div className="simulator-results">
          <ProjectedYieldChart
            data={output.monthlyYield}
            cropType={params.cropType}
          />
          <RiskImpactMatrix cells={output.riskMatrix} />
          <SimulationInsightCard params={params} output={output} />
        </div>
      </div>
    </PageTransition>
  );
}
