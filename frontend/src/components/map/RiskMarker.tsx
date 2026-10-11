import { CircleMarker, Popup } from "react-leaflet";
import type { RiskMapPoint } from "@/lib/mockData";
import { RiskBadge } from "@/components/ui/PageHeader";
export function RiskMarker({ point }: { point: RiskMapPoint }) {
  const color = { low: "#50886a", medium: "#a88338", high: "#a65346" }[
    point.riskLevel
  ];
  return (
    <CircleMarker
      center={[point.lat, point.lng]}
      radius={point.riskLevel === "high" ? 9 : 7}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1 }}
    >
      <Popup>
        <p className="eyebrow">Sample location</p>
        <h3 style={{ margin: "8px 0" }}>{point.region}</h3>
        <RiskBadge level={point.riskLevel} />
        <p>
          {point.riskType} · Index {point.riskScore}/100
        </p>
        <p className="record-meta">
          Illustrative data. Not a measured risk assessment.
        </p>
      </Popup>
    </CircleMarker>
  );
}
