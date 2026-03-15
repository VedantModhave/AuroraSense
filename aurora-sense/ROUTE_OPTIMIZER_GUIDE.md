# Aurora Viewing Route Optimizer Guide

## Overview

The Route Optimizer finds the nearest optimal location for aurora viewing based on real-time conditions and generates GPS directions using OpenStreetMap routing.

## Features

### 🎯 Smart Location Finding
- Searches within customizable radius (10-500 km)
- Evaluates multiple candidate locations
- Ranks by composite score

### 📊 Multi-Criteria Optimization

The optimizer considers three key factors:

1. **Aurora Probability** (50% weight)
   - Real-time NOAA OVATION data
   - Minimum threshold: 0-100%
   - Default: 50%

2. **Cloud Cover** (30% weight)
   - Open-Meteo weather forecast
   - Maximum threshold: 0-100%
   - Default: 30%

3. **Light Pollution** (20% weight)
   - Bortle scale estimation (1-9)
   - Maximum threshold: 1-9
   - Default: 4 (rural/suburban transition)

### 🗺️ GPS Routing
- Powered by OpenStreetMap Routing Machine (OSRM)
- Three transport modes:
  - 🚗 Driving
  - 🚴 Cycling
  - 🚶 Walking
- Turn-by-turn directions
- Distance and duration estimates

### 📍 Alternative Locations
- Shows top 5 alternative locations
- Displayed as yellow markers on map
- Allows manual selection if preferred

## How to Use

### 1. Enter Starting Location
```
Latitude: 64.8
Longitude: -147.7
```

### 2. Adjust Search Criteria

**Search Radius**: How far to search (default: 100 km)
- Increase for remote areas
- Decrease for quick trips

**Min Aurora Probability**: Minimum acceptable aurora activity (default: 50%)
- Lower for more options
- Higher for guaranteed activity

**Max Cloud Cover**: Maximum acceptable clouds (default: 30%)
- Lower for clearer skies
- Higher for more options

**Max Light Pollution**: Maximum Bortle scale (default: 4)
- 1-3: Excellent dark skies
- 4: Rural/suburban transition
- 5-6: Suburban
- 7-9: Urban (not recommended)

**Transport Mode**: How you'll travel
- Driving: Fastest, most flexible
- Cycling: Eco-friendly, moderate speed
- Walking: Slowest, very local

### 3. Click "Find Best Route"

The system will:
1. Generate candidate locations in search radius
2. Check aurora probability at each location
3. Fetch cloud cover forecasts
4. Estimate light pollution
5. Calculate composite scores
6. Select best location
7. Generate GPS route

### 4. Review Results

**Destination Info**:
- Aurora Probability: Real-time percentage
- Cloud Cover: Current forecast
- Bortle Scale: Light pollution level
- Score: Composite rating (0-100)

**Route Info**:
- Distance: Total kilometers
- Duration: Estimated travel time
- Path: Green line on map

**Map Markers**:
- 🔵 Blue: Your starting location
- 🟢 Green: Optimal destination
- 🟡 Yellow: Alternative locations

## API Endpoint

### GET /api/route/optimize

**Query Parameters**:
```
origin_lat: float (required) - Starting latitude
origin_lon: float (required) - Starting longitude
search_radius_km: float (default: 100) - Search radius
min_aurora_probability: float (default: 50) - Min aurora %
max_cloud_cover: float (default: 30) - Max cloud %
max_bortle: int (default: 4) - Max Bortle scale
profile: string (default: "driving") - Transport mode
```

**Example Request**:
```bash
curl "http://localhost:8000/api/route/optimize?origin_lat=64.8&origin_lon=-147.7&search_radius_km=100&min_aurora_probability=50&max_cloud_cover=30&max_bortle=4&profile=driving"
```

**Response**:
```json
{
  "origin": {
    "latitude": 64.8,
    "longitude": -147.7
  },
  "destination": {
    "latitude": 65.2,
    "longitude": -148.1,
    "aurora_probability": 75.5,
    "cloud_cover": 15.2,
    "bortle_scale": 3,
    "score": 82.3
  },
  "route": {
    "distance_km": 45.2,
    "duration_minutes": 38.5,
    "geometry": {
      "type": "LineString",
      "coordinates": [[...]]
    },
    "steps": [
      {
        "instruction": "Head north on Main St",
        "distance_m": 1200,
        "duration_s": 90,
        "type": "turn"
      }
    ]
  },
  "alternative_locations": [...]
}
```

## Scoring Algorithm

```
score = (aurora_probability × 0.5) + 
        ((100 - cloud_cover) × 0.3) + 
        ((10 - bortle_scale) × 10 × 0.2)
```

**Example Calculation**:
- Aurora: 80% → 80 × 0.5 = 40
- Cloud: 20% → (100-20) × 0.3 = 24
- Bortle: 3 → (10-3) × 10 × 0.2 = 14
- **Total Score: 78**

## Tips for Best Results

### 🌌 Aurora Chasers
- Set min aurora probability to 60-70%
- Use larger search radius (200-300 km)
- Accept higher cloud cover (40-50%) for more options
- Check multiple times as conditions change

### 📸 Photographers
- Set max cloud cover to 20% or less
- Require Bortle 3 or lower
- Plan ahead - check forecast chart first
- Consider cycling/walking for quieter locations

### 🚗 Road Trippers
- Use driving mode
- Moderate search radius (100-150 km)
- Balance all criteria
- Check alternative locations for scenic routes

### 🏕️ Campers
- Set Bortle to 2 or lower
- Use walking mode to find nearby spots
- Small search radius (20-50 km)
- Prioritize aurora probability

## Limitations

### Light Pollution Data
Current implementation uses simplified Bortle estimation based on latitude. For production:
- Integrate Light Pollution Map API
- Use NASA Black Marble satellite data
- Consider OpenStreetMap population density

### Routing Service
Uses public OSRM demo server. For production:
- Host your own OSRM instance
- Add traffic data integration
- Support more transport modes
- Include elevation profiles

### Search Algorithm
Grid-based search with 25 candidate points. Improvements:
- Increase candidate density
- Use intelligent sampling
- Consider road network accessibility
- Add historical success data

## Troubleshooting

### "No suitable locations found"
- Increase search radius
- Lower min aurora probability
- Raise max cloud cover
- Increase max Bortle scale
- Check if aurora activity is low globally

### Route not displaying
- Check browser console for errors
- Verify OSRM service is accessible
- Try different transport mode
- Ensure coordinates are valid

### Slow performance
- Reduce search radius
- Use driving mode (faster routing)
- Check network connection
- Wait for data pipeline to warm up

## Future Enhancements

- [ ] Real light pollution data integration
- [ ] Historical aurora success rates
- [ ] Multi-stop route optimization
- [ ] Offline map support
- [ ] Mobile app with GPS tracking
- [ ] Community-reported viewing spots
- [ ] Weather radar overlay
- [ ] Elevation and terrain analysis
- [ ] Parking and facility information
- [ ] Social sharing features

## Related Features

- **Visibility Scoring**: Click map to check any location
- **Alert System**: Get notified when conditions improve
- **Aurora Map**: See global aurora probability
- **Forecast Chart**: Plan trips 1-3 days ahead

---

**Happy aurora hunting! 🌌✨**
