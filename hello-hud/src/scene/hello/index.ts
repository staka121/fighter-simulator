import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import type { Scene } from '../types'
import { buildView } from './view'
import { registerTapCounter } from './event-handlers/registerTapCounter'
import { registerExitOnDoubleTap } from './event-handlers/registerExitOnDoubleTap'

/**
 * The Hello scene: greets, counts taps, exits on double-tap.
 *
 * `enter` renders the view, then registers each event handler and keeps its
 * unsubscribe. `leave` runs them all to tear the subscriptions down.
 */
export function createHelloScene(): Scene {
  let cleanups: Array<() => void> = []

  return {
    async enter(bridge: EvenAppBridge) {
      const result = await bridge.createStartUpPageContainer(buildView())
      console.log('Page created:', result === 0 ? 'success' : `failed (${result})`)

      cleanups = [registerExitOnDoubleTap(bridge), registerTapCounter(bridge)]
    },

    leave() {
      cleanups.forEach(unsubscribe => unsubscribe())
      cleanups = []
    },
  }
}
