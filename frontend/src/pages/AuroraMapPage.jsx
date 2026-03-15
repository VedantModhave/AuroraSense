import AuroraMapDeckGL from '../components/AuroraMapDeckGL'

export default function AuroraMapPage() {
  return (
    <div className="min-h-screen bg-aurora-dark flex flex-col">
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌌</span>
          <h1 className="text-xl font-semibold text-white">Aurora Probability Map</h1>
        </div>
        <div className="text-xs text-gray-400">
          Real-time NOAA OVATION aurora forecast
        </div>
      </header>

      <main className="flex-1 px-4 pb-4 pt-3">
        <AuroraMapDeckGL />
      </main>

      <footer className="px-6 py-3 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between flex-shrink-0">
        <div>
          Data source: NOAA Space Weather Prediction Center
        </div>
        <div>
          Map tiles: © OpenStreetMap contributors
        </div>
      </footer>
    </div>
  )
}
