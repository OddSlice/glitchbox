import { useEditorStore } from '../store/useEditorStore'

export function TopBar() {
  const image = useEditorStore((s) => s.image)

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

  const handleExport = () => {
    const canvas = document.querySelector('#editor-canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'glitchbox-export.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <header className="h-12 bg-bg-light border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-amber">
          <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
          <rect x="6" y="6" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="13" y="6" width="5" height="5" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="6" y="13" width="5" height="5" rx="1" fill="currentColor" opacity="0.4" />
          <rect x="13" y="13" width="5" height="5" rx="1" fill="currentColor" opacity="0.2" />
        </svg>
        <span className="text-text font-semibold text-sm tracking-wide">Glitchbox</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleUpload}
          className="px-3 py-1.5 text-xs font-medium rounded bg-bg-lighter text-text-dim hover:text-text border border-border hover:border-amber/40 transition-colors cursor-pointer"
        >
          Upload
        </button>
        <button
          onClick={handleExport}
          disabled={!image}
          className="px-3 py-1.5 text-xs font-medium rounded bg-amber text-bg hover:bg-amber-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Export
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
