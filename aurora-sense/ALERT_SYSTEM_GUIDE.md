# Aurora Alert System - User Guide

## Overview
The Aurora Alert System monitors space weather conditions and visibility at your saved locations, sending browser notifications when favorable aurora viewing conditions are detected.

## Alert Triggers

The system triggers alerts when ANY of these conditions are met:

### 1. Strong Southward IMF (Bz)
- **Condition**: Bz < -7 nT (default)
- **Why**: Southward-pointing interplanetary magnetic field allows solar wind to interact with Earth's magnetosphere
- **Impact**: Can trigger geomagnetic storms and aurora displays
- **Customizable**: Yes, adjust threshold in settings

### 2. High Solar Wind Speed
- **Condition**: Speed > 500 km/s (default)
- **Why**: Fast solar wind streams compress Earth's magnetosphere
- **Impact**: Increases aurora probability and intensity
- **Customizable**: Yes, adjust threshold in settings

### 3. Excellent Visibility
- **Condition**: Visibility Score > 70 (default)
- **Why**: Combines aurora probability, clear skies, and darkness
- **Impact**: Optimal conditions for aurora observation
- **Customizable**: Yes, adjust threshold in settings

## How to Use

### Step 1: Enable Alerts
1. Click the 🔔 bell icon in the Dashboard header
2. Toggle "Enable Alerts" to ON
3. Toggle "Browser Notifications" to ON
4. Grant notification permission when prompted

### Step 2: Add Locations
1. In the Alert Settings modal, scroll to "Saved Locations"
2. Enter location details:
   - **Name**: e.g., "Fairbanks, Alaska"
   - **Latitude**: e.g., 64.8
   - **Longitude**: e.g., -147.7
3. Click "Add Location"
4. Repeat for multiple locations (home, vacation spot, etc.)

### Step 3: Customize Thresholds (Optional)
Adjust alert sensitivity:
- **Bz Threshold**: Lower = more sensitive (e.g., -5 nT)
- **Speed Threshold**: Lower = more sensitive (e.g., 400 km/s)
- **Visibility Threshold**: Lower = more alerts (e.g., 50)

### Step 4: Monitor
- System checks conditions every 60 seconds
- Green "Monitoring" indicator = active, no alerts
- Pulsing green "Alert Active!" = conditions met
- Desktop notification sent when alert triggers

## Alert Indicator States

| Indicator | Meaning |
|-----------|---------|
| 🔔 Alerts Off (gray) | Alert system disabled |
| 🔔 Monitoring (green) | Active, no current alerts |
| 🔔 Alert Active! (pulsing green) | Alert conditions met! |

## Browser Notifications

### Notification Content
- **Title**: "🌌 Aurora Alert!"
- **Body**: Lists all triggered conditions
- **Example**: 
  ```
  Southward IMF: Bz = -8.5 nT (threshold: -7 nT)
  High solar wind speed: 520 km/s (threshold: 500 km/s)
  ```

### Notification Behavior
- Auto-closes after 10 seconds
- Click to focus browser window
- Tagged to prevent duplicates
- Requires browser permission

### Troubleshooting Notifications

**Not receiving notifications?**
1. Check browser permissions:
   - Chrome: Settings → Privacy → Site Settings → Notifications
   - Firefox: Preferences → Privacy & Security → Permissions → Notifications
2. Ensure "Browser Notifications" toggle is ON
3. Check system Do Not Disturb settings
4. Try disabling and re-enabling notifications

**Too many notifications?**
- Increase alert thresholds
- Remove some saved locations
- Temporarily disable alerts

## Alert History

The system maintains a history of the last 10 alerts:
- View in Alert Settings modal
- Shows timestamp, location, and conditions
- Persists across browser sessions
- Clear history with "Clear" button (if implemented)

## Data Storage

All settings stored in browser localStorage:
- Saved locations
- Alert thresholds
- Enable/disable state
- Notification preferences

**Privacy**: All data stays on your device. Nothing sent to servers except API requests for current conditions.

## Best Practices

### Location Selection
- Choose high-latitude locations (60°+ North/South)
- Avoid light-polluted cities
- Consider time zones for darkness

### Threshold Tuning
**Conservative (fewer alerts)**:
- Bz: -10 nT
- Speed: 600 km/s
- Visibility: 80

**Aggressive (more alerts)**:
- Bz: -5 nT
- Speed: 400 km/s
- Visibility: 50

**Balanced (default)**:
- Bz: -7 nT
- Speed: 500 km/s
- Visibility: 70

### Multiple Locations
- Add home location for immediate alerts
- Add travel destinations for planning
- Add different time zones for 24/7 coverage

## Technical Details

### Alert Check Frequency
- Space weather data: Every 60 seconds
- Visibility checks: On-demand per location
- Notification cooldown: None (alerts on every check if conditions persist)

### Visibility Score Formula
```
visibility_score = (aurora_probability × 0.5) + 
                  ((100 - cloud_cover) × 0.3) + 
                  (darkness_score × 0.2)
```

### Data Sources
- **Magnetic Field**: NOAA SWPC 1-day solar wind data
- **Solar Wind Speed**: NOAA SWPC plasma data
- **Aurora Probability**: NOAA OVATION aurora forecast
- **Cloud Cover**: Open-Meteo weather API
- **Darkness**: Calculated from solar/lunar position

## Example Scenarios

### Scenario 1: Geomagnetic Storm
```
Conditions:
- Bz: -12 nT ✓ (below -7 threshold)
- Speed: 650 km/s ✓ (above 500 threshold)
- Visibility: 45 (below 70 threshold)

Result: Alert triggered (2 conditions met)
Notification: "Southward IMF: Bz = -12 nT, High solar wind speed: 650 km/s"
```

### Scenario 2: Perfect Viewing Night
```
Conditions:
- Bz: -3 nT (above -7 threshold)
- Speed: 380 km/s (below 500 threshold)
- Visibility: 85 ✓ (above 70 threshold)

Result: Alert triggered (1 condition met)
Notification: "Excellent visibility: 85 (threshold: 70)"
```

### Scenario 3: No Alert
```
Conditions:
- Bz: -2 nT (above -7 threshold)
- Speed: 350 km/s (below 500 threshold)
- Visibility: 25 (below 70 threshold)

Result: No alert (0 conditions met)
```

## FAQ

**Q: Can I get alerts for multiple locations?**
A: Yes! Add as many locations as you want. Each is checked independently.

**Q: Will alerts drain my battery?**
A: No. Checks run only when browser is open. Minimal CPU/network usage.

**Q: Can I get SMS/email alerts?**
A: Not currently. Browser notifications only.

**Q: Do alerts work on mobile?**
A: Yes, if your mobile browser supports notifications (Chrome, Firefox, Safari 16.4+).

**Q: What if I miss an alert?**
A: Check the Alert Settings modal for recent alert history.

**Q: Can I test the alert system?**
A: Yes! Set very low thresholds (e.g., Bz: 0, Speed: 0, Visibility: 0) to trigger test alerts.

## Support

For issues or questions:
1. Check browser console for errors (F12)
2. Verify API endpoints are accessible
3. Ensure browser supports Notification API
4. Check localStorage isn't full/blocked

## Future Enhancements

Potential features:
- Email/SMS notifications
- Alert scheduling (only during certain hours)
- Forecast alerts (predict conditions 1-3 days ahead)
- Alert sound customization
- Mobile app with push notifications
