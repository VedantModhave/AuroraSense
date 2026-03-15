export default function AlertIndicator({ lastAlert, onOpenSettings, alertsEnabled }) {
  if (!alertsEnabled) {
    return (
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
      >
        <span className="text-gray-500">🔔</span>
        <span className="text-xs text-gray-400">Alerts Off</span>
      </button>
    )
  }

  if (!lastAlert) {
    return (
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
      >
        <span className="text-green-500">🔔</span>
        <span className="text-xs text-gray-300">Monitoring</span>
      </button>
    )
  }

  return (
    <button
      onClick={onOpenSettings}
      className="flex items-center gap-2 px-3 py-2 bg-aurora-green/20 hover:bg-aurora-green/30 border border-aurora-green rounded-lg transition-colors animate-pulse"
    >
      <span className="text-aurora-green">🔔</span>
      <span className="text-xs text-aurora-green font-semibold">Alert Active!</span>
    </button>
  )
}
