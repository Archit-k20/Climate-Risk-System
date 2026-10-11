import type { SimulatorParams } from "@/types/simulator";
import { ParameterSlider } from "./ParameterSlider";
export function SimulatorControlPanel({
  params,
  onChange,
}: {
  params: SimulatorParams;
  onChange: (params: SimulatorParams) => void;
}) {
  const update = <K extends keyof SimulatorParams>(
    key: K,
    value: SimulatorParams[K],
  ) => onChange({ ...params, [key]: value });
  return (
    <section className="panel simulator-controls">
      <h2>Set the conditions.</h2>
      <ParameterSlider
        label="Rainfall"
        value={params.rainfall}
        min={0}
        max={500}
        step={5}
        unit="mm"
        onChange={(v) => update("rainfall", v)}
      />
      <ParameterSlider
        label="Temperature change"
        value={params.temperatureDelta}
        min={-5}
        max={10}
        step={0.5}
        unit="°C"
        onChange={(v) => update("temperatureDelta", v)}
      />
      <ParameterSlider
        label="Relative humidity"
        value={params.humidity}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => update("humidity", v)}
      />
      <label>
        <span className="control-label">Soil moisture</span>
        <select
          className="field"
          value={params.soilMoisture}
          onChange={(e) =>
            update(
              "soilMoisture",
              e.target.value as SimulatorParams["soilMoisture"],
            )
          }
        >
          {["dry", "moderate", "wet"].map((v) => (
            <option key={v} value={v}>
              {v[0].toUpperCase() + v.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="control-label">Crop type</span>
        <select
          className="field"
          value={params.cropType}
          onChange={(e) =>
            update("cropType", e.target.value as SimulatorParams["cropType"])
          }
        >
          {["wheat", "rice", "maize", "soybean", "cotton"].map((v) => (
            <option key={v} value={v}>
              {v[0].toUpperCase() + v.slice(1)}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
