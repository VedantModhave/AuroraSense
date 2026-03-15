import { useState, useEffect, useCallback } from 'react'
import { getKpIndex, getAuroraForecast } from '../services/auroraApi'

export function useAuroraData(refreshInterval = 60000) {
  const [kpData, setKpData] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [kp, fc] = await Promise.all([getKpIndex(), getAuroraForecast()])
      setKpData(kp)
      setForecast(fc)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchData, refreshInterval])

  return { kpData, forecast, loading, error, refetch: fetchData }
}
