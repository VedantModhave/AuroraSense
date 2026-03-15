# Route Optimizer - Usage Examples

## Quick Examples

### Example 1: Fairbanks, Alaska
**Scenario**: You're in Fairbanks and want to find the best spot within 100km

**Input**:
```
Origin: 64.8, -147.7
Search Radius: 100 km
Min Aurora: 50%
Max Cloud: 30%
Max Bortle: 4
Mode: Driving
```

**Expected Result**:
- Finds location with aurora probability > 50%
- Clear skies (< 30% cloud cover)
- Dark skies (Bortle ≤ 4)
- Driving directions with distance and time

### Example 2: Tromsø, Norway
**Scenario**: Aurora photographer looking for pristine dark skies

**Input**:
```
Origin: 69.6, 18.9
Search Radius: 150 km
Min Aurora: 70%
Max Cloud: 20%
Max Bortle: 3
Mode: Driving
```

**Expected Result**:
- High aurora activity location
- Very clear skies
- Excellent dark skies
- Longer drive for better conditions

### Example 3: Reykjavik, Iceland
**Scenario**: Quick evening trip, willing to compromise

**Input**:
```
Origin: 64.1, -21.9
Search Radius: 50 km
Min Aurora: 40%
Max Cloud: 40%
Max Bortle: 5
Mode: Driving
```

**Expected Result**:
- Nearby location (shorter drive)
- Moderate aurora activity acceptable
- Some clouds acceptable
- Suburban light pollution acceptable

### Example 4: Yellowknife, Canada - Cycling Adventure
**Scenario**: Eco-friendly aurora chaser with time

**Input**:
```
Origin: 62.5, -114.4
Search Radius: 30 km
Min Aurora: 60%
Max Cloud: 25%
Max Bortle: 3
Mode: Cycling
```

**Expected Result**:
- Cycling-friendly route
- Good aurora activity
- Clear skies
- Dark location within cycling distance

## API Examples

### cURL - Basic Request
```bash
curl "http://localhost:8000/api/route/optimize?origin_lat=64.8&origin_lon=-147.7&search_radius_km=100&min_aurora_probability=50&max_cloud_cover=30&max_bortle=4&profile=driving"
```

### cURL - Strict Criteria
```bash
curl "http://localhost:8000/api/route/optimize?origin_lat=69.6&origin_lon=18.9&search_radius_km=200&min_aurora_probability=80&max_cloud_cover=15&max_bortle=2&profile=driving"
```

### Python - Using requests
```python
import requests

response = requests.get('http://localhost:8000/api/route/optimize', params={
    'origin_lat': 64.8,
    'origin_lon': -147.7,
    'search_radius_km': 100,
    'min_aurora_probability': 50,
    'max_cloud_cover': 30,
    'max_bortle': 4,
    'profile': 'driving'
})

data = response.json()
print(f"Best location: {data['destination']['latitude']}, {data['destination']['longitude']}")
print(f"Aurora probability: {data['destination']['aurora_probability']}%")
print(f"Distance: {data['route']['distance_km']} km")
print(f"Duration: {data['route']['duration_minutes']} minutes")
```

### JavaScript - Using fetch
```javascript
const params = new URLSearchParams({
  origin_lat: 64.8,
  origin_lon: -147.7,
  search_radius_km: 100,
  min_aurora_probability: 50,
  max_cloud_cover: 30,
  max_bortle: 4,
  profile: 'driving'
});

const response = await fetch(`/api/route/optimize?${params}`);
const data = await response.json();

console.log('Destination:', data.destination);
console.log('Route:', data.route);
console.log('Alternatives:', data.alternative_locations);
```

### POST Request with JSON
```bash
curl -X POST "http://localhost:8000/api/route/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_lat": 64.8,
    "origin_lon": -147.7,
    "search_radius_km": 100,
    "min_aurora_probability": 50,
    "max_cloud_cover": 30,
    "max_bortle": 4,
    "profile": "driving"
  }'
```

## Response Examples

### Successful Response
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
      "coordinates": [
        [-147.7, 64.8],
        [-147.75, 64.85],
        [-147.9, 65.0],
        [-148.0, 65.15],
        [-148.1, 65.2]
      ]
    },
    "steps": [
      {
        "instruction": "Head north on Richardson Highway",
        "distance_m": 12500,
        "duration_s": 600,
        "type": "depart"
      },
      {
        "instruction": "Turn right onto Steese Highway",
        "distance_m": 28000,
        "duration_s": 1200,
        "type": "turn"
      },
      {
        "instruction": "Arrive at destination",
        "distance_m": 0,
        "duration_s": 0,
        "type": "arrive"
      }
    ]
  },
  "alternative_locations": [
    {
      "latitude": 65.0,
      "longitude": -147.5,
      "aurora_probability": 72.0,
      "cloud_cover": 18.5,
      "bortle_scale": 3,
      "score": 79.8
    },
    {
      "latitude": 64.5,
      "longitude": -148.0,
      "aurora_probability": 68.5,
      "cloud_cover": 22.0,
      "bortle_scale": 4,
      "score": 75.2
    }
  ],
  "timestamp": "2026-03-15T22:30:00Z"
}
```

### Error Response - No Locations Found
```json
{
  "detail": "No suitable aurora viewing locations found within search radius. Try increasing search radius or relaxing criteria."
}
```

## Common Scenarios

### Scenario: Last-Minute Aurora Alert
You receive an aurora alert and need to find the closest good spot quickly.

**Strategy**:
- Small search radius (30-50 km)
- Lower aurora threshold (40-50%)
- Accept some clouds (30-40%)
- Driving mode for speed

### Scenario: Weekend Photography Trip
Planning a weekend trip for aurora photography.

**Strategy**:
- Large search radius (200-300 km)
- High aurora threshold (70-80%)
- Very clear skies (< 20% clouds)
- Darkest skies (Bortle 1-2)
- Check forecast chart first

### Scenario: Romantic Evening
Taking someone special to see the aurora.

**Strategy**:
- Moderate search radius (50-100 km)
- Good aurora activity (60-70%)
- Clear skies (< 25% clouds)
- Dark but accessible (Bortle 3-4)
- Consider cycling for ambiance

### Scenario: Group Tour
Leading a group to see the aurora.

**Strategy**:
- Moderate search radius (75-150 km)
- Reliable aurora (65-75%)
- Clear skies (< 30% clouds)
- Accessible location (Bortle 4-5)
- Driving mode
- Check alternatives for backup plans

## Tips for Best Results

### Increase Success Rate
1. Check current Kp index first (Dashboard)
2. Use larger search radius during low activity
3. Be flexible with cloud cover threshold
4. Check alternative locations
5. Plan during new moon phase

### Optimize for Photography
1. Set Bortle to 2 or lower
2. Require very clear skies (< 15%)
3. High aurora probability (> 75%)
4. Scout location during daytime first
5. Bring backup locations

### Save Time
1. Use moderate thresholds
2. Smaller search radius
3. Accept Bortle 4-5
4. Check route before leaving
5. Have alternatives ready

### Handle "No Locations Found"
1. Increase search radius by 50-100 km
2. Lower aurora threshold by 10-20%
3. Increase cloud cover tolerance by 10-20%
4. Raise Bortle limit by 1-2
5. Check if aurora activity is globally low

## Integration Examples

### With Alert System
```javascript
// When alert triggers, automatically find route
useEffect(() => {
  if (lastAlert && lastAlert.shouldAlert) {
    const location = settings.locations[0];
    optimizeRoute(location.lat, location.lon);
  }
}, [lastAlert]);
```

### With Saved Locations
```javascript
// Optimize route to each saved location
for (const location of savedLocations) {
  const route = await optimizeRoute(
    currentLat, 
    currentLon,
    location.lat,
    location.lon
  );
  routes.push(route);
}
```

### Batch Processing
```python
# Check multiple origins
origins = [
    (64.8, -147.7),  # Fairbanks
    (69.6, 18.9),    # Tromsø
    (64.1, -21.9),   # Reykjavik
]

for lat, lon in origins:
    response = requests.get(f'/api/route/optimize', params={
        'origin_lat': lat,
        'origin_lon': lon,
        'search_radius_km': 100,
        'min_aurora_probability': 60,
        'max_cloud_cover': 25,
        'max_bortle': 3,
        'profile': 'driving'
    })
    
    if response.ok:
        data = response.json()
        print(f"Best route from {lat}, {lon}:")
        print(f"  Distance: {data['route']['distance_km']} km")
        print(f"  Score: {data['destination']['score']}")
```

---

**Happy aurora hunting! 🌌✨**
