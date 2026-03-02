import type { Effects } from '../../store/useEditorStore'
import { defaultEffects } from '../../store/useEditorStore'
import { applyGrayscale, applySepia, applyVignette } from './tone'
import { applyGaussianBlur, applyPixelation, applyFilmGrain } from './texture'
import { applyDithering } from './dither'
import { applyRgbShift, applyCrtScanLines, applyPixelSort, applyVhsNoise } from './glitch'
import { applyBloom, applyLensFlare, applyLightLeak } from './light'

export function hasActiveEffects(effects: Effects): boolean {
  return (Object.keys(defaultEffects) as (keyof Effects)[]).some(
    (key) => effects[key] !== defaultEffects[key],
  )
}

export function applyEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  effects: Effects,
) {
  // 1. Tone
  if (effects.grayscale > 0) applyGrayscale(ctx, width, height, effects.grayscale)
  if (effects.sepia > 0) applySepia(ctx, width, height, effects.sepia)
  if (effects.vignetteIntensity > 0) applyVignette(ctx, width, height, effects.vignetteIntensity, effects.vignetteSpread)

  // 2. Texture (spatial)
  if (effects.gaussianBlur > 0) applyGaussianBlur(ctx, width, height, effects.gaussianBlur)
  if (effects.pixelation > 1) applyPixelation(ctx, width, height, effects.pixelation)

  // 3. Dither
  if (effects.ditherIntensity > 0) applyDithering(ctx, width, height, effects)

  // 4. Texture (noise)
  if (effects.filmGrainIntensity > 0) applyFilmGrain(ctx, width, height, effects.filmGrainIntensity, effects.filmGrainSize)

  // 5. Glitch
  if (effects.pixelSort > 0) applyPixelSort(ctx, width, height, effects.pixelSort)
  if (effects.rgbShift > 0) applyRgbShift(ctx, width, height, effects.rgbShift)
  if (effects.crtScanLines > 0) applyCrtScanLines(ctx, width, height, effects.crtScanLines)
  if (effects.vhsNoise > 0) applyVhsNoise(ctx, width, height, effects.vhsNoise)

  // 6. Light
  if (effects.bloomIntensity > 0) applyBloom(ctx, width, height, effects.bloomIntensity, effects.bloomSpread)
  if (effects.lensFlareIntensity > 0) applyLensFlare(ctx, width, height, effects)
  if (effects.lightLeakIntensity > 0) applyLightLeak(ctx, width, height, effects)
}
