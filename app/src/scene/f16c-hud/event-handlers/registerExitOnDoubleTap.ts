import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { isDoubleClick } from '../../../events'

/**
 * Exit the app (shut the page down) on a double-tap.
 *
 * Runs immediately: subscribes on call and returns the unsubscribe. Kept as its
 * own handler so "the user can always leave" is a self-contained guarantee.
 */
export function registerExitOnDoubleTap(bridge: EvenAppBridge, exitMode = 1): () => void {
  return bridge.onEvenHubEvent(event => {
    if (isDoubleClick(event)) bridge.shutDownPageContainer(exitMode)
  })
}
