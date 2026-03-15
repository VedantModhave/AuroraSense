const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/aurora`

export async function getKpIndex() {
  const res = await fetch(`${BASE_URL}/kp`)
  if (!res.ok) throw new Error(`Failed to fetch Kp index: ${res.statusText}`)
  return res.json()
}

export async function getAuroraForecast() {
  const res = await fetch(`${BASE_URL}/forecast`)
  if (!res.ok) throw new Error(`Failed to fetch forecast: ${res.statusText}`)
  return res.json()
}
