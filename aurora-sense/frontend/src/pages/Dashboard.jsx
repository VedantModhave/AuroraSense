import { useAuroraData } from '../hooks/useAuroraData'
import KpGauge from '../components/KpGauge'
import ForecastChart from '../components/ForecastChart'
import AuroraMap from '../components/AuroraMap'

export default function Dashboard() {
  const { kpData, forecast, loading, error, refetch } = useAuroraData()

  const currentKp = kpData?.current_kp ?? 0
  const visibilityLat = forecast?.forecast?.[0]?.visibility_latitude ?? 65

  return (
    <div className="min-h-screen bg-aurora-dark flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌌</span>
          <h1 className="text-xl font-semibold tracking-tight text-white">AuroraSense</h1>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">
              {error}
            </span>
          )}
          <button
            onClick={refetch}
            className="text-xs text-gray-400 hover:text-aurora-green transition-colors px-3 py-1.5 rounded border border-gray-700 hover:border-aurora-green"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 p-4 flex flex-col gap-4 border-r border-gray-800 overflow-y-auto">
          {loading ? (
            <div className="text-gray-500 text-sm animate-pulse">Loading space weather...</div>
          ) : (
            <>
              <KpGauge kp={currentKp} />
              <ForecastChart forecast={forecast?.forecast} />
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-sm">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Visibility Boundary</p>
                <p className="text-aurora-green font-semibold text-lg">{visibilityLat}° N</p>
                <p className="text-gray-500 text-xs mt-1">Aurora visible poleward of this latitude</p>
              </div>
            </>
          )}
        </aside>

        {/* Map */}
        <main className="flex-1 p-4">
          <AuroraMap visibilityLatitude={visibilityLat} />
        </main>
      </div>
    </div>
  )
}
