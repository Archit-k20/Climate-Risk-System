import { useAppStore } from "@/store/useAppStore";
import type { RiskLevel } from "@/types/analysis";
const levels: RiskLevel[] = ["low", "medium", "high"],
  types = [
    "Drought",
    "Flood",
    "Wildfire",
    "Deforestation",
    "Erosion",
    "Pollution Risk",
  ];
export function MapFilterPanel() {
  const { mapFilters, setMapFilters } = useAppStore();
  return (
    <div className="map-filters">
      <fieldset>
        <legend>Risk level</legend>
        {levels.map((level) => (
          <label key={level}>
            <input
              type="checkbox"
              checked={mapFilters.riskLevels.includes(level)}
              onChange={(e) =>
                setMapFilters({
                  riskLevels: e.target.checked
                    ? [...mapFilters.riskLevels, level]
                    : mapFilters.riskLevels.filter((l) => l !== level),
                })
              }
            />
            {level[0].toUpperCase() + level.slice(1)}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Risk type</legend>
        {types.map((type) => (
          <label key={type}>
            <input
              type="checkbox"
              checked={mapFilters.riskTypes.includes(type)}
              onChange={(e) =>
                setMapFilters({
                  riskTypes: e.target.checked
                    ? [...mapFilters.riskTypes, type]
                    : mapFilters.riskTypes.filter((t) => t !== type),
                })
              }
            />
            {type}
          </label>
        ))}
      </fieldset>
      <button
        className="text-button"
        onClick={() => setMapFilters({ riskLevels: levels, riskTypes: types })}
      >
        Reset filters ↗
      </button>
    </div>
  );
}
