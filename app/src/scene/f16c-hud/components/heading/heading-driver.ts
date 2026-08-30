import { renderTapePng } from './render/renderTapePng'
import { HEADING_TILE, PX_PER_DEG, SCROLL_SMOOTH } from './types'
import { angularDiff, norm } from './tape-math'
import type { ImageSender } from '../../image-sender'
import type { Store } from '../../store'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ~10 Hz. The displayed heading eases toward the (≈1 Hz, discrete) GPS course
// so the scale scrolls smoothly. We only re-render when the scale actually moved
// by ≥1 px, so a straight walk or a standstill sends nothing.
const FRAME_MS = 100

export function startHeadingTapeDriver(send: ImageSender, store: Store): () => void {
  let running = true
  let displayed: number | null = null
  // px-quantised scale position: a number (fix), null (no fix), or undefined
  // (nothing drawn yet — forces the initial placeholder render).
  let lastKey: number | null | undefined = undefined

  async function loop() {
    while (running) {
      const target = store.heading
      if (target == null) {
        displayed = null
      } else if (displayed == null) {
        displayed = target // snap on the first fix
      } else {
        displayed = norm(displayed + angularDiff(target, displayed) * SCROLL_SMOOTH)
      }

      // Skip the render entirely when the scale hasn't shifted by a pixel.
      const key = displayed == null ? null : Math.round(displayed * PX_PER_DEG)
      if (key !== lastKey) {
        lastKey = key
        try {
          const bytes = await renderTapePng(displayed)
          await send(HEADING_TILE.id, HEADING_TILE.name, bytes)
        } catch (e) {
          console.error('heading tape render failed:', e)
        }
      }

      await sleep(FRAME_MS)
    }
  }

  void loop()
  return () => {
    running = false
  }
}
