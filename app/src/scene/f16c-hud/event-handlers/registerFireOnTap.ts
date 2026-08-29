import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { isClick } from '../../../events'

/**
 * Fire on a single tap. Double-tap stays reserved for exit, and the hardware
 * sends CLICK vs DOUBLE_CLICK as distinct events, so the two never collide.
 *
 * Runs immediately: subscribes on call and returns the unsubscribe.
 */
export function registerFireOnTap(bridge: EvenAppBridge, onFire: () => void): () => void {
  return bridge.onEvenHubEvent(event => {
    if (isClick(event)) onFire()
  })
}
