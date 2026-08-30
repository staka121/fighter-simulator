/**
 * Look up ground elevation (metres) for a coordinate via the Open-Meteo
 * Elevation API — free, keyless, HTTPS, CORS-enabled (Copernicus DEM, ~90 m).
 * Returns null on any failure so callers can fall back to "no altitude".
 */
export async function fetchElevation(lat: number, lon: number): Promise<number | null> {
  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { elevation?: number[] }
    const v = data.elevation?.[0]
    return typeof v === 'number' && Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}
