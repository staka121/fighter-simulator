import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'

/**
 * A Scene is one screen on the glasses.
 *
 * Lifecycle mirrors a React component:
 *   - `enter` = mount: render the containers and wire up event handlers.
 *   - `leave` = unmount: run every cleanup (unsubscribe) collected in `enter`.
 */
export interface Scene {
  enter(bridge: EvenAppBridge): Promise<void>
  leave(): void
}
