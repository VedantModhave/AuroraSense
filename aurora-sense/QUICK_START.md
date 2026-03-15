# AuroraSense - Quick Start Guide

## 🚀 Getting Started (5 minutes)

### 1. Start the Application
```bash
# Terminal 1 - Backend
cd aurora-sense/backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd aurora-sense/frontend
npm run dev
```

**Access**: http://localhost:5173

### 2. Enable Aurora Alerts
1. Click 🔔 bell icon (top right)
2. Toggle "Enable Alerts" → ON
3. Toggle "Browser Notifications" → ON
4. Allow notifications when prompted

### 3. Add Your Location
1. In Alert Settings modal:
   - Name: "My Location"
   - Latitude: Your latitude (e.g., 64.8)
   - Longitude: Your longitude (e.g., -147.7)
2. Click "Add Location"

### 4. Done! 🎉
You'll receive alerts when:
- Bz < -7 nT (strong southward IMF)
- Solar wind speed > 500 km/s
- Visibility score > 70 at your location

## 📍 Popular Aurora Viewing Locations

| Location | Latitude | Longitude |
|----------|----------|-----------|
| Fairbanks, Alaska | 64.8 | -147.7 |
| Tromsø, Norway | 69.6 | 18.9 |
| Reykjavik, Iceland | 64.1 | -21.9 |
| Yellowknife, Canada | 62.5 | -114.4 |
| Abisko, Sweden | 68.4 | 18.8 |
| Rovaniemi, Finland | 66.5 | 25.7 |

## 🗺️ Navigation

### Dashboard
- Overview with Kp gauge and forecast
- Alert indicator in header
- Basic visibility map

### Map View
- Simple aurora boundary visualization
- Zoom and pan controls

### Aurora Map
- Advanced deck.gl visualization
- Scatter + heatmap layers
- Day/night terminator overlay
- Click anywhere to check visibility
- Toggle layer modes

## 🔔 Alert System Features

### Alert Triggers (OR logic)
- ⚡ **Bz < -7 nT**: Southward magnetic field
- 🌪️ **Speed > 500 km/s**: Fast solar wind
- ✨ **Visibility > 70**: Excellent viewing conditions

### Customization
- Adjust thresholds for sensitivity
- Save multiple locations
- Enable/disable notifications
- View alert history

### Notification Example
```
🌌 Aurora Alert!

Southward IMF: Bz = -8.5 nT (threshold: -7 nT)
High solar wind speed: 520 km/s (threshold: 500 km/s)
```

## 🌐 API Endpoints

### Space Weather
```bash
# Comprehensive data
GET http://localhost:8000/api/space-weather

# Kp index only
GET http://localhost:8000/api/kp

# Aurora grid (GeoJSON)
GET http://localhost:8000/api/aurora-map
```

### Visibility
```bash
# Check specific location
GET http://localhost:8000/api/visibility?lat=64.8&lon=-147.7
```

### Documentation
```bash
# Interactive API docs
http://localhost:8000/docs
```

## 🎨 Map Features

### Layer Modes
- **Scatter**: Individual probability points
- **Heatmap**: Smooth intensity gradient
- **Both**: Combined visualization

### Interactions
- **Zoom/Pan**: Mouse wheel and drag
- **Click**: Check visibility at any location
- **Hover**: View aurora probability
- **Toggle**: Night overlay on/off

### Color Scale
- 🔵 Blue (0-33%): Low probability
- 🟢 Green (34-66%): Medium probability
- 🟣 Purple (67-100%): High probability

## 📊 Understanding the Data

### Visibility Score
```
Score = (Aurora × 0.5) + (Clear Sky × 0.3) + (Darkness × 0.2)
```

- **0-29**: Poor conditions
- **30-59**: Moderate conditions
- **60-100**: Good to excellent conditions

### Kp Index
- **0-2**: Quiet
- **3-4**: Moderate activity
- **5-6**: Strong activity
- **7-9**: Extreme activity (rare)

### Darkness Score
- **0-30**: Daylight/twilight
- **30-60**: Civil/nautical twilight
- **60-85**: Astronomical twilight
- **85-100**: Full darkness

## 🔧 Troubleshooting

### No Notifications?
1. Check browser permissions
2. Ensure toggle is ON
3. Test with low thresholds (Bz: 0, Speed: 0, Visibility: 0)

### Map Not Loading?
1. Check browser console (F12)
2. Verify backend is running (port 8000)
3. Clear browser cache

### No Aurora Data?
1. Wait 60 seconds for initial fetch
2. Check backend logs
3. Verify NOAA APIs are accessible

### Slow Performance?
1. Switch to "Heatmap" only mode
2. Reduce browser zoom level
3. Close other tabs

## 💡 Pro Tips

1. **Multiple Locations**: Add home + travel destinations
2. **Threshold Tuning**: Start with defaults, adjust based on alert frequency
3. **Time Zones**: Add locations in different zones for 24/7 coverage
4. **Mobile**: Works on mobile browsers with notification support
5. **Planning**: Check forecast chart for upcoming activity

## 📱 Mobile Usage

### Supported Browsers
- ✅ Chrome (Android)
- ✅ Firefox (Android)
- ✅ Safari 16.4+ (iOS)
- ❌ Older browsers

### Tips
- Add to home screen for app-like experience
- Enable notifications in browser settings
- Use landscape mode for better map view

## 🎯 Common Use Cases

### Aurora Chaser
- Add current location
- Set aggressive thresholds (Bz: -5, Speed: 400, Visibility: 50)
- Enable notifications
- Check map frequently

### Photographer
- Add photo locations
- Set conservative thresholds (Bz: -10, Speed: 600, Visibility: 80)
- Monitor forecast chart
- Plan shoots 1-2 days ahead

### Casual Observer
- Add home location
- Use default thresholds
- Enable notifications
- Check when alerted

## 📚 Learn More

- **Alert System Guide**: See ALERT_SYSTEM_GUIDE.md
- **Features**: See FEATURES.md
- **API Docs**: http://localhost:8000/docs
- **NOAA SWPC**: https://www.swpc.noaa.gov/

## 🆘 Need Help?

1. Check browser console (F12) for errors
2. Verify both services are running
3. Test API endpoints directly
4. Review documentation files

---

**Enjoy aurora hunting! 🌌✨**
