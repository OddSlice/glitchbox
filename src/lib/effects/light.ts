import type { Effects } from '../../store/useEditorStore'
import { clamp, hexToRgb } from './utils'

export function applyBloom(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  spread: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const strength = intensity / 100
  const radius = Math.max(1, Math.round(spread / 10))

  // Extract bright pixels into a separate buffer
  const bright = new Float32Array(width * height * 3)
  const threshold = 180

  for (let i = 0; i < width * height; i++) {
    const pi = i * 4
    const r = data[pi], g = data[pi + 1], b = data[pi + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    if (lum > threshold) {
      const factor = (lum - threshold) / (255 - threshold)
      bright[i * 3] = r * factor
      bright[i * 3 + 1] = g * factor
      bright[i * 3 + 2] = b * factor
    }
  }

  // Simple box blur on bright buffer (2 passes)
  for (let pass = 0; pass < 2; pass++) {
    const tmp = new Float32Array(bright)

    // Horizontal
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          if (nx >= 0 && nx < width) {
            const bi = (y * width + nx) * 3
            r += tmp[bi]; g += tmp[bi + 1]; b += tmp[bi + 2]
            count++
          }
        }
        const bi = (y * width + x) * 3
        bright[bi] = r / count
        bright[bi + 1] = g / count
        bright[bi + 2] = b / count
      }
    }

    // Vertical
    const tmp2 = new Float32Array(bright)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy
          if (ny >= 0 && ny < height) {
            const bi = (ny * width + x) * 3
            r += tmp2[bi]; g += tmp2[bi + 1]; b += tmp2[bi + 2]
            count++
          }
        }
        const bi = (y * width + x) * 3
        bright[bi] = r / count
        bright[bi + 1] = g / count
        bright[bi + 2] = b / count
      }
    }
  }

  // Screen blend: result = 1 - (1 - base) * (1 - bloom)
  for (let i = 0; i < width * height; i++) {
    const pi = i * 4
    const bi = i * 3
    const br = bright[bi] * strength / 255
    const bg = bright[bi + 1] * strength / 255
    const bb = bright[bi + 2] * strength / 255

    data[pi] = clamp(255 * (1 - (1 - data[pi] / 255) * (1 - br)))
    data[pi + 1] = clamp(255 * (1 - (1 - data[pi + 1] / 255) * (1 - bg)))
    data[pi + 2] = clamp(255 * (1 - (1 - data[pi + 2] / 255) * (1 - bb)))
  }

  ctx.putImageData(imageData, 0, 0)
}

export function applyLensFlare(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  effects: Effects,
) {
  const { lensFlareStyle, lensFlareX, lensFlareY, lensFlareIntensity, lensFlareTint } = effects
  if (lensFlareIntensity <= 0) return

  const x = (lensFlareX / 100) * width
  const y = (lensFlareY / 100) * height
  const alpha = lensFlareIntensity / 100
  const [tr, tg, tb] = hexToRgb(lensFlareTint)
  const tintStr = `${tr}, ${tg}, ${tb}`

  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  switch (lensFlareStyle) {
    case 'classic':
      drawClassicFlare(ctx, x, y, width, alpha, tintStr)
      break
    case 'anamorphic':
      drawAnamorphicFlare(ctx, x, y, width, height, alpha, tintStr)
      break
    case 'star':
      drawStarFlare(ctx, x, y, width, alpha, tintStr)
      break
    case 'sparkle':
      drawSparkleFlare(ctx, x, y, width, alpha, tintStr)
      break
    case 'streak':
      drawStreakFlare(ctx, x, y, width, alpha, tintStr)
      break
  }

  ctx.restore()
}

function drawClassicFlare(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  alpha: number, tint: string,
) {
  const baseSize = w * 0.15

  // Main glow
  const g1 = ctx.createRadialGradient(x, y, 0, x, y, baseSize)
  g1.addColorStop(0, `rgba(${tint}, ${alpha * 0.9})`)
  g1.addColorStop(0.3, `rgba(${tint}, ${alpha * 0.4})`)
  g1.addColorStop(1, `rgba(${tint}, 0)`)
  ctx.fillStyle = g1
  ctx.fillRect(x - baseSize, y - baseSize, baseSize * 2, baseSize * 2)

  // Secondary rings
  for (let i = 1; i <= 3; i++) {
    const dist = baseSize * (0.8 + i * 0.6)
    const size = baseSize * (0.3 - i * 0.05)
    const rx = x + (x - w / 2) * i * 0.3
    const ry = y + (y - w / 2) * i * 0.3
    const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, size)
    g.addColorStop(0, `rgba(${tint}, ${alpha * 0.3 / i})`)
    g.addColorStop(1, `rgba(${tint}, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(rx, ry, dist, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawAnamorphicFlare(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  alpha: number, tint: string,
) {
  // Long horizontal streak
  const g = ctx.createLinearGradient(0, y, w, y)
  g.addColorStop(0, `rgba(${tint}, 0)`)
  g.addColorStop(Math.max(0, x / w - 0.2), `rgba(${tint}, 0)`)
  g.addColorStop(x / w, `rgba(${tint}, ${alpha * 0.7})`)
  g.addColorStop(Math.min(1, x / w + 0.2), `rgba(${tint}, 0)`)
  g.addColorStop(1, `rgba(${tint}, 0)`)
  ctx.fillStyle = g
  ctx.fillRect(0, y - h * 0.02, w, h * 0.04)

  // Thinner center streak
  const g2 = ctx.createLinearGradient(0, y, w, y)
  g2.addColorStop(0, `rgba(${tint}, 0)`)
  g2.addColorStop(Math.max(0, x / w - 0.3), `rgba(${tint}, 0)`)
  g2.addColorStop(x / w, `rgba(${tint}, ${alpha * 0.4})`)
  g2.addColorStop(Math.min(1, x / w + 0.3), `rgba(${tint}, 0)`)
  g2.addColorStop(1, `rgba(${tint}, 0)`)
  ctx.fillStyle = g2
  ctx.fillRect(0, y - h * 0.005, w, h * 0.01)
}

function drawStarFlare(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  alpha: number, tint: string,
) {
  const size = w * 0.12
  const rays = 6

  // Center glow
  const gc = ctx.createRadialGradient(x, y, 0, x, y, size * 0.3)
  gc.addColorStop(0, `rgba(${tint}, ${alpha * 0.8})`)
  gc.addColorStop(1, `rgba(${tint}, 0)`)
  ctx.fillStyle = gc
  ctx.fillRect(x - size, y - size, size * 2, size * 2)

  // Sharp diagonal rays
  ctx.strokeStyle = `rgba(${tint}, ${alpha * 0.6})`
  ctx.lineWidth = 1.5
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size)
    ctx.stroke()
  }
}

function drawSparkleFlare(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  alpha: number, tint: string,
) {
  const size = w * 0.04

  // Tight bright point
  const g = ctx.createRadialGradient(x, y, 0, x, y, size)
  g.addColorStop(0, `rgba(${tint}, ${alpha})`)
  g.addColorStop(0.2, `rgba(${tint}, ${alpha * 0.6})`)
  g.addColorStop(1, `rgba(${tint}, 0)`)
  ctx.fillStyle = g
  ctx.fillRect(x - size, y - size, size * 2, size * 2)

  // Tiny cross spikes
  ctx.strokeStyle = `rgba(${tint}, ${alpha * 0.8})`
  ctx.lineWidth = 1
  const spikeLen = size * 2
  ctx.beginPath()
  ctx.moveTo(x - spikeLen, y); ctx.lineTo(x + spikeLen, y)
  ctx.moveTo(x, y - spikeLen); ctx.lineTo(x, y + spikeLen)
  ctx.stroke()
}

function drawStreakFlare(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  alpha: number, tint: string,
) {
  const size = w * 0.2

  // Soft light trail going right and slightly down
  const g = ctx.createLinearGradient(x, y, x + size, y + size * 0.15)
  g.addColorStop(0, `rgba(${tint}, ${alpha * 0.7})`)
  g.addColorStop(1, `rgba(${tint}, 0)`)
  ctx.fillStyle = g
  ctx.fillRect(x, y - size * 0.05, size, size * 0.1)

  // Small glow at origin
  const gc = ctx.createRadialGradient(x, y, 0, x, y, size * 0.15)
  gc.addColorStop(0, `rgba(${tint}, ${alpha * 0.5})`)
  gc.addColorStop(1, `rgba(${tint}, 0)`)
  ctx.fillStyle = gc
  ctx.fillRect(x - size * 0.15, y - size * 0.15, size * 0.3, size * 0.3)
}

export function applyLightLeak(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  effects: Effects,
) {
  const { lightLeakColor, lightLeakIntensity, lightLeakPosition } = effects
  if (lightLeakIntensity <= 0) return

  const [r, g, b] = hexToRgb(lightLeakColor)
  const alpha = lightLeakIntensity / 100

  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  let gradient: CanvasGradient
  switch (lightLeakPosition) {
    case 'top':
      gradient = ctx.createLinearGradient(0, 0, 0, height * 0.5)
      break
    case 'bottom':
      gradient = ctx.createLinearGradient(0, height, 0, height * 0.5)
      break
    case 'left':
      gradient = ctx.createLinearGradient(0, 0, width * 0.5, 0)
      break
    case 'right':
      gradient = ctx.createLinearGradient(width, 0, width * 0.5, 0)
      break
  }

  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`)
  gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`)
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}
