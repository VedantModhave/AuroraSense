import { useState, useEffect, useCallback } from 'react'
import { checkAlertConditions, sendNotification, requestNotificationPermission } from '../utils/alertLogic'

const STORAGE_KEY = 'aurora_alert_settings'

export function useAuroraAlerts() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {
      enabled: false,
      locations: [],
      thresholds: {
        bz: -7,
        speed: 500,
        visibility: 70,
      },
      notificationsEnabled: false,
    }
  })

  const [lastAlert, setLastAlert] = useState(null)
  const [alertHistory, setAlertHistory] = useState([])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // Request notification permission when enabled
  useEffect(() => {
    if (settings.notificationsEnabled) {
      requestNotificationPermission().then(granted => {
        if (!granted) {
          setSettings(prev => ({ ...prev, notificationsEnabled: false }))
        }
      })
    }
  }, [settings.notificationsEnabled])

  const addLocation = useCallback((location) => {
    setSettings(prev => ({
      ...prev,
      locations: [...prev.locations, { ...location, id: Date.now() }],
    }))
  }, [])

  const removeLocation = useCallback((id) => {
    setSettings(prev => ({
      ...prev,
      locations: prev.locations.filter(loc => loc.id !== id),
    }))
  }, [])

  const updateThresholds = useCallback((thresholds) => {
    setSettings(prev => ({
      ...prev,
      thresholds: { ...prev.thresholds, ...thresholds },
    }))
  }, [])

  const toggleAlerts = useCallback((enabled) => {
    setSettings(prev => ({ ...prev, enabled }))
  }, [])

  const toggleNotifications = useCallback((enabled) => {
    setSettings(prev => ({ ...prev, notificationsEnabled: enabled }))
  }, [])

  const checkAlerts = useCallback(async (spaceWeather) => {
    if (!settings.enabled || settings.locations.length === 0) {
      return
    }

    for (const location of settings.locations) {
      try {
        // Fetch visibility for this location
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/visibility?lat=${location.lat}&lon=${location.lon}`)
        if (!response.ok) continue

        const visibility = await response.json()

        // Check alert conditions
        const alertData = checkAlertConditions(spaceWeather, visibility, settings.thresholds)

        if (alertData.shouldAlert) {
          const alert = {
            ...alertData,
            location,
            visibility,
          }

          setLastAlert(alert)
          setAlertHistory(prev => [alert, ...prev.slice(0, 9)]) // Keep last 10

          // Send notification if enabled
          if (settings.notificationsEnabled) {
            sendNotification(alertData, location)
          }
        }
      } catch (error) {
        console.error('Error checking alerts for location:', location, error)
      }
    }
  }, [settings])

  const clearAlertHistory = useCallback(() => {
    setAlertHistory([])
    setLastAlert(null)
  }, [])

  return {
    settings,
    lastAlert,
    alertHistory,
    addLocation,
    removeLocation,
    updateThresholds,
    toggleAlerts,
    toggleNotifications,
    checkAlerts,
    clearAlertHistory,
  }
}
