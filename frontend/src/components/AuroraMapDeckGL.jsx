import { useState, useCallback, useMemo, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer, PolygonLayer, LineLayer } from '@deck.gl/layers'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { Map } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAuroraMap } from '../hooks/useAuroraMap'
import { getAuroraColorWithAlpha, getAuroraWeight } from '../utils/auroraColors'
import { generateNightRegion } from '../utils/solarCalculations'
import VisibilityPopup from './VisibilityPopup'
import MapErrorBoundary from './MapErrorBoundary'
import KpContextOverlay from './KpContextOverlay'
import DataSourcesFooter from './DataSourcesFooter'

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

const INITIAL_VIEW = { longitude: 0, latitude: 65, zoom: 2, pitch: 0, bearing: 0 }

// ─── Aurora Oval Outline ──────────────────────────────────────────────────────
/**
 * Build an aurora oval polygon from high-probability grid points.
 * Groups points by longitude bin, finds min/max latitude per bin,
 * then builds outer + inner boundary rings.
 */
function buildAuroraOvalPolygon(auroraPoints, threshold = 20) {
  const highProb = auroraPoints.filter(p => p.probability >= threshold)
  if (highProb.length < 10) return null

  const lonBins = {}
  for (const p of highProb) {
    const key = Math.round(p.position[0])
    if (!lonBins[key]) lonBins[key] = []
    lonBins[key].push(p.position[1])
  }

  const sortedLons = Object.keys(lonBins).map(Number).sort((a, b) => a - b)
  if (sortedLons.length < 3) return null

  const outer = sortedLons.map(lon => [lon, Math.max(...lonBins[lon])])
  const inner = sortedLons.map(lon => [lon, Math.min(...lonBins[lon])])

  // Close the polygon
  const ring = [...outer, ...[...inner].reverse(), outer[0]]
  return [ring]
}
// ─────────────────────────────────────────────────────────────────────────────

function AuroraMapDeckGLInner() {
  const [viewState, setViewState] = useState(INITIAL_VIEW)
  const [layerMode, setLayerMode] = useState('both')
  const [showTerminator, setShowTerminator] = useState(true)
  const [showOval, setShowOval] = useState(true)
  const [showMidnight, setShowMidnight] = useState(false)
  const [nightRegion, setNightRegion] = useState([])
  const [midnightLon, setMidnightLon] = useState(0)
  const [clickedLocation, setClickedLocation] = useState(null)
  const [visibilityData, setVisibilityData] = useState(null)
  const [loadingVisibility, setLoadingVisibility] = useState(false)
  const { auroraData, loading, error } = useAuroraMap(60000)

  // Convert GeoJSON features to deck.gl data format (memoized)
  const auroraPoints = useMemo(() => {
    if (!auroraData?.features) return []
    return auroraData.features.map(feature => ({
      position: feature.geometry.coordinates,
      probability: feature.properties.probability,
    }))
  }, [auroraData])

  // Update night terminator and midnight longitude every minute
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setNightRegion(generateNightRegion(now))
      
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60
      const solarLon = -15 * (utcHours - 12)
      setMidnightLon(solarLon >= 0 ? solarLon - 180 : solarLon + 180)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  // ─── Layers ────────────────────────────────────────────────────────────────

  // Day/Night terminator as a scatter of dark points
  const nightLayer = useMemo(() => {
    if (!showTerminator || !nightRegion.length) return null
    return new ScatterplotLayer({
      id: 'night-region',
      data: nightRegion,
      getPosition: d => d.position,
      getRadius: 80000,
      getFillColor: [0, 0, 40, 70],
      radiusMinPixels: 2,
      radiusMaxPixels: 14,
      pickable: false,
      opacity: 0.35,
    })
  }, [nightRegion, showTerminator])

  // Aurora Oval polygon outline (items 4)
  const ovalLayer = useMemo(() => {
    if (!showOval || !auroraPoints.length) return null
    const polygon = buildAuroraOvalPolygon(auroraPoints, 20)
    if (!polygon) return null
    return new PolygonLayer({
      id: 'aurora-oval',
      data: [{ polygon }],
      getPolygon: d => d.polygon,
      getFillColor: [0, 255, 136, 18],
      getLineColor: [0, 255, 136, 200],
      getLineWidth: 2,
      lineWidthMinPixels: 1,
      lineWidthMaxPixels: 3,
      filled: true,
      stroked: true,
      pickable: false,
      // Glow via CSS filter applied in DeckGL canvas
    })
  }, [auroraPoints, showOval])

  // Improved HeatmapLayer — GPU-accelerated, 0-33 blue, 34-66 green, 67-100 purple
  const heatmapLayer = useMemo(() => {
    if (!auroraPoints.length || (layerMode !== 'heatmap' && layerMode !== 'both')) return null
    return new HeatmapLayer({
      id: 'aurora-heatmap',
      data: auroraPoints,
      getPosition: d => d.position,
      getWeight: d => getAuroraWeight(d.probability),
      radiusPixels: 35,
      intensity: 1.2,
      threshold: 0.04,
      // Blue → Green → Purple color ramp matching 0–33 / 34–66 / 67–100
      colorRange: [
        [0, 50, 255, 0],      // 0%  — deep blue transparent
        [0, 100, 255, 120],   // 33% — blue
        [0, 220, 120, 180],   // 50% — green transition
        [0, 255, 80, 210],    // 66% — bright green
        [100, 50, 255, 230],  // 83% — purple
        [200, 0, 255, 255],   // 100% — vivid purple
      ],
      aggregation: 'SUM',
      updateTriggers: { getWeight: [auroraPoints] },
    })
  }, [auroraPoints, layerMode])

  // Scatter plot for individual points with per-probability coloring
  const scatterLayer = useMemo(() => {
    if (!auroraPoints.length || (layerMode !== 'scatter' && layerMode !== 'both')) return null
    return new ScatterplotLayer({
      id: 'aurora-scatter',
      data: auroraPoints,
      getPosition: d => d.position,
      getRadius: 14000,
      getFillColor: d => getAuroraColorWithAlpha(d.probability, 160),
      radiusMinPixels: 1,
      radiusMaxPixels: 7,
      pickable: true,
      opacity: 0.65,
      updateTriggers: { getFillColor: [auroraPoints] },
    })
  }, [auroraPoints, layerMode])

  // Magnetic Midnight Line
  const midnightLayer = useMemo(() => {
    if (!showMidnight) return null
    return new LineLayer({
      id: 'magnetic-midnight',
      data: [{ from: [midnightLon, -90], to: [midnightLon, 90] }],
      getSourcePosition: d => d.from,
      getTargetPosition: d => d.to,
      getColor: [180, 100, 255, 230], // soft purple glow
      getWidth: 4,
      widthMinPixels: 2,
      widthUnits: 'pixels',
      pickable: false,
    })
  }, [showMidnight, midnightLon])

  const layers = useMemo(() => {
    return [nightLayer, ovalLayer, heatmapLayer, scatterLayer, midnightLayer].filter(Boolean)
  }, [nightLayer, ovalLayer, heatmapLayer, scatterLayer, midnightLayer])

  const onViewStateChange = useCallback(({ viewState: vs }) => setViewState(vs), [])

  // Map click → visibility popup
  const handleMapClick = useCallback(async (info) => {
    if (!info.coordinate) return
    const [lon, lat] = info.coordinate
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return

    setClickedLocation({ lat, lon })
    setLoadingVisibility(true)
    setVisibilityData(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/visibility?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setVisibilityData(await res.json())
    } catch (err) {
      setVisibilityData({ error: err.message })
    } finally {
      setLoadingVisibility(false)
    }
  }, [])

  const closePopup = useCallback(() => {
    setVisibilityData(null)
    setClickedLocation(null)
  }, [])

  const getTooltip = useCallback(({ object }) => {
    if (!object) return null
    return {
      html: `
        <div style="padding:8px;background:rgba(0,0,0,0.88);border-radius:8px;border:1px solid #374151;min-width:120px;">
          <div style="color:#00ff88;font-weight:700;font-size:11px;margin-bottom:4px;">Aurora Probability</div>
          <div style="color:white;font-size:22px;font-weight:800;line-height:1;">${object.probability}%</div>
          <div style="color:#6b7280;font-size:10px;margin-top:6px;">
            ${object.position[1].toFixed(1)}°N, ${object.position[0].toFixed(1)}°E
          </div>
        </div>`,
      style: { backgroundColor: 'transparent' },
    }
  }, [])

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-gray-800"
      style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}
    >
      <DeckGL
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        controller={true}
        layers={layers}
        getTooltip={getTooltip}
        onClick={handleMapClick}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        getCursor={({ isHovering }) => isHovering ? 'pointer' : 'crosshair'}
      >
        <Map mapStyle={OSM_STYLE} />
      </DeckGL>

      {/* Controls overlay — right side */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        {/* Layer mode */}
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-2">
          <div className="text-[10px] text-gray-400 mb-1.5 px-1 uppercase tracking-wide">Layer Mode</div>
          <div className="flex flex-col gap-1">
            {['scatter', 'heatmap', 'both'].map(mode => (
              <button
                key={mode}
                onClick={() => setLayerMode(mode)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  layerMode === mode
                    ? 'bg-aurora-green text-gray-900 font-semibold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Night terminator + Oval toggles */}
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-2 flex flex-col gap-1">
          <button
            onClick={() => setShowTerminator(!showTerminator)}
            className={`w-full px-3 py-1.5 text-xs rounded transition-colors ${
              showTerminator ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {showTerminator ? '🌙 Night On' : '🌙 Night Off'}
          </button>
          <button
            onClick={() => setShowOval(!showOval)}
            className={`w-full px-3 py-1.5 text-xs rounded transition-colors ${
              showOval ? 'bg-emerald-700 text-white font-semibold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {showOval ? '🌐 Oval On' : '🌐 Oval Off'}
          </button>
          <button
            onClick={() => setShowMidnight(!showMidnight)}
            className={`w-full px-3 py-1.5 text-xs rounded transition-colors ${
              showMidnight ? 'bg-purple-700 text-white font-semibold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {showMidnight ? '⏱️ Midnight Line On' : '⏱️ Midnight Line Off'}
          </button>
        </div>

        {/* Stats */}
        {auroraData && (
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-3 text-xs">
            <div className="text-gray-400 mb-0.5">Aurora Points</div>
            <div className="text-aurora-green font-semibold text-lg leading-tight">
              {auroraData.features?.length.toLocaleString() || 0}
            </div>
            {auroraData.metadata?.total_grid_points && (
              <div className="text-gray-600 text-[9px] mt-1">
                of {auroraData.metadata.total_grid_points.toLocaleString()} grid pts
              </div>
            )}
            {auroraData.metadata?.observation_time && (
              <div className="text-gray-500 text-[10px] mt-1">
                {new Date(auroraData.metadata.observation_time).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        <DataSourcesFooter className="static self-end mt-1" />
      </div>

      <KpContextOverlay />

      {/* Top-left overlays (below KP Context) */}
      <div className="absolute top-36 left-4 flex flex-col gap-2 z-10">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 px-3 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-aurora-green animate-pulse" />
          <span className="text-xs text-gray-400">Auto-refresh: 60s</span>
        </div>
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 px-3 py-2">
          <span className="text-xs text-gray-400">💡 Click anywhere to check visibility</span>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-20">
          <div className="bg-gray-800 px-6 py-4 rounded-lg border border-gray-700 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-aurora-green border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-300">Loading aurora data…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-4 bg-red-900/90 backdrop-blur-sm text-red-200 px-4 py-2 rounded-lg border border-red-700 text-sm z-10">
          ⚠ {error}
        </div>
      )}

      {/* Legend — bottom left (moved slightly up to clear footer) */}
      <div className="absolute bottom-20 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-3 z-10">
        <div className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">Aurora Probability</div>
        <div className="flex flex-col gap-1">
          {[
            { color: 'rgb(0, 80, 255)', label: 'Low (0–33%)' },
            { color: 'rgb(0, 255, 100)', label: 'Medium (34–66%)' },
            { color: 'rgb(180, 0, 255)', label: 'High (67–100%)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-4 h-2.5 rounded" style={{ background: color }} />
              <span className="text-[10px] text-gray-300">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-4 h-2.5 rounded border border-aurora-green bg-aurora-green/10" />
            <span className="text-[10px] text-gray-300">Aurora oval (≥20%)</span>
          </div>
        </div>
      </div>

      {/* Visibility popup */}
      {visibilityData && !visibilityData.error && (
        <VisibilityPopup data={visibilityData} onClose={closePopup} />
      )}

      {/* Visibility loading */}
      {loadingVisibility && clickedLocation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-gray-900/90 backdrop-blur-sm px-6 py-4 rounded-lg border border-gray-700 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-aurora-green border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-300 text-sm">
              Visibility at {clickedLocation.lat.toFixed(2)}°, {clickedLocation.lon.toFixed(2)}°…
            </span>
          </div>
        </div>
      )}

      {/* Visibility error */}
      {visibilityData?.error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-red-900/90 backdrop-blur-sm text-red-200 px-6 py-4 rounded-lg border border-red-700">
            <div className="text-sm font-semibold mb-1">Visibility Error</div>
            <div className="text-xs">{visibilityData.error}</div>
            <button onClick={closePopup} className="mt-3 text-xs text-red-300 hover:text-white transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AuroraMapDeckGL() {
  return (
    <MapErrorBoundary>
      <AuroraMapDeckGLInner />
    </MapErrorBoundary>
  )
}
