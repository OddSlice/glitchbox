import { useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { renderToCanvas } from '../lib/renderPipeline'
import type { Adjustments, Effects } from '../store/useEditorStore'

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const image = useEditorStore((s) => s.image)
  const adjustments = useEditorStore((s) => s.adjustments)
  const effects = useEditorStore((s) => s.effects)
  const showOriginal = useEditorStore((s) => s.showOriginal)

  // Performance cache: stores the fully rendered ImageData + the params that produced it
  const cacheRef = useRef<{
    imageData: ImageData | null
    adjustments: Adjustments | null
    effects: Effects | null
    w: number
    h: number
  }>({ imageData: null, adjustments: null, effects: null, w: 0, h: 0 })

  // Clear cache when image changes
  useEffect(() => {
    cacheRef.current = { imageData: null, adjustments: null, effects: null, w: 0, h: 0 }
  }, [image])

  const render = useCallback(() => {
    // Cancel any pending frame to avoid stacking
    cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container || !image) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      // Calculate fit dimensions
      const containerW = container.clientWidth
      const containerH = container.clientHeight
      const imgAspect = image.width / image.height
      const containerAspect = containerW / containerH

      let drawW: number, drawH: number
      if (imgAspect > containerAspect) {
        drawW = Math.min(containerW - 40, image.width)
        drawH = drawW / imgAspect
      } else {
        drawH = Math.min(containerH - 40, image.height)
        drawW = drawH * imgAspect
      }

      drawW = Math.round(drawW)
      drawH = Math.round(drawH)

      if (drawW <= 0 || drawH <= 0) return

      // Before/After: show original unedited image
      if (showOriginal) {
        canvas.width = drawW
        canvas.height = drawH
        ctx.drawImage(image, 0, 0, drawW, drawH)
        return
      }

      // Check if we can use cached result (same params + dimensions)
      const cache = cacheRef.current
      if (
        cache.imageData &&
        drawW === cache.w &&
        drawH === cache.h &&
        adjustments === cache.adjustments &&
        effects === cache.effects
      ) {
        canvas.width = drawW
        canvas.height = drawH
        ctx.putImageData(cache.imageData, 0, 0)
        return
      }

      // Full render
      canvas.width = drawW
      canvas.height = drawH
      renderToCanvas(ctx, image, drawW, drawH, adjustments, effects)

      // Cache the result for next frame
      cacheRef.current = {
        imageData: ctx.getImageData(0, 0, drawW, drawH),
        adjustments,
        effects,
        w: drawW,
        h: drawH,
      }
    })
  }, [image, adjustments, effects, showOriginal])

  useEffect(() => {
    render()
    return () => cancelAnimationFrame(rafRef.current)
  }, [render])

  // Re-render on container resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => render())
    ro.observe(container)
    return () => ro.disconnect()
  }, [render])

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-bg overflow-hidden">
      <canvas
        ref={canvasRef}
        id="editor-canvas"
        className={image ? 'block rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'hidden'}
      />
      {!image && <DropZone />}
    </div>
  )
}

function DropZone() {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      loadFile(file)
    }
  }

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) loadFile(file)
    }
    input.click()
  }

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
      className="border-2 border-dashed border-primary/25 hover:border-primary/50 bg-primary/[0.02] hover:bg-primary/[0.04] rounded-2xl w-[480px] h-[320px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary/60 group-hover:text-primary/80 transition-colors">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-text-dim text-sm">
        Drop your image here or click <span className="text-primary font-medium">Upload</span>
      </p>
    </div>
  )
}

function loadFile(file: File) {
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      useEditorStore.getState().setImage(img, file.name)
    }
    img.src = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}
