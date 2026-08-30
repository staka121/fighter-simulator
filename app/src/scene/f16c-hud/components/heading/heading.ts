import {
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import type { Store } from '../../store'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Heading tape container id/name. */
export const HEADING = { id: 7, name: 'heading' } as const

/** Shown before the first GPS course fix (course needs movement). The tape line
 * is 15 chars ("ll   [ccc]   rr"). The caret's leading spaces are narrower than
 * the digits under it, so it needs more than the box's 7-char offset to sit
 * over the box centre — tuned on-device to 10 spaces.
 */
const PLACEHOLDER = '          ▲\n--   [---]   --'

/**
 * Magnetic heading tape below the panel. The exact heading sits boxed under a
 * fixed index caret (▲), flanked by the bracketing 30° gridlines as tens
 * labels (F-16 tape convention: 120° → "12"). Labels are fixed-width, so the
 * caret stays aligned as the numbers turn.
 *
 * There is no text-align: the text is left-aligned at xPosition + padding, so
 * centring it under the panel centre (x=288, panel 144..432) means placing the
 * text's *left edge* at 288 - textWidth/2, not centring the container. This
 * OS font renders spaces/brackets much narrower than digits, so the tape is
 * well under the container width; xPosition is tuned on-device to land it below
 * the boresight (width just needs to exceed the text so it doesn't clip).
 */
export function buildHeadingContainer(): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: 226,
    yPosition: 222,
    width: 200,
    // Two lines (caret + tape) at the left block's ~31 px line height. h40 clips
    // the tape line; size for both.
    height: 62,
    borderWidth: 0,
    borderColor: 5,
    paddingLength: 1,
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

/** Render the heading tape from store. Placeholder until the first fix. */
export function formatHeading(t: Store): string {
  if (t.heading == null) return PLACEHOLDER
  const h = norm(Math.round(t.heading))
  const lower = Math.floor(h / 30) * 30
  return `          ▲\n${tensLabel(lower)}   [${pad3(h)}]   ${tensLabel(lower + 30)}`
}

/** Render the heading tape from the shared store (updated by the location
 * source). Refreshes ~1 Hz, writes only on change. Returns a stop fn. */
export function startHeadingDriver(bridge: EvenAppBridge, store: Store): () => void {
  let running = true
  let shown = ''

  async function loop() {
    while (running) {
      const content = formatHeading(store)
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
