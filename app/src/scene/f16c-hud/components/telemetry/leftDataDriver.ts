import { TextContainerUpgrade, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { formatLeftData, type Telemetry } from './telemetry'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Render the left data block (weapons + movement) from the shared telemetry.
 * The loop refreshes once a second (for avg/intensity/movement); the missile
 * system calls `refresh` directly for instant weapons feedback. Only writes
 * when the rendered content changed. Returns `stop` and `refresh`.
 */
export function startLeftDataDriver(
  bridge: EvenAppBridge,
  telemetry: Telemetry,
  containerID: number,
  containerName: string,
): { stop: () => void; refresh: () => void } {
  let running = true
  let shown = ''

  const refresh = () => {
    const content = formatLeftData(telemetry)
    if (content === shown) return
    shown = content
    void bridge.textContainerUpgrade(
      new TextContainerUpgrade({ containerID, containerName, content }),
    )
  }

  async function loop() {
    while (running) {
      refresh()
      await sleep(1000)
    }
  }

  void loop()
  return {
    stop() {
      running = false
    },
    refresh,
  }
}
