export default function DataSourcesFooter({ className = "absolute top-4 right-4" }) {
  return (
    <div className={`z-10 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-lg p-2.5 shadow-lg text-[9px] text-gray-400 pointer-events-none w-max text-left ${className}`}>
      <div className="font-semibold text-gray-300 uppercase tracking-widest mb-1.5 border-b border-gray-800 pb-1">Data Sources</div>
      <div className="space-y-0.5">
        <div>• NOAA SWPC Space Weather</div>
        <div>• OVATION Aurora Model</div>
        <div>• Open-Meteo Weather API</div>
        <div>• OpenStreetMap</div>
      </div>
    </div>
  )
}
