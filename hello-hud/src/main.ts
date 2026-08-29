import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'
import { createF16cHudScene } from './scene/f16c-hud'
import { isExit } from './events'

// The bridge to the phone's Even app. Every glasses command goes through it.
const bridge = await waitForEvenAppBridge()

// Mount the initial scene.
const scene = createF16cHudScene()
await scene.enter(bridge)

// Tear the scene down when the host signals the app is exiting.
const stopExitWatch = bridge.onEvenHubEvent(event => {
  if (!isExit(event)) return
  scene.leave()
  stopExitWatch()
})
