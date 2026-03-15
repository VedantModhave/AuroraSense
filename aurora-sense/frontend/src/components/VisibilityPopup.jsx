export default function VisibilityPopup({ data, onClose }) {
  if (!data) return null

  // Determine visibility quality and color
  const getVisibilityQuality = (score) => {
    if (score >= 60) return { label: 'Good', color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-700' }
    if (score >= 30) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-700' }
    return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-700' }
  }

  const quality = getVisibilityQuality(data.visibility_score)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${quality.border} ${quality.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${quality.color.replace('text-', 'bg-')} animate-pulse`} />
              <h3 className="text-lg font-semibold text-white">Visibility Score</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Overall Score */}
          <div className="text-center pb-4 border-b border-gray-800">
            <div className="text-sm text-gray-400 mb-2">Overall Visibility</div>
            <div className={`text-5xl font-bold ${quality.color} mb-2`}>
              {data.visibility_score.toFixed(1)}
            </div>
            <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${quality.bg} ${quality.color} border ${quality.border}`}>
              {quality.label}
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            {/* Aurora Probability */}
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-900/30 border border-purple-700 flex items-center justify-center">
                  <span className="text-lg">🌌</span>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Aurora Probability</div>
                  <div className="text-sm text-gray-300">50% weight</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">{data.aurora_probability.toFixed(1)}%</div>
              </div>
            </div>

            {/* Cloud Cover */}
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-900/30 border border-blue-700 flex items-center justify-center">
                  <span className="text-lg">☁️</span>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Cloud Cover</div>
                  <div className="text-sm text-gray-300">30% weight</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">{data.cloud_cover.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">
                  {(100 - data.cloud_cover).toFixed(0)}% clear
                </div>
              </div>
            </div>

            {/* Darkness Score */}
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-900/30 border border-indigo-700 flex items-center justify-center">
                  <span className="text-lg">🌙</span>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Darkness Score</div>
                  <div className="text-sm text-gray-300">20% weight</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-400">{data.darkness_score.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="pt-3 border-t border-gray-800">
            <div className="text-xs text-gray-400 mb-1">Location</div>
            <div className="text-sm text-gray-300 font-mono">
              {data.location.latitude.toFixed(2)}°N, {data.location.longitude.toFixed(2)}°E
            </div>
          </div>

          {/* Conditions */}
          {data.conditions && (
            <div className="pt-3 border-t border-gray-800">
              <div className="text-xs text-gray-400 mb-2">Current Conditions</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">☀️ Solar:</span>
                  <span className="text-gray-300">{data.conditions.solar_altitude.toFixed(1)}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">🌙 Moon:</span>
                  <span className="text-gray-300">{data.conditions.moon_illumination.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">🌃 Night:</span>
                  <span className="text-gray-300">{data.conditions.is_night ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">✨ Dark:</span>
                  <span className="text-gray-300">{data.conditions.is_astronomical_twilight ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {data.recommendation && (
            <div className={`p-3 rounded-lg ${quality.bg} border ${quality.border}`}>
              <div className="text-xs text-gray-400 mb-1">Recommendation</div>
              <div className="text-sm text-gray-200">{data.recommendation}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <div>Updated: {new Date(data.timestamp).toLocaleTimeString()}</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
