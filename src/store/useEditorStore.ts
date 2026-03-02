import { create } from 'zustand'

export interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
  hue: number
  temperature: number
  exposure: number
  sharpness: number
}

export const defaultAdjustments: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  temperature: 0,
  exposure: 0,
  sharpness: 0,
}

export type DitherStyle = 'ordered' | 'floyd-steinberg' | 'noise'
export type DitherPalette = 'retro' | 'monochrome' | 'neon' | 'handheld'
export type LensFlareStyle = 'classic' | 'anamorphic' | 'star' | 'sparkle' | 'streak'
export type LightLeakPosition = 'top' | 'bottom' | 'left' | 'right'

export interface Effects {
  // Texture
  filmGrainIntensity: number
  filmGrainSize: number
  gaussianBlur: number
  pixelation: number

  // Tone
  vignetteIntensity: number
  vignetteSpread: number
  sepia: number
  grayscale: number

  // Dither
  ditherStyle: DitherStyle
  ditherScale: number
  ditherPalette: DitherPalette
  ditherIntensity: number

  // Glitch
  rgbShift: number
  crtScanLines: number
  pixelSort: number
  vhsNoise: number

  // Light
  lensFlareStyle: LensFlareStyle
  lensFlareX: number
  lensFlareY: number
  lensFlareIntensity: number
  lensFlareTint: string
  bloomIntensity: number
  bloomSpread: number
  lightLeakColor: string
  lightLeakIntensity: number
  lightLeakPosition: LightLeakPosition
}

export const defaultEffects: Effects = {
  filmGrainIntensity: 0,
  filmGrainSize: 1,
  gaussianBlur: 0,
  pixelation: 1,

  vignetteIntensity: 0,
  vignetteSpread: 50,
  sepia: 0,
  grayscale: 0,

  ditherStyle: 'ordered',
  ditherScale: 4,
  ditherPalette: 'retro',
  ditherIntensity: 0,

  rgbShift: 0,
  crtScanLines: 0,
  pixelSort: 0,
  vhsNoise: 0,

  lensFlareStyle: 'classic',
  lensFlareX: 50,
  lensFlareY: 50,
  lensFlareIntensity: 0,
  lensFlareTint: '#ffffff',
  bloomIntensity: 0,
  bloomSpread: 50,
  lightLeakColor: '#ff6b35',
  lightLeakIntensity: 0,
  lightLeakPosition: 'top',
}

export type TabId = 'adjust' | 'effects' | 'presets' | 'ai'

interface EditorState {
  image: HTMLImageElement | null
  fileName: string | null
  adjustments: Adjustments
  effects: Effects
  activeTab: TabId
  activePreset: string | null

  setImage: (img: HTMLImageElement, fileName: string) => void
  setAdjustment: <K extends keyof Adjustments>(key: K, value: Adjustments[K]) => void
  setEffect: <K extends keyof Effects>(key: K, value: Effects[K]) => void
  resetAdjustments: () => void
  resetEffects: () => void
  resetAll: () => void
  setActiveTab: (tab: TabId) => void
  applyPreset: (presetId: string, adjustments: Partial<Adjustments>, effects: Partial<Effects>) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  image: null,
  fileName: null,
  adjustments: { ...defaultAdjustments },
  effects: { ...defaultEffects },
  activeTab: 'adjust',
  activePreset: null,

  setImage: (img, fileName) => set({ image: img, fileName }),

  setAdjustment: (key, value) =>
    set((state) => ({
      adjustments: { ...state.adjustments, [key]: value },
      activePreset: null,
    })),

  setEffect: (key, value) =>
    set((state) => ({
      effects: { ...state.effects, [key]: value },
      activePreset: null,
    })),

  resetAdjustments: () => set({ adjustments: { ...defaultAdjustments } }),

  resetEffects: () => set({ effects: { ...defaultEffects } }),

  resetAll: () => set({
    adjustments: { ...defaultAdjustments },
    effects: { ...defaultEffects },
    activePreset: null,
  }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  applyPreset: (presetId, adjustments, effects) =>
    set({
      adjustments: { ...defaultAdjustments, ...adjustments },
      effects: { ...defaultEffects, ...effects },
      activePreset: presetId,
    }),
}))
