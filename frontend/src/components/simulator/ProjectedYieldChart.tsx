import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyYieldPoint } from "@/types/simulator";
export function ProjectedYieldChart({
  data,
  cropType,
}: {
  data: MonthlyYieldPoint[];
  cropType: string;
}) {
  return (
    <section>
      <div className="section-heading">
        <h2>Illustrative yield · {cropType}</h2>
        <span className="eyebrow">kg / ha</span>
      </div>
      <div
        style={{ height: 270, width: "100%", minWidth: 0 }}
        role="img"
        aria-label="Illustrative monthly baseline and scenario yield chart"
      >
        <ResponsiveContainer
          initialDimension={{ width: 500, height: 270 }}
          width="100%"
          height="100%"
          minWidth={100}
          minHeight={270}
        >
          <AreaChart
            data={data}
            margin={{ left: 0, right: 5, top: 10, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--color-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={43}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-bg-base)",
                border: "1px solid var(--color-border)",
                color: "var(--ink)",
                fontSize: 12,
              }}
            />
            <Area
              name="Illustrative baseline"
              dataKey="baseline"
              stroke="var(--color-muted)"
              fill="transparent"
              strokeDasharray="4 4"
              isAnimationActive={false}
            />
            <Area
              name="Scenario yield"
              dataKey="projected"
              stroke="var(--accent)"
              fill="var(--accent)"
              fillOpacity={0.12}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="record-meta">
        Solid: scenario yield · Dashed: illustrative baseline. These values are
        not an agricultural forecast.
      </p>
    </section>
  );
}
