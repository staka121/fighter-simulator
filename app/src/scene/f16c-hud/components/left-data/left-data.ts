import {
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import { formatLeftData } from './format'
import type { Store } from '../../store'

export { formatLeftData }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Left data block container id/name. */
export const LEFT_DATA = { id: 5, name: 'leftData' } as const

/**
 * Left data block (weapons + walking telemetry) — one container so every line
 * shares the same spacing. Hugs the panel's left edge, below the airspeed box.
 */
export function buildLeftDataContainer(): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: 8,
    yPosition: 133,
    width: 134,
    // Five lines (weapons/avg/intensity/class/position) at the OS line height
    // (~31 px); y133 + 154 = 287 stays within the 288-tall canvas.
    height: 154,
    borderWidth: 0,
    borderColor: 5,
    paddingLength: 2,
    containerID: LEFT_DATA.id,
    containerName: LEFT_DATA.name,
    content: 'ARM 6\nAVG 0.0\nINT 0\nSTOP\n--',
    isEventCapture: 0,
  })
}

/**
 * Render the left data block from the shared store. The loop refreshes once
 * a second (avg/intensity/movement); the missile system calls `refresh`
 * directly for instant weapons feedback. Only writes when the content changed.
 * Returns `stop` and `refresh`.
 */
export function startLeftDataDriver(
  bridge: EvenAppBridge,
  store: Store,
): { stop: () => void; refresh: () => void } {
  let running = true
  let shown = ''

  const refresh = () => {
    const content = formatLeftData(store)
    if (content === shown) return
    shown = content
    void bridge.textContainerUpgrade(
      new TextContainerUpgrade({
        containerID: LEFT_DATA.id,
        containerName: LEFT_DATA.name,
        content,
      }),
    )
  }

  async function loop() {
    while (running) {
      refresh()
      await sleep(1000)
    }
  }

  void loop()
  return {
    stop() {
      running = false
    },
    refresh,
  }
}
