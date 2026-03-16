import { useAuroraData } from '../hooks/useAuroraData'
import { useAuroraAlerts } from '../hooks/useAuroraAlerts'
import { useState, useEffect, useRef } from 'react'
import KpGauge from '../components/KpGauge'
import ForecastChart from '../components/ForecastChart'
import AuroraMap from '../components/AuroraMap'
import AlertIndicator from '../components/AlertIndicator'
import AlertSettings from '../components/AlertSettings'
import SolarWindPanel from '../components/SolarWindPanel'
import VisibilityGauge from '../components/VisibilityGauge'
import PhotographyAdvisor from '../components/PhotographyAdvisor'

export default function Dashboard() {
  const { kpData, forecast, loading, error, refetch } = useAuroraData()
  const [showAlertSettings, setShowAlertSettings] = useState(false)
  const [spaceWeather, setSpaceWeather] = useState(null)
  const [substormDismissed, setSubstormDismissed] = useState(false)
  const bzHistoryRef = useRef([])

  const {
    settings: alertSettings,
    lastAlert,
    addLocation,
    removeLocation,
    updateThresholds,
    toggleAlerts,
    toggleNotifications,
    checkAlerts,
  } = useAuroraAlerts()

  // Fetch and periodically refresh space weather data
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await window.fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/space-weather`)
        if (res.ok) {
          const data = await res.json()
          setSpaceWeather(data)

          // Track Bz history for substorm detection
          const magReading = data.magnetic_field?.readings?.[data.magnetic_field.readings.length - 1]
          const bz = magReading?.bz_gsm
          if (bz !== undefined && bz !== null) {
            bzHistoryRef.current = [
              ...bzHistoryRef.current.slice(-29),
              { bz, ts: Date.now() }
            ]
          }
        }
      } catch (err) {
        console.error('Failed to fetch space weather:', err)
      }
    }
    fetch()
    const interval = setInterval(fetch, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (spaceWeather && alertSettings.enabled) {
      checkAlerts(spaceWeather)
    }
  }, [spaceWeather, alertSettings.enabled, checkAlerts])

  const currentKp = kpData?.current_kp ?? 0
  const visibilityLat = forecast?.forecast?.[0]?.visibility_latitude ?? 65

  // Compute substorm warning from current space weather
  const magReading = spaceWeather?.magnetic_field?.readings?.[spaceWeather.magnetic_field.readings.length - 1]
  const plasmaReading = spaceWeather?.plasma?.readings?.[spaceWeather.plasma.readings.length - 1]
  const bz = magReading?.bz_gsm ?? null
  const speed = plasmaReading?.speed ?? null
  const bzHistory = bzHistoryRef.current
  const recentBzDrop = bzHistory.length >= 2
    ? bzHistory[0].bz - bzHistory[bzHistory.length - 1].bz
    : 0
  const substormActive = !substormDismissed && (
    (bz !== null && bz < -7) ||
    (speed !== null && speed > 500) ||
    recentBzDrop > 3
  )

  // Sample visibility score from space weather data (use aurora probability as proxy)
  const auroraProb = spaceWeather?.aurora_grid?.max_probability ?? null
  const visibilityScore = auroraProb !== null ? Math.min(100, auroraProb * 1.2) : null

  return (
    <div className="min-h-screen bg-aurora-dark flex flex-col">
      {/* Substorm Early Warning Banner */}
      {substormActive && (
        <div className="bg-red-950 border-b border-red-800 px-6 py-3 flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-red-300">Substorm Warning</div>
            <div className="text-xs text-red-400">
              Rapid magnetic field change detected — aurora activity likely in the next 10 minutes.
              {bz !== null && bz < -7 && ` Bz = ${bz.toFixed(1)} nT.`}
              {speed !== null && speed > 500 && ` Wind = ${speed.toFixed(0)} km/s.`}
            </div>
          </div>
          <button
            onClick={() => setSubstormDismissed(true)}
            className="text-red-500 hover:text-red-300 transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌌</span>
          <h1 className="text-xl font-semibold tracking-tight text-white">AuroraSense</h1>
        </div>
        <div className="flex items-center gap-3">
          <AlertIndicator
            lastAlert={lastAlert}
            alertsEnabled={alertSettings.enabled}
            onOpenSettings={() => setShowAlertSettings(true)}
          />
          {error && (
            <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">{error}</span>
          )}
          <button
            onClick={refetch}
            className="text-xs text-gray-400 hover:text-aurora-green transition-colors px-3 py-1.5 rounded border border-gray-700 hover:border-aurora-green"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0 p-4 flex gap-4 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden border-b lg:border-r border-gray-800 lg:flex-col items-start lg:items-stretch">
          {loading ? (
            <div className="text-gray-500 text-sm animate-pulse">Loading space weather…</div>
          ) : (
            <>
              <KpGauge kp={currentKp} />
              <ForecastChart forecast={forecast?.forecast} />

              {/* Visibility Boundary */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-sm">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Visibility Boundary</p>
                <p className="text-aurora-green font-semibold text-lg">{visibilityLat}° N</p>
                <p className="text-gray-500 text-xs mt-1">Aurora visible poleward of this latitude</p>
              </div>

              {/* Visibility Score Gauge */}
              {visibilityScore !== null && (
                <VisibilityGauge
                  score={visibilityScore}
                  label="Based on current aurora probability"
                />
              )}

              {/* PWA / Innovation Stretch Goal: Settings Advisor */}
              <PhotographyAdvisor kpIndex={currentKp} />

              {/* Solar Wind Telemetry Panel */}
              <SolarWindPanel spaceWeather={spaceWeather} />
            </>
          )}
        </aside>

        {/* Map */}
        <main className="flex-1 p-4 min-h-[70vh] lg:min-h-0">
          <AuroraMap visibilityLatitude={visibilityLat} />
        </main>
      </div>

      {/* Alert Settings Modal */}
      {showAlertSettings && (
        <AlertSettings
          settings={alertSettings}
          onUpdateThresholds={updateThresholds}
          onToggleAlerts={toggleAlerts}
          onToggleNotifications={toggleNotifications}
          onAddLocation={addLocation}
          onRemoveLocation={removeLocation}
          onClose={() => setShowAlertSettings(false)}
        />
      )}
    </div>
  )
}
