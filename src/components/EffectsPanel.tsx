import { useEditorStore, defaultEffects, type Effects } from '../store/useEditorStore'
import { Slider } from './Slider'
import { PickerControl } from './PickerControl'
import { ColorPicker } from './ColorPicker'

type ControlConfig =
  | { type: 'slider'; key: keyof Effects; label: string; min: number; max: number }
  | { type: 'picker'; key: keyof Effects; label: string; options: { value: string; label: string }[] }
  | { type: 'color'; key: keyof Effects; label: string }

interface GroupConfig {
  title: string
  controls: ControlConfig[]
}

const groups: GroupConfig[] = [
  {
    title: 'Texture',
    controls: [
      { type: 'slider', key: 'filmGrainIntensity', label: 'Film Grain', min: 0, max: 100 },
      { type: 'slider', key: 'filmGrainSize', label: 'Grain Size', min: 1, max: 3 },
      { type: 'slider', key: 'gaussianBlur', label: 'Gaussian Blur', min: 0, max: 20 },
      { type: 'slider', key: 'pixelation', label: 'Pixelation', min: 1, max: 50 },
    ],
  },
  {
    title: 'Tone',
    controls: [
      { type: 'slider', key: 'vignetteIntensity', label: 'Vignette', min: 0, max: 100 },
      { type: 'slider', key: 'vignetteSpread', label: 'Vignette Spread', min: 0, max: 100 },
      { type: 'slider', key: 'sepia', label: 'Sepia', min: 0, max: 100 },
      { type: 'slider', key: 'grayscale', label: 'Grayscale', min: 0, max: 100 },
    ],
  },
  {
    title: 'Dither',
    controls: [
      { type: 'slider', key: 'ditherIntensity', label: 'Intensity', min: 0, max: 100 },
      {
        type: 'picker', key: 'ditherStyle', label: 'Style',
        options: [
          { value: 'ordered', label: 'Ordered' },
          { value: 'floyd-steinberg', label: 'Floyd-S.' },
          { value: 'noise', label: 'Noise' },
        ],
      },
      { type: 'slider', key: 'ditherScale', label: 'Scale', min: 1, max: 20 },
      {
        type: 'picker', key: 'ditherPalette', label: 'Palette',
        options: [
          { value: 'retro', label: 'Retro' },
          { value: 'monochrome', label: 'Mono' },
          { value: 'neon', label: 'Neon' },
          { value: 'handheld', label: 'Handheld' },
        ],
      },
    ],
  },
  {
    title: 'Glitch',
    controls: [
      { type: 'slider', key: 'rgbShift', label: 'RGB Shift', min: 0, max: 50 },
      { type: 'slider', key: 'crtScanLines', label: 'CRT Scan Lines', min: 0, max: 100 },
      { type: 'slider', key: 'pixelSort', label: 'Pixel Sort', min: 0, max: 100 },
      { type: 'slider', key: 'vhsNoise', label: 'VHS Noise', min: 0, max: 100 },
    ],
  },
  {
    title: 'Light',
    controls: [
      { type: 'slider', key: 'lensFlareIntensity', label: 'Lens Flare', min: 0, max: 100 },
      {
        type: 'picker', key: 'lensFlareStyle', label: 'Flare Style',
        options: [
          { value: 'classic', label: 'Classic' },
          { value: 'anamorphic', label: 'Anamorphic' },
          { value: 'star', label: 'Star' },
          { value: 'sparkle', label: 'Sparkle' },
          { value: 'streak', label: 'Streak' },
        ],
      },
      { type: 'slider', key: 'lensFlareX', label: 'Flare X', min: 0, max: 100 },
      { type: 'slider', key: 'lensFlareY', label: 'Flare Y', min: 0, max: 100 },
      { type: 'color', key: 'lensFlareTint', label: 'Flare Tint' },
      { type: 'slider', key: 'bloomIntensity', label: 'Bloom', min: 0, max: 100 },
      { type: 'slider', key: 'bloomSpread', label: 'Bloom Spread', min: 0, max: 100 },
      { type: 'slider', key: 'lightLeakIntensity', label: 'Light Leak', min: 0, max: 100 },
      { type: 'color', key: 'lightLeakColor', label: 'Leak Color' },
      {
        type: 'picker', key: 'lightLeakPosition', label: 'Leak Position',
        options: [
          { value: 'top', label: 'Top' },
          { value: 'bottom', label: 'Bottom' },
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
        ],
      },
    ],
  },
]

export function EffectsPanel() {
  const effects = useEditorStore((s) => s.effects)
  const setEffect = useEditorStore((s) => s.setEffect)
  const resetAll = useEditorStore((s) => s.resetAll)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {groups.map((group) => (
          <EffectsGroup key={group.title} group={group} effects={effects} setEffect={setEffect} />
        ))}
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

function EffectsGroup({
  group,
  effects,
  setEffect,
}: {
  group: GroupConfig
  effects: Effects
  setEffect: <K extends keyof Effects>(key: K, value: Effects[K]) => void
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-3">{group.title}</h3>
      <div className="space-y-3">
        {group.controls.map((ctrl) => {
          if (ctrl.type === 'slider') {
            return (
              <Slider
                key={ctrl.key}
                label={ctrl.label}
                value={effects[ctrl.key] as number}
                min={ctrl.min}
                max={ctrl.max}
                defaultValue={defaultEffects[ctrl.key] as number}
                onChange={(v) => setEffect(ctrl.key, v as Effects[typeof ctrl.key])}
              />
            )
          }
          if (ctrl.type === 'picker') {
            return (
              <PickerControl
                key={ctrl.key}
                label={ctrl.label}
                value={effects[ctrl.key] as string}
                options={ctrl.options}
                onChange={(v) => setEffect(ctrl.key, v as Effects[typeof ctrl.key])}
              />
            )
          }
          if (ctrl.type === 'color') {
            return (
              <ColorPicker
                key={ctrl.key}
                label={ctrl.label}
                value={effects[ctrl.key] as string}
                onChange={(v) => setEffect(ctrl.key, v as Effects[typeof ctrl.key])}
              />
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
