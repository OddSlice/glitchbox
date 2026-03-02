import { useEditorStore } from '../store/useEditorStore'
import { presets } from '../lib/presets'

export function PresetsPanel() {
  const activePreset = useEditorStore((s) => s.activePreset)
  const applyPreset = useEditorStore((s) => s.applyPreset)
  const resetAll = useEditorStore((s) => s.resetAll)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id, preset.adjustments, preset.effects)}
              className={`text-left p-3 rounded border transition-colors cursor-pointer ${
                activePreset === preset.id
                  ? 'border-amber bg-amber/10'
                  : 'border-border bg-bg-lighter hover:border-amber/30'
              }`}
            >
              <div className={`text-xs font-medium mb-0.5 ${
                activePreset === preset.id ? 'text-amber' : 'text-text'
              }`}>
                {preset.name}
              </div>
              <div className="text-[10px] text-text-dim/60 leading-tight">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-border">
        <button
          onClick={resetAll}
          className="w-full py-2 text-xs font-medium rounded border border-border text-text-dim hover:text-text hover:border-amber/40 transition-colors cursor-pointer"
        >
          Reset All
        </button>
      </div>
    </div>
  )
}
