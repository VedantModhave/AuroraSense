import { useState } from 'react'
import { Map } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers'
import 'maplibre-gl/dist/maplibre-gl.css'

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

export default function RouteOptimizer() {
  const [showFilters, setShowFilters] = useState(false)
  const [origin, setOrigin] = useState({ lat: '', lon: '' })
  const [criteria, setCriteria] = useState({
    searchRadius: 100,
    minAurora: 50,
    maxCloud: 30,
    maxBortle: 4,
    profile: 'driving',
  })
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 65,
    zoom: 4,
  })

  const handleOptimize = async () => {
    if (!origin.lat || !origin.lon) {
      setError('Please enter origin coordinates')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        origin_lat: origin.lat,
        origin_lon: origin.lon,
        search_radius_km: criteria.searchRadius,
        min_aurora_probability: criteria.minAurora,
        max_cloud_cover: criteria.maxCloud,
        max_bortle: criteria.maxBortle,
        profile: criteria.profile,
      })

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/route/optimize?${params}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to optimize route')
      }

      const data = await response.json()
      setRoute(data)

      // Center map on route
      const minLon = Math.min(data.origin.longitude, data.destination.longitude)
      const maxLon = Math.max(data.origin.longitude, data.destination.longitude)
      const minLat = Math.min(data.origin.latitude, data.destination.latitude)
      const maxLat = Math.max(data.origin.latitude, data.destination.latitude)
      const maxDiff = Math.max(maxLon - minLon, maxLat - minLat) || 0.1
      const targetZoom = Math.max(4, Math.min(12, Math.log2(120 / maxDiff)))

      setViewState({
        longitude: (minLon + maxLon) / 2,
        latitude: (minLat + maxLat) / 2,
        zoom: targetZoom,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const layers = []

  if (route) {
    // Route path
    const routePath = route.route.geometry.coordinates.map(coord => [coord[0], coord[1]])
    
    layers.push(
      new PathLayer({
        id: 'route-path',
        data: [{ path: routePath }],
        getPath: d => d.path,
        getColor: [0, 255, 136, 200],
        getWidth: 5,
        widthMinPixels: 3,
        capRounded: true,
        jointRounded: true,
      })
    )

    // Origin marker
    layers.push(
      new ScatterplotLayer({
        id: 'origin-marker',
        data: [route.origin],
        getPosition: d => [d.longitude, d.latitude],
        getFillColor: [59, 130, 246],
        getRadius: 500,
        radiusMinPixels: 8,
        radiusMaxPixels: 20,
      })
    )

    // Best Destination marker
    layers.push(
      new ScatterplotLayer({
        id: 'destination-marker',
        data: [route.destination],
        getPosition: d => [d.longitude, d.latitude],
        getFillColor: [0, 255, 136],
        getRadius: 800,
        radiusMinPixels: 12,
        radiusMaxPixels: 30,
        pickable: true,
      })
    )

    // Alternative locations with color coding (yellow/red)
    if (route.alternative_locations?.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: 'alternatives',
          data: route.alternative_locations,
          getPosition: d => [d.longitude, d.latitude],
          getFillColor: d => d.score >= 50 ? [255, 200, 0, 220] : [239, 68, 68, 220],
          getRadius: 600,
          radiusMinPixels: 8,
          radiusMaxPixels: 20,
          pickable: true,
        })
      )
    }
  }

  const getTooltip = ({ object }) => {
    if (!object || object.aurora_probability === undefined) return null

    const color = object.score >= 80 ? '#00ff88' : object.score >= 50 ? '#ffc800' : '#ef4444'
    const status = object.score >= 80 ? 'Best' : object.score >= 50 ? 'Alternative' : 'Poor'

    return {
      html: `
        <div style="padding:10px;background:rgba(10,10,26,0.95);border-radius:8px;border:1px solid ${color};min-width:180px;color:white;font-size:12px;font-family:system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.5);">
          <div style="font-weight:700;margin-bottom:6px;color:${color};font-size:14px;display:flex;justify-content:space-between;align-items:center;">
            <span>Score: ${Math.round(object.score)}</span>
            <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.1);">${status}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:#9ca3af;">Aurora:</span>
            <span style="font-weight:600;color:#00ff88;">${object.aurora_probability}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:#9ca3af;">Cloud Cover:</span>
            <span style="font-weight:600;color:${object.cloud_cover > 50 ? '#ef4444' : 'white'};">${object.cloud_cover}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:#9ca3af;">Light Pollution:</span>
            <span style="font-weight:600;">Bortle ${object.bortle_scale}</span>
          </div>
          <div style="font-size:10px;color:#6b7280;margin-top:6px;border-top:1px solid #1f2937;padding-top:4px;">
            ${object.latitude.toFixed(3)}°N, ${object.longitude.toFixed(3)}°E
          </div>
        </div>
      `,
      style: { backgroundColor: 'transparent' }
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full h-full gap-4 min-h-0">
      {/* Control Panel */}
      <div className="lg:w-96 bg-gray-900 rounded-xl border border-gray-800 p-6 flex-shrink-0 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🗺️</span> Route Optimizer
          </h2>
          <button 
            className="lg:hidden text-xs text-aurora-green border border-aurora-green/30 px-3 py-1.5 rounded"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Toggle Filters'}
          </button>
        </div>

        <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          {/* Origin */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm font-semibold text-gray-300">Starting Location</div>
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setOrigin({ 
                        lat: pos.coords.latitude.toFixed(4), 
                        lon: pos.coords.longitude.toFixed(4) 
                      })
                    },
                    (err) => setError('Geolocation failed: ' + err.message)
                  )
                }
              }}
              className="text-[10px] text-aurora-green hover:underline flex items-center gap-1"
            >
              📍 Use My Location
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Latitude"
              value={origin.lat}
              onChange={(e) => setOrigin(prev => ({ ...prev, lat: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-aurora-green outline-none"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Longitude"
              value={origin.lon}
              onChange={(e) => setOrigin(prev => ({ ...prev, lon: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-aurora-green outline-none"
              step="0.01"
            />
          </div>
        </div>

        {/* Criteria */}
        <div className="space-y-4 mb-6">
          <div className="text-sm font-semibold text-gray-300">Search Criteria</div>
          
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Search Radius: {criteria.searchRadius} km
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={criteria.searchRadius}
              onChange={(e) => setCriteria(prev => ({ ...prev, searchRadius: parseInt(e.target.value) }))}
              className="w-full accent-aurora-green"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Min Aurora Probability: {criteria.minAurora}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={criteria.minAurora}
              onChange={(e) => setCriteria(prev => ({ ...prev, minAurora: parseInt(e.target.value) }))}
              className="w-full accent-aurora-green"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Max Cloud Cover: {criteria.maxCloud}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={criteria.maxCloud}
              onChange={(e) => setCriteria(prev => ({ ...prev, maxCloud: parseInt(e.target.value) }))}
              className="w-full accent-aurora-green"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Max Light Pollution (Bortle): {criteria.maxBortle}
            </label>
            <input
              type="range"
              min="1"
              max="9"
              step="1"
              value={criteria.maxBortle}
              onChange={(e) => setCriteria(prev => ({ ...prev, maxBortle: parseInt(e.target.value) }))}
              className="w-full accent-aurora-green"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Transport Mode</label>
            <select
              value={criteria.profile}
              onChange={(e) => setCriteria(prev => ({ ...prev, profile: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-aurora-green outline-none"
            >
              <option value="driving">🚗 Driving</option>
              <option value="cycling">🚴 Cycling</option>
              <option value="walking">🚶 Walking</option>
            </select>
          </div>
        </div>

        {/* Optimize Button */}
        <button
          onClick={handleOptimize}
          disabled={loading || !origin.lat || !origin.lon}
          className="w-full bg-aurora-green text-gray-900 font-bold py-3 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <span>🎯</span> Find Best Route
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Route Info */}
        {route && (
          <div className="mt-6 space-y-4">
            <div className="text-sm font-semibold text-gray-300 border-t border-gray-800 pt-4">
              Optimal Destination
            </div>

            {/* Best-effort warning */}
            {!route.destination.meets_criteria && (
              <div className="p-3 bg-yellow-900/40 border border-yellow-700 rounded-lg text-xs text-yellow-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <span>⚠️</span> Optimal status: Not met
                </div>
                <div className="leading-snug">
                  No location fully meets the selected criteria. Showing the best available option based on current conditions.
                </div>
                <div className="mt-2 pt-2 border-t border-yellow-700/50 text-[10px] opacity-80 italic">
                  Hint: Try lowering cloud cover or aurora probability thresholds.
                </div>
              </div>
            )}

            {route.destination.meets_criteria && (
              <div className="p-3 bg-green-900/40 border border-green-700 rounded-lg text-xs text-green-300">
                ✅ Location meets all your criteria.
              </div>
            )}
            
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Aurora Probability</span>
                <span className="text-aurora-green font-semibold">
                  {route.destination.aurora_probability}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Cloud Cover</span>
                <span className="text-white">{route.destination.cloud_cover}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Bortle Scale</span>
                <span className="text-white">{route.destination.bortle_scale}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Score</span>
                <span className="text-aurora-green font-bold">{Math.round(route.destination.score)}</span>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Distance</span>
                <span className="text-white font-semibold">{route.route.distance_km} km</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Duration</span>
                <span className="text-white font-semibold">
                  {Math.floor(route.route.duration_minutes)} min
                </span>
              </div>
            </div>

            {route.alternative_locations?.length > 0 && (
              <div className="text-xs text-gray-500">
                + {route.alternative_locations.length} alternative locations plotted
              </div>
            )}
            <div className="text-[10px] text-gray-400 italic">
              Hover over pins on the map for detailed metrics.
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-800 relative h-full min-h-[400px]">
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState }) => setViewState(viewState)}
          controller={true}
          layers={layers}
          getTooltip={getTooltip}
          getCursor={({ isHovering }) => isHovering ? 'pointer' : 'grab'}
          style={{ width: '100%', height: '100%' }}
        >
          <Map mapStyle={OSM_STYLE} />
        </DeckGL>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-3 text-xs">
          <div className="font-semibold text-white mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-300">Origin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-aurora-green shadow-[0_0_8px_#00ff88]" />
              <span className="text-gray-300">Best Destination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ffc800]" />
              <span className="text-gray-300">Alternative (Ok)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-300">Alternative (Poor)</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-1 border-t border-gray-700">
              <div className="w-8 h-1 bg-aurora-green" />
              <span className="text-gray-300">Optimal Route</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
