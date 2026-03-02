# Glitchbox

Glitchbox is a professional browser-based image editing tool built with React, TypeScript, and HTML5 Canvas, designed to feel like desktop editing software (Lightroom/Photoshop style).

## What's been built

**Foundation & Adjust tab (v0.1)**

- Project scaffolding: Vite + React + TypeScript + Tailwind CSS v4 + Zustand
- Dark UI shell: fixed top bar (logo, upload, export), large canvas area, 320px right sidebar
- Four-tab sidebar (Adjust, Effects, Presets, AI) — only Adjust is active; others show "coming soon"
- **Adjust tab** with two slider groups:
  - Light & Color: Brightness, Contrast, Saturation, Hue, Temperature, Exposure
  - Detail: Sharpness
- Real-time image processing via HTML5 Canvas:
  - CSS filters for brightness, contrast, saturation, hue-rotate
  - Pixel manipulation for temperature (warm/cool color shift), exposure (multiplicative luminance), and sharpness (unsharp mask)
- Image upload via file picker or drag-and-drop with a styled drop zone
- PNG export of the current canvas state
- Reset All button to restore defaults
- Responsive canvas sizing with ResizeObserver

## What's coming next

- **Effects tab**: Grain, vignette, blur, glitch/distortion effects
- **Presets tab**: One-click adjustment presets (e.g., "Film", "Fade", "Vibrant")
- **AI tab**: AI-powered features (auto-enhance, background removal, style transfer)
- Undo/redo history
- Crop and rotate tools
- Before/after comparison view
- Layer support

## Known issues

- **Sharpness on large images**: The unsharp mask uses a simple 3x3 box blur kernel. For very large images this can be slow since it runs on the main thread. A Web Worker or WebGL approach would be better for production.
- **Temperature model is simplified**: Real color temperature adjustment should use a proper Kelvin-to-RGB curve; the current version uses a linear additive shift which is approximate but visually reasonable.
- **No undo/redo**: Slider changes are immediate with no history stack. This should be added before the Effects tab ships.
- **Export resolution**: Export uses the display-scaled canvas dimensions, not the original image resolution. For full-res export, a separate off-screen canvas at native resolution would be needed.
