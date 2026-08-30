import { ImuReportPace, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import type { Scene } from '../types'
import { buildView } from './view'
import { READOUTS } from './readouts'
import { startHudDriver } from './components/center-panel'
import { createTelemetry, startLeftDataDriver } from './components/telemetry'
import { createMissileSystem, MENU_ITEMS } from './components/weapons'
import { registerExitOnDoubleTap } from './event-handlers/registerExitOnDoubleTap'
import { registerFireOnTap } from './event-handlers/registerFireOnTap'
import { registerMenu } from './event-handlers/registerMenu'
import { registerImuSampler, type ImuSample } from './event-handlers/registerImuSampler'
import { registerLocation } from './event-handlers/registerLocation'
import { registerIntensity } from './event-handlers/registerIntensity'

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
      const leftData = startLeftDataDriver(
        bridge,
        telemetry,
        READOUTS.leftData.id,
        READOUTS.leftData.name,
      )
      const missiles = createMissileSystem(telemetry, leftData.refresh)
      await bridge.imuControl(true, ImuReportPace.P500)

      cleanups = [
        registerExitOnDoubleTap(bridge),
        registerFireOnTap(bridge, () => missiles.fire()),
        registerMenu(bridge, {
          [MENU_ITEMS.toggleArm]: () => missiles.toggleArm(),
          [MENU_ITEMS.reload]: () => missiles.reload(),
        }),
        registerImuSampler(bridge, imu),
        registerIntensity(bridge, telemetry),
        registerLocation(bridge, telemetry, READOUTS.airspeed.id, READOUTS.airspeed.name),
        startHudDriver(bridge, imu),
        leftData.stop,
        () => void bridge.imuControl(false),
      ]
    },

    leave() {
      cleanups.forEach(cleanup => cleanup())
      cleanups = []
    },
  }
}
