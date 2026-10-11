import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, X, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader, RiskBadge } from "@/components/ui/PageHeader";
import { ReportBody } from "@/components/reports/ReportBody";
import { useReports } from "@/hooks/useReports";
import { isDemo } from "@/lib/config";
import { exportReportToPDF } from "@/lib/pdfExport";
import type { AnalysisRecord } from "@/types/analysis";
function ReportDialog({
  report,
  close,
}: {
  report: AnalysisRecord;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);
  const download = async () => {
    setExporting(true);
    try {
      await exportReportToPDF(report);
    } catch {
      toast.error("The PDF could not be exported. Please retry.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <dialog
      className="report-dialog"
      ref={dialog}
      aria-label={`Report for ${report.filename}`}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-header">
        <p className="eyebrow">Report / {report.id}</p>
        <div className="dialog-actions">
          <button
            className="button secondary"
            onClick={() => void download()}
            disabled={exporting}
          >
            <Download size={14} />
            {exporting ? "Exporting…" : "Export PDF"}
          </button>
          <button
            className="icon-button"
            aria-label="Close report"
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <ReportBody report={report} />
    </dialog>
  );
}
export default function ReportsPage() {
  const query = useReports(),
    [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(""),
    [level, setLevel] = useState("all"),
    [sort, setSort] = useState("newest");
  const records = (query.data ?? [])
    .filter(
      (r) =>
        (level === "all" || r.risk_level === level) &&
        (r.filename + " " + (r.land_class ?? "") + " " + (r.risk_type ?? ""))
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "score"
        ? (b.score ?? -1) - (a.score ?? -1)
        : sort === "name"
          ? a.filename.localeCompare(b.filename)
          : String(b.completed_at ?? b.uploaded_at).localeCompare(
              String(a.completed_at ?? a.uploaded_at),
            ),
    );
  const selected = query.data?.find((r) => r.id === params.get("report"));
  return (
    <PageTransition>
      <PageHeader
        number="05"
        title="The report archive."
        description="A considered record of each classification, its risk index, and the original interpretation."
      />
      {isDemo && (
        <div className="notice">
          Illustrative archive. All six reports use sample data; no uploaded
          image or real location was analysed.
        </div>
      )}
      <div className="report-controls">
        <input
          className="field search-field"
          aria-label="Search reports"
          placeholder="Search filename, land cover, or risk…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field"
          aria-label="Filter risk level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="all">All risk levels</option>
          {["low", "medium", "high"].map((v) => (
            <option key={v} value={v}>
              {v[0].toUpperCase() + v.slice(1)}
            </option>
          ))}
        </select>
        <select
          className="field"
          aria-label="Sort reports"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="score">Highest index</option>
          <option value="name">Filename A–Z</option>
        </select>
      </div>
      {query.isPending ? (
        <p className="empty-state" role="status">
          Loading reports…
        </p>
      ) : query.isError ? (
        <div className="notice error" role="alert">
          The archive is unavailable.{" "}
          <button className="text-button" onClick={() => void query.refetch()}>
            Retry
          </button>
        </div>
      ) : records.length ? (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Image / Land cover</th>
                  <th>Primary risk</th>
                  <th>Level</th>
                  <th>Index /100</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <button
                        className="table-record"
                        onClick={() => setParams({ report: r.id })}
                      >
                        {r.filename}
                      </button>
                      <span className="record-meta">
                        {r.land_class ?? "Unknown"} ·{" "}
                        {r.provenance === "legacy"
                          ? "Historical record"
                          : r.completed_at
                            ? new Date(r.completed_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "Date not recorded"}
                      </span>
                    </td>
                    <td>{r.risk_type ?? "Unknown"}</td>
                    <td>
                      <RiskBadge level={r.risk_level} />
                    </td>
                    <td style={{ fontFamily: "var(--mono)" }}>
                      {r.score ?? "—"}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Open ${r.filename}`}
                        onClick={() => setParams({ report: r.id })}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-count">
            {records.length} of {query.data?.length} records · Heuristic
            indices, not probabilities
          </p>
        </>
      ) : (
        <div className="empty-state">
          <h2>
            {query.data?.length
              ? "No matching reports."
              : "No completed analyses yet."}
          </h2>
          <p>
            {query.data?.length
              ? "Try another search or risk filter."
              : "Completed analyses will be saved here."}
          </p>
        </div>
      )}
      {selected && (
        <ReportDialog report={selected} close={() => setParams({})} />
      )}
    </PageTransition>
  );
}
