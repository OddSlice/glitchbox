import { useEditorStore, type TabId } from '../store/useEditorStore'
import { AdjustPanel } from './AdjustPanel'
import { EffectsPanel } from './EffectsPanel'
// import { PresetsPanel } from './PresetsPanel'  // Hidden for now
import { AIPanel } from './AIPanel'

const tabs: { id: TabId; label: string }[] = [
  { id: 'adjust', label: 'Adjust' },
  { id: 'effects', label: 'Effects' },
  // { id: 'presets', label: 'Presets' },  // Hidden for now
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
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-dim hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'adjust' && <AdjustPanel />}
        {activeTab === 'effects' && <EffectsPanel />}
        {/* {activeTab === 'presets' && <PresetsPanel />} */}
        {activeTab === 'ai' && <AIPanel />}
      </div>
    </aside>
  )
}
