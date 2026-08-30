import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { isScrollUp, isScrollDown } from '../../../events'

/**
 * Dispatch scroll gestures. Scroll down opens the settings screen; scroll up
 * returns to the HUD. Subscribes immediately and returns the unsubscribe.
 */
export function registerScroll(
  bridge: EvenAppBridge,
  handlers: { onUp?: () => void; onDown?: () => void },
): () => void {
  return bridge.onEvenHubEvent(event => {
    if (isScrollDown(event)) handlers.onDown?.()
    else if (isScrollUp(event)) handlers.onUp?.()
  })
}
