import { useState, useEffect, useCallback } from 'react'

export function useAuroraMap(refreshInterval = 60000) {
  const [auroraData, setAuroraData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAuroraMap = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/aurora-map`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch aurora map: ${response.statusText}`)
      }
      
      const data = await response.json()
      setAuroraData(data)
    } catch (err) {
      setError(err.message)
      console.error('Aurora map fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuroraMap()
    const interval = setInterval(fetchAuroraMap, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchAuroraMap, refreshInterval])

  return { auroraData, loading, error, refetch: fetchAuroraMap }
}
