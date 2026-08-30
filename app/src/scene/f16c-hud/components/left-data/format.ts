import type { Store } from '../../store'

// A "walking HUD" reinterpretation of the F-16C left block:
//   ARM/SAFE <n> → master arm + missiles                (missile system)
//   AVG          → average moving speed (km/h)          (GPS)
//   INT          → exercise intensity 0–100             (IMU shake)
//   cat          → movement class from speed            (STOP/WALK/RUN/VEHICLE)
//   lat,lon      → current position                     (GPS)

function category(kmh: number | null): string {
  const s = kmh ?? 0
  if (s < 1) return 'STOP'
  if (s < 7) return 'WALK'
  if (s < 15) return 'RUN'
  return 'VEHICLE'
}

/** Current position as a single line. The narrow left block (≈134 px) can't fit
 * full precision, so it is coarse (1 dp ≈ 10 km, tuned on-device). */
function coords(t: Store): string {
  if (t.lat == null || t.lon == null) return '--'
  return `${t.lat.toFixed(1)},${t.lon.toFixed(1)}`
}

/** Build the left data block content (one container, uniform line spacing). */
export function formatLeftData(t: Store): string {
  const weapons = `${t.armed ? 'ARM' : 'SAFE'} ${t.ammo}`
  const avg = t.avgCount > 0 ? (t.avgSum / t.avgCount).toFixed(1) : '0.0'
  const intensity = Math.min(100, Math.round(t.energy * 200))
  return `${weapons}\nAVG ${avg}\nINT ${intensity}\n${category(t.speedKmh)}\n${coords(t)}`
}
