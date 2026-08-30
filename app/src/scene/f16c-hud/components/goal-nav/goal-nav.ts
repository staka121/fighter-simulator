import {
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import { formatGoalNav } from './format'
import type { Store } from '../../store'

export { formatGoalNav }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Right data block (goal navigation) container id/name. */
export const GOAL_NAV = { id: 6, name: 'goalNav' } as const

/**
 * Right data block: goal navigation (range / goal altitude / bearing / time-to-
 * go / steerpoint), one container so every line shares the spacing. Below the
 * altitude box, hugging the panel's right edge.
 */
export function buildGoalNavContainer(): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: 436,
    yPosition: 133,
    width: 118,
    // Five lines at the OS line height (~31 px) need ~155 px; y133 + 154 = 287
    // stays within the 288-tall canvas.
    height: 154,
    borderWidth: 0,
    borderColor: 5,
    paddingLength: 2,
    containerID: GOAL_NAV.id,
    containerName: GOAL_NAV.name,
    content: 'R --\nAL --\nB --\nT --:--\nSP --',
    isEventCapture: 0,
  })
}

/** Render the goal-nav block from the shared store (position + goal). Refreshes
 * ~1 Hz, writes only on change. Returns a stop fn. */
export function startGoalNavDriver(bridge: EvenAppBridge, store: Store): () => void {
  let running = true
  let shown = ''

  async function loop() {
    while (running) {
      const content = formatGoalNav(store)
      if (content !== shown) {
        shown = content
        void bridge.textContainerUpgrade(
          new TextContainerUpgrade({
            containerID: GOAL_NAV.id,
            containerName: GOAL_NAV.name,
            content,
          }),
        )
      }
      await sleep(1000)
    }
  }

  void loop()
  return () => {
    running = false
  }
}
