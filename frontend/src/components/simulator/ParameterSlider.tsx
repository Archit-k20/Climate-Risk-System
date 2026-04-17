import { motion } from 'framer-motion'

interface ParameterSliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  // Color accent for this particular slider's track fill
  accentColor?: string
  onChange: (value: number) => void
  // Optional: format the display value differently from the raw number
  formatValue?: (value: number) => string
}

/**
 * A styled range slider with a label, current value display, and
 * a colored fill that shows how far along the range the value is.
 *
 * The fill effect is achieved using a CSS background gradient trick:
 * we dynamically calculate what percentage of the track is "filled"
 * and set the background to be half colored (left) and half muted (right).
 * This avoids needing a separate DOM element just for the fill layer.
 */
export function ParameterSlider({
  label, value, min, max, step = 1, unit,
  accentColor = 'var(--color-amber)',
  onChange, formatValue,
}: ParameterSliderProps) {

  // What percentage of the slider range does the current value represent?
  const fillPercent = ((value - min) / (max - min)) * 100

  const displayValue = formatValue ? formatValue(value) : `${value}`

  return (
    <div className="flex flex-col gap-2">
      {/* Label row: name on left, current value on right */}
      <div className="flex items-center justify-between">
        <label
          className="text-xs"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {label}
        </label>
        <motion.span
          // Animate the value display whenever the number changes —
          // a subtle scale pulse that draws the eye to the updated value
          key={value}
          initial={{ scale: 1.2, color: accentColor }}
          animate={{ scale: 1.0, color: accentColor }}
          transition={{ duration: 0.2 }}
          className="text-xs font-bold"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {displayValue} {unit}
        </motion.span>
      </div>

      {/* Range input with dynamic gradient fill */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          // The gradient creates the visual fill effect:
          // everything to the left of the thumb = accent color (filled)
          // everything to the right = muted color (empty track)
          background: `linear-gradient(to right, 
            ${accentColor} 0%, 
            ${accentColor} ${fillPercent}%, 
            var(--color-border) ${fillPercent}%, 
            var(--color-border) 100%)`,
          outline: 'none',
        }}
      />

      {/* Min/Max labels for context */}
      <div className="flex justify-between">
        <span className="text-xs" style={{ color: 'var(--color-muted)', fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace' }}>
          {min}{unit}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-muted)', fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace' }}>
          {max}{unit}
        </span>
      </div>
    </div>
  )
}