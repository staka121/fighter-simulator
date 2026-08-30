import type { GoalPoint } from '../scene/f16c-hud/store'

/**
 * Parse and validate lat/lon input strings into a GoalPoint, or null if either
 * is blank, non-numeric, or out of range (lat ±90, lon ±180).
 */
export function parseGoalInput(latStr: string, lonStr: string): GoalPoint | null {
  if (latStr.trim() === '' || lonStr.trim() === '') return null
  const lat = Number(latStr)
  const lon = Number(lonStr)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null
  return { lat, lon }
}

/** Human-readable "lat, lon" to 5 dp, or an em dash when unknown. */
export function formatCoord(lat: number | null, lon: number | null): string {
  if (lat == null || lon == null) return '—'
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}
