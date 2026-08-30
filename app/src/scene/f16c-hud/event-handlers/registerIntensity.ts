import { OsEventTypeList, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import type { Store } from '../store'

/**
 * Estimate exercise intensity from the IMU (no heart-rate API exists, so
 * Karvonen isn't possible). Tracks an EWMA of how much the accelerometer
 * magnitude deviates from 1 g — near 0 when still, higher the more you bob /
 * shake while walking or running. Written into `store.energy`.
 *
 * Runs immediately: subscribes on call and returns the unsubscribe. The caller
 * must enable IMU streaming with `imuControl(true)`.
 */
export function registerIntensity(bridge: EvenAppBridge, store: Store): () => void {
  return bridge.onEvenHubEvent(event => {
    const sys = event.sysEvent
    if (!sys?.imuData || sys.eventType !== OsEventTypeList.IMU_DATA_REPORT) return

    const { x = 0, y = 0, z = 0 } = sys.imuData
    const deviation = Math.abs(Math.sqrt(x * x + y * y + z * z) - 1)
    store.energy += (deviation - store.energy) * 0.05
  })
}
