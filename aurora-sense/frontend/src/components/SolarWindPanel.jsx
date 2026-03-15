import { useEffect, useState, useRef } from 'react'

/**
 * Real-time Solar Wind Telemetry Panel.
 * Displays Bz, speed, density from NOAA /api/space-weather.
 */
export default function SolarWindPanel({ spaceWeather }) {
  const [bzHistory, setBzHistory] = useState([])
  const [substormWarning, setSubstormWarning] = useState(null)
  const prevBzRef = useRef(null)
  const bzTimestampsRef = useRef([])

  const mag = spaceWeather?.magnetic_field
  const plasma = spaceWeather?.plasma

  const magReading = mag?.readings?.[mag.readings.length - 1]
  const plasmaReading = plasma?.readings?.[plasma.readings.length - 1]

  const bz = magReading?.bz_gsm ?? null
  const speed = plasmaReading?.speed ?? null
  const density = plasmaReading?.density ?? null
  const lastUpdated = mag?.last_updated ?? plasma?.last_updated ?? magReading?.time_tag ?? plasmaReading?.time_tag ?? null

  // Track Bz history for substorm early warning
  useEffect(() => {
    if (bz === null) return
    const now = Date.now()

    setBzHistory(prev => {
      const next = [...prev, { bz, ts: now }].slice(-60)
      return next
    })

    // Check for rapid Bz drop > 3 nT in last 5 minutes
    bzTimestampsRef.current = [...bzTimestampsRef.current, { bz, ts: now }].filter(
      e => now - e.ts < 5 * 60 * 1000
    )

    const oldest = bzTimestampsRef.current[0]
    const bzDrop = oldest ? oldest.bz - bz : 0 // positive = drop

    const isSubstorm =
      bz < -7 ||
      (speed !== null && speed > 500) ||
      bzDrop > 3

    if (isSubstorm) {
      let reason = []
      if (bz < -7) reason.push(`Bz = ${bz.toFixed(1)} nT (strongly southward)`)
      if (speed !== null && speed > 500) reason.push(`Speed = ${speed.toFixed(0)} km/s`)
      if (bzDrop > 3) reason.push(`Bz dropped ${bzDrop.toFixed(1)} nT in 5 min`)
      setSubstormWarning(reason.join(' · '))
    } else {
      setSubstormWarning(null)
    }

    prevBzRef.current = bz
  }, [bz, speed])

  const getBzColor = (val) => {
    if (val === null) return 'text-gray-400'
    if (val < -7) return 'text-red-400'
    if (val < -3) return 'text-orange-400'
    if (val < 0) return 'text-yellow-400'
    return 'text-aurora-green'
  }

  const getSpeedColor = (val) => {
    if (val === null) return 'text-gray-400'
    if (val > 700) return 'text-red-400'
    if (val > 500) return 'text-orange-400'
    if (val > 350) return 'text-yellow-400'
    return 'text-aurora-green'
  }

  const formatTime = (tag) => {
    if (!tag) return '—'
    try {
      return new Date(tag).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch { return tag }
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Solar Wind</p>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-aurora-green animate-pulse" />
          <span className="text-[10px] text-gray-500">{formatTime(lastUpdated)}</span>
        </div>
      </div>

      {/* Substorm Warning Banner */}
      {substormWarning && (
        <div className="mx-3 mt-3 p-2.5 bg-red-950 border border-red-700 rounded-lg flex items-start gap-2">
          <span className="text-base leading-none">⚡</span>
          <div>
            <div className="text-xs font-bold text-red-300">Substorm Warning</div>
            <div className="text-[10px] text-red-400 mt-0.5">{substormWarning}</div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="p-4 space-y-3">
        {/* Bz */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Bz (IMF)</div>
            <div className={`text-xl font-bold tabular-nums ${getBzColor(bz)}`}>
              {bz !== null ? `${bz > 0 ? '+' : ''}${bz.toFixed(1)}` : '—'}
              <span className="text-xs font-normal text-gray-500 ml-1">nT</span>
            </div>
          </div>
          {bz !== null && (
            <div className="text-[10px] text-gray-500 text-right">
              {bz < -7 ? '🔴 Storm' : bz < -3 ? '🟠 Active' : bz < 0 ? '🟡 Minor' : '🟢 Calm'}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-800" />

        {/* Speed */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Solar Wind Speed</div>
            <div className={`text-xl font-bold tabular-nums ${getSpeedColor(speed)}`}>
              {speed !== null ? speed.toFixed(0) : '—'}
              <span className="text-xs font-normal text-gray-500 ml-1">km/s</span>
            </div>
          </div>
          {speed !== null && (
            <div className="text-[10px] text-gray-500 text-right">
              {speed > 700 ? '🔴 Extreme' : speed > 500 ? '🟠 Fast' : speed > 350 ? '🟡 Moderate' : '🟢 Slow'}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-800" />

        {/* Density */}
        <div>
          <div className="text-xs text-gray-500">Proton Density</div>
          <div className="text-xl font-bold tabular-nums text-blue-300">
            {density !== null ? density.toFixed(1) : '—'}
            <span className="text-xs font-normal text-gray-500 ml-1">p/cm³</span>
          </div>
        </div>

        {/* Bz mini-sparkline */}
        {bzHistory.length > 2 && (
          <div>
            <div className="text-[10px] text-gray-600 mb-1">Bz trend (last readings)</div>
            <div className="flex items-end gap-px h-8">
              {bzHistory.slice(-30).map((entry, i) => {
                const norm = Math.min(1, Math.abs(entry.bz) / 20)
                const isNeg = entry.bz < 0
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${Math.max(4, norm * 100)}%`,
                      background: isNeg
                        ? `rgba(239, 68, 68, ${0.4 + norm * 0.6})`
                        : `rgba(0, 255, 136, ${0.3 + norm * 0.7})`,
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
