export default function PhotographyAdvisor({ kpIndex }) {
  let iso = "1600 - 3200";
  let shutter = "10s - 15s";
  let aperture = "f/2.8 or widest";

  if (kpIndex >= 6) {
    iso = "800 - 1600";
    shutter = "2s - 5s";
    aperture = "f/2.8 or f/4.0";
  } else if (kpIndex >= 4) {
    iso = "1600 - 3200";
    shutter = "5s - 8s";
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-sm w-full">
      <div className="flex items-center gap-2 mb-3">
        <span>📸</span>
        <h3 className="font-semibold text-gray-200 uppercase tracking-widest text-xs">Photography Advisor</h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center border-b border-gray-800 pb-1">
          <span className="text-gray-400 text-xs">ISO</span>
          <span className="text-aurora-green font-bold text-xs">{iso}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-800 pb-1">
          <span className="text-gray-400 text-xs">Shutter</span>
          <span className="text-aurora-green font-bold text-xs">{shutter}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Aperture</span>
          <span className="text-aurora-green font-bold text-xs">{aperture}</span>
        </div>
      </div>
    </div>
  )
}
