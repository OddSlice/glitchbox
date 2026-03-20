interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="group flex items-center justify-between">
      <span className="text-[11px] text-text-dim group-hover:text-text transition-colors">{label}</span>
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] text-text-muted tabular-nums uppercase">{value}</span>
        <label className="relative cursor-pointer">
          <div
            className="w-7 h-7 rounded-lg border border-border hover:border-border-hover transition-all shadow-sm"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>
    </div>
  )
}
