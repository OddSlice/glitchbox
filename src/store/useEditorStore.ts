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

export type TabId = 'adjust' | 'effects' | 'presets' | 'ai'

interface EditorState {
  image: HTMLImageElement | null
  fileName: string | null
  adjustments: Adjustments
  activeTab: TabId

  setImage: (img: HTMLImageElement, fileName: string) => void
  setAdjustment: <K extends keyof Adjustments>(key: K, value: Adjustments[K]) => void
  resetAdjustments: () => void
  setActiveTab: (tab: TabId) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  image: null,
  fileName: null,
  adjustments: { ...defaultAdjustments },
  activeTab: 'adjust',

  setImage: (img, fileName) => set({ image: img, fileName }),

  setAdjustment: (key, value) =>
    set((state) => ({
      adjustments: { ...state.adjustments, [key]: value },
    })),

  resetAdjustments: () => set({ adjustments: { ...defaultAdjustments } }),

  setActiveTab: (tab) => set({ activeTab: tab }),
}))
