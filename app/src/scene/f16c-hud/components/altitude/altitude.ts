import {
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import type { Store } from '../../store'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Altitude box container id/name. */
export const ALTITUDE = { id: 4, name: 'altitude' } as const

/**
 * Altitude box, hugging the panel's right edge (panel right is x432). A "walking
 * HUD" reinterpretation of the F-16C barometric altitude: GPS altitude in
 * metres. No text-align field exists, so the box is sized snug to the digits.
 */
export function buildAltitudeContainer(): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: 436,
    yPosition: 125,
    width: 68,
    height: 32,
    borderWidth: 1,
    borderColor: 5,
    paddingLength: 1,
    containerID: ALTITUDE.id,
    containerName: ALTITUDE.name,
    content: '--',
    isEventCapture: 0,
  })
}

/** GPS altitude in whole metres, or `--` (location failed or no fix yet). */
export function formatAltitude(t: Store): string {
  if (!t.locationOk || t.altitude == null) return '--'
  return String(Math.round(t.altitude))
}

/** Render the altitude box from the shared store (updated by the location
 * source). Refreshes ~1 Hz, writes only on change. Returns a stop fn. */
export function startAltitudeDriver(bridge: EvenAppBridge, store: Store): () => void {
  let running = true
  let shown = ''

  async function loop() {
    while (running) {
      const content = formatAltitude(store)
      if (content !== shown) {
        shown = content
        void bridge.textContainerUpgrade(
          new TextContainerUpgrade({
            containerID: ALTITUDE.id,
            containerName: ALTITUDE.name,
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
