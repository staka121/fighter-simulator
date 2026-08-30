// Shared geodesy helpers used by the goal-nav readout and the minimap.

const R_EARTH = 6_371_000 // mean Earth radius, metres
const toRad = (d: number) => (d * Math.PI) / 180
const toDeg = (r: number) => (r * 180) / Math.PI

export interface LatLon {
  lat: number
  lon: number
}

/** Great-circle distance between two points, in metres (haversine). */
export function distanceMeters(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const la1 = toRad(a.lat)
  const la2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Initial bearing from `a` to `b`, degrees clockwise from true north [0,360). */
export function initialBearing(a: LatLon, b: LatLon): number {
  const la1 = toRad(a.lat)
  const la2 = toRad(b.lat)
  const dLon = toRad(b.lon - a.lon)
  const y = Math.sin(dLon) * Math.cos(la2)
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Normalise degrees into [0, 360). */
export const norm = (deg: number) => ((deg % 360) + 360) % 360

/** Signed smallest angle from `b` to `a`, in (-180, 180]. */
export function angularDiff(a: number, b: number): number {
  const d = norm(a - b)
  return d > 180 ? d - 360 : d
}
