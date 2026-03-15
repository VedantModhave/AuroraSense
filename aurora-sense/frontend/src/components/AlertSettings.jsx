import { useState } from 'react'

export default function AlertSettings({ settings, onUpdateThresholds, onToggleAlerts, onToggleNotifications, onAddLocation, onRemoveLocation, onClose }) {
  const [newLocation, setNewLocation] = useState({ name: '', lat: '', lon: '' })

  const handleAddLocation = () => {
    if (newLocation.name && newLocation.lat && newLocation.lon) {
      onAddLocation({
        name: newLocation.name,
        lat: parseFloat(newLocation.lat),
        lon: parseFloat(newLocation.lon),
      })
      setNewLocation({ name: '', lat: '', lon: '' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🔔</span> Aurora Alert Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <div className="text-sm font-semibold text-white">Enable Alerts</div>
              <div className="text-xs text-gray-400 mt-1">Monitor conditions and trigger alerts</div>
            </div>
            <button
              onClick={() => onToggleAlerts(!settings.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-aurora-green' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Browser Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <div className="text-sm font-semibold text-white">Browser Notifications</div>
              <div className="text-xs text-gray-400 mt-1">Receive desktop notifications</div>
            </div>
            <button
              onClick={() => onToggleNotifications(!settings.notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationsEnabled ? 'bg-aurora-green' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Alert Thresholds */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-white mb-3">Alert Thresholds</div>
            
            {/* Bz Threshold */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <label className="block text-xs text-gray-400 mb-2">
                Bz (Southward IMF) - Trigger when below:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.thresholds.bz}
                  onChange={(e) => onUpdateThresholds({ bz: parseFloat(e.target.value) })}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  step="0.1"
                />
                <span className="text-sm text-gray-400">nT</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Default: -7 nT (strong southward)</div>
            </div>

            {/* Speed Threshold */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <label className="block text-xs text-gray-400 mb-2">
                Solar Wind Speed - Trigger when above:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.thresholds.speed}
                  onChange={(e) => onUpdateThresholds({ speed: parseFloat(e.target.value) })}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  step="10"
                />
                <span className="text-sm text-gray-400">km/s</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Default: 500 km/s (high speed stream)</div>
            </div>

            {/* Visibility Threshold */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <label className="block text-xs text-gray-400 mb-2">
                Visibility Score - Trigger when above:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.thresholds.visibility}
                  onChange={(e) => onUpdateThresholds({ visibility: parseFloat(e.target.value) })}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  step="5"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-400">score</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Default: 70 (excellent conditions)</div>
            </div>
          </div>

          {/* Saved Locations */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-white">Saved Locations</div>
            
            {settings.locations.length === 0 ? (
              <div className="p-4 bg-gray-800/30 rounded-lg text-center text-sm text-gray-500">
                No locations saved. Add a location to receive alerts.
              </div>
            ) : (
              <div className="space-y-2">
                {settings.locations.map(location => (
                  <div key={location.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-sm text-white font-medium">{location.name}</div>
                      <div className="text-xs text-gray-400 font-mono">
                        {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveLocation(location.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Location Form */}
            <div className="p-4 bg-gray-800/30 rounded-lg space-y-3">
              <div className="text-xs text-gray-400 mb-2">Add New Location</div>
              <input
                type="text"
                placeholder="Location name (e.g., Fairbanks)"
                value={newLocation.name}
                onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Latitude"
                  value={newLocation.lat}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, lat: e.target.value }))}
                  className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  step="0.01"
                  min="-90"
                  max="90"
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  value={newLocation.lon}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, lon: e.target.value }))}
                  className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  step="0.01"
                  min="-180"
                  max="180"
                />
              </div>
              <button
                onClick={handleAddLocation}
                disabled={!newLocation.name || !newLocation.lat || !newLocation.lon}
                className="w-full bg-aurora-green text-gray-900 font-semibold py-2 rounded hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Add Location
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
