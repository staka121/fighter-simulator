import type { Store } from './store'
import type { ImuSample } from './event-handlers/registerImuSampler'

/**
 * Dev-only seed for the Even simulator, which supplies no GPS or IMU. It fills
 * the shared store with representative walking data and eases the IMU into a
 * gentle banked attitude so the real HUD renders a populated frame for the
 * store-listing screenshots.
 *
 * This is NOT post-processing: the actual app still draws every pixel through
 * the real SDK — this only stands in for the sensor inputs the simulator lacks.
 * It is reached only via `?demo` under `import.meta.env.DEV` (see main.ts), so a
 * packaged build never loads or runs it. Returns a cleanup fn.
 */
export function seedDemo(store: Store, imu: ImuSample): () => void {
  const here = { lat: 35.6586, lon: 139.7454 } // near Tokyo Tower

  // Walking telemetry the GPS source would otherwise write. The simulator's
  // native location call fails and flips locationOk off, so re-assert it.
  store.locationOk = true
  store.lat = here.lat
  store.lon = here.lon
  store.speedKmh = 5.4
  store.heading = 62
  store.altitude = 38
  store.energy = 0.12 // INT ≈ 24
  store.avgSum = 5.4
  store.avgCount = 1

  // A two-leg route: the first steerpoint is reached, the second is active, so
  // the nav block shows "SP 01>02" and the minimap shows both blips.
  store.goals = [
    { lat: 35.655, lon: 139.7412, alt: 32, reached: true },
    { lat: 35.6647, lon: 139.753, alt: 41 },
  ]
  store.activeGoalIndex = 1
  store.fromSteerpoint = 1

  // IMU: capture a level baseline first, then hold a gentle climb + right bank
  // so the pitch ladder tilts and the flight-path marker deflects.
  imu.x = 0
  imu.y = 0
  imu.z = 1
  imu.received = true
  const tilt = setTimeout(() => {
    store.locationOk = true // defeat any late async flip from the failing native call
    imu.x = 0.09
    imu.y = 0.05
    imu.z = 0.99
  }, 600)

  return () => clearTimeout(tilt)
}
