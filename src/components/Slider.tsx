interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  defaultValue: number
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, defaultValue, onChange }: SliderProps) {
  const isDefault = value === defaultValue
  const range = max - min
  const pct = ((value - min) / range) * 100
  const defaultPct = ((defaultValue - min) / range) * 100

  // For sliders with a center default, fill from center to thumb.
  // For sliders starting at min default, fill from left to thumb.
  const isCentered = defaultValue !== min
  let background: string
  if (isCentered) {
    const lo = Math.min(defaultPct, pct)
    const hi = Math.max(defaultPct, pct)
    background = `linear-gradient(to right, #2e2c27 0%, #2e2c27 ${lo}%, #eeb604 ${lo}%, #eeb604 ${hi}%, #2e2c27 ${hi}%, #2e2c27 100%)`
  } else {
    background = `linear-gradient(to right, #eeb604 0%, #eeb604 ${pct}%, #2e2c27 ${pct}%, #2e2c27 100%)`
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-dim group-hover:text-text transition-colors">{label}</span>
        <span
          className={`text-xs tabular-nums min-w-8 text-right cursor-pointer ${
            isDefault ? 'text-text-dim/50' : 'text-text'
          }`}
          onDoubleClick={() => onChange(defaultValue)}
          title="Double-click to reset"
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider w-full"
        style={{ background }}
      />
    </div>
  )
}
