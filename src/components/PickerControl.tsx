interface PickerControlProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

export function PickerControl({ label, value, options, onChange }: PickerControlProps) {
  return (
    <div className="group">
      <span className="text-xs text-text-dim group-hover:text-text transition-colors block mb-1.5">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-1 px-1.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
              value === opt.value
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-bg-lighter text-text-dim border border-border hover:text-text hover:border-primary/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
