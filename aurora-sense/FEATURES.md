# AuroraSense Features

## Overview
Real-time aurora forecasting platform powered by NOAA space weather data with interactive deck.gl visualization.

## Backend API Endpoints

### Space Weather Data
- `GET /api/health` - Health check
- `GET /api/space-weather` - Comprehensive space weather summary
  - Magnetic field (Bx, By, Bz, Bt)
  - Solar wind plasma (density, speed, temperature)
  - Kp index
  - Aurora probability grid
- `GET /api/kp` - Current Kp index and history
- `GET /api/aurora-grid` - Raw aurora probability grid (65k points)

### Aurora Visualization
- `GET /api/aurora-map` - GeoJSON aurora probability map
  - Query params: `filter` (hotspots, contours, or all)
  - Query params: `min_probability` (threshold for hotspots)
- `GET /api/aurora-map/stats` - Aurora activity statistics

### Visibility Scoring
- `GET /api/visibility?lat=XX&lon=XX` - Comprehensive visibility score
  - Aurora probability (50% weight)
  - Cloud cover from Open-Meteo (30% weight)
  - Darkness score - solar/lunar position (20% weight)
  - Returns detailed breakdown and recommendation

### Legacy Endpoints
- `GET /api/aurora/kp` - Kp index (legacy format)
- `GET /api/aurora/forecast` - Aurora forecast (legacy format)

## Frontend Features

### Pages
1. **Dashboard** - Overview with Kp gauge, forecast chart, and basic map
2. **Map View** - Simple visibility boundary visualization
3. **Aurora Map** (NEW) - Advanced deck.gl visualization

### Aurora Map Features
- **Dual Layer Rendering**:
  - ScatterplotLayer: Individual aurora probability points
  - HeatmapLayer: Smooth probability intensity visualization
  - Toggle between scatter, heatmap, or both

- **Color Scale**:
  - Low probability (0-33%): Blue → Cyan
  - Medium probability (34-66%): Cyan → Green
  - High probability (67-100%): Green → Purple

- **Interactive Controls**:
  - Zoom and pan support
  - Hover tooltips showing probability and coordinates
  - Layer mode toggle (scatter/heatmap/both)
  - Real-time stats display

- **Auto-refresh**: Updates every 60 seconds
- **OpenStreetMap tiles**: Free, no API key required

## Data Pipeline

### Background Services
- **Async polling**: Fetches NOAA data every 60 seconds
- **Concurrent fetching**: All 4 data sources fetched in parallel
- **In-memory caching**: Latest results cached for instant API responses
- **Error handling**: Graceful degradation, keeps stale data on failure

### Data Sources
1. **Magnetic Field**: https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json
2. **Solar Wind Plasma**: https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json
3. **Aurora Grid**: https://services.swpc.noaa.gov/json/ovation_aurora_latest.json
4. **Kp Index**: https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
5. **Cloud Cover**: https://api.open-meteo.com/v1/forecast (Open-Meteo API)

## Technology Stack

### Backend
- FastAPI (Python)
- APScheduler (background jobs)
- httpx (async HTTP client)
- Pydantic (data validation)

### Frontend
- React 18
- Vite
- TailwindCSS
- deck.gl 9.2 (GPU-accelerated visualization)
  - ScatterplotLayer
  - HeatmapLayer
- maplibre-gl (OpenStreetMap rendering)

### Deployment
- Docker Compose ready
- Backend: Port 8000
- Frontend: Port 5173
- No API keys required (uses free OSM tiles)

## Visibility Scoring Algorithm

```
visibility_score = (aurora_probability × 0.5) + 
                  ((100 - cloud_cover) × 0.3) + 
                  (darkness_score × 0.2)
```

### Darkness Score Components
- **Solar altitude** (70% weight):
  - 100 = sun well below horizon (< -18°)
  - 85 = astronomical twilight (-12° to -18°)
  - 60 = nautical twilight (-6° to -12°)
  - 30 = civil twilight (0° to -6°)
  - 0 = daylight (> 0°)

- **Moon brightness** (30% weight):
  - Considers both moon illumination and altitude
  - 100 = new moon or moon below horizon
  - Lower = bright moon above horizon

## Usage

### Start Services
```bash
# Backend
cd aurora-sense/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd aurora-sense/frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Docker
```bash
cd aurora-sense
docker-compose up --build
```

## API Examples

### Get visibility score for Fairbanks, Alaska
```bash
curl "http://localhost:8000/api/visibility?lat=64.8&lon=-147.7"
```

### Get aurora map with hotspots only
```bash
curl "http://localhost:8000/api/aurora-map?filter=hotspots&min_probability=50"
```

### Get comprehensive space weather data
```bash
curl "http://localhost:8000/api/space-weather"
```
