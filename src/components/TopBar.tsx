import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { renderToCanvas } from '../lib/renderPipeline'

export function TopBar() {
  const image = useEditorStore((s) => s.image)
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const showOriginal = useEditorStore((s) => s.showOriginal)
  const setShowOriginal = useEditorStore((s) => s.setShowOriginal)

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useEditorStore.getState().undo()
      } else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey))) {
        e.preventDefault()
        useEditorStore.getState().redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // --- Export confirmation flash ---
  const [exportLabel, setExportLabel] = useState('Export')

  // --- Before/After hold + toggle ---
  const pressStartRef = useRef(0)
  const [isToggled, setIsToggled] = useState(false)

  const handleBeforePointerDown = () => {
    pressStartRef.current = Date.now()
    setShowOriginal(true)
  }

  const handleBeforePointerUp = () => {
    const elapsed = Date.now() - pressStartRef.current
    if (elapsed < 300) {
      // Short press: toggle mode
      const newToggle = !isToggled
      setIsToggled(newToggle)
      setShowOriginal(newToggle)
    } else {
      // Long press: release hold
      if (!isToggled) {
        setShowOriginal(false)
      }
    }
  }

  const handleBeforePointerLeave = () => {
    if (!isToggled) {
      setShowOriginal(false)
    }
  }

  // --- Upload ---
  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      loadImageFile(file)
    }
    input.click()
  }

  // --- Export at original resolution ---
  const handleExport = () => {
    const { image, adjustments, effects, fileName } = useEditorStore.getState()
    if (!image) return

    const w = image.naturalWidth
    const h = image.naturalHeight

    const offscreen = document.createElement('canvas')
    offscreen.width = w
    offscreen.height = h
    const ctx = offscreen.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    renderToCanvas(ctx, image, w, h, adjustments, effects)

    const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'glitchbox-export'

    offscreen.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${baseName}-glitchbox.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)

      setExportLabel('Exported \u2713')
      setTimeout(() => setExportLabel('Export'), 2000)
    }, 'image/png')
  }

  return (
    <header className="h-12 bg-bg-light border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-primary">
          <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
          <rect x="6" y="6" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="13" y="6" width="5" height="5" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="6" y="13" width="5" height="5" rx="1" fill="currentColor" opacity="0.4" />
          <rect x="13" y="13" width="5" height="5" rx="1" fill="currentColor" opacity="0.2" />
        </svg>
        <span className="text-text font-semibold text-sm tracking-wide">Glitchbox</span>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 ml-2">
          <button
            onClick={() => useEditorStore.getState().undo()}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-text-dim hover:text-text hover:bg-bg-lighter transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M3 13C5.5 8.5 9.5 6 14 6c4.5 0 7 2 7 6s-2.5 6-7 6c-2.5 0-4.5-.8-6-2.5" />
            </svg>
          </button>
          <button
            onClick={() => useEditorStore.getState().redo()}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded text-text-dim hover:text-text hover:bg-bg-lighter transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M21 13C18.5 8.5 14.5 6 10 6c-4.5 0-7 2-7 6s2.5 6 7 6c2.5 0 4.5-.8 6-2.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Before / After toggle */}
        <button
          onPointerDown={handleBeforePointerDown}
          onPointerUp={handleBeforePointerUp}
          onPointerLeave={handleBeforePointerLeave}
          disabled={!image}
          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer select-none ${
            showOriginal
              ? 'border-primary bg-primary/10 text-primary'
              : 'bg-bg-lighter text-text-dim hover:text-text border-border hover:border-primary/40'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          Before
        </button>
        <button
          onClick={handleUpload}
          className="px-3 py-1.5 text-xs font-medium rounded bg-bg-lighter text-text-dim hover:text-text border border-border hover:border-primary/40 transition-colors cursor-pointer"
        >
          Upload
        </button>
        <button
          onClick={handleExport}
          disabled={!image}
          className="px-3 py-1.5 text-xs font-medium rounded bg-primary text-bg hover:bg-primary-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          {exportLabel}
        </button>
      </div>
    </header>
  )
}

export function loadImageFile(file: File) {
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
