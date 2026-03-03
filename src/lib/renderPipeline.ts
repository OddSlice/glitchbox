import type { Adjustments, Effects } from '../store/useEditorStore'
import { applyTemperatureExposureSharpness } from './canvasEffects'
import { applyEffects, hasActiveEffects } from './effects'

/**
 * Render the full editing pipeline to a canvas context.
 * Used by both the display canvas (at scaled size) and
 * the export path (at original resolution).
 */
export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  adjustments: Adjustments,
  effects: Effects,
) {
  // 1. Apply CSS filters for brightness, contrast, saturation, hue
  const { brightness, contrast, saturation, hue } = adjustments
  ctx.filter = [
    `brightness(${brightness / 100})`,
    `contrast(${contrast / 100})`,
    `saturate(${saturation / 100})`,
    `hue-rotate(${hue}deg)`,
  ].join(' ')

  ctx.drawImage(image, 0, 0, width, height)

  // Reset filter before pixel manipulation
  ctx.filter = 'none'

  // 2. Apply temperature, exposure, sharpness via pixel manipulation
  const { temperature, exposure, sharpness } = adjustments
  if (temperature !== 0 || exposure !== 0 || sharpness !== 0) {
    applyTemperatureExposureSharpness(ctx, width, height, temperature, exposure, sharpness)
  }

  // 3. Apply effects (stacked on top of adjustments)
  if (hasActiveEffects(effects)) {
    applyEffects(ctx, width, height, effects)
  }
}
