import {
  TextContainerProperty,
  TextContainerUpgrade,
  ImageContainerProperty,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import { HEADING_TILE, HEADING_NUM } from './types'
import { formatHeadingNumber } from './format'
import { renderTicksPng } from './render/renderTicksPng'
import type { ImageSender } from '../../image-sender'
import type { Store } from '../../store'

export { formatHeadingNumber }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Static tick-scale image tile (the moving value is a separate text box). */
export function buildHeadingImageContainer(): ImageContainerProperty {
  return new ImageContainerProperty({
    xPosition: HEADING_TILE.x,
    yPosition: HEADING_TILE.y,
    width: HEADING_TILE.w,
    height: HEADING_TILE.h,
    containerID: HEADING_TILE.id,
    containerName: HEADING_TILE.name,
  })
}

/** Current-heading number box, centred over the ticks. */
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
 * Push the static ticks image, then re-send it on a slow heartbeat so it
 * survives an image reset (e.g. after the app is backgrounded). It never
 * changes, so rendering happens once. Returns a stop fn.
 */
export function startHeadingTicks(send: ImageSender): () => void {
  let running = true
  let bytes: Uint8Array | null = null

  async function loop() {
    while (running) {
      try {
        if (!bytes) bytes = await renderTicksPng()
        await send(HEADING_TILE.id, HEADING_TILE.name, bytes)
      } catch (e) {
        console.error('heading ticks render failed:', e)
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
