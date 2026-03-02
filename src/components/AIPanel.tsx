import { useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { models, type ModelConfig } from '../config/models'
import { editImageWithGemini } from '../lib/ai/gemini'

export function AIPanel() {
  const image = useEditorStore((s) => s.image)
  const resetAll = useEditorStore((s) => s.resetAll)

  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(models[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasImage = image !== null
  const canApply = hasImage && prompt.trim().length > 0 && !loading

  const handleApply = async () => {
    if (!canApply) return

    setLoading(true)
    setError(null)

    try {
      // Get the current canvas as base64 PNG
      const canvas = document.querySelector('#editor-canvas') as HTMLCanvasElement
      if (!canvas) throw new Error('Canvas not found')

      const dataUrl = canvas.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]

      // Read API key from env
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
      if (!apiKey) {
        throw new Error(
          'VITE_GEMINI_API_KEY is not set. Add it to your .env file and restart the dev server.',
        )
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
                {model.name}
              </option>
            ))}
          </select>
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
            disabled={!hasImage || loading}
            rows={5}
            className="w-full bg-bg-lighter border border-border rounded px-3 py-2.5 text-xs text-text leading-relaxed placeholder:text-text-dim/40 focus:outline-none focus:border-amber/40 resize-none disabled:opacity-40 disabled:cursor-not-allowed"
          />
          {hasImage && (
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
        {!hasImage && (
          <div className="text-[11px] text-text-dim/50 text-center py-4">
            Upload an image to start using AI editing
          </div>
        )}
      </div>

      {/* Fixed bottom: Apply button */}
      <div className="shrink-0 p-4 border-t border-border">
        <button
          onClick={handleApply}
          disabled={!canApply}
          className="w-full py-2.5 text-xs font-semibold rounded bg-amber text-bg hover:bg-amber-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Processing...' : 'Apply'}
        </button>
      </div>
    </div>
  )
}
