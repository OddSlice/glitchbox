import { useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { applyTemperatureExposureSharpness } from '../lib/canvasEffects'
import { applyEffects, hasActiveEffects } from '../lib/effects'

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const image = useEditorStore((s) => s.image)
  const adjustments = useEditorStore((s) => s.adjustments)
  const effects = useEditorStore((s) => s.effects)

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

      canvas.width = drawW
      canvas.height = drawH

      // Apply CSS filters for brightness, contrast, saturation, hue
      const { brightness, contrast, saturation, hue } = adjustments
      ctx.filter = [
        `brightness(${brightness / 100})`,
        `contrast(${contrast / 100})`,
        `saturate(${saturation / 100})`,
        `hue-rotate(${hue}deg)`,
      ].join(' ')

      ctx.drawImage(image, 0, 0, drawW, drawH)

      // Reset filter before pixel manipulation
      ctx.filter = 'none'

      // Apply temperature, exposure, sharpness via pixel manipulation
      const { temperature, exposure, sharpness } = adjustments
      if (temperature !== 0 || exposure !== 0 || sharpness !== 0) {
        applyTemperatureExposureSharpness(ctx, drawW, drawH, temperature, exposure, sharpness)
      }

      // Apply effects (stacked on top of adjustments)
      if (hasActiveEffects(effects)) {
        applyEffects(ctx, drawW, drawH, effects)
      }
    })
  }, [image, adjustments, effects])

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
        className={image ? 'block shadow-2xl' : 'hidden'}
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
      className="border-2 border-dashed border-border hover:border-amber/40 rounded-lg w-[480px] h-[320px] flex flex-col items-center justify-center cursor-pointer transition-colors group"
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-text-dim/30 group-hover:text-amber/50 transition-colors mb-4">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="text-text-dim text-sm">Drop your image here or click Upload</p>
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
