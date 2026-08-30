import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'

/**
 * Dispatch OS contextual-menu selections to per-item handlers keyed by itemID.
 * Menu clicks arrive as independent top-level events (they bypass event
 * capture). Runs immediately: subscribes on call and returns the unsubscribe.
 */
export function registerMenu(
  bridge: EvenAppBridge,
  handlers: Record<number, () => void>,
): () => void {
  return bridge.onEvenHubEvent(event => {
    const itemID = event.menuItemClickEvent?.itemID
    if (itemID === undefined) return
    handlers[itemID]?.()
  })
}
