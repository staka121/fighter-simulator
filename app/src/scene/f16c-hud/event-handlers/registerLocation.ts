import { AppLocationAccuracy, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import type { Telemetry } from '../components/telemetry'

/**
 * Location source: start Even Hub native location updates and write movement
 * data into `telemetry` (`speedKmh`, the moving-speed average, `heading`, and
 * `speedOk`). Components render from telemetry — the speed component shows the
 * box, the heading component shows the tape, the telemetry component uses the
 * average. Uses the app bridge (not web geolocation), needs `location` in
 * app.json. Returns the unsubscribe.
 */
export function registerLocation(bridge: EvenAppBridge, telemetry: Telemetry): () => void {
  const unsubscribe = bridge.onAppLocationChanged(loc => {
    const mps = loc.speed
    if (mps != null && mps >= 0) {
      const kmh = mps * 3.6
      telemetry.speedKmh = kmh
      if (kmh >= 0.5) {
        telemetry.avgSum += kmh
        telemetry.avgCount += 1
      }
    } else {
      telemetry.speedKmh = 0
    }

    // GPS course is only meaningful while moving; it's reported < 0 (or null)
    // when standing still. Keep the last good heading rather than snapping.
    const hdg = loc.heading
    if (hdg != null && hdg >= 0) telemetry.heading = hdg
  })

  bridge
    .startAppLocationUpdates({ accuracy: AppLocationAccuracy.High, intervalMs: 1000 })
    .then(ok => {
      if (!ok) telemetry.speedOk = false
    })
    .catch(() => {
      telemetry.speedOk = false
    })

  return () => {
    unsubscribe()
    void bridge.stopAppLocationUpdates()
  }
}
