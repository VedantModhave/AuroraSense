import RouteOptimizer from '../components/RouteOptimizer'

export default function RouteOptimizerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Aurora Viewing Route Optimizer
          </h1>
          <p className="text-gray-400">
            Find the nearest optimal location for aurora viewing and get GPS directions
          </p>
        </div>

        {/* Route Optimizer */}
        <div className="h-[calc(100vh-180px)]">
          <RouteOptimizer />
        </div>

        {/* Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="text-sm font-semibold text-aurora-green mb-2">
              🌌 Aurora Probability
            </div>
            <div className="text-xs text-gray-400">
              Finds locations with aurora probability above your threshold based on real-time NOAA data
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="text-sm font-semibold text-aurora-green mb-2">
              ☁️ Cloud Cover
            </div>
            <div className="text-xs text-gray-400">
              Filters locations with clear skies using Open-Meteo weather forecasts
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="text-sm font-semibold text-aurora-green mb-2">
              💡 Light Pollution
            </div>
            <div className="text-xs text-gray-400">
              Ensures dark skies by checking Bortle scale (1=darkest, 9=city center)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
