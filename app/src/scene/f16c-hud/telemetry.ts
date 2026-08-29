// Shared walking telemetry, written by the location/IMU handlers and read by the
// left-data driver. A "walking HUD" reinterpretation of the F-16C left block:
//   ARM  → master arm (missile) state          (static for now)
//   AVG  → average moving speed (km/h)          (GPS)
//   INT  → exercise intensity 0–100             (IMU shake; no heart-rate API)
//   cat  → movement class from speed            (STOP/WALK/RUN/VEHICLE)
//   GL   → goal bearing/distance                (deferred → "---")
export interface Telemetry {
  speedKmh: number | null // latest GPS speed
  speedOk: boolean // location updates running
  avgSum: number // Σ moving-speed samples
  avgCount: number // count of moving-speed samples
  energy: number // EWMA of |accel| deviation from 1 g
}

export function createTelemetry(): Telemetry {
  return { speedKmh: null, speedOk: true, avgSum: 0, avgCount: 0, energy: 0 }
}

function category(kmh: number | null): string {
  const s = kmh ?? 0
  if (s < 1) return 'STOP'
  if (s < 7) return 'WALK'
  if (s < 15) return 'RUN'
  return 'VEHICLE'
}

/** Build the left data block content. The fixed OS font fits ~3 lines in the
 * left margin, so only the movement metrics live here; ARM (weapons) and GL
 * (goal) are handled elsewhere. */
export function formatLeftData(t: Telemetry): string {
  const avg = t.avgCount > 0 ? (t.avgSum / t.avgCount).toFixed(1) : '0.0'
  const intensity = Math.min(100, Math.round(t.energy * 200))
  return `AVG ${avg}\nINT ${intensity}\n${category(t.speedKmh)}`
}
