import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'
import { createHelloScene } from './scene/hello'
import { isExit } from './events'

// The bridge to the phone's Even app. Every glasses command goes through it.
const bridge = await waitForEvenAppBridge()

// Mount the initial scene.
const scene = createHelloScene()
await scene.enter(bridge)

// Tear the scene down when the host signals the app is exiting.
const stopExitWatch = bridge.onEvenHubEvent(event => {
  if (!isExit(event)) return
  scene.leave()
  stopExitWatch()
})
