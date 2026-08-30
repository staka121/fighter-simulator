import { activeGoal, type Store } from '../../store'
import { distanceMeters, initialBearing } from '../../geo'

const PLACEHOLDER = 'R --\nAL --\nB --\nT --:--\nSP --'

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
 * time-to-go, and steerpoint number. All `--` until a goal and a GPS fix exist,
 * and again once the final destination is reached (nav complete).
 */
export function formatGoalNav(store: Store): string {
  const g = activeGoal(store)
  // No goal / no fix → clear. A reached goal is no longer a destination, so the
  // block stays cleared even after leaving it (nav does not resume).
  if (!g || g.reached || store.lat == null || store.lon == null) return PLACEHOLDER

  const here = { lat: store.lat, lon: store.lon }
  const m = distanceMeters(here, g)
  const alt = g.alt != null ? `AL ${Math.round(g.alt)}` : 'AL --'
  const bearing = `B ${pad3(Math.round(initialBearing(here, g)) % 360)}`
  // ETA speed: prefer the moving average, fall back to the latest reading.
  const kmh = store.avgCount > 0 ? store.avgSum / store.avgCount : (store.speedKmh ?? 0)
  const ttg = fmtTtg(m, kmh / 3.6)
  // Steerpoint from>to: the nav start is 00 and goals are 01, 02, … in order.
  // `from` is the last steerpoint reached (see updateNavProgress); `to` is the
  // active goal's number. e.g. "00>01". (Sequential for now; may become
  // user-assigned later.)
  const sp = `SP ${pad2(store.fromSteerpoint)}>${pad2(store.activeGoalIndex + 1)}`

  return `${fmtRange(m)}\n${alt}\n${bearing}\n${ttg}\n${sp}`
}
