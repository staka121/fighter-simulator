// Shared HUD state — the scene-level contract that data sources write and
// components read. Sources (registerLocation, registerIntensity, the missile
// system) mutate it; renderers (speed, heading, left-data) read it. It is not a
// component: adding a field here is an explicit change to the shared contract,
// not a reach into any one component.
export const AMMO_START = 6

export interface Store {
  // movement
  speedKmh: number | null // latest GPS speed
  heading: number | null // GPS course, deg from true north (null when standing)
  altitude: number | null // latest GPS altitude (m), null until the first fix
  locationOk: boolean // location updates running
  avgSum: number // Σ moving-speed samples
  avgCount: number // count of moving-speed samples
  energy: number // EWMA of |accel| deviation from 1 g
  // weapons
  armed: boolean
  ammo: number
}

export function createStore(): Store {
  return {
    speedKmh: null,
    heading: null,
    altitude: null,
    locationOk: true,
    avgSum: 0,
    avgCount: 0,
    energy: 0,
    armed: true,
    ammo: AMMO_START,
  }
}
