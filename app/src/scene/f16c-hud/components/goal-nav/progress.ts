import { activeGoal, type Store } from '../../store'
import { distanceMeters } from './geo'

/** How close (m) counts as reaching a steerpoint. */
export const ARRIVE_RADIUS_M = 15

/**
 * Advance `fromSteerpoint` when the wearer reaches the active goal, so the SP
 * from>to reflects the last steerpoint actually reached — not merely the
 * previous list index. Switching the active goal before arriving leaves `from`
 * where it was (00 = nav start until the first arrival). Mutates the store.
 */
export function updateNavProgress(store: Store): void {
  const g = activeGoal(store)
  if (!g || store.lat == null || store.lon == null) return
  if (distanceMeters({ lat: store.lat, lon: store.lon }, g) <= ARRIVE_RADIUS_M) {
    store.fromSteerpoint = store.activeGoalIndex + 1
  }
}
