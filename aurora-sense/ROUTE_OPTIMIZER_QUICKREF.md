# Route Optimizer - Quick Reference Card

## 🚀 Quick Start

### UI Access
1. Navigate to http://localhost:5173
2. Click "Route Optimizer" tab
3. Enter origin coordinates
4. Adjust criteria sliders
5. Click "Find Best Route"

### API Access
```bash
curl "http://localhost:8000/api/route/optimize?origin_lat=64.8&origin_lon=-147.7"
```

## 📊 Default Settings

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Search Radius | 100 km | 10-500 | How far to search |
| Min Aurora | 50% | 0-100 | Minimum aurora activity |
| Max Cloud | 30% | 0-100 | Maximum cloud cover |
| Max Bortle | 4 | 1-9 | Maximum light pollution |
| Profile | driving | - | Transport mode |

## 🎯 Scoring Formula

```
score = (aurora × 0.5) + (clear_sky × 0.3) + (darkness × 0.2)
```

## 🗺️ Map Legend

| Color | Meaning |
|-------|---------|
| 🔵 Blue | Your starting location |
| 🟢 Green | Best destination |
| 🟡 Yellow | Alternative locations |
| Green Line | GPS route |

## 📍 Popular Starting Points

| Location | Latitude | Longitude |
|----------|----------|-----------|
| Fairbanks, AK | 64.8 | -147.7 |
| Tromsø, Norway | 69.6 | 18.9 |
| Reykjavik, Iceland | 64.1 | -21.9 |
| Yellowknife, Canada | 62.5 | -114.4 |
| Abisko, Sweden | 68.4 | 18.8 |

## 🔧 Common Adjustments

### More Options
- ⬆️ Increase search radius
- ⬇️ Lower aurora threshold
- ⬆️ Raise cloud tolerance
- ⬆️ Raise Bortle limit

### Better Quality
- ⬇️ Decrease search radius
- ⬆️ Raise aurora threshold
- ⬇️ Lower cloud tolerance
- ⬇️ Lower Bortle limit

## 🌟 Bortle Scale Reference

| Scale | Description | Suitable? |
|-------|-------------|-----------|
| 1-2 | Excellent dark sky | ✅ Perfect |
| 3 | Rural sky | ✅ Great |
| 4 | Rural/suburban | ✅ Good |
| 5-6 | Suburban | ⚠️ Marginal |
| 7-9 | Urban | ❌ Poor |

## 🚗 Transport Modes

| Mode | Best For | Speed |
|------|----------|-------|
| 🚗 Driving | Distance, flexibility | Fast |
| 🚴 Cycling | Eco-friendly, moderate | Medium |
| 🚶 Walking | Very local, quiet | Slow |

## ⚡ Quick Scenarios

### Last Minute
```
Radius: 50 km
Aurora: 40%
Cloud: 40%
Bortle: 5
```

### Photography
```
Radius: 200 km
Aurora: 75%
Cloud: 15%
Bortle: 2
```

### Romantic
```
Radius: 75 km
Aurora: 65%
Cloud: 25%
Bortle: 3
```

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| No locations found | Increase radius or relax criteria |
| Route not showing | Check OSRM service, try different mode |
| Slow performance | Reduce search radius |
| Low scores | Check global aurora activity |

## 📡 API Endpoints

### GET Request
```
/api/route/optimize?origin_lat=XX&origin_lon=XX&search_radius_km=100
```

### POST Request
```json
POST /api/route/optimize
{
  "origin_lat": 64.8,
  "origin_lon": -147.7,
  "search_radius_km": 100,
  "min_aurora_probability": 50,
  "max_cloud_cover": 30,
  "max_bortle": 4,
  "profile": "driving"
}
```

## 📚 Documentation

- **Full Guide**: ROUTE_OPTIMIZER_GUIDE.md
- **Examples**: ROUTE_OPTIMIZER_EXAMPLES.md
- **Technical**: ROUTE_OPTIMIZER_SUMMARY.md
- **API Docs**: http://localhost:8000/docs

## 💡 Pro Tips

1. Check Kp index first (Dashboard)
2. Use larger radius during low activity
3. Check alternatives for backup plans
4. Plan during new moon for best darkness
5. Scout locations during daytime

---

**Need Help?** See ROUTE_OPTIMIZER_GUIDE.md for detailed instructions
