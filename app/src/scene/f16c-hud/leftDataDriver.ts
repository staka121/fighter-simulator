import { TextContainerUpgrade, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { formatLeftData, type Telemetry } from './telemetry'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Refresh the left data block once a second from the shared telemetry (ARM /
 * avg speed / intensity / movement class / goal). Text updates are cheap, and
 * we only send when the rendered content changed. Returns a stop fn.
 */
export function startLeftDataDriver(
  bridge: EvenAppBridge,
  telemetry: Telemetry,
  containerID: number,
  containerName: string,
): () => void {
  let running = true
  let shown = ''

  async function loop() {
    while (running) {
      const content = formatLeftData(telemetry)
      if (content !== shown) {
        shown = content
        await bridge.textContainerUpgrade(
          new TextContainerUpgrade({ containerID, containerName, content }),
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
