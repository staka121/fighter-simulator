import { renderMinimapPng } from './render/renderMinimapPng'
import { MINIMAP_TILE, HEADING_STEP_DEG, POS_STEP } from './types'
import { norm } from '../../geo'
import type { ImageSender } from '../../image-sender'
import type { Store } from '../../store'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
// ~2.5 Hz. The minimap doesn't move much or finely, so it stays off the shared
// image channel most of the time — it snaps to the GPS course (no easing) and
// only re-renders when the heading moved ≥ HEADING_STEP_DEG or the position
// shifted ≥ ~11 m (or the goals changed).
const FRAME_MS = 400

export function startMinimapDriver(send: ImageSender, store: Store): () => void {
  let running = true
  let lastKey: string | null = null

  async function loop() {
    while (running) {
      const h = store.heading
      const goalsSig = store.goals.map(g => `${g.lat.toFixed(4)},${g.lon.toFixed(4)}`).join(';')
      const key = [
        h == null ? 'x' : Math.round(norm(h) / HEADING_STEP_DEG),
        store.lat == null ? 'x' : Math.round(store.lat * POS_STEP),
        store.lon == null ? 'x' : Math.round(store.lon * POS_STEP),
        store.activeGoalIndex,
        goalsSig,
      ].join('|')

      if (key !== lastKey) {
        lastKey = key
        try {
          const bytes = await renderMinimapPng(store, h ?? 0)
          await send(MINIMAP_TILE.id, MINIMAP_TILE.name, bytes)
        } catch (e) {
          console.error('minimap render failed:', e)
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
