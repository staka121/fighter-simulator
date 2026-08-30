import { distanceMeters } from '../../geo'
import type { Store } from '../../store'

/** How close (m) counts as reaching a steerpoint. */
export const ARRIVE_RADIUS_M = 15

/**
 * Advance navigation when the wearer reaches the active goal: mark that goal
 * `reached`, move `fromSteerpoint` up (so the SP from>to reflects the last
 * steerpoint actually reached), and auto-advance the active goal to the next one
 * so the right block follows the route. At the final goal there is nothing to
 * advance to — the readout clears instead (see formatGoalNav). Mutates the store.
 */
export function updateNavProgress(store: Store): void {
  const i = store.activeGoalIndex
  const g = store.goals[i]
  if (!g || store.lat == null || store.lon == null) return

  if (distanceMeters({ lat: store.lat, lon: store.lon }, g) <= ARRIVE_RADIUS_M) {
    g.reached = true
    store.fromSteerpoint = i + 1
    if (i < store.goals.length - 1) store.activeGoalIndex = i + 1
  }
}
