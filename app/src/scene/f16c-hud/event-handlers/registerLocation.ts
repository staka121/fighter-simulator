import {
  TextContainerUpgrade,
  AppLocationAccuracy,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import type { Telemetry } from '../telemetry'

/**
 * Start Even Hub native location updates. Writes speed into `telemetry` (for the
 * left-block average) and drives the airspeed box (current speed):
 *   - `NG`  : host refused to start updates (permission/support)
 *   - `0.0` : running but speed unknown / standing still
 *   - `N.N` : current speed (km/h)
 *
 * Uses the app bridge (not web geolocation), needs `location` in app.json.
 * Returns the unsubscribe (stops the updates).
 */
export function registerLocation(
  bridge: EvenAppBridge,
  telemetry: Telemetry,
  speedBoxID: number,
  speedBoxName: string,
): () => void {
  let shown = ''
  const writeBox = (v: string) => {
    if (v === shown) return
    shown = v
    void bridge.textContainerUpgrade(
      new TextContainerUpgrade({
        containerID: speedBoxID,
        containerName: speedBoxName,
        content: v,
      }),
    )
  }

  const unsubscribe = bridge.onAppLocationChanged(loc => {
    const mps = loc.speed
    if (mps != null && mps >= 0) {
      const kmh = mps * 3.6
      telemetry.speedKmh = kmh
      writeBox(kmh.toFixed(1))
      if (kmh >= 0.5) {
        telemetry.avgSum += kmh
        telemetry.avgCount += 1
      }
    } else {
      telemetry.speedKmh = 0
      writeBox('0.0')
    }
  })

  bridge
    .startAppLocationUpdates({ accuracy: AppLocationAccuracy.High, intervalMs: 1000 })
    .then(ok => {
      if (!ok) {
        telemetry.speedOk = false
        writeBox('NG')
      }
    })
    .catch(() => {
      telemetry.speedOk = false
      writeBox('NG')
    })

  return () => {
    unsubscribe()
    void bridge.stopAppLocationUpdates()
  }
}
