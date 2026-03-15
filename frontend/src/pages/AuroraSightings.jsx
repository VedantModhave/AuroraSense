import { useState, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer } from '@deck.gl/layers'
import { Map } from 'react-map-gl/maplibre'
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

export default function AuroraSightings() {
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ lat: '', lon: '', photo_url: '' })
  const [submitting, setSubmitting] = useState(false)
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 65,
    zoom: 2,
  })

  useEffect(() => {
    fetchSightings()
  }, [])

  const fetchSightings = async () => {
    try {
      const res = await fetch('/api/sightings')
      if (res.ok) {
        const data = await res.json()
        setSightings(data)
      }
    } catch (e) {
      console.error('Failed to fetch sightings:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.lat || !form.lon) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(form.lat),
          longitude: parseFloat(form.lon),
          photo_url: form.photo_url || null
        })
      })

      if (res.ok) {
        setForm({ lat: '', lon: '', photo_url: '' })
        fetchSightings()
      }
    } catch (e) {
      console.error('Submit error:', e)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle click on map to fill coords
  const handleMapClick = (info) => {
    if (info.coordinate) {
      setForm(prev => ({
        ...prev,
        lon: info.coordinate[0].toFixed(4),
        lat: info.coordinate[1].toFixed(4)
      }))
    }
  }

  const layers = [
    new ScatterplotLayer({
      id: 'sightings-layer',
      data: sightings,
      getPosition: d => [d.longitude, d.latitude],
      getFillColor: [0, 255, 136, 200],
      getRadius: 20000,
      radiusMinPixels: 6,
      radiusMaxPixels: 20,
      pickable: true,
      stroked: true,
      getLineColor: [255, 255, 255],
      lineWidthMinPixels: 2,
    })
  ]

  const getTooltip = ({ object }) => {
    if (!object) return null
    return {
      html: `
        <div style="background:rgba(0,0,0,0.9);padding:10px;border-radius:8px;border:1px solid #00ff88;color:white;font-family:system-ui;font-size:12px">
          <div style="font-weight:bold;margin-bottom:4px">Aurora Sighting</div>
          <div>Lat: ${object.latitude.toFixed(3)}</div>
          <div>Lon: ${object.longitude.toFixed(3)}</div>
          <div style="color:#9ca3af;font-size:10px;margin-top:4px">${new Date(object.timestamp).toLocaleString()}</div>
          ${object.photo_url ? `<div style="margin-top:8px;color:#00ff88">📷 Photo submitted</div>` : ''}
        </div>
      `
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4 lg:p-6">
      <div className="lg:w-96 bg-gray-900 rounded-xl border border-gray-800 p-6 flex-shrink-0">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span>📸</span> Community Sightings
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Report and view live aurora sightings from the community.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Click map or enter manually:</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.0001"
                required
                placeholder="Lat"
                value={form.lat}
                onChange={e => setForm(prev => ({ ...prev, lat: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-aurora-green outline-none"
              />
              <input
                type="number"
                step="0.0001"
                required
                placeholder="Lon"
                value={form.lon}
                onChange={e => setForm(prev => ({ ...prev, lon: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-aurora-green outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Photo URL (optional):</label>
            <input
              type="url"
              placeholder="https://..."
              value={form.photo_url}
              onChange={e => setForm(prev => ({ ...prev, photo_url: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-aurora-green outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-aurora-green text-gray-900 font-bold py-2 rounded hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Sighting'}
          </button>
        </form>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-2">Recent Reports ({sightings.length})</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : sightings.length === 0 ? (
              <div className="text-xs text-gray-500">No sightings reported yet.</div>
            ) : (
              sightings.slice().reverse().map(s => (
                <div key={s.id} className="bg-gray-800/50 rounded p-3 text-sm border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-200">{s.latitude.toFixed(2)}°, {s.longitude.toFixed(2)}°</span>
                    <span className="text-[10px] text-gray-500">{new Date(s.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {s.photo_url && (
                    <a href={s.photo_url} target="_blank" rel="noreferrer" className="text-xs text-aurora-green hover:underline flex items-center gap-1 mt-1">
                      <span>📷</span> View Photo
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-gray-800 relative min-h-[500px]">
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState }) => setViewState(viewState)}
          controller={true}
          layers={layers}
          getTooltip={getTooltip}
          onClick={handleMapClick}
          getCursor={({ isHovering }) => isHovering ? 'pointer' : 'crosshair'}
        >
          <Map mapStyle={OSM_STYLE} />
        </DeckGL>
        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded px-3 py-2 text-xs text-gray-300 pointer-events-none">
          Click anywhere on the map to set location
        </div>
      </div>
    </div>
  )
}
