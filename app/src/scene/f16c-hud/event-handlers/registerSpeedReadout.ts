import {
  TextContainerUpgrade,
  AppLocationAccuracy,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'

/**
 * Show live ground speed (km/h) in a text container using the Even Hub native
 * location API (`startAppLocationUpdates` + `onAppLocationChanged`). The value
 * doubles as a status indicator:
 *   - `NG`  : the host refused to start location updates (permission/support)
 *   - `0.0` : updates running but speed unknown (null / standing still)
 *   - `N.N` : actual speed in km/h
 *
 * This goes through the app bridge (not web geolocation), so it needs the
 * `location` permission in app.json — not an HTTPS secure context.
 *
 * Returns the unsubscribe (stops the updates).
 */
export function registerSpeedReadout(
  bridge: EvenAppBridge,
  containerID: number,
  containerName: string,
): () => void {
  let shown = ''
  const write = (v: string) => {
    if (v === shown) return
    shown = v
    void bridge.textContainerUpgrade(
      new TextContainerUpgrade({ containerID, containerName, content: v }),
    )
  }

  const unsubscribe = bridge.onAppLocationChanged(loc => {
    const mps = loc.speed
    write(mps != null && mps >= 0 ? (mps * 3.6).toFixed(1) : '0.0')
  })

  bridge
    .startAppLocationUpdates({ accuracy: AppLocationAccuracy.High, intervalMs: 1000 })
    .then(ok => {
      if (!ok) write('NG')
    })
    .catch(() => write('NG'))

  return () => {
    unsubscribe()
    void bridge.stopAppLocationUpdates()
  }
}
