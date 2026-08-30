import type { Store } from '../../store'

// A "walking HUD" reinterpretation of the F-16C left block:
//   ARM/SAFE <n> → master arm + missiles                (missile system)
//   AVG          → average moving speed (km/h)          (GPS)
//   INT          → exercise intensity 0–100             (IMU shake)
//   cat          → movement class from speed            (STOP/WALK/RUN/VEHICLE)

function category(kmh: number | null): string {
  const s = kmh ?? 0
  if (s < 1) return 'STOP'
  if (s < 7) return 'WALK'
  if (s < 15) return 'RUN'
  return 'VEHICLE'
}

/** Build the left data block content (one container, uniform line spacing). */
export function formatLeftData(t: Store): string {
  const weapons = `${t.armed ? 'ARM' : 'SAFE'} ${t.ammo}`
  const avg = t.avgCount > 0 ? (t.avgSum / t.avgCount).toFixed(1) : '0.0'
  const intensity = Math.min(100, Math.round(t.energy * 200))
  return `${weapons}\nAVG ${avg}\nINT ${intensity}\n${category(t.speedKmh)}`
}
