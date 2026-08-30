import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'
import { createF16cHudScene } from './scene/f16c-hud'
import { createStore } from './scene/f16c-hud/store'
import { loadGoal, mountGoalPanel } from './goal'
import { isExit } from './events'

// The bridge to the phone's Even app. Every glasses command goes through it.
const bridge = await waitForEvenAppBridge()

// Shared HUD state, owned here so the phone-side goal UI and the glasses scene
// read/write the same store. Restore any persisted goal before either runs.
const store = createStore()
loadGoal(store)

// Phone screen: the goal-setting panel (destination coordinates).
const app = document.getElementById('app')
if (app) mountGoalPanel(app, store)

// Mount the initial scene.
const scene = createF16cHudScene(store)
await scene.enter(bridge)

// Tear the scene down when the host signals the app is exiting.
const stopExitWatch = bridge.onEvenHubEvent(event => {
  if (!isExit(event)) return
  scene.leave()
  stopExitWatch()
})
