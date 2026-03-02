import { useEditorStore, type TabId } from '../store/useEditorStore'
import { AdjustPanel } from './AdjustPanel'

const tabs: { id: TabId; label: string }[] = [
  { id: 'adjust', label: 'Adjust' },
  { id: 'effects', label: 'Effects' },
  { id: 'presets', label: 'Presets' },
  { id: 'ai', label: 'AI' },
]

export function Sidebar() {
  const activeTab = useEditorStore((s) => s.activeTab)
  const setActiveTab = useEditorStore((s) => s.setActiveTab)

  return (
    <aside className="w-80 bg-bg-light border-l border-border flex flex-col shrink-0 h-full">
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'text-amber border-b-2 border-amber'
                : 'text-text-dim hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'adjust' ? (
          <AdjustPanel />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <div className="text-text-dim text-sm font-medium mb-1">
                {tabs.find((t) => t.id === activeTab)?.label}
              </div>
              <div className="text-text-dim/50 text-xs">Coming soon</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
