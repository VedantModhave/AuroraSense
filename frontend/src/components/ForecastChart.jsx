export default function ForecastChart({ forecast }) {
  if (!forecast?.length) return null

  const max = 9
  const items = forecast.slice(0, 12)

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Kp Forecast</p>
      <div className="flex items-end gap-1 h-24">
        {items.map((entry, i) => {
          const height = `${(entry.kp_index / max) * 100}%`
          const color = entry.kp_index >= 5 ? '#f59e0b' : '#00ff88'
          const label = new Date(entry.time_tag).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{ height, backgroundColor: color, minHeight: '4px' }}
              />
              <span className="text-gray-600 text-[9px] mt-1 rotate-45 origin-left hidden group-hover:block absolute -bottom-4 left-0 whitespace-nowrap">
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
