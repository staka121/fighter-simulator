import {
  TextContainerProperty,
  TextContainerUpgrade,
  ImageContainerProperty,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import { HEADING_TICKS, HEADING_NUM } from './types'
import { formatHeadingNumber } from './format'
import { renderTicksPng } from './render/renderTicksPng'
import type { ImageSender } from '../../image-sender'
import type { Store } from '../../store'

export { formatHeadingNumber }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** The two static tick-strip image tiles flanking the number box. */
export function buildHeadingTickContainers(): ImageContainerProperty[] {
  return HEADING_TICKS.map(
    t =>
      new ImageContainerProperty({
        xPosition: t.x,
        yPosition: t.y,
        width: t.w,
        height: t.h,
        containerID: t.id,
        containerName: t.name,
      }),
  )
}

/** Current-heading number box, centred in the gap between the tick strips. */
export function buildHeadingNumberContainer(): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: HEADING_NUM.x,
    yPosition: HEADING_NUM.y,
    width: HEADING_NUM.w,
    height: HEADING_NUM.h,
    borderWidth: 1,
    borderColor: 5,
    paddingLength: 1,
    containerID: HEADING_NUM.id,
    containerName: HEADING_NUM.name,
    content: '---',
    isEventCapture: 0,
  })
}

/**
 * Push the static tick strips, then re-send them on a slow heartbeat so they
 * survive an image reset (e.g. after the app is backgrounded). They never
 * change, so each is rendered once. Returns a stop fn.
 */
export function startHeadingTicks(send: ImageSender): () => void {
  let running = true
  const cache = new Map<number, Uint8Array>()

  async function loop() {
    while (running) {
      for (const t of HEADING_TICKS) {
        try {
          let bytes = cache.get(t.id)
          if (!bytes) {
            bytes = await renderTicksPng(t.w, t.h, t.anchor)
            cache.set(t.id, bytes)
          }
          await send(t.id, t.name, bytes)
        } catch (e) {
          console.error('heading ticks render failed:', e)
        }
      }
      await sleep(4000)
    }
  }

  void loop()
  return () => {
    running = false
  }
}

/** Update the heading number box via text upgrades (~2 Hz, on change) — off the
 * image send channel, so it never competes with the panel. Returns a stop fn. */
export function startHeadingNumberDriver(bridge: EvenAppBridge, store: Store): () => void {
  let running = true
  let shown = ''

  async function loop() {
    while (running) {
      const content = formatHeadingNumber(store)
      if (content !== shown) {
        shown = content
        void bridge.textContainerUpgrade(
          new TextContainerUpgrade({
            containerID: HEADING_NUM.id,
            containerName: HEADING_NUM.name,
            content,
          }),
        )
      }
      await sleep(500)
    }
  }

  void loop()
  return () => {
    running = false
  }
}
