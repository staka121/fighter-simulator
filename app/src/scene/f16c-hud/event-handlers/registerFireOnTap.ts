import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { isClick } from '../../../events'

/**
 * Fire on a single tap. Double-tap stays reserved for exit and long-press opens
 * the contextual menu — CLICK, DOUBLE_CLICK and LONG_PRESS are distinct events,
 * so they coexist.
 *
 * Runs immediately: subscribes on call and returns the unsubscribe.
 */
export function registerFireOnTap(bridge: EvenAppBridge, onFire: () => void): () => void {
  return bridge.onEvenHubEvent(event => {
    if (isClick(event)) onFire()
  })
}
