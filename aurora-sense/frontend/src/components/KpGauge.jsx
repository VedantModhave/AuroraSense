export default function KpGauge({ kp }) {
  const level = kp >= 7 ? 'Extreme' : kp >= 5 ? 'Strong' : kp >= 3 ? 'Moderate' : 'Quiet'
  const color = kp >= 7 ? 'text-red-400' : kp >= 5 ? 'text-orange-400' : kp >= 3 ? 'text-yellow-400' : 'text-aurora-green'
  const barWidth = `${(kp / 9) * 100}%`

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Kp Index</p>
      <div className="flex items-end gap-2">
        <span className={`text-5xl font-bold ${color}`}>{kp.toFixed(1)}</span>
        <span className={`text-sm mb-1 ${color}`}>{level}</span>
      </div>
      <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: barWidth,
            background: 'linear-gradient(90deg, #00ff88, #f59e0b, #ef4444)',
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>0</span><span>9</span>
      </div>
    </div>
  )
}
