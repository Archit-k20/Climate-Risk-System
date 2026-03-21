import { SimulatorParams } from '@/types/simulator'
import { ParameterSlider } from './ParameterSlider'

interface SimulatorControlPanelProps {
  params: SimulatorParams
  // Called every time any parameter changes. The parent debounces this.
  onChange: (params: SimulatorParams) => void
}

// Soil moisture and crop type are categorical (not continuous numbers),
// so we use styled button groups instead of sliders.
const SOIL_OPTIONS: { value: SimulatorParams['soilMoisture']; label: string; color: string }[] = [
  { value: 'dry',      label: 'Dry',      color: '#f59e0b' },
  { value: 'moderate', label: 'Moderate', color: '#06b6d4' },
  { value: 'wet',      label: 'Wet',      color: '#10b981' },
]

const CROP_OPTIONS: { value: SimulatorParams['cropType']; label: string; emoji: string }[] = [
  { value: 'wheat',   label: 'Wheat',   emoji: '🌾' },
  { value: 'rice',    label: 'Rice',    emoji: '🌿' },
  { value: 'maize',   label: 'Maize',   emoji: '🌽' },
  { value: 'soybean', label: 'Soybean', emoji: '🫘' },
  { value: 'cotton',  label: 'Cotton',  emoji: '☁️' },
]

export function SimulatorControlPanel({ params, onChange }: SimulatorControlPanelProps) {
  // Helper to update a single parameter while keeping the others unchanged.
  // This pattern (spreading the existing params then overriding one key)
  // ensures we never accidentally wipe out other parameter values.
  const update = <K extends keyof SimulatorParams>(key: K, value: SimulatorParams[K]) => {
    onChange({ ...params, [key]: value })
  }

  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-6"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div>
        <p
          className="text-xs uppercase tracking-widest mb-1"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Climate Parameters
        </p>
        <p className="text-xs" style={{ color: 'var(--color-muted)', opacity: 0.6, fontFamily: 'IBM Plex Mono, monospace' }}>
          Adjust variables to simulate projected outcomes
        </p>
      </div>

      {/* ── Rainfall Slider ── */}
      <ParameterSlider
        label="Annual Rainfall"
        value={params.rainfall}
        min={0}
        max={500}
        step={5}
        unit="mm"
        accentColor="var(--color-teal)"
        onChange={(v) => update('rainfall', v)}
      />

      {/* ── Temperature Delta Slider ── */}
      <ParameterSlider
        label="Temperature Change"
        value={params.temperatureDelta}
        min={-5}
        max={10}
        step={0.5}
        unit="°C"
        accentColor="var(--color-red)"
        // Format negative values with a "+" prefix for positive ones
        formatValue={(v) => v > 0 ? `+${v}` : `${v}`}
        onChange={(v) => update('temperatureDelta', v)}
      />

      {/* ── Humidity Slider ── */}
      <ParameterSlider
        label="Relative Humidity"
        value={params.humidity}
        min={0}
        max={100}
        step={1}
        unit="%"
        accentColor="var(--color-amber)"
        onChange={(v) => update('humidity', v)}
      />

      {/* ── Soil Moisture Selector ── */}
      <div className="flex flex-col gap-2">
        <p
          className="text-xs"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Soil Moisture
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SOIL_OPTIONS.map((opt) => {
            const isActive = params.soilMoisture === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update('soilMoisture', opt.value)}
                className="py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: isActive ? `${opt.color}20` : 'transparent',
                  border: `1px solid ${isActive ? opt.color : 'var(--color-border)'}`,
                  color: isActive ? opt.color : 'var(--color-muted)',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Crop Type Selector ── */}
      <div className="flex flex-col gap-2">
        <p
          className="text-xs"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Crop Type
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CROP_OPTIONS.map((opt) => {
            const isActive = params.cropType === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update('cropType', opt.value)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
                style={{
                  background: isActive ? 'rgba(245,158,11,0.15)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--color-amber)' : 'var(--color-border)'}`,
                  color: isActive ? 'var(--color-amber)' : 'var(--color-muted)',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}