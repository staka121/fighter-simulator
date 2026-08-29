import { TextContainerUpgrade, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { isClick } from '../../../events'
import { HINT, MAIN_CONTAINER } from '../view'

/**
 * Count single taps and re-render the container's text in place.
 *
 * Runs immediately: subscribes on call and returns the unsubscribe (the cleanup
 * the scene runs on `leave`). Only cares about CLICK, so it never fires on a
 * double-tap — the ordering dance the flat version needed disappears.
 */
export function registerTapCounter(bridge: EvenAppBridge): () => void {
  let taps = 0

  return bridge.onEvenHubEvent(event => {
    if (!isClick(event)) return

    taps += 1
    bridge.textContainerUpgrade(
      new TextContainerUpgrade({
        containerID: MAIN_CONTAINER.id,
        containerName: MAIN_CONTAINER.name,
        content: `Taps: ${taps}\n${HINT}`,
      }),
    )
  })
}
