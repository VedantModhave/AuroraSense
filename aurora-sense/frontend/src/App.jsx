import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import AuroraMapPage from './pages/AuroraMapPage'
import RouteOptimizerPage from './pages/RouteOptimizerPage'
import AuroraSightings from './pages/AuroraSightings'
import GlobalStatusBar from './components/GlobalStatusBar'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Global Status Bar at the very top */}
      <GlobalStatusBar />

      {/* Navigation */}
      <nav className="flex gap-4 px-6 py-2 bg-aurora-dark border-b border-gray-800 shrink-0 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setPage('dashboard')}
          className={`text-sm px-3 py-1 rounded transition-colors ${page === 'dashboard' ? 'text-aurora-green border border-aurora-green' : 'text-gray-400 hover:text-white'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setPage('map')}
          className={`text-sm px-3 py-1 rounded transition-colors ${page === 'map' ? 'text-aurora-green border border-aurora-green' : 'text-gray-400 hover:text-white'}`}
        >
          Map View
        </button>
        <button
          onClick={() => setPage('aurora-map')}
          className={`text-sm px-3 py-1 rounded transition-colors ${page === 'aurora-map' ? 'text-aurora-green border border-aurora-green' : 'text-gray-400 hover:text-white'}`}
        >
          Aurora Map
        </button>
        <button
          onClick={() => setPage('route-optimizer')}
          className={`text-sm px-3 py-1 rounded transition-colors ${page === 'route-optimizer' ? 'text-aurora-green border border-aurora-green' : 'text-gray-400 hover:text-white'}`}
        >
          Route Optimizer
        </button>
        <button
          onClick={() => setPage('sightings')}
          className={`text-sm px-3 py-1 rounded transition-colors ${page === 'sightings' ? 'text-aurora-green border border-aurora-green' : 'text-gray-400 hover:text-white'}`}
        >
          Community Sightings
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-aurora-dark flex flex-col">
        {page === 'dashboard' ? <Dashboard /> : 
         page === 'map' ? <MapView /> : 
         page === 'aurora-map' ? <AuroraMapPage /> :
         page === 'route-optimizer' ? <RouteOptimizerPage /> :
         page === 'sightings' ? <AuroraSightings /> :
         <Dashboard />}
      </div>
    </div>
  )
}
