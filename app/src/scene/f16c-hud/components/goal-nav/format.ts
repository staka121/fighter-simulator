import type { Store } from '../../store'
import { distanceMeters, initialBearing } from './geo'

const pad2 = (n: number) => String(n).padStart(2, '0')
const pad3 = (n: number) => String(n).padStart(3, '0')

/** Range to goal: metres up to 4 digits, then km (one decimal). */
function fmtRange(m: number): string {
  return m < 10_000 ? `R ${Math.round(m)}` : `R ${(m / 1000).toFixed(1)}k`
}

/** Time to go MM:SS from range and ground speed (m/s); -- below a slow walk. */
function fmtTtg(m: number, mps: number): string {
  if (!(mps > 0.14)) return 'T --:--' // < ~0.5 km/h → not usefully moving
  const sec = Math.round(m / mps)
  const mm = Math.min(99, Math.floor(sec / 60))
  return `T ${pad2(mm)}:${pad2(sec % 60)}`
}

/**
 * Right data block — goal navigation, a walking-HUD take on the F-16C
 * steerpoint block. Five lines: range, goal altitude, bearing (true north),
 * time-to-go, and steerpoint number. All `--` until a goal and a GPS fix exist.
 */
export function formatGoalNav(store: Store): string {
  const g = store.goal
  if (!g || store.lat == null || store.lon == null) {
    return 'R --\nAL --\nB --\nT --:--\nSP --'
  }

  const here = { lat: store.lat, lon: store.lon }
  const m = distanceMeters(here, g)
  const alt = g.alt != null ? `AL ${Math.round(g.alt)}` : 'AL --'
  const bearing = `B ${pad3(Math.round(initialBearing(here, g)) % 360)}`
  // ETA speed: prefer the moving average, fall back to the latest reading.
  const kmh = store.avgCount > 0 ? store.avgSum / store.avgCount : (store.speedKmh ?? 0)
  const ttg = fmtTtg(m, kmh / 3.6)
  const sp = 'SP 001' // single goal for now; the index when multiple goals land

  return `${fmtRange(m)}\n${alt}\n${bearing}\n${ttg}\n${sp}`
}
