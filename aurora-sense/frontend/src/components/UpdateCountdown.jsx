import { useState, useEffect } from 'react'

export default function UpdateCountdown({ refreshIntervalSeconds = 60, onRefresh }) {
  const [secondsLeft, setSecondsLeft] = useState(refreshIntervalSeconds)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (onRefresh) onRefresh()
          return refreshIntervalSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [refreshIntervalSeconds, onRefresh])

  return (
    <div className="flex items-center gap-1.5 min-w-[130px] justify-end">
      <div className={`w-1.5 h-1.5 rounded-full ${secondsLeft < 10 ? 'bg-amber-400' : 'bg-aurora-green'} animate-pulse`} />
      <span className="text-xs text-gray-500 tabular-nums">Next Update In: <span className="text-gray-400 font-semibold">{secondsLeft}s</span></span>
    </div>
  )
}
