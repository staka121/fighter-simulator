import { OsEventTypeList, type EvenAppBridge } from '@evenrealities/even_hub_sdk'

/** Latest IMU sample (accelerometer). x≈pitch axis, y≈yaw axis, z≈vertical. */
export interface ImuSample {
  x: number
  y: number
  z: number
  received: boolean
}

/**
 * Stream the IMU into a mutable sink the render loop reads each frame.
 *
 * Runs immediately: subscribes on call and returns the unsubscribe.
 * The caller must enable streaming with `imuControl(true, ...)`.
 */
export function registerImuSampler(bridge: EvenAppBridge, sink: ImuSample): () => void {
  return bridge.onEvenHubEvent(event => {
    const sys = event.sysEvent
    if (!sys?.imuData || sys.eventType !== OsEventTypeList.IMU_DATA_REPORT) return
    sink.x = sys.imuData.x ?? 0
    sink.y = sys.imuData.y ?? 0
    sink.z = sys.imuData.z ?? 0
    sink.received = true
  })
}
