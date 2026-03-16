import { useState, useEffect } from 'react'
import UpdateCountdown from './UpdateCountdown'

/**
 * GlobalStatusBar — top system status strip shown across all pages.
 * Displays live solar wind speed, Bz, aurora risk level, and last refresh.
 */
export default function GlobalStatusBar() {
  const [dismissed, setDismissed] = useState(false)
  const [spaceWeather, setSpaceWeather] = useState(null)

  useEffect(() => {
    const fetchSW = async () => {
      try {
        const res = await window.fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/space-weather`)
        if (res.ok) {
          const data = await res.json()
          setSpaceWeather(data)
        }
      } catch (err) {
        console.error('Failed to fetch space weather:', err)
      }
    }
    fetchSW()
    const interval = setInterval(fetchSW, 60000)
    return () => clearInterval(interval)
  }, [])

  const mag = spaceWeather?.magnetic_field
  const plasma = spaceWeather?.plasma

  const magReading = mag?.readings?.[mag.readings.length - 1]
  const plasmaReading = plasma?.readings?.[plasma.readings.length - 1]

  const bz = magReading?.bz_gsm ?? null
  const speed = plasmaReading?.speed ?? null
  const lastUpdated = mag?.last_updated ?? plasma?.last_updated ?? magReading?.time_tag ?? plasmaReading?.time_tag ?? null

  // Compute aurora risk level
  const getRisk = () => {
    if (bz === null && speed === null) return { label: 'UNKNOWN', color: 'text-gray-400', bg: 'bg-gray-800/60' }
    let score = 0
    if (bz !== null) {
      if (bz < -7) score += 3
      else if (bz < -3) score += 2
      else if (bz < 0) score += 1
    }
    if (speed !== null) {
      if (speed > 700) score += 3
      else if (speed > 500) score += 2
      else if (speed > 350) score += 1
    }
    if (score >= 4) return { label: 'HIGH', color: 'text-red-400', bg: 'bg-red-950/60' }
    if (score >= 2) return { label: 'MODERATE', color: 'text-amber-400', bg: 'bg-amber-950/60' }
    return { label: 'LOW', color: 'text-aurora-green', bg: 'bg-green-950/40' }
  }

  const risk = getRisk()

  const formatTime = (tag) => {
    if (!tag) return '—'
    try { return new Date(tag).toUTCString().slice(17, 22) + ' UTC' } catch { return '—' }
  }

  // Don't render if no data yet or dismissed
  if (!spaceWeather || dismissed) return null

  return (
    <div 
      className="border-b border-gray-800/80 px-4 py-1.5 flex items-center gap-6 text-xs backdrop-blur-sm z-50 relative shrink-0"
      style={{ background: 'linear-gradient(90deg, #0b1020, #102040, #1b3c4f)' }}
    >
      <div className="flex items-center gap-1.5 text-gray-400">
        <div className="w-1.5 h-1.5 rounded-full bg-aurora-green animate-pulse" />
        <span className="font-semibold text-gray-300 uppercase tracking-wide text-[10px]">Live</span>
      </div>

      <div className="flex items-center gap-5 flex-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Solar Wind:</span>
          <span className={`font-semibold tabular-nums ${speed !== null && speed > 500 ? 'text-orange-400' : 'text-white'}`}>
            {speed !== null ? `${speed.toFixed(0)} km/s` : '—'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Bz:</span>
          <span className={`font-semibold tabular-nums ${bz !== null && bz < -3 ? 'text-red-400' : 'text-white'}`}>
            {bz !== null ? `${bz > 0 ? '+' : ''}${bz.toFixed(1)} nT` : '—'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Aurora Risk:</span>
          <span className={`font-bold uppercase tracking-wide ${risk.color}`}>{risk.label}</span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-600">
          <span>Updated:</span>
          <span className="text-gray-500">{formatTime(lastUpdated)}</span>
        </div>

        <UpdateCountdown refreshIntervalSeconds={60} />
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="text-gray-600 hover:text-gray-400 transition-colors ml-auto flex-shrink-0"
        aria-label="Dismiss status bar"
      >
        ✕
      </button>
    </div>
  )
}
