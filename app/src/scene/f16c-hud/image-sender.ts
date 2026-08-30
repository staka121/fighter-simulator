import { ImageRawDataUpdate, type EvenAppBridge } from '@evenrealities/even_hub_sdk'

export type ImageSender = (
  containerID: number,
  containerName: string,
  imageData: Uint8Array,
) => Promise<void>

/**
 * Serialise all image sends onto one channel, coalescing per tile. The glasses
 * require raw-image sends to be strictly serial, but the panel, heading tape and
 * minimap run independent render loops. Sending every frame in FIFO order lets a
 * fast producer (the IMU-driven panel while walking) clog the queue with stale
 * frames, so other tiles — and the panel itself — update irregularly or stall.
 *
 * Instead we keep only the *latest* pending frame per tile and drain them one at
 * a time. Backlog is bounded to one frame per tile, and every tile always sends
 * its freshest pixels as soon as the channel is free.
 *
 * `priorityId` (the moving panel) is drained first whenever it has a pending
 * frame, so its cadence stays regular instead of being pushed around by the
 * slower heading/minimap tiles; those fill the gaps between panel frames. The
 * Map preserves insertion order, giving FIFO fairness among the rest.
 */
export function createImageSender(bridge: EvenAppBridge, priorityId?: number): ImageSender {
  const latest = new Map<number, { name: string; data: Uint8Array }>()
  let draining = false

  async function drain() {
    if (draining) return
    draining = true
    try {
      while (latest.size > 0) {
        const id =
          priorityId != null && latest.has(priorityId)
            ? priorityId
            : (latest.keys().next().value as number)
        const frame = latest.get(id)!
        latest.delete(id) // a newer frame arriving during the send re-adds the id
        try {
          await bridge.updateImageRawData(
            new ImageRawDataUpdate({
              containerID: id,
              containerName: frame.name,
              imageData: frame.data,
            }),
          )
        } catch (e) {
          console.error('image send failed:', e)
        }
      }
    } finally {
      draining = false
    }
  }

  return (containerID, containerName, imageData) => {
    latest.set(containerID, { name: containerName, data: imageData })
    void drain()
    return Promise.resolve()
  }
}
