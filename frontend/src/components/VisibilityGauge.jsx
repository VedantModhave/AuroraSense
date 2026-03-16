/**
 * VisibilityGauge — arc gauge showing aurora viewing score 0–100.
 * Bands: 0–30 Poor (red), 30–60 Moderate (amber), 60–100 Excellent (green)
 */
export default function VisibilityGauge({ score = 0, label }) {
  const clampedScore = Math.min(100, Math.max(0, score))

  // Arc geometry (half-circle, 180°)
  const radius = 60
  const cx = 80
  const cy = 80
  const startAngle = -180   // left
  const endAngle = 0        // right

  const toRad = (deg) => (deg * Math.PI) / 180
  const arcPoint = (angle) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  })

  // Track arc spans 180° total
  const scoreAngle = startAngle + (clampedScore / 100) * 180
  const needleAngle = scoreAngle

  // Needle line
  const needleTip = arcPoint(needleAngle)

  // Color by band
  const getBand = (s) => {
    if (s < 30) return { label: 'Poor', color: '#ef4444', trackColor: '#7f1d1d' }
    if (s < 60) return { label: 'Moderate', color: '#f59e0b', trackColor: '#78350f' }
    return { label: 'Excellent', color: '#00ff88', trackColor: '#064e3b' }
  }

  const band = getBand(clampedScore)

  // SVG arc path helper
  const describeArc = (startDeg, endDeg, r, stroke) => {
    const s = arcPoint(startDeg)
    const e = arcPoint(endDeg)
    const largeArcFlag = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${e.x} ${e.y}`
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
          Visibility Score
        </p>
        <div className="group relative">
          <span className="text-gray-500 hover:text-aurora-green cursor-help text-xs">ⓘ</span>
          <div className="absolute right-0 bottom-full mb-2 w-64 bg-gray-950 border border-gray-800 p-3 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            <div className="text-[10px] text-gray-300 space-y-2 leading-relaxed">
              <p className="font-bold text-aurora-green border-b border-gray-800 pb-1 mb-1">SCORING MODEL</p>
              <div className="font-mono text-[9px] text-gray-400">
                0.40 × Aurora Prob.<br/>
                + 0.30 × (100 - Clouds)<br/>
                + 0.20 × Darkness Score<br/>
                + 0.10 × Light Pollution
              </div>
              <p>Aurora: OVATION aurora model. Clouds: Open-Meteo forecasts. Darkness: solar elevation & moon illumination.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 160 90" className="w-full max-w-[180px]">
          {/* Background track (grey) */}
          <path
            d={describeArc(-180, 0, radius)}
            fill="none"
            stroke="#1f2937"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Colored progress arc */}
          {clampedScore > 0 && (
            <path
              d={describeArc(-180, scoreAngle, radius)}
              fill="none"
              stroke={band.color}
              strokeWidth="12"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${band.color}80)` }}
            />
          )}

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.6))' }}
          />
          <circle cx={cx} cy={cy} r="4" fill="white" />

          {/* Score text */}
          <text
            x={cx}
            y={cy + 22}
            textAnchor="middle"
            fill="white"
            fontSize="22"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            {Math.round(clampedScore)}
          </text>

          {/* Band label */}
          <text
            x={cx}
            y={cy + 36}
            textAnchor="middle"
            fill={band.color}
            fontSize="9"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
          >
            {band.label.toUpperCase()}
          </text>

          {/* Scale labels */}
          <text x="12" y="82" fill="#4b5563" fontSize="8" fontFamily="system-ui">0</text>
          <text x="72" y="22" fill="#4b5563" fontSize="8" fontFamily="system-ui" textAnchor="middle">50</text>
          <text x="140" y="82" fill="#4b5563" fontSize="8" fontFamily="system-ui" textAnchor="end">100</text>
        </svg>

        {/* Band indicators */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-gray-500">Poor</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-gray-500">Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-aurora-green" />
            <span className="text-[10px] text-gray-500">Excellent</span>
          </div>
        </div>

        {label && (
          <p className="text-[10px] text-gray-600 mt-2 text-center">{label}</p>
        )}
      </div>
    </div>
  )
}
