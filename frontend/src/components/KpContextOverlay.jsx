import { useAuroraData } from '../hooks/useAuroraData'

/**
 * Top-left corner context overlay displaying current KP index
 * and approximate visibility boundary on maps.
 */
export default function KpContextOverlay() {
  const { kpData, forecast } = useAuroraData()
  const kp = kpData?.current_kp ?? 0
  const visibilityLat = forecast?.forecast?.[0]?.visibility_latitude ?? 65

  return (
    <div className="absolute top-4 left-4 z-10 bg-gray-900/80 backdrop-blur-md rounded-xl border border-aurora-green/30 p-3 shadow-[0_4px_12px_rgba(0,255,136,0.1)] transition-opacity duration-300 pointer-events-none min-w-[180px]">
      <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Aurora Visibility</div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-400">KP Index:</span>
        <span className="text-xl font-bold text-aurora-green tabular-nums">{kp.toFixed(1)}</span>
      </div>
      <div className="h-px bg-gray-800 mb-2 w-full" />
      <div className="text-xs text-gray-300 leading-tight">
        Approx visible above <strong className="text-white">{visibilityLat}°</strong>
      </div>
    </div>
  )
}
