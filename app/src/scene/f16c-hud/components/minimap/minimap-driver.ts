import { renderMinimapPng } from './render/renderMinimapPng'
import { MINIMAP_TILE, SCROLL_SMOOTH } from './types'
import { angularDiff, norm } from '../../geo'
import type { ImageSender } from '../../image-sender'
import type { Store } from '../../store'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
// ~5 Hz; eases the heading-up rotation. Kept below the panel's rate so it doesn't
// crowd the shared send channel (the panel is prioritised there).
const FRAME_MS = 200

/** Drive the minimap: ease the displayed heading toward the GPS course for
 * smooth heading-up rotation, and re-render only when the view actually changes
 * (position / heading / goals), so a standstill sends nothing. */
export function startMinimapDriver(send: ImageSender, store: Store): () => void {
  let running = true
  let displayed = 0 // north-up until the first course fix
  let haveHeading = false
  let lastKey: string | null = null

  async function loop() {
    while (running) {
      const target = store.heading
      if (target != null) {
        if (!haveHeading) {
          displayed = target
          haveHeading = true
        } else {
          displayed = norm(displayed + angularDiff(target, displayed) * SCROLL_SMOOTH)
        }
      }

      const goalsSig = store.goals.map(g => `${g.lat.toFixed(4)},${g.lon.toFixed(4)}`).join(';')
      const key = [
        Math.round(displayed * 2), // 0.5° rotation resolution
        store.lat == null ? 'x' : Math.round(store.lat * 1e5),
        store.lon == null ? 'x' : Math.round(store.lon * 1e5),
        store.activeGoalIndex,
        goalsSig,
      ].join('|')

      if (key !== lastKey) {
        lastKey = key
        try {
          const bytes = await renderMinimapPng(store, displayed)
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
