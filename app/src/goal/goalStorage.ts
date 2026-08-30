import type { GoalPoint, Store } from '../scene/f16c-hud/store'

const KEY = 'f16c.goal.v1'

/** Load a persisted goal from localStorage into the store (no-op if none or
 * corrupt). */
export function loadGoal(store: Store): void {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const g = JSON.parse(raw) as Partial<GoalPoint>
    if (typeof g?.lat === 'number' && typeof g?.lon === 'number') {
      store.goal = { lat: g.lat, lon: g.lon }
    }
  } catch {
    // ignore unavailable / corrupt storage
  }
}

/** Persist (or clear) the goal in localStorage. */
export function saveGoal(goal: GoalPoint | null): void {
  try {
    if (goal) localStorage.setItem(KEY, JSON.stringify(goal))
    else localStorage.removeItem(KEY)
  } catch {
    // ignore unavailable storage
  }
}
