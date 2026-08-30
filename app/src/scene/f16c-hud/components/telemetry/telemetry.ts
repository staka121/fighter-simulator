// Shared state for the left data block, written by the location/IMU handlers
// and the missile system, and rendered as one multi-line container so every
// line shares the same spacing. A "walking HUD" reinterpretation of the F-16C
// left block:
//   ARM/SAFE <n> → master arm + missiles                (missile system)
//   AVG          → average moving speed (km/h)          (GPS)
//   INT          → exercise intensity 0–100             (IMU shake)
//   cat          → movement class from speed            (STOP/WALK/RUN/VEHICLE)
export const AMMO_START = 6

export interface Telemetry {
  // movement
  speedKmh: number | null // latest GPS speed
  heading: number | null // GPS course, deg from true north (null when standing)
  speedOk: boolean // location updates running
  avgSum: number // Σ moving-speed samples
  avgCount: number // count of moving-speed samples
  energy: number // EWMA of |accel| deviation from 1 g
  // weapons
  armed: boolean
  ammo: number
}

export function createTelemetry(): Telemetry {
  return {
    speedKmh: null,
    heading: null,
    speedOk: true,
    avgSum: 0,
    avgCount: 0,
    energy: 0,
    armed: true,
    ammo: AMMO_START,
  }
}

function category(kmh: number | null): string {
  const s = kmh ?? 0
  if (s < 1) return 'STOP'
  if (s < 7) return 'WALK'
  if (s < 15) return 'RUN'
  return 'VEHICLE'
}

/** Build the left data block content (one container, uniform line spacing). */
export function formatLeftData(t: Telemetry): string {
  const weapons = `${t.armed ? 'ARM' : 'SAFE'} ${t.ammo}`
  const avg = t.avgCount > 0 ? (t.avgSum / t.avgCount).toFixed(1) : '0.0'
  const intensity = Math.min(100, Math.round(t.energy * 200))
  return `${weapons}\nAVG ${avg}\nINT ${intensity}\n${category(t.speedKmh)}`
}
