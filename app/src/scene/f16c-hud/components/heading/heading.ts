import {
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import type { Telemetry } from '../telemetry'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Heading tape container id/name. */
export const HEADING = { id: 7, name: 'heading' } as const

/** Shown before the first GPS course fix (course needs movement). */
const PLACEHOLDER = '     ▲\n --   [---]   --'

/**
 * Magnetic heading tape below the panel. The exact heading sits boxed under a
 * fixed index caret (▲), flanked by the bracketing 30° gridlines as tens
 * labels (F-16 tape convention: 120° → "12"). Labels are fixed-width, so the
 * caret stays aligned as the numbers turn.
 */
export function buildHeadingContainer(): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: 180,
    yPosition: 222,
    width: 216,
    height: 40,
    borderWidth: 0,
    borderColor: 5,
    paddingLength: 2,
    containerID: HEADING.id,
    containerName: HEADING.name,
    content: PLACEHOLDER,
    isEventCapture: 0,
  })
}

const norm = (deg: number) => ((deg % 360) + 360) % 360
const pad2 = (n: number) => String(n).padStart(2, '0')
const pad3 = (n: number) => String(n).padStart(3, '0')

/** Tens label for a degree value (e.g. 120 → "12", 0 → "00"). */
function tensLabel(deg: number): string {
  return pad2(norm(deg) / 10)
}

/** Render the heading tape from telemetry. Placeholder until the first fix. */
export function formatHeading(t: Telemetry): string {
  if (t.heading == null) return PLACEHOLDER
  const h = norm(Math.round(t.heading))
  const lower = Math.floor(h / 30) * 30
  return `     ▲\n ${tensLabel(lower)}   [${pad3(h)}]   ${tensLabel(lower + 30)}`
}

/** Render the heading tape from the shared telemetry (updated by the location
 * source). Refreshes ~1 Hz, writes only on change. Returns a stop fn. */
export function startHeadingDriver(bridge: EvenAppBridge, telemetry: Telemetry): () => void {
  let running = true
  let shown = ''

  async function loop() {
    while (running) {
      const content = formatHeading(telemetry)
      if (content !== shown) {
        shown = content
        void bridge.textContainerUpgrade(
          new TextContainerUpgrade({
            containerID: HEADING.id,
            containerName: HEADING.name,
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
