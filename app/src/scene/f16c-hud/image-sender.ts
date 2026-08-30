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
 * a time, round-robin. Backlog is bounded to one frame per tile, and every tile
 * always sends its freshest pixels as soon as the channel is free.
 */
export function createImageSender(bridge: EvenAppBridge): ImageSender {
  const latest = new Map<number, { name: string; data: Uint8Array }>()
  const queue: number[] = [] // tile ids awaiting a send, in arrival order
  let draining = false

  async function drain() {
    if (draining) return
    draining = true
    try {
      while (queue.length > 0) {
        const id = queue.shift()!
        const frame = latest.get(id)
        latest.delete(id) // a newer frame arriving during the send re-queues the id
        if (!frame) continue
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
    if (!latest.has(containerID)) queue.push(containerID)
    latest.set(containerID, { name: containerName, data: imageData })
    void drain()
    return Promise.resolve()
  }
}
