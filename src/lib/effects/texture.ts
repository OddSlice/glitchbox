import { clamp } from './utils'

export function applyFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  size: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const strength = (intensity / 100) * 80

  const blockSize = Math.max(1, Math.round(size))

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      const noise = (Math.random() - 0.5) * 2 * strength
      for (let by = 0; by < blockSize && y + by < height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4
          data[i] = clamp(data[i] + noise)
          data[i + 1] = clamp(data[i + 1] + noise)
          data[i + 2] = clamp(data[i + 2] + noise)
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export function applyGaussianBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number,
) {
  const radius = Math.round(strength)
  if (radius < 1) return

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const copy = new Uint8ClampedArray(data)

  // 3-pass box blur to approximate Gaussian
  for (let pass = 0; pass < 3; pass++) {
    const src = pass === 0 ? copy : data
    const tmp = new Uint8ClampedArray(src)

    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          if (nx >= 0 && nx < width) {
            const idx = (y * width + nx) * 4
            r += tmp[idx]
            g += tmp[idx + 1]
            b += tmp[idx + 2]
            count++
          }
        }
        const idx = (y * width + x) * 4
        data[idx] = (r / count + 0.5) | 0
        data[idx + 1] = (g / count + 0.5) | 0
        data[idx + 2] = (b / count + 0.5) | 0
      }
    }

    // Vertical pass
    const tmp2 = new Uint8ClampedArray(data)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy
          if (ny >= 0 && ny < height) {
            const idx = (ny * width + x) * 4
            r += tmp2[idx]
            g += tmp2[idx + 1]
            b += tmp2[idx + 2]
            count++
          }
        }
        const idx = (y * width + x) * 4
        data[idx] = (r / count + 0.5) | 0
        data[idx + 1] = (g / count + 0.5) | 0
        data[idx + 2] = (b / count + 0.5) | 0
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export function applyPixelation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  blockSize: number,
) {
  if (blockSize <= 1) return

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      let r = 0, g = 0, b = 0, count = 0

      // Average the block
      for (let by = 0; by < blockSize && y + by < height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
      }

      r = (r / count + 0.5) | 0
      g = (g / count + 0.5) | 0
      b = (b / count + 0.5) | 0

      // Fill the block
      for (let by = 0; by < blockSize && y + by < height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4
          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
