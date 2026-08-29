import { TextContainerUpgrade, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { READOUTS, AMMO_START } from './readouts'
import { playLaunchSound, playEmptySound } from './sound'

/**
 * Missile / master-arm state for the tap-to-fire feature. The bottom-left
 * readout shows `ARM <n>` (master arm + remaining missiles); firing plays a
 * launch sound and decrements. No-op when empty.
 */
export function createMissileSystem(bridge: EvenAppBridge) {
  let ammo = AMMO_START

  const render = () => {
    void bridge.textContainerUpgrade(
      new TextContainerUpgrade({
        containerID: READOUTS.ammo.id,
        containerName: READOUTS.ammo.name,
        content: `ARM ${ammo}`,
      }),
    )
  }

  return {
    getAmmo: () => ammo,
    fire() {
      if (ammo <= 0) {
        playEmptySound()
        return
      }
      ammo -= 1
      playLaunchSound()
      render()
    },
  }
}
