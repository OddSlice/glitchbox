import type { Adjustments, Effects } from '../store/useEditorStore'

export interface Preset {
  id: string
  name: string
  description: string
  adjustments: Partial<Adjustments>
  effects: Partial<Effects>
}

export const presets: Preset[] = [
  {
    id: 'lofi',
    name: 'Lofi',
    description: 'Warm, faded, low-fidelity',
    adjustments: { temperature: 30 },
    effects: { filmGrainIntensity: 60, filmGrainSize: 2, vignetteIntensity: 40 },
  },
  {
    id: 'retro-90s',
    name: 'Retro 90s',
    description: 'Nostalgic dithered aesthetic',
    adjustments: {},
    effects: {
      ditherStyle: 'floyd-steinberg',
      ditherPalette: 'retro',
      ditherIntensity: 70,
      crtScanLines: 40,
      sepia: 30,
    },
  },
  {
    id: 'glitch-art',
    name: 'Glitch Art',
    description: 'Digital corruption',
    adjustments: {},
    effects: { rgbShift: 30, pixelSort: 50, vhsNoise: 40 },
  },
  {
    id: 'film-noir',
    name: 'Film Noir',
    description: 'High-contrast black & white',
    adjustments: { contrast: 120, sharpness: 60 },
    effects: { grayscale: 100, vignetteIntensity: 70, vignetteSpread: 40 },
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Neon retro-futurism',
    adjustments: { temperature: -20 },
    effects: {
      ditherStyle: 'ordered',
      ditherPalette: 'neon',
      ditherIntensity: 60,
      bloomIntensity: 50,
    },
  },
  {
    id: 'raw-film',
    name: 'Raw Film',
    description: 'Analog film stock',
    adjustments: {},
    effects: {
      filmGrainIntensity: 80,
      filmGrainSize: 2,
      lightLeakColor: '#ff8c42',
      lightLeakIntensity: 50,
      lightLeakPosition: 'top',
      gaussianBlur: 2,
    },
  },
  {
    id: 'crisp',
    name: 'Crisp',
    description: 'Sharp and vivid',
    adjustments: { sharpness: 80, contrast: 130, exposure: 20 },
    effects: {},
  },
]
