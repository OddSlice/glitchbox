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
  const trackColor = '#23211a'
  const fillColor = '#eeb604'
  if (isCentered) {
    const lo = Math.min(defaultPct, pct)
    const hi = Math.max(defaultPct, pct)
    background = `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${lo}%, ${fillColor} ${lo}%, ${fillColor} ${hi}%, ${trackColor} ${hi}%, ${trackColor} 100%)`
  } else {
    background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${pct}%, ${trackColor} ${pct}%, ${trackColor} 100%)`
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-text-dim group-hover:text-text transition-colors">{label}</span>
        <span
          className={`text-[11px] tabular-nums min-w-8 text-right cursor-pointer transition-colors ${
            isDefault ? 'text-text-muted' : 'text-text font-medium'
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
