import { ImageRawDataUpdate, type EvenAppBridge } from '@evenrealities/even_hub_sdk'

export type ImageSender = (
  containerID: number,
  containerName: string,
  imageData: Uint8Array,
) => Promise<void>

/**
 * Serialise all image sends onto one channel. The glasses require raw-image
 * sends to be strictly serial, but the HUD panel and the heading tape run
 * independent render loops. Chaining every send onto a single tail promise
 * guarantees only one `updateImageRawData` is ever in flight, regardless of
 * which driver initiated it.
 */
export function createImageSender(bridge: EvenAppBridge): ImageSender {
  let tail: Promise<unknown> = Promise.resolve()
  return (containerID, containerName, imageData) => {
    const run = tail
      .catch(() => {})
      .then(() =>
        bridge.updateImageRawData(
          new ImageRawDataUpdate({ containerID, containerName, imageData }),
        ),
      )
    tail = run
    return run.then(() => {})
  }
}
