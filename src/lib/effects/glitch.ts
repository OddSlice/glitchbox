import { clamp, luminance } from './utils'

export function applyRgbShift(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const original = new Uint8ClampedArray(data)
  const offset = Math.round(amount)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4

      // Shift red channel left
      const rxSrc = Math.min(width - 1, Math.max(0, x + offset))
      const ri = (y * width + rxSrc) * 4
      data[i] = original[ri]

      // Blue channel shifts right
      const bxSrc = Math.min(width - 1, Math.max(0, x - offset))
      const bi = (y * width + bxSrc) * 4
      data[i + 2] = original[bi + 2]

      // Green stays in place
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export function applyCrtScanLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const darken = amount / 100 * 0.6

  for (let y = 0; y < height; y++) {
    if (y % 3 === 0) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        data[i] = clamp(data[i] * (1 - darken))
        data[i + 1] = clamp(data[i + 1] * (1 - darken))
        data[i + 2] = clamp(data[i + 2] * (1 - darken))
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export function applyPixelSort(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Threshold: higher amount = more pixels get sorted
  const threshold = 255 * (1 - amount / 100)

  for (let y = 0; y < height; y++) {
    // Find spans of pixels above threshold
    let spanStart = -1

    for (let x = 0; x <= width; x++) {
      if (x < width) {
        const i = (y * width + x) * 4
        const lum = luminance(data[i], data[i + 1], data[i + 2])

        if (lum > threshold && spanStart === -1) {
          spanStart = x
        } else if (lum <= threshold && spanStart !== -1) {
          sortSpan(data, y, width, spanStart, x)
          spanStart = -1
        }
      } else if (spanStart !== -1) {
        sortSpan(data, y, width, spanStart, x)
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

function sortSpan(
  data: Uint8ClampedArray,
  y: number,
  width: number,
  start: number,
  end: number,
) {
  const len = end - start
  if (len < 2) return

  // Extract pixels with luminance
  const pixels: { r: number; g: number; b: number; a: number; lum: number }[] = []
  for (let x = start; x < end; x++) {
    const i = (y * width + x) * 4
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    pixels.push({ r, g, b, a, lum: luminance(r, g, b) })
  }

  pixels.sort((a, b) => a.lum - b.lum)

  // Write back
  for (let j = 0; j < pixels.length; j++) {
    const i = (y * width + (start + j)) * 4
    data[i] = pixels[j].r
    data[i + 1] = pixels[j].g
    data[i + 2] = pixels[j].b
    data[i + 3] = pixels[j].a
  }
}

export function applyVhsNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const strength = amount / 100

  // Horizontal band distortion
  const numBands = Math.floor(3 + strength * 10)
  for (let b = 0; b < numBands; b++) {
    const bandY = Math.floor(Math.random() * height)
    const bandH = Math.floor(2 + Math.random() * 8 * strength)
    const shift = Math.floor((Math.random() - 0.5) * 20 * strength)

    for (let y = bandY; y < Math.min(height, bandY + bandH); y++) {
      for (let x = 0; x < width; x++) {
        const srcX = Math.min(width - 1, Math.max(0, x + shift))
        const di = (y * width + x) * 4
        const si = (y * width + srcX) * 4
        data[di] = data[si]
        data[di + 1] = data[si + 1]
        data[di + 2] = data[si + 2]
      }
    }
  }

  // Static noise
  const noiseAmount = strength * 40
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < strength * 0.3) {
      const noise = (Math.random() - 0.5) * noiseAmount
      data[i] = clamp(data[i] + noise)
      data[i + 1] = clamp(data[i + 1] + noise)
      data[i + 2] = clamp(data[i + 2] + noise)
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
