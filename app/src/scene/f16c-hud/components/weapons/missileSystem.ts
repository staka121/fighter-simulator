import { AMMO_START, type Telemetry } from '../telemetry/telemetry'
import { playLaunchSound, playEmptySound } from './sound'

/**
 * Master arm + missile logic. State lives in the shared `telemetry` so the ARM/
 * SAFE line renders with the rest of the left block; `refresh` re-renders that
 * block immediately (a glasses tap fires, a menu item toggles arm / reloads).
 * Firing plays a launch sound and decrements; a blocked shot (safe or empty)
 * buzzes.
 */
export function createMissileSystem(telemetry: Telemetry, refresh: () => void) {
  return {
    getAmmo: () => telemetry.ammo,
    isArmed: () => telemetry.armed,

    toggleArm() {
      telemetry.armed = !telemetry.armed
      refresh()
    },

    reload() {
      telemetry.ammo = AMMO_START
      refresh()
    },

    fire() {
      if (!telemetry.armed || telemetry.ammo <= 0) {
        playEmptySound()
        return
      }
      telemetry.ammo -= 1
      playLaunchSound()
      refresh()
    },
  }
}
