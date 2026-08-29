import { ImuReportPace, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import type { Scene } from '../types'
import { buildView } from './view'
import { READOUTS } from './readouts'
import { createTelemetry } from './telemetry'
import { registerExitOnDoubleTap } from './event-handlers/registerExitOnDoubleTap'
import { registerImuSampler, type ImuSample } from './event-handlers/registerImuSampler'
import { registerLocation } from './event-handlers/registerLocation'
import { registerIntensity } from './event-handlers/registerIntensity'
import { startHudDriver } from './hudDriver'
import { startLeftDataDriver } from './leftDataDriver'

/**
 * The F-16C HUD scene: renders fighter HUD symbology and keeps it up while the
 * wearer walks around. Double-tap to exit.
 *
 * The boresight cross is fixed; the flight path marker and horizon/ladder are
 * driven by the IMU. Graphics are drawn with the Canvas 2D API and sent as PNG
 * bytes; the host converts to 4-bit greyscale. See render.ts / hudDriver.ts.
 */
export function createF16cHudScene(): Scene {
  let cleanups: Array<() => void> = []

  return {
    async enter(bridge: EvenAppBridge) {
      const created = await bridge.createStartUpPageContainer(buildView())
      if (created !== 0) console.error('HUD page create failed:', created)

      const imu: ImuSample = { x: 0, y: 0, z: 1, received: false }
      const telemetry = createTelemetry()
      await bridge.imuControl(true, ImuReportPace.P500)

      cleanups = [
        registerExitOnDoubleTap(bridge),
        registerImuSampler(bridge, imu),
        registerIntensity(bridge, telemetry),
        registerLocation(bridge, telemetry, READOUTS.airspeed.id, READOUTS.airspeed.name),
        startHudDriver(bridge, imu),
        startLeftDataDriver(bridge, telemetry, READOUTS.leftData.id, READOUTS.leftData.name),
        () => void bridge.imuControl(false),
      ]
    },

    leave() {
      cleanups.forEach(cleanup => cleanup())
      cleanups = []
    },
  }
}
