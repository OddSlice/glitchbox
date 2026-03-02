/**
 * Apply temperature shift, exposure adjustment, and unsharp mask sharpening
 * directly via canvas pixel manipulation.
 */
export function applyTemperatureExposureSharpness(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  temperature: number,
  exposure: number,
  sharpness: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Apply temperature and exposure
  if (temperature !== 0 || exposure !== 0) {
    const tempStrength = temperature / 100
    const warmR = tempStrength > 0 ? tempStrength * 30 : 0
    const warmG = tempStrength > 0 ? tempStrength * 10 : 0
    const coolB = tempStrength < 0 ? -tempStrength * 30 : 0
    const coolR = tempStrength < 0 ? tempStrength * 10 : 0

    const expFactor = Math.pow(2, exposure / 100)

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      r = r * expFactor
      g = g * expFactor
      b = b * expFactor

      r = r + warmR + coolR
      g = g + warmG
      b = b + coolB

      data[i] = clamp(r)
      data[i + 1] = clamp(g)
      data[i + 2] = clamp(b)
    }
  }

  // Apply sharpness via convolution kernel (faster than unsharp mask with separate blur)
  if (sharpness > 0) {
    applySharpnessKernel(data, width, height, sharpness / 100)
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Apply sharpening using a 3x3 convolution kernel.
 * This is much faster than the unsharp mask approach (blur + subtract)
 * because it only does a single pass over the pixels.
 */
function applySharpnessKernel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
) {
  // Sharpen kernel: center = 1 + 4*amount, edges = -amount
  // At amount=0: identity. At amount=1: strong sharpen.
  const a = amount * 1.5
  const center = 1 + 4 * a
  const edge = -a

  const len = data.length
  const original = new Uint8Array(len)
  original.set(data)

  const w4 = width * 4

  // Skip the 1px border to avoid bounds checks in the hot loop
  for (let y = 1; y < height - 1; y++) {
    const rowStart = y * w4
    for (let x = 1; x < width - 1; x++) {
      const i = rowStart + x * 4
      const top = i - w4
      const bot = i + w4

      for (let c = 0; c < 3; c++) {
        const ic = i + c
        const val =
          original[ic] * center +
          original[top + c] * edge +
          original[bot + c] * edge +
          original[ic - 4] * edge +
          original[ic + 4] * edge

        data[ic] = val < 0 ? 0 : val > 255 ? 255 : (val + 0.5) | 0
      }
    }
  }
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : (v + 0.5) | 0
}
