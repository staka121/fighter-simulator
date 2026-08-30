// Shared HUD state — the scene-level contract that data sources write and
// components read. Sources (registerLocation, registerIntensity, the missile
// system) mutate it; renderers (speed, heading, left-data) read it. It is not a
// component: adding a field here is an explicit change to the shared contract,
// not a reach into any one component.
export const AMMO_START = 6

/** A geographic point (WGS84 degrees), with an optional elevation in metres.
 * `reached` is set once the wearer arrives (nav progress). */
export interface GoalPoint {
  lat: number
  lon: number
  alt?: number
  reached?: boolean
}

export interface Store {
  // movement
  speedKmh: number | null // latest GPS speed
  heading: number | null // GPS course, deg from true north (null when standing)
  altitude: number | null // latest GPS altitude (m), null until the first fix
  lat: number | null // latest GPS latitude, null until the first fix
  lon: number | null // latest GPS longitude, null until the first fix
  locationOk: boolean // location updates running
  avgSum: number // Σ moving-speed samples
  avgCount: number // count of moving-speed samples
  energy: number // EWMA of |accel| deviation from 1 g
  // navigation — destinations set from the phone UI (persisted). The glasses
  // navigate to the active one; `activeGoalIndex` is -1 when there is none.
  goals: GoalPoint[]
  activeGoalIndex: number
  // The steerpoint most recently reached (0 = the nav start). Advances only on
  // arrival, so switching the active goal mid-leg doesn't fake a "from".
  fromSteerpoint: number
  // weapons
  armed: boolean
  ammo: number
}

export function createStore(): Store {
  return {
    speedKmh: null,
    heading: null,
    altitude: null,
    lat: null,
    lon: null,
    locationOk: true,
    avgSum: 0,
    avgCount: 0,
    energy: 0,
    goals: [],
    activeGoalIndex: -1,
    fromSteerpoint: 0,
    armed: true,
    ammo: AMMO_START,
  }
}

/** The goal the glasses navigate to, or null when none is selected. */
export function activeGoal(store: Store): GoalPoint | null {
  return store.goals[store.activeGoalIndex] ?? null
}
