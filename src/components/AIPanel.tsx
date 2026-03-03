import { useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { models, type ModelConfig } from '../config/models'
import { editImageWithGemini } from '../lib/ai/gemini'
import { renderToCanvas } from '../lib/renderPipeline'

const hasApiKey = !!import.meta.env.VITE_GEMINI_API_KEY

export function AIPanel() {
  const image = useEditorStore((s) => s.image)
  const resetAll = useEditorStore((s) => s.resetAll)

  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(models[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasImage = image !== null
  const isModelAvailable = selectedModel.available
  const canApply = hasApiKey && hasImage && isModelAvailable && prompt.trim().length > 0 && !loading

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

      // Read API key from env
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY is not set.')
      }

      // Call Gemini
      const result = await editImageWithGemini(
        base64,
        'image/png',
        prompt.trim(),
        apiKey,
        selectedModel.id,
      )

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* API key missing banner */}
        {!hasApiKey && (
          <div className="text-[11px] text-amber bg-amber/10 border border-amber/20 rounded px-3 py-2.5 leading-relaxed">
            To use AI editing, add your Gemini API key to the <code className="bg-amber/10 px-1 rounded">.env</code> file and restart the dev server. See <code className="bg-amber/10 px-1 rounded">docs/project.md</code> for setup instructions.
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
              This model is not yet wired up. Select a Gemini model to use AI editing.
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
            disabled={!hasApiKey || !hasImage || !isModelAvailable || loading}
            rows={5}
            className="w-full bg-bg-lighter border border-border rounded px-3 py-2.5 text-xs text-text leading-relaxed placeholder:text-text-dim/40 focus:outline-none focus:border-amber/40 resize-none disabled:opacity-40 disabled:cursor-not-allowed"
          />
          {hasApiKey && hasImage && isModelAvailable && (
            <p className="text-[10px] text-text-dim/40 mt-1.5">
              Cmd+Enter to apply
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2 leading-relaxed">
            {error}
          </div>
        )}

        {/* Info note when no image */}
        {hasApiKey && !hasImage && (
          <div className="text-[11px] text-text-dim/50 text-center py-4">
            Upload an image to start using AI editing
          </div>
        )}
      </div>

      {/* Fixed bottom: Apply button — hidden when no API key */}
      {hasApiKey && (
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
