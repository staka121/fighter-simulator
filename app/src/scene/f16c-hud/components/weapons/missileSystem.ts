import { AMMO_START, type Store } from '../../store'
import { playLaunchSound, playEmptySound } from './sound'

/**
 * Master arm + missile logic. State lives in the shared `store` so the ARM/
 * SAFE line renders with the rest of the left block; `refresh` re-renders that
 * block immediately (a glasses tap fires, a menu item toggles arm / reloads).
 * Firing plays a launch sound and decrements; a blocked shot (safe or empty)
 * buzzes.
 */
export function createMissileSystem(store: Store, refresh: () => void) {
  return {
    getAmmo: () => store.ammo,
    isArmed: () => store.armed,

    toggleArm() {
      store.armed = !store.armed
      refresh()
    },

    reload() {
      store.ammo = AMMO_START
      refresh()
    },

    fire() {
      if (!store.armed || store.ammo <= 0) {
        playEmptySound()
        return
      }
      store.ammo -= 1
      playLaunchSound()
      refresh()
    },
  }
}
