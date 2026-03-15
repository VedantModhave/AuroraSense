import { useAuroraData } from '../hooks/useAuroraData'
import AuroraMap from '../components/AuroraMap'

export default function MapView() {
  const { forecast, loading } = useAuroraData()
  const visibilityLat = forecast?.forecast?.[0]?.visibility_latitude ?? 65

  return (
    <div className="min-h-screen bg-aurora-dark flex flex-col">
      <header className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
        <span className="text-2xl">🗺️</span>
        <h1 className="text-xl font-semibold text-white">Aurora Map</h1>
        {!loading && (
          <span className="ml-auto text-xs text-gray-400">
            Visibility boundary: <span className="text-aurora-green">{visibilityLat}° N</span>
          </span>
        )}
      </header>
      <main className="flex-1 p-4">
        <AuroraMap visibilityLatitude={visibilityLat} />
      </main>
    </div>
  )
}
