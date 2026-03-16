import { useState, useCallback } from 'react'
import DeckGL from '@deck.gl/react'
import { PolygonLayer, LineLayer } from '@deck.gl/layers'
import { Map } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapErrorBoundary from './MapErrorBoundary'
import KpContextOverlay from './KpContextOverlay'
import DataSourcesFooter from './DataSourcesFooter'

// Free OpenStreetMap tile style
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

const INITIAL_VIEW = {
  longitude: 0,
  latitude: 70,
  zoom: 2,
  pitch: 0,
  bearing: 0,
}

/** Build a ring of coordinates at a given latitude (360 points). */
function latRing(lat) {
  return Array.from({ length: 361 }, (_, i) => [i - 180, lat])
}

/** Aurora oval polygon: filled band from visibilityLatitude to ~85°N (max Mercator). */
function buildAuroraPolygon(lat) {
  // Web Mercator crashes at lat=90, cap at 85.05 for polygon projection
  const safeLat = Math.min(lat, 85.0)
  const outer = latRing(85.05)
  const inner = [...latRing(safeLat)].reverse()
  
  // Return a single ring that follows the top edge, then the bottom edge
  return [...outer, ...inner, outer[0]]
}

/** Visibility boundary as a LineLayer data array. */
function buildBoundaryLine(lat) {
  const ring = latRing(lat)
  return ring.slice(0, -1).map((pos, i) => ({
    from: pos,
    to: ring[i + 1],
  }))
}

function AuroraMapInner({ visibilityLatitude = 65 }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW)

  const layers = [
    new PolygonLayer({
      id: 'aurora-oval',
      data: [{ polygon: buildAuroraPolygon(visibilityLatitude) }],
      getPolygon: d => d.polygon,
      getFillColor: [0, 255, 136, 100],
      getLineColor: [0, 255, 136, 50],
      filled: true,
      stroked: true,
      pickable: false,
    }),
    new LineLayer({
      id: 'visibility-boundary',
      data: buildBoundaryLine(visibilityLatitude),
      getSourcePosition: d => d.from,
      getTargetPosition: d => d.to,
      getColor: [0, 255, 136, 200],
      getWidth: 2,
      widthUnits: 'pixels',
      pickable: false,
    }),
  ]

  const onViewStateChange = useCallback(({ viewState: vs }) => {
    setViewState(vs)
  }, [])

  return (
    // Key fix: explicit height so DeckGL canvas resolves to real pixel dimensions
    <div
      className="relative w-full rounded-xl overflow-hidden border border-gray-800"
      style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}
    >
      <DeckGL
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        controller={true}
        layers={layers}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <Map mapStyle={OSM_STYLE} />
      </DeckGL>
      <KpContextOverlay />

      {/* Legend */}
      <div className="absolute bottom-20 left-4 bg-gray-900/80 text-xs text-gray-300 px-3 py-2 rounded-lg border border-gray-700 pointer-events-none z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-4 h-1 rounded" style={{ background: '#00ff88' }} />
          Visibility boundary ({visibilityLatitude}° N)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-3 rounded opacity-40" style={{ background: '#00ff88' }} />
          Aurora zone
        </div>
      </div>

      <DataSourcesFooter />
    </div>
  )
}

export default function AuroraMap({ visibilityLatitude }) {
  return (
    <MapErrorBoundary>
      <AuroraMapInner visibilityLatitude={visibilityLatitude} />
    </MapErrorBoundary>
  )
}
