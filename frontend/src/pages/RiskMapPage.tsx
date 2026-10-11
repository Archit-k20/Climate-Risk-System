import { MapContainer, TileLayer } from "react-leaflet";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader, RiskBadge } from "@/components/ui/PageHeader";
import { HeatmapLayer } from "@/components/map/HeatmapLayer";
import { RiskMarker } from "@/components/map/RiskMarker";
import { MapFilterPanel } from "@/components/map/MapFilterPanel";
import { mockMapPoints } from "@/lib/mockData";
import { useAppStore } from "@/store/useAppStore";
export default function RiskMapPage() {
  const { mapFilters } = useAppStore();
  const points = mockMapPoints.filter(
    (p) =>
      mapFilters.riskLevels.includes(p.riskLevel) &&
      mapFilters.riskTypes.includes(p.riskType),
  );
  return (
    <PageTransition>
      <PageHeader
        number="03"
        title="Patterns across the landscape."
        description="An illustrative atlas of environmental risks across India. Explore the existing sample locations by risk type and level."
      />
      <div className="notice">
        Fixed demonstration points. These locations are not live observations
        and are not associated with uploaded images.
      </div>
      <div className="map-layout">
        <MapFilterPanel />
        <div>
          <div className="map-canvas">
            <MapContainer
              center={[20.5, 78.9]}
              zoom={5}
              minZoom={4}
              maxZoom={14}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url={import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
                attribution={import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
              />
              <HeatmapLayer points={points} />
              {points.map((p) => (
                <RiskMarker key={p.id} point={p} />
              ))}
            </MapContainer>
            {!points.length && (
              <div className="map-empty">
                No sample locations match these filters.
              </div>
            )}
          </div>
          <div className="map-legend">
            <span>
              {points.length} / {mockMapPoints.length} sample locations
            </span>
            {["low", "medium", "high"].map((level) => (
              <RiskBadge key={level} level={level} />
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
