# Glitchbox

Glitchbox is a professional browser-based image editing tool built with React, TypeScript, and HTML5 Canvas, designed to feel like desktop editing software (Lightroom/Photoshop style).

## What's been built

### Step 1: Foundation & Adjust tab (complete)

- Project scaffolding: Vite + React + TypeScript + Tailwind CSS v4 + Zustand
- Dark UI shell: fixed top bar (logo, upload, export), large canvas area, 320px right sidebar
- Four-tab sidebar (Adjust, Effects, Presets, AI)
- **Adjust tab** with two slider groups:
  - Light & Color: Brightness, Contrast, Saturation, Hue, Temperature, Exposure
  - Detail: Sharpness
- Real-time image processing via HTML5 Canvas:
  - CSS filters for brightness, contrast, saturation, hue-rotate
  - Pixel manipulation for temperature (warm/cool color shift), exposure (multiplicative luminance), and sharpness (convolution kernel)
- Image upload via file picker or drag-and-drop with a styled drop zone
- PNG export of the current canvas state
- Reset All button to restore defaults
- Responsive canvas sizing with ResizeObserver

### Step 2: Effects tab & Presets tab (complete)

- **Effects tab** with 5 groups, all real-time canvas pixel manipulation:
  - **Texture**: Film Grain (intensity + size), Gaussian Blur (3-pass box blur approximation), Pixelation (block averaging)
  - **Tone**: Vignette (intensity + spread), Sepia (matrix transform), Grayscale (luminance blend)
  - **Dither**: 3 styles (Ordered/Bayer 8x8, Floyd-Steinberg error diffusion, Noise), 4 palettes (Retro, Monochrome, Neon, Handheld/Game Boy), intensity + scale controls
  - **Glitch**: RGB Shift (chromatic aberration), CRT Scan Lines, Pixel Sort (brightness-based row sorting), VHS Noise (band distortion + static)
  - **Light**: Lens Flare (5 styles: Classic, Anamorphic, Star, Sparkle, Streak) with position/tint controls, Bloom/Glow (bright area extraction + blur + screen blend), Light Leak (edge gradient overlay with color picker + position selector)
- Effects stack on top of Adjust values in the render pipeline
- New UI controls: PickerControl (segmented buttons for enums), ColorPicker (native color input with swatch)
- **Presets tab** with 7 one-click presets:
  - Lofi, Retro 90s, Glitch Art, Film Noir, Vaporwave, Raw Film, Crisp
  - Each applies a fixed combination of adjust + effects values
  - Active preset highlighted with amber border
  - Manual slider changes clear preset selection
- Reset All button on all tabs resets both adjustments and effects

### Step 3: AI tab (complete)

- **AI tab** with Gemini 2.0 Flash integration for AI-powered image editing:
  - Multiline text prompt for describing edits in plain English
  - Model dropdown selector driven by `/src/config/models.ts` config array
  - Sends current canvas state as base64 PNG + user prompt to Gemini API
  - Writes returned AI-edited image back to canvas, resetting adjustments/effects
  - Loading state: button shows "Processing..." and inputs disabled during API call
  - Error state: red error message displayed below prompt on failure
  - Disabled state: Apply button disabled when no image is loaded
  - Keyboard shortcut: Cmd/Ctrl+Enter to apply
- **Model configuration** (`/src/config/models.ts`):
  - Array of `ModelConfig` objects: `{ id, name, provider, apiKeyLabel }`
  - Adding a new model = adding one entry to the array
  - Currently: Gemini 2.0 Flash (`gemini-2.0-flash-exp`)
- **API service** (`/src/lib/ai/gemini.ts`):
  - Pure async function using `@google/generative-ai` SDK
  - Sends image + prompt with `responseModalities: ['IMAGE', 'TEXT']`
  - Parses response for image part; falls back to text error message if no image returned

## Environment setup

To use the AI tab, you need a Gemini API key:

1. Get an API key at https://aistudio.google.com/apikey
2. Copy `.env.example` to `.env` in the project root
3. Replace `your_gemini_api_key_here` with your actual key
4. Restart the dev server (`npm run dev`)

```
VITE_GEMINI_API_KEY=your_actual_key_here
```

The `.env` file is gitignored and will not be committed.

## What's coming next

- Undo/redo history
- Crop and rotate tools
- Before/after comparison view
- Layer support
- Additional AI models (add entries to `/src/config/models.ts`)

## Known issues

- **Performance with multiple expensive effects**: Effects like Gaussian Blur, Bloom, and Dithering each do their own getImageData/putImageData. With many active simultaneously on large images, frame time can increase. Web Workers or WebGL would help.
- **Temperature model is simplified**: Uses a linear additive shift rather than a proper Kelvin-to-RGB curve.
- **No undo/redo**: Slider changes are immediate with no history stack.
- **Export resolution**: Export uses display-scaled canvas dimensions, not original image resolution.
- **Film grain is non-deterministic**: Grain pattern changes on each re-render since it uses Math.random(). A seeded PRNG would make it stable.
- **AI sends display-scaled image**: The AI receives the canvas at display resolution, not original image resolution.
