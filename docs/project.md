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

- **AI tab** with Gemini integration for AI-powered image editing:
  - Multiline text prompt for describing edits in plain English
  - Model dropdown selector driven by `/src/config/models.ts` config array
  - Sends full-resolution image (via offscreen canvas at original dimensions) + user prompt to Gemini API
  - Writes returned AI-edited image back to canvas, resetting adjustments/effects
  - Loading state: button shows "Processing..." and inputs disabled during API call
  - Error state: red error message displayed below prompt on failure
  - Missing API key state: amber info banner with setup instructions, Apply button hidden
  - Disabled state: Apply button disabled when no image loaded or model unavailable
  - Keyboard shortcut: Cmd/Ctrl+Enter to apply
- **Model configuration** (`/src/config/models.ts`):
  - Array of `ModelConfig` objects: `{ id, name, provider, apiKeyLabel, available }`
  - Adding a new model = adding one entry to the array (see "Adding a new AI model" below)
  - Currently configured:
    - **Gemini 2.5 Flash** (google) — available
    - **Gemini 3.1 Flash Preview** (google) — available
    - **GPT Image 1.5** (openai) — available
    - **Seedream** (seedream) — coming soon
    - **Qwen** (qwen) — coming soon
  - Unavailable models show "Coming soon" in the dropdown
- **API services**:
  - `/src/lib/ai/gemini.ts` — Gemini service using `@google/genai` SDK. Sends image + prompt, parses response for inline image data. Also handles Style Transfer (two-image call with system instruction).
  - `/src/lib/ai/openai.ts` — OpenAI service using `openai` SDK (browser mode). Converts base64 to File, calls `images.edit()`, returns b64_json response.
  - Provider routing in `AIPanel.tsx` — selects the correct service based on `model.provider`
- **Style Transfer** feature:
  - Second upload zone in the AI tab for a style reference image (drop zone or click to upload)
  - "Transfer Style" button sends both source image (full-resolution offscreen canvas) and style reference to Gemini
  - Uses a baked-in two-step system prompt: Step 1 analyses the style reference in exhaustive detail (color palette, texture, grain, lighting, contrast, color grading, artistic style, edge treatment, effects, mood), Step 2 applies all identified characteristics to the source image while preserving content/composition
  - System prompt passed as `config.systemInstruction` to the Gemini API
  - Result written back to canvas with undo history support (Ctrl+Z to revert)
  - Same loading state ("Processing...") and error handling as the AI prompt apply
  - Clear/remove button on style reference preview to swap images
  - Disabled when no source image loaded, no style reference uploaded, or model unavailable
- **Password-gated access**:
  - AI tab is locked behind a password when `VITE_AI_PASSWORD_HASH` env var is set
  - Password is never stored in the frontend — only its SHA-256 hash is in the env var
  - Client-side hashing via `crypto.subtle.digest('SHA-256', ...)` compares input hash to stored hash
  - Unlock state persists in `sessionStorage` (lasts until the browser tab is closed)
  - Lock screen shows a lock icon, "Ask the owner for the password" hint, and a password input
  - If `VITE_AI_PASSWORD_HASH` is empty or missing, the AI tab is fully open (no gate)

### Step 4: Polish — Undo/Redo, Full-Res Export, Before/After, Performance (complete)

- **Undo/Redo**:
  - Two-stack model (`past`/`future` arrays) in Zustand store, capped at 50 snapshots
  - Each snapshot stores `{ adjustments, effects, activePreset }`
  - Debounced at 300ms — slider drags produce one history entry per drag, not per tick
  - Discrete operations (preset apply, reset) push immediately
  - Keyboard shortcuts: **Ctrl+Z** (undo), **Ctrl+Shift+Z** / **Ctrl+Y** (redo)
  - Two icon buttons in the top bar (undo/redo arrows), greyed out when unavailable
  - History resets on new image upload
- **Export at original resolution**:
  - Export creates an offscreen canvas at `image.naturalWidth x naturalHeight`
  - Full pipeline (CSS filters -> pixel manipulation -> effects) applied at original size
  - Uses `canvas.toBlob()` for efficient download
  - Display canvas stays at scaled-down size for performance
  - Shared `renderToCanvas()` utility (`/src/lib/renderPipeline.ts`) used by display, export, and AI
  - Export button flashes "Exported ✓" for 2 seconds after successful download
- **Before/After toggle**:
  - "Before" button in the top bar, between undo/redo and Upload
  - Hold (mousedown) to show original unedited image; release to return to edited
  - Short click (<300ms) toggles on/off for accessibility
  - Active state shows amber styling
  - Instant swap — no re-render, just draws raw image without filters/effects
- **Performance pipeline cache**:
  - Caches fully rendered `ImageData` + the parameters that produced it
  - On re-render, if adjustments + effects + dimensions unchanged -> `putImageData` from cache (skips entire pipeline)
  - Cache cleared on image change
  - Freezes random effects (film grain, VHS noise) to stable patterns — standard for static image editors
  - Combined with existing RAF cancellation for smooth slider interaction

## Environment setup

To use the AI tab, you need a Gemini API key:

1. Get a Gemini API key at https://aistudio.google.com/apikey and/or an OpenAI API key at https://platform.openai.com/api-keys
2. Copy `.env.example` to `.env` in the project root
3. Replace the placeholder values with your actual keys
4. Restart the dev server (`npm run dev`)

```
VITE_GEMINI_API_KEY=your_actual_gemini_key_here
VITE_OPENAI_API_KEY=your_actual_openai_key_here
```

The `.env` file is gitignored and will not be committed.

For future providers (OpenAI, Seedream, Qwen), add additional env vars:

```
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_SEEDREAM_API_KEY=your_seedream_key_here
VITE_QWEN_API_KEY=your_qwen_key_here
```

## Adding a new AI model

To add a new AI model to the dropdown:

1. **Add an entry to `/src/config/models.ts`**:
   ```typescript
   {
     id: 'your-model-id',        // API model identifier
     name: 'Display Name',       // shown in the dropdown
     provider: 'provider-name',  // e.g. 'openai', 'stability'
     apiKeyLabel: 'VITE_YOUR_API_KEY', // env var name for the API key
     available: false,           // set to true once the service is wired up
   }
   ```

2. **Create a service file** at `/src/lib/ai/your-provider.ts` that exports an async function matching the same pattern as `gemini.ts` — takes `(imageBase64, mimeType, prompt, apiKey, modelId)` and returns `{ imageBase64, mimeType }`.

3. **Update `AIPanel.tsx`** to import your service and call it when the selected model's provider matches. Currently the `handleApply` function calls `editImageWithGemini` directly — add a conditional branch for your provider.

4. **Set `available: true`** in the models config once the service is working.

5. **Add the env var** to `.env.example` so other developers know to set it up.

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z / Ctrl+Y | Redo |
| Cmd/Ctrl+Enter | Apply AI edit (in AI tab) |

## What's coming next

- Crop and rotate tools
- Layer support
- Seedream and Qwen integration (model entries already in dropdown)

## Known issues

- **Temperature model is simplified**: Uses a linear additive shift rather than a proper Kelvin-to-RGB curve.
- **Film grain is non-deterministic**: Grain pattern changes on each re-render since it uses Math.random(). A seeded PRNG would make it stable. (Mitigated by pipeline cache which freezes the pattern.)
- **Large image export/AI can be slow**: Exporting or sending very large images (e.g., 6000x4000) runs the full effects pipeline at original resolution, which can take several seconds for expensive effects like blur and bloom.
