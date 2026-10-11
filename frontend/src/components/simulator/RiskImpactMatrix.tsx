import type { RiskMatrixCell } from "@/types/simulator";
import { RiskBadge } from "@/components/ui/PageHeader";
export function RiskImpactMatrix({ cells }: { cells: RiskMatrixCell[] }) {
  return (
    <section>
      <div className="section-heading">
        <h2>Scenario risk matrix</h2>
        <span className="eyebrow">Index / 100</span>
      </div>
      <div className="risk-matrix">
        {cells.map((c) => (
          <div className="risk-cell" key={c.riskType}>
            <span className="record-title">{c.riskType}</span>
            <strong>{c.score}</strong>
            <RiskBadge level={c.severity} />
            <div className="bar">
              <span style={{ width: `${c.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
