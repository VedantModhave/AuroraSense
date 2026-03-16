import React from 'react';

/**
 * AuroraProbabilityForecast — a small sparkline-style chart for Dashboard sidebar.
 * Estimates aurora probability based on Kp index forecast if real-time prob forecast isn't available.
 */
export default function AuroraProbabilityForecast({ forecast }) {
  if (!forecast || forecast.length === 0) return null;

  // Take next 12 items (3h if data is every 15m, or longer if data is hourly)
  // Usually NOAA Kp forecast is in 3-hour bins for long term, but let's take next 8 items
  const items = forecast.slice(0, 8);

  const getProb = (kp) => {
    // Simple mapping Kp -> Prob %
    if (kp < 1) return 5;
    if (kp < 3) return kp * 10;
    if (kp < 5) return 30 + (kp - 3) * 15;
    return 60 + (kp - 5) * 10;
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
          Aurora Probability Forecast
        </p>
        <span className="text-[9px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">Next 6-12h</span>
      </div>
      
      <div className="flex items-end gap-1.5 h-12">
        {items.map((entry, i) => {
          const prob = getProb(entry.kp_index);
          const height = `${prob}%`;
          const time = new Date(entry.time_tag).toLocaleTimeString([], { hour: 'numeric', hour12: true });
          
          return (
            <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
              <div 
                className="w-full rounded-t-sm transition-all duration-500 bg-gradient-to-t from-aurora-green/20 to-aurora-green"
                style={{ height, minHeight: '2px' }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[9px] px-2 py-1 rounded border border-gray-800 opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none">
                {time}: {prob.toFixed(0)}% prob
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-[8px] text-gray-600 uppercase">
        <span>Now</span>
        <span>Future</span>
      </div>
    </div>
  );
}
