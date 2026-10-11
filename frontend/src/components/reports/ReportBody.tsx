import type { AnalysisRecord } from "@/types/analysis";
import { reportFields, narrativeSections } from "@/lib/report";
import { RiskBadge } from "@/components/ui/PageHeader";
export function ReportBody({ report }: { report: AnalysisRecord }) {
  return (
    <article className="report-body">
      <p className="eyebrow">
        {report.provenance === "demo"
          ? "Illustrative sample report"
          : report.provenance === "legacy"
            ? "Historical record · Incomplete provenance"
            : "Saved analysis"}
      </p>
      <h2>{report.filename}</h2>
      <p className="sample-note">
        {report.provenance === "demo"
          ? "Sample output only. No model was run and no location was assessed."
          : "This heuristic index is not a probability or calibrated scientific confidence."}
      </p>
      {report.status === "inconclusive" ? (
        <div className="notice">
          The three models disagree. No risk classification or index was
          assigned.
        </div>
      ) : (
        <div className="section-heading">
          <div className="report-index">
            {report.score ?? "—"}
            <small> / 100</small>
          </div>
          <RiskBadge level={report.risk_level} />
        </div>
      )}
      <dl className="report-metadata">
        {reportFields(report)
          .filter(([key]) => key !== "Heuristic risk index /100")
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      {report.model_votes && (
        <p className="record-meta" style={{ marginTop: 16 }}>
          {Object.entries(report.model_votes)
            .map(([model, vote]) => `${model}: ${vote}`)
            .join(" · ")}
        </p>
      )}
      {report.description && (
        <p className="page-description" style={{ marginTop: 20 }}>
          {report.description}
        </p>
      )}
      {report.narrative_reason && (
        <div className="notice" style={{ marginTop: 20 }}>
          {report.narrative_reason}
        </div>
      )}
      {report.narrative ? (
        <div className="narrative">
          {narrativeSections(report.narrative).map((s, i) => (
            <section key={i}>
              <h3>{s.heading}</h3>
              <p>{s.text}</p>
            </section>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          {report.provenance === "legacy"
            ? "The original narrative was not saved. No replacement has been generated."
            : "No narrative was generated for this result."}
        </p>
      )}
    </article>
  );
}
