import type { GoalPoint, Store } from '../scene/f16c-hud/store'

const KEY = 'f16c.goals.v1'
const LEGACY_KEY = 'f16c.goal.v1' // single-goal format, pre multi-goal

interface Persisted {
  goals: GoalPoint[]
  active: number
}

function isGoalPoint(g: unknown): g is GoalPoint {
  if (typeof g !== 'object' || g === null) return false
  const p = g as Record<string, unknown>
  return (
    typeof p.lat === 'number' &&
    typeof p.lon === 'number' &&
    (p.alt === undefined || typeof p.alt === 'number')
  )
}

/** Clamp an active index to a valid slot (or -1 when the list is empty). */
function clampActive(active: unknown, len: number): number {
  if (len === 0) return -1
  return typeof active === 'number' && active >= 0 && active < len ? active : 0
}

/** Load persisted goals into the store, migrating a single legacy goal if the
 * new list is absent. No-op on unavailable / corrupt storage. */
export function loadGoals(store: Store): void {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>
      if (Array.isArray(p?.goals)) {
        store.goals = p.goals.filter(isGoalPoint)
        store.activeGoalIndex = clampActive(p.active, store.goals.length)
        return
      }
    }
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const g = JSON.parse(legacy)
      if (isGoalPoint(g)) {
        store.goals = [g]
        store.activeGoalIndex = 0
        saveGoals(store)
        localStorage.removeItem(LEGACY_KEY)
      }
    }
  } catch {
    // ignore unavailable / corrupt storage
  }
}

/** Persist the current goal list + active index. */
export function saveGoals(store: Store): void {
  try {
    const data: Persisted = { goals: store.goals, active: store.activeGoalIndex }
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // ignore unavailable storage
  }
}
