import { useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const AURORA_OVAL_SOURCE = 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json'

export default function AuroraMap({ visibilityLatitude }) {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 70],
      zoom: 2,
      projection: 'globe',
    })

    map.current.on('load', () => {
      // Aurora visibility boundary line
      map.current.addSource('visibility-line', {
        type: 'geojson',
        data: buildLatitudeLine(visibilityLatitude ?? 65),
      })

      map.current.addLayer({
        id: 'visibility-line',
        type: 'line',
        source: 'visibility-line',
        paint: {
          'line-color': '#00ff88',
          'line-width': 2,
          'line-dasharray': [4, 2],
          'line-opacity': 0.8,
        },
      })

      // Aurora oval fill (approximate)
      map.current.addSource('aurora-fill', {
        type: 'geojson',
        data: buildAuroraOval(visibilityLatitude ?? 65),
      })

      map.current.addLayer({
        id: 'aurora-fill',
        type: 'fill',
        source: 'aurora-fill',
        paint: {
          'fill-color': '#00ff88',
          'fill-opacity': 0.12,
        },
      })
    })

    return () => map.current?.remove()
  }, [])

  // Update layers when visibility latitude changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || visibilityLatitude == null) return
    const src = map.current.getSource('visibility-line')
    const fillSrc = map.current.getSource('aurora-fill')
    if (src) src.setData(buildLatitudeLine(visibilityLatitude))
    if (fillSrc) fillSrc.setData(buildAuroraOval(visibilityLatitude))
  }, [visibilityLatitude])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-800">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapboxgl.accessToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 text-sm text-gray-400">
          Set <code className="mx-1 text-aurora-green">VITE_MAPBOX_TOKEN</code> to enable the map
        </div>
      )}
    </div>
  )
}

function buildLatitudeLine(lat) {
  const coords = Array.from({ length: 361 }, (_, i) => [i - 180, lat])
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
  }
}

function buildAuroraOval(lat) {
  const outer = Array.from({ length: 361 }, (_, i) => [i - 180, 90])
  const inner = Array.from({ length: 361 }, (_, i) => [i - 180, lat]).reverse()
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[...outer, outer[0]], [...inner, inner[0]]],
    },
  }
}
