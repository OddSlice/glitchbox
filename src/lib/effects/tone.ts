import { clamp, luminance } from './utils'

export function applyGrayscale(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const t = amount / 100

  for (let i = 0; i < data.length; i += 4) {
    const gray = luminance(data[i], data[i + 1], data[i + 2])
    data[i] = clamp(data[i] + (gray - data[i]) * t)
    data[i + 1] = clamp(data[i + 1] + (gray - data[i + 1]) * t)
    data[i + 2] = clamp(data[i + 2] + (gray - data[i + 2]) * t)
  }

  ctx.putImageData(imageData, 0, 0)
}

export function applySepia(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const t = amount / 100

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const sr = 0.393 * r + 0.769 * g + 0.189 * b
    const sg = 0.349 * r + 0.686 * g + 0.168 * b
    const sb = 0.272 * r + 0.534 * g + 0.131 * b
    data[i] = clamp(r + (sr - r) * t)
    data[i + 1] = clamp(g + (sg - g) * t)
    data[i + 2] = clamp(b + (sb - b) * t)
  }

  ctx.putImageData(imageData, 0, 0)
}

export function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  spread: number,
) {
  const cx = width / 2
  const cy = height / 2
  const maxDist = Math.sqrt(cx * cx + cy * cy)
  const spreadNorm = 1 - spread / 100
  const innerRadius = maxDist * (0.2 + spreadNorm * 0.6)
  const strength = intensity / 100

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    const dy = y - cy
    for (let x = 0; x < width; x++) {
      const dx = x - cx
      const dist = Math.sqrt(dx * dx + dy * dy)
      const factor = Math.max(0, (dist - innerRadius) / (maxDist - innerRadius))
      const darken = 1 - factor * factor * strength

      const i = (y * width + x) * 4
      data[i] = clamp(data[i] * darken)
      data[i + 1] = clamp(data[i + 1] * darken)
      data[i + 2] = clamp(data[i + 2] * darken)
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
