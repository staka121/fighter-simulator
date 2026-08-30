import {
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Clock container id/name (top-left). */
export const CLOCK = { id: 9, name: 'clock' } as const

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Local wall-clock time as HH:MM:SS. */
export function formatClock(now: Date): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
}

/** Top-left clock readout. */
export function buildClockContainer(): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: 8,
    yPosition: 4,
    width: 120,
    height: 32,
    borderWidth: 0,
    borderColor: 5,
    paddingLength: 1,
    containerID: CLOCK.id,
    containerName: CLOCK.name,
    content: '00:00:00',
    isEventCapture: 0,
  })
}

/** Tick the clock ~1 Hz, writing only when the displayed time changed. Returns a
 * stop fn. */
export function startClockDriver(bridge: EvenAppBridge): () => void {
  let running = true
  let shown = ''

  async function loop() {
    while (running) {
      const content = formatClock(new Date())
      if (content !== shown) {
        shown = content
        void bridge.textContainerUpgrade(
          new TextContainerUpgrade({ containerID: CLOCK.id, containerName: CLOCK.name, content }),
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
