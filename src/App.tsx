import { TopBar } from './components/TopBar'
import { Canvas } from './components/Canvas'
import { Sidebar } from './components/Sidebar'

export default function App() {
  return (
    <div className="flex flex-col h-full w-full">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Canvas />
        <Sidebar />
      </div>
    </div>
  )
}
