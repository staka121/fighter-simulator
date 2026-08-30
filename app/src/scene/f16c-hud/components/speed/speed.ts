import {
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import type { Store } from '../../store'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Airspeed box container id/name. */
export const SPEED = { id: 3, name: 'speed' } as const

/**
 * Airspeed box, hugging the panel's left edge. Mirrors the altitude box across
 * the panel centre (same width, equal 4 px gap to the panel edge) so the two
 * read symmetrically. No text-align field exists, so the box is sized snug.
 */
export function buildSpeedContainer(): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: 72,
    yPosition: 125,
    width: 68,
    height: 32,
    borderWidth: 1,
    borderColor: 5,
    paddingLength: 1,
    containerID: SPEED.id,
    containerName: SPEED.name,
    content: '0.0',
    isEventCapture: 0,
  })
}

/** Ground speed (km/h) or a status marker: `--` (location failed) / `0.0`
 * (running but unknown / standing) / `N.N`. */
export function formatSpeed(t: Store): string {
  if (!t.locationOk) return '--'
  return (t.speedKmh ?? 0).toFixed(1)
}

/** Render the airspeed box from the shared store (updated by the location
 * source). Refreshes ~1 Hz, writes only on change. Returns a stop fn. */
export function startSpeedDriver(bridge: EvenAppBridge, store: Store): () => void {
  let running = true
  let shown = ''

  async function loop() {
    while (running) {
      const content = formatSpeed(store)
      if (content !== shown) {
        shown = content
        void bridge.textContainerUpgrade(
          new TextContainerUpgrade({ containerID: SPEED.id, containerName: SPEED.name, content }),
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
