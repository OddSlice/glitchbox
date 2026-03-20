interface PickerControlProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

export function PickerControl({ label, value, options, onChange }: PickerControlProps) {
  return (
    <div className="group">
      <span className="text-[11px] text-text-dim group-hover:text-text transition-colors block mb-2">{label}</span>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-1.5 px-2 text-[10px] font-medium rounded-lg transition-all cursor-pointer ${
              value === opt.value
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-bg-lighter text-text-muted border border-border hover:text-text-dim hover:border-border-hover hover:bg-bg-elevated/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
