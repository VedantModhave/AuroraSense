import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div>
      <nav className="fixed top-0 left-0 right-0 z-50 flex gap-4 px-6 py-2 bg-aurora-dark border-b border-gray-800">
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
      </nav>
      <div className="pt-10">
        {page === 'dashboard' ? <Dashboard /> : <MapView />}
      </div>
    </div>
  )
}
