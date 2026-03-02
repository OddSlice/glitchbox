import type { Effects } from '../../store/useEditorStore'
import { luminance } from './utils'

// Bayer 8x8 ordered dither matrix
const BAYER_8X8 = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
]

type RGB = [number, number, number]

const PALETTES: Record<string, RGB[]> = {
  retro: [[228, 100, 132], [78, 140, 200], [20, 20, 20]],
  monochrome: [[0, 0, 0], [255, 255, 255]],
  neon: [[57, 255, 20], [255, 20, 147], [10, 10, 10]],
  handheld: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
}

function nearestColor(r: number, g: number, b: number, palette: RGB[]): RGB {
  let minDist = Infinity
  let best = palette[0]
  for (const c of palette) {
    const dr = r - c[0], dg = g - c[1], db = b - c[2]
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) {
      minDist = dist
      best = c
    }
  }
  return best
}

export function applyDithering(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  effects: Effects,
) {
  const { ditherStyle, ditherScale, ditherPalette, ditherIntensity } = effects
  if (ditherIntensity <= 0) return

  const palette = PALETTES[ditherPalette] || PALETTES.retro
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const t = ditherIntensity / 100

  if (ditherStyle === 'ordered') {
    applyOrderedDither(data, width, height, palette, ditherScale, t)
  } else if (ditherStyle === 'floyd-steinberg') {
    applyFloydSteinberg(data, width, height, palette, ditherScale, t)
  } else {
    applyNoiseDither(data, width, height, palette, ditherScale, t)
  }

  ctx.putImageData(imageData, 0, 0)
}

function applyOrderedDither(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[],
  scale: number,
  blend: number,
) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]

      const threshold = (BAYER_8X8[Math.floor(y / scale) % 8][Math.floor(x / scale) % 8] / 64 - 0.5) * 128
      const nr = r + threshold
      const ng = g + threshold
      const nb = b + threshold

      const [cr, cg, cb] = nearestColor(nr, ng, nb, palette)
      data[i] = r + (cr - r) * blend
      data[i + 1] = g + (cg - g) * blend
      data[i + 2] = b + (cb - b) * blend
    }
  }
}

function applyFloydSteinberg(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[],
  scale: number,
  blend: number,
) {
  // Work on a float copy for error diffusion
  const pixels = new Float32Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    pixels[i * 3] = data[i * 4]
    pixels[i * 3 + 1] = data[i * 4 + 1]
    pixels[i * 3 + 2] = data[i * 4 + 2]
  }

  const step = Math.max(1, Math.round(scale / 2))

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const pi = (y * width + x) * 3
      const r = pixels[pi], g = pixels[pi + 1], b = pixels[pi + 2]
      const [cr, cg, cb] = nearestColor(r, g, b, palette)

      const er = r - cr, eg = g - cg, eb = b - cb

      // Distribute error
      const diffuse = (dx: number, dy: number, w: number) => {
        const nx = x + dx * step, ny = y + dy * step
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = (ny * width + nx) * 3
          pixels[ni] += er * w
          pixels[ni + 1] += eg * w
          pixels[ni + 2] += eb * w
        }
      }

      diffuse(1, 0, 7 / 16)
      diffuse(-1, 1, 3 / 16)
      diffuse(0, 1, 5 / 16)
      diffuse(1, 1, 1 / 16)

      // Fill the block
      for (let by = 0; by < step && y + by < height; by++) {
        for (let bx = 0; bx < step && x + bx < width; bx++) {
          const di = ((y + by) * width + (x + bx)) * 4
          data[di] = data[di] + (cr - data[di]) * blend
          data[di + 1] = data[di + 1] + (cg - data[di + 1]) * blend
          data[di + 2] = data[di + 2] + (cb - data[di + 2]) * blend
        }
      }
    }
  }
}

function applyNoiseDither(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[],
  scale: number,
  blend: number,
) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]

      const noise = (Math.random() - 0.5) * 128 * (scale / 10)
      const nr = r + noise
      const ng = g + noise
      const nb = b + noise

      const [cr, cg, cb] = nearestColor(nr, ng, nb, palette)
      data[i] = r + (cr - r) * blend
      data[i + 1] = g + (cg - g) * blend
      data[i + 2] = b + (cb - b) * blend
    }
  }
}
