import { useCallback, useRef, useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { models, type ModelConfig } from '../config/models'
import { editImageWithGemini, styleTransferWithGemini } from '../lib/ai/gemini'
import { editImageWithOpenAI } from '../lib/ai/openai'
import { renderToCanvas } from '../lib/renderPipeline'

/** Check which provider keys are available */
const apiKeys: Record<string, string | undefined> = {
  google: import.meta.env.VITE_GEMINI_API_KEY as string | undefined,
  openai: import.meta.env.VITE_OPENAI_API_KEY as string | undefined,
}

function getApiKeyForModel(model: ModelConfig): string | undefined {
  return apiKeys[model.provider]
}

function hasAnyApiKey(): boolean {
  return Object.values(apiKeys).some(Boolean)
}

export function AIPanel() {
  const image = useEditorStore((s) => s.image)
  const resetAll = useEditorStore((s) => s.resetAll)

  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(models[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Style Transfer state
  const [styleImage, setStyleImage] = useState<string | null>(null) // base64 data URL
  const [styleMimeType, setStyleMimeType] = useState<string>('image/png')
  const [styleLoading, setStyleLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const styleInputRef = useRef<HTMLInputElement>(null)

  const hasImage = image !== null
  const isModelAvailable = selectedModel.available
  const hasKey = !!getApiKeyForModel(selectedModel)
  const hasAnyKey = hasAnyApiKey()
  const canApply = hasKey && hasImage && isModelAvailable && prompt.trim().length > 0 && !loading && !styleLoading
  // Style transfer only works with Gemini models (needs system instruction + two-image call)
  const isGeminiModel = selectedModel.provider === 'google'
  const canStyleTransfer = hasKey && hasImage && isModelAvailable && isGeminiModel && styleImage !== null && !loading && !styleLoading

  const handleApply = async () => {
    if (!canApply) return

    setLoading(true)
    setError(null)

    try {
      // Render at original resolution using offscreen canvas
      const { image, adjustments, effects } = useEditorStore.getState()
      if (!image) throw new Error('No image loaded')

      const w = image.naturalWidth
      const h = image.naturalHeight

      const offscreen = document.createElement('canvas')
      offscreen.width = w
      offscreen.height = h
      const ctx = offscreen.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Could not create offscreen canvas')

      renderToCanvas(ctx, image, w, h, adjustments, effects)

      const dataUrl = offscreen.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]

      const apiKey = getApiKeyForModel(selectedModel)
      if (!apiKey) {
        throw new Error(`API key for ${selectedModel.provider} is not set.`)
      }

      // Route to the correct provider
      let result: { imageBase64: string; mimeType: string }

      if (selectedModel.provider === 'openai') {
        result = await editImageWithOpenAI(
          base64,
          'image/png',
          prompt.trim(),
          apiKey,
          selectedModel.id,
        )
      } else {
        result = await editImageWithGemini(
          base64,
          'image/png',
          prompt.trim(),
          apiKey,
          selectedModel.id,
        )
      }

      // Load the returned image and write it back to the canvas
      const img = new window.Image()
      img.onload = () => {
        resetAll()
        useEditorStore.getState().setImage(img, 'ai-edit.png')
        setPrompt('')
      }
      img.onerror = () => {
        setError('Failed to load the AI-edited image')
        setLoading(false)
      }
      img.src = `data:${result.mimeType};base64,${result.imageBase64}`
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // --- Style Transfer ---

  const loadStyleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setStyleImage(dataUrl)
      setStyleMimeType(file.type || 'image/png')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleStyleUpload = () => {
    styleInputRef.current?.click()
  }

  const handleStyleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadStyleFile(file)
    if (styleInputRef.current) styleInputRef.current.value = ''
  }

  const handleStyleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadStyleFile(file)
  }

  const handleStyleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleStyleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleClearStyle = () => {
    setStyleImage(null)
    setStyleMimeType('image/png')
  }

  const handleStyleTransfer = async () => {
    if (!canStyleTransfer || !styleImage) return

    setStyleLoading(true)
    setError(null)

    try {
      const { image, adjustments, effects } = useEditorStore.getState()
      if (!image) throw new Error('No image loaded')

      const w = image.naturalWidth
      const h = image.naturalHeight

      const offscreen = document.createElement('canvas')
      offscreen.width = w
      offscreen.height = h
      const ctx = offscreen.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Could not create offscreen canvas')

      renderToCanvas(ctx, image, w, h, adjustments, effects)

      const sourceDataUrl = offscreen.toDataURL('image/png')
      const sourceBase64 = sourceDataUrl.split(',')[1]

      const styleBase64 = styleImage.split(',')[1]

      const apiKey = getApiKeyForModel(selectedModel)
      if (!apiKey) {
        throw new Error(`API key for ${selectedModel.provider} is not set.`)
      }

      const result = await styleTransferWithGemini(
        sourceBase64,
        'image/png',
        styleBase64,
        styleMimeType,
        apiKey,
        selectedModel.id,
      )

      const img = new window.Image()
      img.onload = () => {
        resetAll()
        useEditorStore.getState().setImage(img, 'style-transfer.png')
      }
      img.onerror = () => {
        setError('Failed to load the style-transferred image')
        setStyleLoading(false)
      }
      img.src = `data:${result.mimeType};base64,${result.imageBase64}`
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setStyleLoading(false)
    }
  }

  const isProcessing = loading || styleLoading

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* API key missing banner */}
        {!hasAnyKey && (
          <div className="text-[11px] text-amber bg-amber/10 border border-amber/20 rounded px-3 py-2.5 leading-relaxed">
            To use AI editing, add your API key to the <code className="bg-amber/10 px-1 rounded">.env</code> file and restart the dev server. See <code className="bg-amber/10 px-1 rounded">docs/project.md</code> for setup instructions.
          </div>
        )}

        {/* Per-model key missing hint */}
        {hasAnyKey && isModelAvailable && !hasKey && (
          <div className="text-[11px] text-amber bg-amber/10 border border-amber/20 rounded px-3 py-2.5 leading-relaxed">
            This model requires <code className="bg-amber/10 px-1 rounded">{selectedModel.apiKeyLabel}</code> in your <code className="bg-amber/10 px-1 rounded">.env</code> file. Add it and restart the dev server.
          </div>
        )}

        {/* Model selector */}
        <div>
          <h3 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-3">
            Model
          </h3>
          <select
            value={selectedModel.id}
            onChange={(e) => {
              const model = models.find((m) => m.id === e.target.value)
              if (model) setSelectedModel(model)
            }}
            className="w-full bg-bg-lighter border border-border rounded px-3 py-2 text-xs text-text focus:outline-none focus:border-amber/40 cursor-pointer appearance-none"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}{!model.available ? ' — Coming soon' : ''}
              </option>
            ))}
          </select>
          {!isModelAvailable && (
            <p className="text-[10px] text-text-dim/50 mt-1.5">
              This model is not yet wired up. Select an available model to use AI editing.
            </p>
          )}
        </div>

        {/* Prompt input */}
        <div>
          <h3 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-3">
            Prompt
          </h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canApply) {
                handleApply()
              }
            }}
            placeholder="Describe how you want to edit your image... e.g. make it look like a sunset, add a moody dark atmosphere"
            disabled={!hasKey || !hasImage || !isModelAvailable || isProcessing}
            rows={5}
            className="w-full bg-bg-lighter border border-border rounded px-3 py-2.5 text-xs text-text leading-relaxed placeholder:text-text-dim/40 focus:outline-none focus:border-amber/40 resize-none disabled:opacity-40 disabled:cursor-not-allowed"
          />
          {hasKey && hasImage && isModelAvailable && (
            <p className="text-[10px] text-text-dim/40 mt-1.5">
              Cmd+Enter to apply
            </p>
          )}
        </div>

        {/* Divider + Style Transfer section (Gemini only) */}
        {hasAnyKey && (
          <>
            <div className="border-t border-border" />

            <div>
              <h3 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-3">
                Style Transfer
              </h3>

              {!isGeminiModel && isModelAvailable && (
                <p className="text-[10px] text-text-dim/50 mb-2">
                  Style Transfer is currently available with Gemini models only. Select a Gemini model to use this feature.
                </p>
              )}

              {/* Style reference drop zone / preview */}
              {styleImage ? (
                <div className="relative">
                  <img
                    src={styleImage}
                    alt="Style reference"
                    className="w-full h-32 object-cover rounded border border-border"
                  />
                  <button
                    onClick={handleClearStyle}
                    disabled={isProcessing}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-bg/80 border border-border text-text-dim hover:text-text hover:bg-bg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30"
                    title="Remove style reference"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onClick={handleStyleUpload}
                  onDrop={handleStyleDrop}
                  onDragOver={handleStyleDragOver}
                  onDragLeave={handleStyleDragLeave}
                  className={`h-24 rounded border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-amber bg-amber/5'
                      : 'border-border hover:border-amber/40 hover:bg-bg-lighter/50'
                  } ${(!hasImage || !isModelAvailable || !isGeminiModel || isProcessing) ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim/50">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-[10px] text-text-dim/50 text-center px-2">
                    Drop style reference here or click to upload
                  </span>
                </div>
              )}

              <input
                ref={styleInputRef}
                type="file"
                accept="image/*"
                onChange={handleStyleFileChange}
                className="hidden"
              />

              {/* Transfer Style button */}
              <button
                onClick={handleStyleTransfer}
                disabled={!canStyleTransfer}
                title={
                  !isGeminiModel
                    ? 'Style Transfer requires a Gemini model'
                    : !styleImage
                      ? 'Upload a style reference image first'
                      : undefined
                }
                className="w-full mt-3 py-2.5 text-xs font-semibold rounded bg-amber text-bg hover:bg-amber-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {styleLoading ? 'Processing...' : 'Transfer Style'}
              </button>
            </div>
          </>
        )}

        {/* Error message */}
        {error && (
          <div className="text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2 leading-relaxed">
            {error}
          </div>
        )}

        {/* Info note when no image */}
        {hasAnyKey && !hasImage && (
          <div className="text-[11px] text-text-dim/50 text-center py-4">
            Upload an image to start using AI editing
          </div>
        )}
      </div>

      {/* Fixed bottom: Apply button — hidden when no API keys at all */}
      {hasAnyKey && (
        <div className="shrink-0 p-4 border-t border-border">
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="w-full py-2.5 text-xs font-semibold rounded bg-amber text-bg hover:bg-amber-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Processing...' : 'Apply'}
          </button>
        </div>
      )}
    </div>
  )
}
