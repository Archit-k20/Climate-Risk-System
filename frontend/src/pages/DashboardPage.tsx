import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/layout/PageTransition";
import { RiskBadge } from "@/components/ui/PageHeader";
import { useReports, useSummary, useDistribution } from "@/hooks/useReports";
import { isDemo } from "@/lib/config";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
function Terrain() {
  return (
    <div>
      <svg className="terrain" viewBox="0 0 460 270" aria-hidden="true">
        {Array.from({ length: 31 }, (_, j) => {
          const d = Array.from({ length: 95 }, (_, i) => {
            const x = 8 + i * 4.7,
              ridge =
                48 *
                  Math.exp(-(((i - 45) / 21) ** 2)) *
                  Math.sin(j * 0.115 + 0.3) +
                17 * Math.sin(i * 0.065 + j * 0.125);
            const y = 20 + j * 7.6 - Math.sin((Math.PI * i) / 94) * ridge;
            return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
          }).join("");
          return (
            <path
              key={j}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={j % 5 === 0 ? 1.3 : 0.7}
              opacity={j % 5 === 0 ? 0.85 : 0.48}
            />
          );
        })}
      </svg>
      <div className="terrain-caption">
        <span>Land / Water / Atmosphere</span>
        <span>Abstract terrain study</span>
      </div>
    </div>
  );
}
export default function DashboardPage() {
  const summary = useSummary(),
    reports = useReports(),
    distribution = useDistribution();
  const refresh = useAppStore((s) => s.autoRefresh);
  const health = useQuery({
    queryKey: ["health"],
    enabled: !isDemo,
    queryFn: async () =>
      (await api.get<{ services: Record<string, string> }>("/health")).data,
    refetchInterval: refresh ? 30_000 : false,
    retry: false,
  });
  const stats = [
    ["Images analyzed", summary.data?.total_analyzed],
    ["High-risk analyses", summary.data?.active_high_risk_zones],
    ["Average risk index", summary.data?.average_risk_score],
    ["Reports generated", summary.data?.reports_generated],
  ] as const;
  const chart = ["low", "medium", "high"].map((level) => ({
    name: level,
    value: distribution.data?.[level as "low" | "medium" | "high"] || 0,
  }));
  return (
    <PageTransition>
      <section className="hero">
        <div>
          <p className="eyebrow">A climate observatory</p>
          <h1>
            A closer look
            <br />
            at our planet.
          </h1>
          <p className="hero-description">
            Satellite imagery. Environmental risk.
            <br />
            One considered perspective.
          </p>
          <p className="sample-note">
            {isDemo
              ? "Sample workspace · Explore six illustrative analyses"
              : "Land-cover classifications · Rule-based risk indices"}
          </p>
        </div>
        <Terrain />
      </section>
      {summary.isError && (
        <div className="notice error" role="alert">
          Dashboard statistics are unavailable.{" "}
          <button
            className="text-button"
            onClick={() => void summary.refetch()}
          >
            Retry
          </button>
        </div>
      )}
      <dl className="metrics">
        {stats.map(([label, value], i) => (
          <div className="metric" key={label}>
            <dt>{label}</dt>
            <dd>
              {value ?? "—"}
              {i === 2 && <small>/ 100</small>}
            </dd>
          </div>
        ))}
      </dl>
      <div className="dashboard-bottom">
        <section>
          <div className="section-heading">
            <h2>Risk distribution</h2>
            <span className="eyebrow">
              {isDemo ? "Sample data" : "Completed analyses"}
            </span>
          </div>
          {distribution.isError ? (
            <p className="empty-state">Distribution unavailable.</p>
          ) : distribution.isPending ? (
            <p className="empty-state">Loading distribution…</p>
          ) : !distribution.data?.total ? (
            <p className="empty-state">No completed analyses yet.</p>
          ) : (
            <div className="distribution">
              <div
                className="donut"
                role="img"
                aria-label={chart
                  .map((c) => `${c.name}: ${c.value}`)
                  .join(", ")}
              >
                <ResponsiveContainer
                  initialDimension={{ width: 160, height: 160 }}
                  width="100%"
                  height="100%"
                  minWidth={100}
                  minHeight={100}
                >
                  <PieChart>
                    <Pie
                      data={chart}
                      dataKey="value"
                      innerRadius="70%"
                      outerRadius="95%"
                      startAngle={90}
                      endAngle={-270}
                      stroke="var(--color-bg-base)"
                      strokeWidth={4}
                      isAnimationActive={false}
                    >
                      {["--color-emerald", "--color-amber", "--color-red"].map(
                        (color) => (
                          <Cell key={color} fill={`var(${color})`} />
                        ),
                      )}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend">
                {chart.map((c) => (
                  <div className="legend-row" key={c.name}>
                    <RiskBadge level={c.name} />
                    <span>
                      {c.value}{" "}
                      <small>
                        {" "}
                        /{" "}
                        {Math.round((c.value / distribution.data!.total) * 100)}
                        %
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="record-meta" style={{ marginTop: 22 }}>
            A heuristic index, not a probability of an event.
          </p>
        </section>
        <section>
          <div className="section-heading">
            <h2>Recent analyses</h2>
            <Link className="text-button" to="/reports">
              All reports <ArrowUpRight size={14} />
            </Link>
          </div>
          {reports.isPending ? (
            <p className="empty-state">Loading analyses…</p>
          ) : reports.isError ? (
            <p className="empty-state">
              Reports are unavailable.{" "}
              <button
                className="text-button"
                onClick={() => void reports.refetch()}
              >
                Retry
              </button>
            </p>
          ) : !reports.data?.length ? (
            <p className="empty-state">
              Your completed analyses will appear here.
            </p>
          ) : (
            reports.data.slice(0, 4).map((r) => (
              <Link
                className="recent-row"
                key={r.id}
                to={`/reports?report=${r.id}`}
              >
                <div>
                  <div className="record-title">
                    {r.land_class || "Classification unavailable"}
                  </div>
                  <span className="record-meta">
                    {r.filename} · {r.risk_type || "Unknown risk type"}
                  </span>
                </div>
                <div className="record-score">
                  {r.score ?? "—"}
                  <br />
                  <RiskBadge level={r.risk_level} />
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
      <div className="status-line">
        {isDemo ? (
          <span>
            <i />
            Demonstration mode · Backend connections disabled
          </span>
        ) : (
          ["api", "database", "redis", "model"].map((name) => (
            <span key={name}>
              <i className={health.data?.services[name] || ""} />
              {name}: {health.data?.services[name] || "unknown"}
            </span>
          ))
        )}
      </div>
    </PageTransition>
  );
}
