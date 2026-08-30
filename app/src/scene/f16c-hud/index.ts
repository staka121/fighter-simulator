import {
  ImuReportPace,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import type { Scene } from '../types'
import { buildView, buildHudRebuild, buildSettingsRebuild, SETTINGS_BODY } from './view'
import { startHudDriver, TILES } from './components/center-panel'
import { startSpeedDriver } from './components/speed'
import { startAltitudeDriver } from './components/altitude'
import { startHeadingTicks, startHeadingNumberDriver } from './components/heading'
import { startMinimapDriver } from './components/minimap'
import { startClockDriver } from './components/clock'
import { startLeftDataDriver } from './components/left-data'
import { startGoalNavDriver } from './components/goal-nav'
import { createSettings } from './settings'
import type { Store } from './store'
import { createImageSender, type ImageSender } from './image-sender'
import { createMissileSystem } from './components/weapons'
import { registerExitOnDoubleTap } from './event-handlers/registerExitOnDoubleTap'
import { registerFireOnTap } from './event-handlers/registerFireOnTap'
import { registerScroll } from './event-handlers/registerScroll'
import { registerImuSampler, type ImuSample } from './event-handlers/registerImuSampler'
import { registerLocation } from './event-handlers/registerLocation'
import { registerIntensity } from './event-handlers/registerIntensity'

/**
 * The F-16C HUD scene. The HUD renders fighter symbology while walking; scroll
 * down opens a settings screen (cursor navigated by scroll, activated by tap),
 * scroll up returns. Double-tap exits.
 *
 * Two cleanup groups: `persistent` (data sources, tap/scroll input) live for the
 * whole scene; `hud` (the rendering drivers + weapons) run only in HUD mode and
 * are torn down while settings is shown so they don't send to absent containers.
 *
 * The shared `store` is owned by the caller (main.ts) so the phone-side goal UI
 * can write into the same state the scene reads.
 */
export function createF16cHudScene(store: Store): Scene {
  let persistent: Array<() => void> = []
  let hud: Array<() => void> = []
  let mode: 'hud' | 'settings' = 'hud'

  let bridge: EvenAppBridge
  let send: ImageSender
  let fireCurrent: () => void = () => {}
  const imu: ImuSample = { x: 0, y: 0, z: 1, received: false }

  const settings = createSettings(store, { close: () => closeSettings() })

  function startHud(): Array<() => void> {
    const leftData = startLeftDataDriver(bridge, store)
    const missiles = createMissileSystem(store, leftData.refresh)
    fireCurrent = () => missiles.fire()
    return [
      startHudDriver(send, imu),
      startSpeedDriver(bridge, store),
      startAltitudeDriver(bridge, store),
      startGoalNavDriver(bridge, store),
      startHeadingTicks(send),
      startHeadingNumberDriver(bridge, store),
      startMinimapDriver(send, store),
      startClockDriver(bridge),
      leftData.stop,
    ]
  }

  function stopHud(): void {
    hud.forEach(c => c())
    hud = []
  }

  function renderSettings(): void {
    void bridge.textContainerUpgrade(
      new TextContainerUpgrade({
        containerID: SETTINGS_BODY.id,
        containerName: SETTINGS_BODY.name,
        content: settings.text(),
      }),
    )
  }

  function openSettings(): void {
    if (mode !== 'hud') return
    mode = 'settings'
    stopHud()
    settings.reset()
    void bridge.rebuildPageContainer(buildSettingsRebuild(settings.text()))
  }

  function closeSettings(): void {
    if (mode !== 'settings') return
    mode = 'hud'
    void bridge.rebuildPageContainer(buildHudRebuild())
    hud = startHud()
  }

  return {
    async enter(b: EvenAppBridge) {
      bridge = b
      const created = await bridge.createStartUpPageContainer(buildView())
      if (created !== 0) console.error('HUD page create failed:', created)

      // All raw-image sends go through one serial channel; the moving panel is
      // prioritised so its cadence stays regular.
      send = createImageSender(bridge, TILES[0].id)
      await bridge.imuControl(true, ImuReportPace.P500)

      persistent = [
        registerExitOnDoubleTap(bridge),
        // Tap: fire in HUD mode, activate the cursor row in settings.
        registerFireOnTap(bridge, () => (mode === 'hud' ? fireCurrent() : activateSettings())),
        // Scroll: open settings from the HUD, otherwise move the settings cursor.
        registerScroll(bridge, {
          onDown: () => (mode === 'hud' ? openSettings() : moveSettings(1)),
          onUp: () => mode === 'settings' && moveSettings(-1),
        }),
        registerImuSampler(bridge, imu),
        registerIntensity(bridge, store),
        registerLocation(bridge, store),
        () => void bridge.imuControl(false),
      ]
      hud = startHud()
    },

    leave() {
      stopHud()
      persistent.forEach(cleanup => cleanup())
      persistent = []
    },
  }

  function moveSettings(delta: number): void {
    settings.move(delta)
    renderSettings()
  }

  function activateSettings(): void {
    settings.activate()
    if (mode === 'settings') renderSettings() // Close switches mode; others refresh labels
  }
}
