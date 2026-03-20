import { useEditorStore, defaultAdjustments, type Adjustments } from '../store/useEditorStore'
import { Slider } from './Slider'

interface SliderConfig {
  key: keyof Adjustments
  label: string
  min: number
  max: number
}

const lightColorSliders: SliderConfig[] = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200 },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200 },
  { key: 'hue', label: 'Hue', min: -180, max: 180 },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
  { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
]

const detailSliders: SliderConfig[] = [
  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
]

export function AdjustPanel() {
  const adjustments = useEditorStore((s) => s.adjustments)
  const setAdjustment = useEditorStore((s) => s.setAdjustment)
  const resetAll = useEditorStore((s) => s.resetAll)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <SliderGroup title="Light & Color" sliders={lightColorSliders} adjustments={adjustments} setAdjustment={setAdjustment} />
        <SliderGroup title="Detail" sliders={detailSliders} adjustments={adjustments} setAdjustment={setAdjustment} />
      </div>

      <div className="shrink-0 p-4 border-t border-border">
        <button
          onClick={resetAll}
          className="w-full py-2.5 text-[11px] font-semibold rounded-lg border border-border text-text-dim hover:text-text hover:border-border-hover hover:bg-bg-elevated/50 transition-all cursor-pointer"
        >
          Reset All
        </button>
      </div>
    </div>
  )
}

function SliderGroup({
  title,
  sliders,
  adjustments,
  setAdjustment,
}: {
  title: string
  sliders: SliderConfig[]
  adjustments: Adjustments
  setAdjustment: <K extends keyof Adjustments>(key: K, value: Adjustments[K]) => void
}) {
  return (
    <div>
      <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mb-4">{title}</h3>
      <div className="space-y-4">
        {sliders.map((s) => (
          <Slider
            key={s.key}
            label={s.label}
            value={adjustments[s.key]}
            min={s.min}
            max={s.max}
            defaultValue={defaultAdjustments[s.key]}
            onChange={(v) => setAdjustment(s.key, v)}
          />
        ))}
      </div>
    </div>
  )
}
