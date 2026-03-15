/**
 * Aurora alert logic and conditions
 */

/**
 * Check if alert conditions are met
 * @param {Object} spaceWeather - Space weather data
 * @param {Object} visibility - Visibility data for location
 * @param {Object} thresholds - User-defined thresholds
 * @returns {Object} Alert status and reasons
 */
export function checkAlertConditions(spaceWeather, visibility, thresholds = {}) {
  const alerts = []
  const reasons = []

  // Default thresholds
  const bzThreshold = thresholds.bz ?? -7 // nT
  const speedThreshold = thresholds.speed ?? 500 // km/s
  const visibilityThreshold = thresholds.visibility ?? 70 // score

  // Check Bz (southward IMF)
  if (spaceWeather?.magnetic_field?.readings?.length > 0) {
    const latestMag = spaceWeather.magnetic_field.readings[spaceWeather.magnetic_field.readings.length - 1]
    if (latestMag.bz_gsm !== null && latestMag.bz_gsm < bzThreshold) {
      alerts.push('bz')
      reasons.push(`Southward IMF: Bz = ${latestMag.bz_gsm.toFixed(1)} nT (threshold: ${bzThreshold} nT)`)
    }
  }

  // Check solar wind speed
  if (spaceWeather?.plasma?.readings?.length > 0) {
    const latestPlasma = spaceWeather.plasma.readings[spaceWeather.plasma.readings.length - 1]
    if (latestPlasma.speed !== null && latestPlasma.speed > speedThreshold) {
      alerts.push('speed')
      reasons.push(`High solar wind speed: ${latestPlasma.speed.toFixed(0)} km/s (threshold: ${speedThreshold} km/s)`)
    }
  }

  // Check visibility score
  if (visibility?.visibility_score !== undefined && visibility.visibility_score > visibilityThreshold) {
    alerts.push('visibility')
    reasons.push(`Excellent visibility: ${visibility.visibility_score.toFixed(1)} (threshold: ${visibilityThreshold})`)
  }

  return {
    shouldAlert: alerts.length > 0,
    alerts,
    reasons,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Request browser notification permission
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Send browser notification
 * @param {Object} alertData - Alert data
 * @param {Object} location - User location
 */
export function sendNotification(alertData, location) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const title = '🌌 Aurora Alert!'
  const body = alertData.reasons.join('\n')
  const icon = '/aurora-icon.png' // Optional: add icon to public folder

  const notification = new Notification(title, {
    body,
    icon,
    badge: icon,
    tag: 'aurora-alert',
    requireInteraction: false,
    silent: false,
    data: {
      location,
      timestamp: alertData.timestamp,
    },
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }

  // Auto-close after 10 seconds
  setTimeout(() => notification.close(), 10000)
}

/**
 * Format alert message for display
 * @param {Object} alertData - Alert data
 * @returns {string} Formatted message
 */
export function formatAlertMessage(alertData) {
  if (!alertData.shouldAlert) {
    return 'No alerts at this time.'
  }

  return `Aurora alert triggered!\n\n${alertData.reasons.join('\n')}`
}
