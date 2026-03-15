/**
 * Calculate solar position and generate day/night terminator.
 * Based on astronomical algorithms for solar zenith angle.
 */

/**
 * Calculate Julian Day from Date
 */
function getJulianDay(date) {
  const time = date.getTime()
  return time / 86400000 + 2440587.5
}

/**
 * Calculate solar declination angle
 * @param {number} julianDay - Julian day number
 * @returns {number} Declination in radians
 */
function getSolarDeclination(julianDay) {
  const n = julianDay - 2451545.0
  const L = (280.460 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180
  const epsilon = (23.439 - 0.0000004 * n) * Math.PI / 180
  return Math.asin(Math.sin(epsilon) * Math.sin(lambda))
}

/**
 * Calculate hour angle
 * @param {number} julianDay - Julian day number
 * @param {number} longitude - Longitude in degrees
 * @returns {number} Hour angle in radians
 */
function getHourAngle(julianDay, longitude) {
  const n = julianDay - 2451545.0
  const gmst = (280.460 + 360.9856474 * n) % 360
  const localSiderealTime = (gmst + longitude) % 360
  const solarRightAscension = 0 // Simplified
  return (localSiderealTime - solarRightAscension) * Math.PI / 180
}

/**
 * Calculate solar zenith angle for a given location and time
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {Date} date - Date/time (UTC)
 * @returns {number} Solar zenith angle in degrees (0 = directly overhead, 90 = horizon, >90 = below horizon)
 */
export function calculateSolarZenithAngle(lat, lon, date) {
  const julianDay = getJulianDay(date)
  const latRad = lat * Math.PI / 180
  const declination = getSolarDeclination(julianDay)
  
  // Calculate hour angle
  const dayFraction = (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24
  const hourAngle = (dayFraction * 360 + lon - 180) * Math.PI / 180
  
  // Calculate solar altitude
  const sinAlt = Math.sin(latRad) * Math.sin(declination) + 
                 Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle)
  
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)))
  const zenithAngle = (Math.PI / 2) - altitude
  
  return zenithAngle * 180 / Math.PI
}

/**
 * Generate terminator line coordinates
 * @param {Date} date - Current date/time (UTC)
 * @param {number} zenithThreshold - Zenith angle threshold (90 = horizon, 96 = civil twilight, 102 = nautical, 108 = astronomical)
 * @returns {Array} Array of [lon, lat] coordinates forming the terminator
 */
export function generateTerminatorLine(date, zenithThreshold = 96) {
  const points = []
  const resolution = 2 // degrees
  
  // Sample points along latitudes
  for (let lat = -90; lat <= 90; lat += resolution) {
    let foundTerminator = false
    
    // Search for terminator longitude at this latitude
    for (let lon = -180; lon <= 180; lon += resolution) {
      const zenith = calculateSolarZenithAngle(lat, lon, date)
      
      if (Math.abs(zenith - zenithThreshold) < resolution) {
        points.push([lon, lat])
        foundTerminator = true
        break
      }
    }
    
    // If no terminator found at this latitude, check if it's all day or all night
    if (!foundTerminator) {
      const zenithAtZero = calculateSolarZenithAngle(lat, 0, date)
      if (zenithAtZero > zenithThreshold) {
        // All night - add edge points
        points.push([-180, lat])
        points.push([180, lat])
      }
    }
  }
  
  return points
}

/**
 * Generate night region polygon for deck.gl
 * @param {Date} date - Current date/time (UTC)
 * @returns {Object} GeoJSON-like polygon representing night region
 */
export function generateNightRegion(date) {
  const nightPoints = []
  const resolution = 5 // degrees - coarser for performance
  
  // Civil twilight threshold (96° zenith = 6° below horizon)
  const twilightThreshold = 96
  
  for (let lat = 90; lat >= -90; lat -= resolution) {
    for (let lon = -180; lon <= 180; lon += resolution) {
      const zenith = calculateSolarZenithAngle(lat, lon, date)
      
      if (zenith >= twilightThreshold) {
        nightPoints.push({
          position: [lon, lat],
          zenith: zenith,
        })
      }
    }
  }
  
  return nightPoints
}

/**
 * Generate terminator polygon coordinates
 * @param {Date} date - Current date/time (UTC)
 * @returns {Array} Array of coordinate rings for polygon
 */
export function generateTerminatorPolygon(date) {
  const resolution = 3 // degrees
  const twilightThreshold = 96 // Civil twilight
  
  const nightSide = []
  
  // Generate grid and find night side
  for (let lon = -180; lon <= 180; lon += resolution) {
    const column = []
    for (let lat = 90; lat >= -90; lat -= resolution) {
      const zenith = calculateSolarZenithAngle(lat, lon, date)
      if (zenith >= twilightThreshold) {
        column.push([lon, lat])
      }
    }
    if (column.length > 0) {
      nightSide.push(...column)
    }
  }
  
  // Create polygon by connecting night points
  if (nightSide.length === 0) return []
  
  // Simple approach: create a filled polygon covering the night side
  // This is a simplified version - for production, use proper polygon generation
  const polygon = []
  
  // Top edge
  for (let lon = -180; lon <= 180; lon += resolution) {
    const zenith = calculateSolarZenithAngle(90, lon, date)
    if (zenith >= twilightThreshold) {
      polygon.push([lon, 90])
    }
  }
  
  // Right edge
  for (let lat = 90; lat >= -90; lat -= resolution) {
    const zenith = calculateSolarZenithAngle(lat, 180, date)
    if (zenith >= twilightThreshold) {
      polygon.push([180, lat])
    }
  }
  
  // Bottom edge
  for (let lon = 180; lon >= -180; lon -= resolution) {
    const zenith = calculateSolarZenithAngle(-90, lon, date)
    if (zenith >= twilightThreshold) {
      polygon.push([lon, -90])
    }
  }
  
  // Left edge
  for (let lat = -90; lat <= 90; lat += resolution) {
    const zenith = calculateSolarZenithAngle(lat, -180, date)
    if (zenith >= twilightThreshold) {
      polygon.push([-180, lat])
    }
  }
  
  return polygon.length > 0 ? [polygon] : []
}

/**
 * Check if a location is in darkness suitable for aurora viewing
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {Date} date - Date/time (UTC)
 * @returns {Object} Darkness info
 */
export function checkDarkness(lat, lon, date) {
  const zenith = calculateSolarZenithAngle(lat, lon, date)
  
  return {
    zenithAngle: zenith,
    isDaylight: zenith < 90,
    isCivilTwilight: zenith >= 90 && zenith < 96,
    isNauticalTwilight: zenith >= 96 && zenith < 102,
    isAstronomicalTwilight: zenith >= 102 && zenith < 108,
    isNight: zenith >= 108,
    isAuroraViewing: zenith >= 96, // Civil twilight or darker
  }
}
