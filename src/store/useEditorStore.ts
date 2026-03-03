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

// --- Undo/Redo types ---

interface Snapshot {
  adjustments: Adjustments
  effects: Effects
  activePreset: string | null
}

const MAX_HISTORY = 50

interface EditorState {
  image: HTMLImageElement | null
  fileName: string | null
  adjustments: Adjustments
  effects: Effects
  activeTab: TabId
  activePreset: string | null

  // Undo/Redo
  past: Snapshot[]
  future: Snapshot[]
  canUndo: boolean
  canRedo: boolean

  // Before/After
  showOriginal: boolean

  setImage: (img: HTMLImageElement, fileName: string) => void
  setAdjustment: <K extends keyof Adjustments>(key: K, value: Adjustments[K]) => void
  setEffect: <K extends keyof Effects>(key: K, value: Effects[K]) => void
  resetAdjustments: () => void
  resetEffects: () => void
  resetAll: () => void
  setActiveTab: (tab: TabId) => void
  applyPreset: (presetId: string, adjustments: Partial<Adjustments>, effects: Partial<Effects>) => void

  // History actions (internal)
  _commitToHistory: (snapshot: Snapshot) => void
  undo: () => void
  redo: () => void

  // Before/After
  setShowOriginal: (v: boolean) => void
}

// --- Module-level debounce for history ---

let pendingSnapshot: Snapshot | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function captureSnapshot(): Snapshot {
  const { adjustments, effects, activePreset } = useEditorStore.getState()
  return {
    adjustments: { ...adjustments },
    effects: { ...effects },
    activePreset,
  }
}

function commitPending() {
  if (pendingSnapshot) {
    useEditorStore.getState()._commitToHistory(pendingSnapshot)
    pendingSnapshot = null
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

/** Debounced history push — call on every slider tick. Captures pre-change state on first call. */
export function pushHistory() {
  if (!pendingSnapshot) {
    pendingSnapshot = captureSnapshot()
  }
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    commitPending()
  }, 300)
}

/** Immediate history push — call before discrete operations (preset, reset). */
export function pushHistoryImmediate() {
  commitPending() // flush any pending slider changes first
  const snapshot = captureSnapshot()
  useEditorStore.getState()._commitToHistory(snapshot)
}

// --- Store ---

export const useEditorStore = create<EditorState>((set) => ({
  image: null,
  fileName: null,
  adjustments: { ...defaultAdjustments },
  effects: { ...defaultEffects },
  activeTab: 'adjust',
  activePreset: null,

  // Undo/Redo initial state
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  // Before/After
  showOriginal: false,

  setImage: (img, fileName) => {
    // Flush any pending history before image change
    commitPending()
    set({
      image: img,
      fileName,
      adjustments: { ...defaultAdjustments },
      effects: { ...defaultEffects },
      activePreset: null,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
      showOriginal: false,
    })
  },

  setAdjustment: (key, value) => {
    pushHistory()
    set((state) => ({
      adjustments: { ...state.adjustments, [key]: value },
      activePreset: null,
    }))
  },

  setEffect: (key, value) => {
    pushHistory()
    set((state) => ({
      effects: { ...state.effects, [key]: value },
      activePreset: null,
    }))
  },

  resetAdjustments: () => {
    pushHistoryImmediate()
    set({ adjustments: { ...defaultAdjustments } })
  },

  resetEffects: () => {
    pushHistoryImmediate()
    set({ effects: { ...defaultEffects } })
  },

  resetAll: () => {
    pushHistoryImmediate()
    set({
      adjustments: { ...defaultAdjustments },
      effects: { ...defaultEffects },
      activePreset: null,
    })
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  applyPreset: (presetId, adjustments, effects) => {
    pushHistoryImmediate()
    set({
      adjustments: { ...defaultAdjustments, ...adjustments },
      effects: { ...defaultEffects, ...effects },
      activePreset: presetId,
    })
  },

  // --- History internals ---

  _commitToHistory: (snapshot) =>
    set((state) => {
      const newPast = [...state.past, snapshot]
      if (newPast.length > MAX_HISTORY) newPast.shift()
      return {
        past: newPast,
        future: [],
        canUndo: true,
        canRedo: false,
      }
    }),

  undo: () => {
    // Flush any pending debounce so the current state is saved
    commitPending()
    set((state) => {
      if (state.past.length === 0) return state
      const newPast = [...state.past]
      const snapshot = newPast.pop()!
      const currentSnapshot: Snapshot = {
        adjustments: { ...state.adjustments },
        effects: { ...state.effects },
        activePreset: state.activePreset,
      }
      return {
        past: newPast,
        future: [...state.future, currentSnapshot],
        adjustments: { ...snapshot.adjustments },
        effects: { ...snapshot.effects },
        activePreset: snapshot.activePreset,
        canUndo: newPast.length > 0,
        canRedo: true,
      }
    })
  },

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state
      const newFuture = [...state.future]
      const snapshot = newFuture.pop()!
      const currentSnapshot: Snapshot = {
        adjustments: { ...state.adjustments },
        effects: { ...state.effects },
        activePreset: state.activePreset,
      }
      return {
        past: [...state.past, currentSnapshot],
        future: newFuture,
        adjustments: { ...snapshot.adjustments },
        effects: { ...snapshot.effects },
        activePreset: snapshot.activePreset,
        canUndo: true,
        canRedo: newFuture.length > 0,
      }
    }),

  setShowOriginal: (v) => set({ showOriginal: v }),
}))
